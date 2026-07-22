import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth-server";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !["ADMIN", "RECEPTIONIST"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const bookingId = params.id;
    const { payment_method, amount, transaction_ref } = await request.json();

    if (!payment_method || amount === undefined) {
      return NextResponse.json({ error: "Payment method and amount are required" }, { status: 400 });
    }

    // 1. Verify booking exists and is CHECKED_IN
    const { data: booking, error: bError } = await supabaseServer
      .from("bookings")
      .select("id, status, room_id")
      .eq("id", bookingId)
      .single();

    if (bError || !booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    if (booking.status !== "CHECKED_IN") return NextResponse.json({ error: `Cannot checkout booking with status ${booking.status}` }, { status: 400 });

    // 2. Create payment record
    const { error: pError } = await supabaseServer.from("payments").insert({
      booking_id: bookingId,
      amount,
      method: payment_method,
      status: "COMPLETED",
      transaction_ref
    });
    if (pError) throw pError;

    // 3. Update booking status
    const { error: ubError } = await supabaseServer
      .from("bookings")
      .update({ status: "CHECKED_OUT", updated_at: new Date().toISOString() })
      .eq("id", bookingId);
    if (ubError) throw ubError;

    // Update status of paid incidents to RESOLVED
    await supabaseServer
      .from("room_incidents")
      .update({ 
        status: "RESOLVED", 
        resolved_at: new Date().toISOString(), 
        updated_at: new Date().toISOString() 
      })
      .eq("booking_id", bookingId)
      .eq("is_chargeable", true)
      .not("status", "in", '("RESOLVED","CLOSED","CANCELLED")');

    // 4. Update room status to DIRTY
    const nowIso = new Date().toISOString();
    let { error: urError } = await supabaseServer
      .from("rooms")
      .update({ status: "DIRTY", updated_at: nowIso, status_updated_at: nowIso })
      .eq("id", booking.room_id);
    if (urError && urError.message && urError.message.includes("status_updated_at")) {
      const fallback = await supabaseServer
        .from("rooms")
        .update({ status: "DIRTY", updated_at: nowIso })
        .eq("id", booking.room_id);
      urError = fallback.error;
    }
    if (urError) throw urError;

    // 5. Audit log
    await supabaseServer.from("audit_logs").insert({
      user_id: user.sub,
      action: "CHECK_OUT",
      entity_type: "BOOKING",
      entity_id: bookingId,
      details: { payment_method, amount, transaction_ref }
    });

    return NextResponse.json({ message: "Checkout successful" });

  } catch (error) {
    console.error("Checkout API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = params.id;
    // 1. Kéo thông tin đặt phòng gốc
    const { data: booking, error: bookingError } = await supabaseServer
      .from("bookings")
      .select("*, room:rooms(*, room_type:room_types(*))")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Không tìm thấy đơn đặt phòng" }, { status: 404 });
    }

    // 2. Lấy số tiền cọc đã thanh toán (Deposit)
    const { data: payments } = await supabaseServer
      .from("payments")
      .select("amount")
      .eq("booking_id", bookingId)
      .eq("status", "COMPLETED");

    const depositPaid = payments
      ? payments.reduce((sum, item) => sum + Number(item.amount || 0), 0)
      : 0;

    // 3. Tự động kiểm tra các khoản phạt chưa thanh toán (chargeable và chưa RESOLVED/CLOSED/CANCELLED) của booking này
    const { data: incidents } = await supabaseServer
      .from("room_incidents")
      .select("*")
      .eq("booking_id", bookingId)
      .eq("is_chargeable", true)
      .not("status", "in", '("RESOLVED","CLOSED","CANCELLED")');

    const totalFineAmount = incidents
      ? incidents.reduce((sum, item) => sum + Number(item.approved_charge || item.estimated_charge || 0), 0)
      : 0;

    // 4. Tự động cộng tất cả đơn gọi món / dịch vụ phòng (service_orders) chưa bị hủy của booking này
    let serviceOrders: any[] = [];
    try {
      const { data: sOrders } = await supabaseServer
        .from("service_orders")
        .select("*, items:service_order_items(*, service:services(*))")
        .eq("booking_id", bookingId)
        .not("status", "eq", "CANCELLED");
      if (sOrders) serviceOrders = sOrders;
    } catch (e) {
      console.warn("Could not fetch service orders for checkout calculation:", e);
    }

    const totalServiceAmount = serviceOrders.reduce((sum, order) => {
      let amount = Number(order.total_amount || 0);
      try {
        if (order.notes && order.notes.trim().startsWith("{")) {
          const notesObj = JSON.parse(order.notes);
          if (notesObj.is_car_rental) {
            // Only add to bill if the car rental has been confirmed as returned (COMPLETED)
            if (order.status !== "COMPLETED") {
              return sum; // skip if not completed yet
            }
            amount = amount * 26320; // Convert USD to VND
          }
        }
      } catch (e) {}
      return sum + amount;
    }, 0);

    // 5. Cộng dồn vào InvoiceData cuối cùng
    const calculateNights = (start: string, end: string) => {
      const diff = Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24));
      return diff > 0 ? diff : 1;
    };

    const nights = calculateNights(booking.check_in_date, booking.check_out_date);
    const basePrice = Number(booking.room?.room_type?.base_price || 0);
    const roomCharges = nights * basePrice;
    
    // Tổng số bill trước cọc
    const subtotal = roomCharges + totalServiceAmount + totalFineAmount; 
    
    // 2% VAT của tổng số bill
    const vatRate = 0.02;
    const vatAmount = subtotal * vatRate;
    
    // Khách trả = Tổng bill + VAT - Tiền cọc
    const grandTotal = subtotal + vatAmount - depositPaid;
    const remainingRoomCharges = Math.max(0, roomCharges - depositPaid);


    return NextResponse.json({
      booking,
      room_charges: roomCharges,
      deposit_paid: depositPaid,
      remaining_room_charges: remainingRoomCharges,
      service_charges: totalServiceAmount,
      service_charges_detail: {
        orders: serviceOrders,
        total_service: totalServiceAmount,
      },
      incident_charges: {
        incidents: incidents || [],
        total_fine: totalFineAmount
      },
      subtotal,
      vat_rate: vatRate,
      vat_amount: vatAmount,
      grand_total: grandTotal,
      balance_due: grandTotal
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}