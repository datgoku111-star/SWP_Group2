import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { bookingId, serviceOrderId } = await request.json();

    if (bookingId) {
      // Find pending payment
      const { data: payments } = await supabaseServer
        .from("payments")
        .select("id, booking_id")
        .eq("booking_id", bookingId)
        .eq("status", "PENDING");

      if (payments && payments.length > 0) {
        for (const p of payments) {
          await supabaseServer.from("payments").update({ status: "COMPLETED" }).eq("id", p.id);
        }
      }

      // If it's a room booking (no serviceOrderId), keep it PENDING so receptionist confirms it
      if (!serviceOrderId) {
        await supabaseServer.from("bookings").update({ status: "PENDING" }).eq("id", bookingId);
      }
    }

    if (serviceOrderId) {
      // If there is a service order, update its status
      await supabaseServer.from("service_orders").update({ status: "IN_PROGRESS" }).eq("id", serviceOrderId);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
