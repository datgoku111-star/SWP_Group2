import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. Fetch all physical rooms
    const { data: rooms, error: roomsError } = await supabaseServer
      .from("rooms")
      .select("*, room_type:room_types(*)")
      .order("room_number");
    if (roomsError) throw roomsError;

    // 2. Fetch active bookings (confirmed or checked in)
    const { data: bookings, error: bookingsError } = await supabaseServer
      .from("bookings")
      .select("room_id, check_in_date, check_out_date")
      .in("status", ["CONFIRMED", "CHECKED_IN"]);
    if (bookingsError) throw bookingsError;

    // 3. Map active booked ranges to each room
    const result = (rooms || []).map((r) => {
      const roomBookings = (bookings || [])
        .filter((b) => b.room_id === r.id)
        .map((b) => ({
          checkIn: b.check_in_date,
          checkOut: b.check_out_date,
        }));
      return {
        id: r.id,
        room_number: r.room_number,
        floor: r.floor,
        room_type: r.room_type?.name,
        notes: r.notes,
        status: r.status,
        bookedRanges: roomBookings,
      };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("GET occupancy error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
