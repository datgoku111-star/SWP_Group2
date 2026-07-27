import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth-server";
import { sendEmail, buildBookingConfirmationEmailTemplate } from "@/lib/mail-sender";

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
      .select("*, room:rooms(*, room_type:room_types(*)), user:users(id, email, full_name, role), guest:guests(*)")
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

      // Upsert payment record to COMPLETED
      const { data: existingPayment } = await supabaseServer
        .from("payments")
        .select("*")
        .eq("booking_id", bookingId)
        .eq("status", "COMPLETED");

      let depositPaidAmount = booking.total_amount;
      if (!existingPayment || existingPayment.length === 0) {
        await supabaseServer
          .from("payments")
          .insert({
            booking_id: bookingId,
            amount: booking.total_amount,
            method: "TRANSFER",
            status: "COMPLETED",
            transaction_ref: `CONFIRM_FALLBACK_${Math.floor(100000 + Math.random() * 900000)}`
          });
      } else {
        depositPaidAmount = existingPayment.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
      }

      // Send booking confirmation email to customer
      const recipientEmail = booking.guest?.email || booking.user?.email;
      if (recipientEmail) {
        const customerName = booking.guest?.full_name || booking.user?.full_name || "Quý khách";
        const phone = booking.guest?.phone || booking.user?.phone || "";

        const emailHtml = buildBookingConfirmationEmailTemplate({
          bookingId: booking.id,
          customerName,
          email: recipientEmail,
          phone,
          roomNumber: booking.room?.room_number || "N/A",
          roomTypeName: booking.room?.room_type?.name || "N/A",
          checkInDate: booking.check_in_date,
          checkOutDate: booking.check_out_date,
          numGuests: booking.num_guests,
          totalPrice: booking.total_amount,
          depositAmount: depositPaidAmount,
          specialRequests: booking.special_requests || ""
        });

        sendEmail({
          to: recipientEmail,
          subject: `[HSRM Resort] Xác nhận Đặt phòng & Thanh toán Cọc - Mã: ${booking.id}`,
          html: emailHtml
        }).catch((err: any) => {
          console.error("Failed to send booking confirmation email:", err);
        });
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
