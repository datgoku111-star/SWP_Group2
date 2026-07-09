import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth-server";


export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !["ADMIN", "RECEPTIONIST"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { booking_id, guest } = await request.json();

    if (!booking_id || !guest || !guest.full_name || !guest.id_card_number) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Verify booking exists and validation check
    const { data: booking, error: bError } = await supabaseServer
      .from("bookings")
      .select("id, status, room_id")
      .eq("id", booking_id)
      .single();

    if (bError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (["CANCELLED", "CHECKED_OUT"].includes(booking.status)) {
      return NextResponse.json({ error: `Cannot check in. Booking is already ${booking.status}` }, { status: 400 });
    }

    if (booking.status !== "CONFIRMED" && booking.status !== "PENDING") {
      return NextResponse.json({ error: `Cannot check in booking with status ${booking.status}` }, { status: 400 });
    }

    // Upsert guest
    const { data: guestData, error: gError } = await supabaseServer
      .from("guests")
      .upsert({
        full_name: guest.full_name,
        id_card_number: guest.id_card_number,
        id_card_type: guest.id_card_type,
        nationality: guest.nationality,
        address: guest.address,
      }, { onConflict: "id_card_number" })
      .select("id")
      .single();

    if (gError) throw gError;

    // Update booking status
    const nowIso = new Date().toISOString();
    const { error: ubError } = await supabaseServer
      .from("bookings")
      .update({ 
        status: "CHECKED_IN",
        guest_id: guestData.id,
        updated_at: nowIso
      })
      .eq("id", booking_id);

    if (ubError) throw ubError;

    // Update room status with status_updated_at fallback
    let { error: urError } = await supabaseServer
      .from("rooms")
      .update({
        status: "IN_USE",
        updated_at: nowIso,
        status_updated_at: nowIso,
      })
      .eq("id", booking.room_id);

    if (urError && urError.message && urError.message.includes("status_updated_at")) {
      const fallback = await supabaseServer
        .from("rooms")
        .update({
          status: "IN_USE",
          updated_at: nowIso,
        })
        .eq("id", booking.room_id);
      urError = fallback.error;
    }

    if (urError) throw urError;

    // 5. Create audit log
    await supabaseServer.from("audit_logs").insert({
      user_id: user.sub,
      action: "CHECK_IN",
      entity_type: "BOOKING",
      entity_id: booking_id,
      details: { guest_id: guestData.id, room_id: booking.room_id },
    });

    return NextResponse.json({ message: "Check-in completed successfully" });

  } catch (error) {
    console.error("Checkin API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
