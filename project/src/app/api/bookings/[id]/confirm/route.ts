import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth-server";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const serviceOrderId = searchParams.get("serviceOrderId");
    const bookingId = params.id;

    // 1. Confirm room booking
    const { data: booking, error: bError } = await supabaseServer
      .from("bookings")
      .select("*, user:users(*)")
      .eq("id", bookingId)
      .single();

    if (!bError && booking) {
      if (user.role !== "ADMIN" && user.role !== "RECEPTIONIST") {
        return NextResponse.json({ error: "Forbidden. Only staff can confirm bookings." }, { status: 403 });
      }

      // Update booking status to CONFIRMED
      await supabaseServer
        .from("bookings")
        .update({ status: "CONFIRMED", updated_at: new Date().toISOString() })
        .eq("id", bookingId);

      // Check if this is an experience booking
      let isExperience = false;
      let expTitle = "Experience";
      try {
        if (booking.special_requests) {
          const parsed = JSON.parse(booking.special_requests);
          if (parsed.isExperience) {
            isExperience = true;
            expTitle = parsed.title || expTitle;
          }
        }
      } catch (e) {}

      // Upsert payment record to COMPLETED (skip for Experience since it requires NO deposit)
      if (!isExperience) {
        const { data: existingPayment } = await supabaseServer
          .from("payments")
          .select("*")
          .eq("booking_id", bookingId)
          .eq("status", "COMPLETED");

        if (!existingPayment || existingPayment.length === 0) {
          await supabaseServer
            .from("payments")
            .insert({
              booking_id: bookingId,
              amount: booking.total_amount * 0.1, // Only 10% deposit is paid when confirming
              method: "TRANSFER",
              status: "COMPLETED",
              transaction_ref: `CONFIRM_FALLBACK_${Math.floor(100000 + Math.random() * 900000)}`
            });
        }
      } else {
        // Send Experience Confirmation Email
        if (booking.user?.email) {
          // Use the internal endpoint or direct function to send email
          // Using fetch to the existing API is easier
          const protocol = request.headers.get("x-forwarded-proto") || "http";
          const host = request.headers.get("host") || "localhost:3000";
          
          fetch(`${protocol}://${host}/api/mail/send-experience-confirmation`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: booking.user.email,
              customerName: booking.user.full_name || "Customer",
              title: expTitle,
              checkInDate: booking.check_in_date,
              checkOutDate: booking.check_out_date,
            }),
          }).catch(err => console.error("Failed to trigger experience email:", err));
        }
      }
    }

    // 2. Confirm food service order
    if (serviceOrderId) {
      const { data: order } = await supabaseServer
        .from("service_orders")
        .select("*")
        .eq("id", serviceOrderId)
        .single();

      if (order) {
        // Update service order status to IN_PROGRESS
        await supabaseServer
          .from("service_orders")
          .update({ status: "IN_PROGRESS" })
          .eq("id", serviceOrderId);

        // Record service order payment
        const { data: existingOrderPayment } = await supabaseServer
          .from("payments")
          .select("*")
          .eq("booking_id", bookingId)
          .like("transaction_ref", `%service_${serviceOrderId}%`);

        if (!existingOrderPayment || existingOrderPayment.length === 0) {
          await supabaseServer
            .from("payments")
            .insert({
              booking_id: bookingId,
              amount: order.total_amount,
              method: "TRANSFER",
              status: "COMPLETED",
              transaction_ref: `SERVICE_CONFIRM_${serviceOrderId}`
            });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Confirmation endpoint error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
