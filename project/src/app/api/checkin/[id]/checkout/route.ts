import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth-server";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !["ADMIN", "RECEPTIONIST"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const bookingId = params.id;
    const { payment_method, amount, transaction_ref } = await request.json();

    if (!payment_method || amount === undefined) {
      return NextResponse.json({ error: "Payment method and amount are required" }, { status: 400 });
    }

    // 1. Verify booking exists and is CHECKED_IN
    const { data: booking, error: bError } = await supabaseServer
      .from("bookings")
      .select("id, status, room_id")
      .eq("id", bookingId)
      .single();

    if (bError || !booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    if (booking.status !== "CHECKED_IN") return NextResponse.json({ error: `Cannot checkout booking with status ${booking.status}` }, { status: 400 });

    // 2. Create payment record
    const { error: pError } = await supabaseServer.from("payments").insert({
      booking_id: bookingId,
      amount,
      method: payment_method,
      status: "COMPLETED",
      transaction_ref
    });
    if (pError) throw pError;

    // 3. Update booking status
    const { error: ubError } = await supabaseServer
      .from("bookings")
      .update({ status: "CHECKED_OUT", updated_at: new Date().toISOString() })
      .eq("id", bookingId);
    if (ubError) throw ubError;

    // Update status of paid incidents to RESOLVED
    await supabaseServer
      .from("room_incidents")
      .update({ 
        status: "RESOLVED", 
        resolved_at: new Date().toISOString(), 
        updated_at: new Date().toISOString() 
      })
      .eq("booking_id", bookingId)
      .eq("is_chargeable", true)
      .not("status", "in", '("RESOLVED","CLOSED","CANCELLED")');

    // 4. Update room status to DIRTY
    const nowIso = new Date().toISOString();
    let { error: urError } = await supabaseServer
      .from("rooms")
      .update({ status: "DIRTY", updated_at: nowIso, status_updated_at: nowIso })
      .eq("id", booking.room_id);
    if (urError && urError.message && urError.message.includes("status_updated_at")) {
      const fallback = await supabaseServer
        .from("rooms")
        .update({ status: "DIRTY", updated_at: nowIso })
        .eq("id", booking.room_id);
      urError = fallback.error;
    }
    if (urError) throw urError;

    // 5. Audit log
    await supabaseServer.from("audit_logs").insert({
      user_id: user.sub,
      action: "CHECK_OUT",
      entity_type: "BOOKING",
      entity_id: bookingId,
      details: { payment_method, amount, transaction_ref }
    });

    return NextResponse.json({ message: "Checkout successful" });

  } catch (error) {
    console.error("Checkout API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = params.id;
    // 1. Kéo thông tin đặt phòng gốc
    const { data: booking, error: bookingError } = await supabaseServer
      .from("bookings")
      .select("*, room:rooms(*, room_type:room_types(*))")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Không tìm thấy đơn đặt phòng" }, { status: 404 });
    }

    // 2. Lấy số tiền cọc đã thanh toán (Deposit)
    const { data: payments } = await supabaseServer
      .from("payments")
      .select("amount")
      .eq("booking_id", bookingId)
      .eq("status", "COMPLETED");

    const depositPaid = payments
      ? payments.reduce((sum, item) => sum + Number(item.amount || 0), 0)
      : 0;

    // 3. Lấy tổng tiền dịch vụ (Service Orders) chưa thanh toán
    const { data: serviceOrders } = await supabaseServer
      .from("service_orders")
      .select("total_amount")
      .eq("booking_id", bookingId)
      .not("status", "in", '("CANCELLED")');

    const totalServiceCharges = serviceOrders
      ? serviceOrders.reduce((sum, item) => sum + Number(item.total_amount || 0), 0)
      : 0;

    // 4. Tự động kiểm tra các khoản phạt chưa thanh toán (chargeable và chưa RESOLVED/CLOSED/CANCELLED) của booking này
    const { data: incidents } = await supabaseServer
      .from("room_incidents")
      .select("*")
      .eq("booking_id", bookingId)
      .eq("is_chargeable", true)
      .not("status", "in", '("RESOLVED","CLOSED","CANCELLED")');

    const totalFineAmount = incidents
      ? incidents.reduce((sum, item) => sum + Number(item.approved_charge || item.estimated_charge || 0), 0)
      : 0;

    // 5. Cộng dồn vào InvoiceData cuối cùng
    const roomCharges = Number(booking.total_amount);
    const remainingRoomCharges = Math.max(0, roomCharges - depositPaid);
    
    const subtotal = remainingRoomCharges + totalServiceCharges + totalFineAmount; // Cộng dồn tiền phạt trực tiếp
    const vatRate = 0.02; // 2% VAT
    const vatAmount = subtotal * vatRate;
    const grandTotal = subtotal + vatAmount;

    return NextResponse.json({
      booking,
      room_charges: roomCharges,
      deposit_paid: depositPaid,
      remaining_room_charges: remainingRoomCharges,
      service_charges: totalServiceCharges,
      incident_charges: {
        incidents: incidents || [],
        total_fine: totalFineAmount
      },
      subtotal,
      vat_rate: vatRate,
      vat_amount: vatAmount,
      grand_total: grandTotal,
      balance_due: grandTotal
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}