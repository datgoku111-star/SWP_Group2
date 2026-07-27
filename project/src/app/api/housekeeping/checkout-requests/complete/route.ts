import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth-server";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !["ADMIN", "HOUSEKEEPING", "RECEPTIONIST"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { bookingId, roomId, hasDamage, damageDescription, estimatedCharge } = await req.json();

    if (!bookingId) {
      return NextResponse.json({ error: "Missing bookingId" }, { status: 400 });
    }

    // Incidents are virtualized and stored directly inside rooms.notes via POST /api/incidents.
    // So we skip writing to room_incidents here.

    // 2. Update booking checkout_step
    const { error: updateError } = await supabaseServer
      .from("bookings")
      .update({
        checkout_step: "INSPECTED",
        checkout_message: "Room inspection has been completed successfully.",
      })
      .eq("id", bookingId);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST /api/housekeeping/checkout-requests/complete error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
