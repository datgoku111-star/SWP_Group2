import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth-server";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !["ADMIN", "RECEPTIONIST"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { bookingId, action, message } = await req.json();

    if (!bookingId || !action) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    if (action === "SEND_CLEANER") {
      const { error } = await supabaseServer
        .from("bookings")
        .update({
          checkout_step: "INSPECTING",
          checkout_message: message || "A cleaner is inspecting your room for checkout.",
        })
        .eq("id", bookingId);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (action === "DIRECT_CHECKOUT") {
      // 1. Fetch booking to get the room_id
      const { data: booking, error: bError } = await supabaseServer
        .from("bookings")
        .select("room_id")
        .eq("id", bookingId)
        .single();

      if (bError || !booking) {
        throw new Error("Booking not found");
      }

      // 2. Update booking: set checkout_step to INSPECTING (send cleaner to inspect)
      const { error: ubError } = await supabaseServer
        .from("bookings")
        .update({
          checkout_step: "INSPECTING",
          updated_at: new Date().toISOString()
        })
        .eq("id", bookingId);

      if (ubError) throw ubError;

      // 3. Update room status to DIRTY
      const nowIso = new Date().toISOString();
      const { error: urError } = await supabaseServer
        .from("rooms")
        .update({
          status: "DIRTY",
          updated_at: nowIso,
          status_updated_at: nowIso
        })
        .eq("id", booking.room_id);

      if (urError) throw urError;

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("POST /api/receptionist/checkout-request error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
