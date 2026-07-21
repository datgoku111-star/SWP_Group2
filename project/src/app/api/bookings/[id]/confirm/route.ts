import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth-server";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const serviceOrderId = searchParams.get("serviceOrderId");
    const bookingId = params.id;

    // 1. Confirm room booking
    const { data: booking, error: bError } = await supabaseServer
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (!bError && booking) {
      if (user.role === "CUSTOMER" && booking.user_id !== user.sub) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      // Update booking status to CONFIRMED
      await supabaseServer
        .from("bookings")
        .update({ status: "CONFIRMED", updated_at: new Date().toISOString() })
        .eq("id", bookingId);

      // Upsert payment record to COMPLETED
      const { data: existingPayment } = await supabaseServer
        .from("payments")
        .select("*")
        .eq("booking_id", bookingId)
        .eq("status", "COMPLETED");

      if (!existingPayment || existingPayment.length === 0) {
        await supabaseServer
          .from("payments")
          .insert({
            booking_id: bookingId,
            amount: booking.total_amount,
            method: "TRANSFER",
            status: "COMPLETED",
            transaction_ref: `CONFIRM_FALLBACK_${Math.floor(100000 + Math.random() * 900000)}`
          });
      }
    }

    // 2. Confirm food service order
    if (serviceOrderId) {
      const { data: order } = await supabaseServer
        .from("service_orders")
        .select("*")
        .eq("id", serviceOrderId)
        .single();

      if (order) {
        // Update service order status to IN_PROGRESS
        await supabaseServer
          .from("service_orders")
          .update({ status: "IN_PROGRESS" })
          .eq("id", serviceOrderId);

        // Record service order payment
        const { data: existingOrderPayment } = await supabaseServer
          .from("payments")
          .select("*")
          .eq("booking_id", bookingId)
          .like("transaction_ref", `%service_${serviceOrderId}%`);

        if (!existingOrderPayment || existingOrderPayment.length === 0) {
          await supabaseServer
            .from("payments")
            .insert({
              booking_id: bookingId,
              amount: order.total_amount,
              method: "TRANSFER",
              status: "COMPLETED",
              transaction_ref: `SERVICE_CONFIRM_${serviceOrderId}`
            });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Confirmation endpoint error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
