import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth-server";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !["ADMIN", "RECEPTIONIST"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { data: rawPayments, error: payError } = await supabaseServer
      .from("payments")
      .select(`
        id,
        booking_id,
        amount,
        method,
        status,
        transaction_ref,
        created_at,
        booking:bookings(
          id,
          check_in_date,
          check_out_date,
          user:users(full_name, email),
          room:rooms(room_number, room_type:room_types(name))
        )
      `)
      .order("created_at", { ascending: false });

    if (payError) {
      console.error("GET admin payments error:", payError);
      throw payError;
    }

    const list = [];
    for (const p of (rawPayments || [])) {
      const isService = p.transaction_ref?.includes("_service_") || false;
      let serviceOrderId = "";
      let serviceItemsText = "";
      let guest_name = (p.booking as any)?.user?.full_name || "Khách ẩn danh";
      let guest_email = (p.booking as any)?.user?.email || "";
      let roomName = (p.booking as any)?.room?.room_type?.name || "";
      let details = "";

      if (isService) {
        serviceOrderId = p.transaction_ref.split("_service_")[1];
        try {
          const { data: orderData } = await supabaseServer
            .from("service_orders")
            .select("*, items:service_order_items(*, service:services(*))")
            .eq("id", serviceOrderId)
            .single();

          if (orderData && orderData.items) {
            serviceItemsText = orderData.items
              .map((i: any) => `${i.service?.name} x${i.quantity}`)
              .join(", ");
            details = `Đồ ăn: ${serviceItemsText}`;
          } else {
            details = "Đơn gọi món ăn";
          }
        } catch (err) {
          details = "Đơn gọi món ăn";
        }
      } else {
        const checkIn = (p.booking as any)?.check_in_date || "";
        const checkOut = (p.booking as any)?.check_out_date || "";
        const roomNum = (p.booking as any)?.room?.room_number || "";
        details = `Phòng ${roomNum} (${roomName}) [${checkIn} → ${checkOut}]`;
      }

      list.push({
        id: p.id,
        booking_id: p.booking_id,
        amount: Number(p.amount),
        method: p.method,
        status: p.status,
        transaction_ref: p.transaction_ref || "",
        created_at: p.created_at,
        guest_name,
        guest_email,
        type: isService ? "service" : "room",
        details,
        serviceOrderId,
        serviceItemsText,
        roomName
      });
    }

    return NextResponse.json(list);
  } catch (error: any) {
    console.error("GET admin payments failure:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !["ADMIN", "RECEPTIONIST"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id, action } = await request.json();
    if (!id || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Fetch current payment details
    const { data: payment, error: payFetchError } = await supabaseServer
      .from("payments")
      .select(`
        *,
        booking:bookings(
          id,
          room:rooms(room_number, room_type:room_types(name))
        )
      `)
      .eq("id", id)
      .single();

    if (payFetchError || !payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const isService = payment.transaction_ref?.includes("_service_") || false;
    let serviceOrderId = "";
    if (isService) {
      serviceOrderId = payment.transaction_ref.split("_service_")[1];
    }

    if (action === "approve") {
      // Approve Flow
      // Update payment
      const { error: payError } = await supabaseServer
        .from("payments")
        .update({ status: "COMPLETED" })
        .eq("id", id);
      if (payError) throw payError;

      if (isService && serviceOrderId) {
        // Update service order status
        const { error: orderError } = await supabaseServer
          .from("service_orders")
          .update({ status: "IN_PROGRESS" })
          .eq("id", serviceOrderId);
        if (orderError) throw orderError;
      } else {
        // Update booking status
        const { error: bookError } = await supabaseServer
          .from("bookings")
          .update({ status: "CONFIRMED", updated_at: new Date().toISOString() })
          .eq("id", payment.booking_id);
        if (bookError) throw bookError;

        // Decrement available room
        const roomName = (payment.booking as any)?.room?.room_type?.name;
        if (roomName) {
          const { data: hotelRoom } = await supabaseServer
            .from("hotel_rooms")
            .select("id, available_rooms")
            .eq("title", roomName)
            .single();

          if (hotelRoom && hotelRoom.available_rooms > 0) {
            await supabaseServer
              .from("hotel_rooms")
              .update({ available_rooms: hotelRoom.available_rooms - 1 })
              .eq("id", hotelRoom.id);
          }
        }
      }

      return NextResponse.json({ message: "Payment approved successfully" });
    } else if (action === "reject") {
      // Reject Flow
      const { error: payError } = await supabaseServer
        .from("payments")
        .update({ status: "REFUNDED" })
        .eq("id", id);
      if (payError) throw payError;

      if (isService && serviceOrderId) {
        const { error: orderError } = await supabaseServer
          .from("service_orders")
          .update({ status: "CANCELLED" })
          .eq("id", serviceOrderId);
        if (orderError) throw orderError;
      } else {
        const { error: bookError } = await supabaseServer
          .from("bookings")
          .update({ status: "CANCELLED", updated_at: new Date().toISOString() })
          .eq("id", payment.booking_id);
        if (bookError) throw bookError;
      }

      return NextResponse.json({ message: "Payment rejected successfully" });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("POST admin payments failure:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
