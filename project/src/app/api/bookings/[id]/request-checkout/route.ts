import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth-server";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    // Check if booking belongs to user (unless staff)
    const { data: booking, error: fetchError } = await supabaseServer
      .from("bookings")
      .select("user_id, status, checkout_step")
      .eq("id", id)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const isStaff = ["ADMIN", "RECEPTIONIST"].includes(user.role);
    if (!isStaff && booking.user_id !== user.sub) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (booking.status !== "CHECKED_IN") {
      return NextResponse.json({ error: "Booking must be CHECKED_IN to request checkout" }, { status: 400 });
    }

    if (booking.checkout_step && booking.checkout_step !== "NONE") {
      return NextResponse.json({ error: "Checkout already requested" }, { status: 400 });
    }

    const { error: updateError } = await supabaseServer
      .from("bookings")
      .update({
        checkout_step: "REQUESTED",
        checkout_requested_at: new Date().toISOString()
      })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
