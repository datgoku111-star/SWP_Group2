import { NextResponse } from "next/server";
import { createBooking, getAllBookings, getBookingsByUser } from "@/lib/db/bookings";
import { getCurrentUser } from "@/lib/auth-server";


export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Admins and Receptionists can see all bookings, Customers only see their own
    if (["ADMIN", "RECEPTIONIST"].includes(user.role)) {
      const bookings = await getAllBookings();
      return NextResponse.json(bookings);
    } else {
      const bookings = await getBookingsByUser(user.sub);
      return NextResponse.json(bookings);
    }
  } catch (error) {
    console.error("GET bookings error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    
    // Basic validation
    if (!data.room_id || !data.check_in_date || !data.check_out_date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const booking = await createBooking({
      user_id: user.sub,
      room_id: data.room_id,
      check_in_date: data.check_in_date,
      check_out_date: data.check_out_date,
      num_guests: data.num_guests || 1,
      total_amount: data.total_amount || 0,
      special_requests: data.special_requests,
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error: any) {
    console.error("POST booking error:", error);
    if (error.message && (error.message.includes("no longer available") || error.message.includes("không còn trống"))) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
