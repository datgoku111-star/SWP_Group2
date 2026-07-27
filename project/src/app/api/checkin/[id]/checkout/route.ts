import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth-server";
import { sendEmail, buildCheckoutEmailTemplate } from "@/lib/mail-sender";

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
      .select("*, room:rooms(*, room_type:room_types(*)), user:users(id, email, full_name, role), guest:guests(*)")
      .eq("id", bookingId)
      .single();

    if (bError || !booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    if (booking.status !== "CHECKED_IN") return NextResponse.json({ error: `Cannot checkout booking with status ${booking.status}` }, { status: 400 });

    // Calculate billing details BEFORE inserting the final checkout payment
    // so that the depositPaid represents everything paid BEFORE this checkout payment.
    const { data: payments } = await supabaseServer
      .from("payments")
      .select("amount")
      .eq("booking_id", bookingId)
      .eq("status", "COMPLETED");

    const depositPaid = payments
      ? payments.reduce((sum, item) => sum + Number(item.amount || 0), 0)
      : 0;

    const { data: roomForIncident } = await supabaseServer
      .from("rooms")
      .select("*")
      .eq("id", booking.room_id)
      .single();

    const incidents: any[] = [];
    if (roomForIncident && roomForIncident.notes && roomForIncident.notes.includes("DAMAGE:")) {
      try {
        const parts = roomForIncident.notes.split("DAMAGE:");
        const jsonStr = parts[1].trim();
        const damageData = JSON.parse(jsonStr);

        if (damageData.booking_id === bookingId && (damageData.is_chargeable ?? true)) {
          incidents.push({
            id: `incident-${booking.room_id}`,
            room_id: booking.room_id,
            booking_id: bookingId,
            description: damageData.description,
            detailed_note: damageData.detailed_note,
            estimated_charge: damageData.estimated_charge || 0,
            approved_charge: damageData.approved_charge || 0,
            actual_charge: damageData.approved_charge || 0,
            is_chargeable: true,
            status: 'REPORTED',
            incident_evidence: damageData.image ? [{ file_url: damageData.image }] : []
          });
        }
      } catch (e) {
        console.error("Failed to parse incident JSON for checkout:", e);
      }
    }

    const totalFineAmount = incidents.reduce((sum, item) => sum + Number(item.approved_charge || item.estimated_charge || 0), 0);

    let serviceOrders: any[] = [];
    try {
      const { data: sOrders } = await supabaseServer
        .from("service_orders")
        .select("*, items:service_order_items(*, service:services(*))")
        .eq("booking_id", bookingId)
        .not("status", "eq", "CANCELLED");
      if (sOrders) serviceOrders = sOrders;
    } catch (e) {
      console.warn("Could not fetch service orders for checkout calculation:", e);
    }

    const totalServiceAmount = serviceOrders.reduce((sum, order) => {
      let amt = Number(order.total_amount || 0);
      try {
        if (order.notes && order.notes.trim().startsWith("{")) {
          const notesObj = JSON.parse(order.notes);
          if (notesObj.is_car_rental) {
            if (order.status !== "COMPLETED") {
              return sum;
            }
            amt = amt * 26320;
          }
        }
      } catch (e) {}
      return sum + amt;
    }, 0);

    const calculateNights = (start: string, end: string) => {
      const diff = Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24));
      return diff > 0 ? diff : 1;
    };

    const nights = calculateNights(booking.check_in_date, booking.check_out_date);
    const basePrice = Number(booking.room?.room_type?.base_price || 0);
    const roomCharges = nights * basePrice;
    
    const subtotal = roomCharges + totalServiceAmount + totalFineAmount; 
    const vatRate = 0.02;
    const vatAmount = subtotal * vatRate;

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

    // Update status of paid incidents to RESOLVED by clearing from room notes
    const { data: currentRoom } = await supabaseServer
      .from("rooms")
      .select("*")
      .eq("id", booking.room_id)
      .single();

    if (currentRoom && currentRoom.notes && currentRoom.notes.includes("DAMAGE:")) {
      let bedConfig = 'SINGLE';
      if (currentRoom.notes.includes('|')) {
        bedConfig = currentRoom.notes.split('|')[0].trim();
      } else if (!currentRoom.notes.includes('DAMAGE:')) {
        bedConfig = currentRoom.notes.trim();
      }
      await supabaseServer
        .from("rooms")
        .update({ notes: bedConfig })
        .eq("id", booking.room_id);
    }

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

    // Send check-out invoice email to customer
    const recipientEmail = booking.guest?.email || booking.user?.email;
    if (recipientEmail) {
      const customerName = booking.guest?.full_name || booking.user?.full_name || "Quý khách";
      const phone = booking.guest?.phone || booking.user?.phone || "";

      const emailHtml = buildCheckoutEmailTemplate({
        bookingId: booking.id,
        customerName,
        email: recipientEmail,
        phone,
        roomNumber: booking.room?.room_number || "N/A",
        roomTypeName: booking.room?.room_type?.name || "N/A",
        checkInDate: booking.check_in_date,
        checkOutDate: booking.check_out_date,
        nights,
        basePrice,
        roomCharges,
        serviceCharges: totalServiceAmount,
        serviceOrders,
        incidentCharges: totalFineAmount,
        incidents: incidents || [],
        subtotal,
        vatRate,
        vatAmount,
        depositPaid,
        finalPaid: amount,
        paymentMethod: payment_method,
        transactionRef: transaction_ref || ""
      });

      sendEmail({
        to: recipientEmail,
        subject: `[HSRM Resort] Hóa đơn Thanh toán & Xác nhận Check-out - Mã: ${booking.id}`,
        html: emailHtml
      }).catch((err: any) => {
        console.error("Failed to send checkout email:", err);
      });
    }

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

    // 3. Tự động kiểm tra các khoản phạt chưa thanh toán (chargeable và chưa RESOLVED/CLOSED/CANCELLED) của booking này
    const { data: roomForIncidentGet } = await supabaseServer
      .from("rooms")
      .select("*")
      .eq("id", booking.room_id)
      .single();

    const incidents: any[] = [];
    if (roomForIncidentGet && roomForIncidentGet.notes && roomForIncidentGet.notes.includes("DAMAGE:")) {
      try {
        const parts = roomForIncidentGet.notes.split("DAMAGE:");
        const jsonStr = parts[1].trim();
        const damageData = JSON.parse(jsonStr);

        if (damageData.booking_id === bookingId && (damageData.is_chargeable ?? true)) {
          incidents.push({
            id: `incident-${booking.room_id}`,
            room_id: booking.room_id,
            booking_id: bookingId,
            description: damageData.description,
            detailed_note: damageData.detailed_note,
            estimated_charge: damageData.estimated_charge || 0,
            approved_charge: damageData.approved_charge || 0,
            actual_charge: damageData.approved_charge || 0,
            is_chargeable: true,
            status: 'REPORTED',
            incident_evidence: damageData.image ? [{ file_url: damageData.image }] : []
          });
        }
      } catch (e) {
        console.error("Failed to parse incident JSON for checkout GET:", e);
      }
    }

    const totalFineAmount = incidents.reduce((sum, item) => sum + Number(item.approved_charge || item.estimated_charge || 0), 0);

    // 4. Tự động cộng tất cả đơn gọi món / dịch vụ phòng (service_orders) chưa bị hủy của booking này
    let serviceOrders: any[] = [];
    try {
      const { data: sOrders } = await supabaseServer
        .from("service_orders")
        .select("*, items:service_order_items(*, service:services(*))")
        .eq("booking_id", bookingId)
        .not("status", "eq", "CANCELLED");
      if (sOrders) serviceOrders = sOrders;
    } catch (e) {
      console.warn("Could not fetch service orders for checkout calculation:", e);
    }

    const totalServiceAmount = serviceOrders.reduce((sum, order) => {
      let amount = Number(order.total_amount || 0);
      try {
        if (order.notes && order.notes.trim().startsWith("{")) {
          const notesObj = JSON.parse(order.notes);
          if (notesObj.is_car_rental) {
            // Only add to bill if the car rental has been confirmed as returned (COMPLETED)
            if (order.status !== "COMPLETED") {
              return sum; // skip if not completed yet
            }
            amount = amount * 26320; // Convert USD to VND
          }
        }
      } catch (e) {}
      return sum + amount;
    }, 0);

    // 4.5 Tự động cộng các đơn Trải nghiệm (Experience) đã liên kết
    const { data: expBookings } = await supabaseServer
      .from("bookings")
      .select("total_amount")
      .eq("user_id", booking.user_id)
      .like("special_requests", `%parent_booking_id%${bookingId}%`)
      .in("status", ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"]);
    
    const totalExperienceAmount = expBookings
      ? expBookings.reduce((sum, item) => sum + Number(item.total_amount || 0), 0)
      : 0;
    
    // Note: Experience amount is in USD, so we convert it to VND if the app treats base prices as USD * 25000 elsewhere
    // Wait! Let's check how total_amount is stored. In PageMain.tsx, it's stored exactly as pricePerNight * nights.
    // If the base price is 150, totalAmount = 150. We might need to multiply by 25000 if checkout calculates in VND!
    // But roomCharges doesn't multiply by 25000 here! It's just nights * basePrice.
    // So the conversion to VND happens in the UI component (`PageMain.tsx` or `checkin/page.tsx`).
    // Thus we don't multiply here.

    // 5. Cộng dồn vào InvoiceData cuối cùng
    const calculateNights = (start: string, end: string) => {
      const diff = Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24));
      return diff > 0 ? diff : 1;
    };

    const nights = calculateNights(booking.check_in_date, booking.check_out_date);
    const basePrice = Number(booking.room?.room_type?.base_price || 0);
    const roomCharges = nights * basePrice;
    
    // Tổng số bill trước cọc
    const subtotal = roomCharges + totalServiceAmount + totalFineAmount + totalExperienceAmount; 
    
    // 2% VAT của tổng số bill
    const vatRate = 0.02;
    const vatAmount = subtotal * vatRate;
    
    // Khách trả = Tổng bill + VAT - Tiền cọc
    const grandTotal = subtotal + vatAmount - depositPaid;
    const remainingRoomCharges = Math.max(0, roomCharges - depositPaid);


    return NextResponse.json({
      booking,
      room_charges: roomCharges,
      deposit_paid: depositPaid,
      remaining_room_charges: remainingRoomCharges,
      service_charges: totalServiceAmount,
      experience_charges: totalExperienceAmount,
      service_charges_detail: {
        orders: serviceOrders,
        total_service: totalServiceAmount,
      },
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