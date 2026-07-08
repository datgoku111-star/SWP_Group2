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
