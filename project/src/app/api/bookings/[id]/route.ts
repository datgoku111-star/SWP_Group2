import { NextResponse } from "next/server";
import { getBookingById } from "@/lib/db/bookings";
import { getCurrentUser } from "@/lib/auth-server";


export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const booking = await getBookingById(params.id);
    
    // Authorization check: User must be staff or the owner of the booking
    if (!["ADMIN", "RECEPTIONIST"].includes(user.role) && booking.user_id !== user.sub) {
      return NextResponse.json({ error: "Unauthorized access to this booking" }, { status: 403 });
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error("GET booking error:", error);
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
}
