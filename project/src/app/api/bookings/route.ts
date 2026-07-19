import { NextResponse } from "next/server";
import { createBooking, getAllBookings } from "@/lib/db/bookings";
import { getCurrentUser } from "@/lib/auth-server";


export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !["ADMIN", "RECEPTIONIST"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const bookings = await getAllBookings();
    return NextResponse.json(bookings);
  } catch (error) {
    console.error("GET bookings error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { sendReceptionistInvoiceEmail } from "@/lib/mail";

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

    // Notify receptionist asynchronously
    sendReceptionistInvoiceEmail(
      booking.id, 
      `Room ID: ${booking.room_id}`, 
      booking.total_amount, 
      booking.total_amount
    ).catch(console.error);

    return NextResponse.json(booking, { status: 201 });
  } catch (error: any) {
    console.error("POST booking error:", error);
    // Handle race condition specific error from db function
    if (error.message && error.message.includes("no longer available")) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
