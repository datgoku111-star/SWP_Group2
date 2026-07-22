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

    if (hasDamage) {
      // 1. Create room_incident
      const { error: incidentError } = await supabaseServer.from("room_incidents").insert({
        room_id: roomId,
        booking_id: bookingId,
        incident_type: "DAMAGE",
        description: damageDescription,
        status: "REQUESTED",
        priority: "HIGH",
        is_chargeable: true,
        estimated_charge: estimatedCharge || 0,
        assigned_to_user_id: user.id
      });
      
      if (incidentError) throw incidentError;
    }

    // 2. Update booking checkout_step
    const { error: updateError } = await supabaseServer
      .from("bookings")
      .update({
        checkout_step: "INSPECTED",
        checkout_message: "Phòng đã được kiểm tra hoàn tất.",
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
