import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth-server";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bookingId = params.id;
    const body = await request.json().catch(() => ({}));
    const reason = body.reason || "";

    // Fetch booking
    const { data: booking, error: fetchError } = await supabaseServer
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Check authorization: Must be the owner, an admin, or a receptionist
    if (booking.user_id !== user.sub && user.role !== "ADMIN" && user.role !== "RECEPTIONIST") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check status: Can only cancel PENDING or CONFIRMED bookings
    if (booking.status !== "PENDING" && booking.status !== "CONFIRMED") {
      return NextResponse.json(
        { error: `Cannot cancel a booking with status ${booking.status}` },
        { status: 400 }
      );
    }

    // Update status to CANCELLED and append reason if provided
    let newRequests = booking.special_requests || "";
    if (reason) {
      newRequests = newRequests ? `${newRequests}\n[CANCEL_REASON: ${reason}]` : `[CANCEL_REASON: ${reason}]`;
    }

    const { data: updatedBooking, error: updateError } = await supabaseServer
      .from("bookings")
      .update({ 
        status: "CANCELLED",
        special_requests: newRequests
      })
      .eq("id", bookingId)
      .select()
      .single();

    // Refund deposit if any (set status to REFUNDED)
    if (reason && user.role !== "CUSTOMER") {
      await supabaseServer.from("payments").update({ status: "REFUNDED" }).eq("booking_id", bookingId);
    }

    if (updateError) {
      console.error("Failed to cancel booking:", updateError);
      return NextResponse.json(
        { error: "Failed to cancel booking" },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedBooking);
  } catch (error) {
    console.error("Cancel booking error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
