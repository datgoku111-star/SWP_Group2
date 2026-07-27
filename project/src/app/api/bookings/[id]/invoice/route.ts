import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth-server";

import type { InvoiceData } from "@/types/hotel";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const bookingId = params.id;

    // 1. Fetch Booking + Room + User + Guest
    const { data: booking, error: bError } = await supabaseServer
      .from("bookings")
      .select("*, room:rooms(*, room_type:room_types(*)), user:users(id, email, full_name, phone), guest:guests(*)")
      .eq("id", bookingId)
      .single();

    if (bError || !booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    // Authorization
    if (!["ADMIN", "RECEPTIONIST"].includes(user.role) && booking.user_id !== user.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // 2. Fetch completed or in-progress (paid) service orders
    const { data: orders, error: oError } = await supabaseServer
      .from("service_orders")
      .select("id, status, items:service_order_items(*, service:services(*))")
      .eq("booking_id", bookingId)
      .in("status", ["IN_PROGRESS", "COMPLETED"]);

    // 2.5 Fetch experience bookings (as linked bookings)
    const { data: experiences, error: eError } = await supabaseServer
      .from("bookings")
      .select("id, special_requests, total_amount, num_guests")
      .eq("user_id", booking.user_id)
      .like("special_requests", `%parent_booking_id%${bookingId}%`)
      .in("status", ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"]);

    // 2.6 Fetch car bookings
    const { data: cars, error: cError } = await supabaseServer
      .from("car_bookings")
      .select("id, car_type, total_price")
      .eq("booking_id", bookingId);

    // 3. Fetch payments
    const { data: payments, error: pError } = await supabaseServer
      .from("payments")
      .select("*")
      .eq("booking_id", bookingId)
      .eq("status", "COMPLETED");

    // 4. Fetch room and virtual incidents that are chargeable
    const { data: room } = await supabaseServer
      .from("rooms")
      .select("*")
      .eq("id", booking.room_id)
      .single();

    const incidents: any[] = [];
    if (room && room.notes && room.notes.includes("DAMAGE:")) {
      try {
        const parts = room.notes.split("DAMAGE:");
        const jsonStr = parts[1].trim();
        const damageData = JSON.parse(jsonStr);

        if (damageData.booking_id === bookingId && (damageData.is_chargeable ?? true)) {
          incidents.push({
            id: `incident-${room.id}`,
            room_id: room.id,
            booking_id: bookingId,
            description: damageData.description,
            detailed_note: damageData.detailed_note,
            estimated_charge: damageData.estimated_charge || 0,
            approved_charge: damageData.approved_charge || 0,
            actual_charge: damageData.approved_charge || 0,
            is_chargeable: true,
            status: room.status === 'MAINTENANCE' ? 'REPORTED' : 'RESOLVED',
            incident_evidence: damageData.image ? [{ file_url: damageData.image }] : []
          });
        }
      } catch (e) {
        console.error("Failed to parse incident JSON for invoice:", e);
      }
    }

    const totalFineAmountUSD = incidents
      ? incidents.reduce((sum, item) => sum + Number(item.approved_charge || item.estimated_charge || 0), 0)
      : 0;

    const totalFineAmount = Math.round(totalFineAmountUSD * 26320);

    const convertedIncidents = (incidents || []).map(item => ({
      ...item,
      estimated_charge: Math.round(Number(item.estimated_charge || 0) * 26320),
      approved_charge: Math.round(Number(item.approved_charge || 0) * 26320),
      actual_charge: Math.round(Number(item.actual_charge || 0) * 26320),
    }));

    // Convert base_price of room type from USD to VND for invoice display
    if (booking.room?.room_type) {
      booking.room.room_type.base_price = Math.round(Number(booking.room.room_type.base_price) * 26320);
    }

    // Calculations
    const ciDate = new Date(booking.check_in_date);
    const coDate = new Date(booking.check_out_date);
    const days = Math.max(1, Math.ceil((coDate.getTime() - ciDate.getTime()) / (1000 * 60 * 60 * 24)));
    const roomCharges = days * (booking.room?.room_type?.base_price || 0);

    const serviceCharges = (orders || []).map(order => {
      const items = order.items || [];
      const total = items.reduce((sum, item) => sum + item.subtotal, 0);
      return { order_id: order.id, items, total };
    });

    const totalServices = serviceCharges.reduce((sum, sc) => sum + sc.total, 0);
    
    const experienceCharges = (experiences || []).map(exp => {
      let expName = "Experience";
      try {
        if (exp.special_requests) {
          const req = JSON.parse(exp.special_requests);
          expName = req.title || "Experience";
        }
      } catch (e) {}
      return {
        id: exp.id,
        experience_id: expName,
        guests: exp.num_guests,
        total: Math.round(Number(exp.total_amount) * 26320) // convert to VND
      };
    });
    const totalExperiences = experienceCharges.reduce((sum, exp) => sum + exp.total, 0);

    const carCharges = (cars || []).map(car => ({
      id: car.id,
      car_type: car.car_type,
      total: Number(car.total_price)
    }));
    const totalCars = carCharges.reduce((sum, car) => sum + car.total, 0);

    const subtotal = roomCharges + totalServices + totalExperiences + totalCars + totalFineAmount;
    
    // Configurable VAT, usually 2%
    const vatRate = 0.02;
    const vatAmount = subtotal * vatRate;
    const grandTotal = subtotal + vatAmount;

    // Convert room booking payments from USD to VND, leaving service orders (which are already in VND) untouched
    const convertedPayments = (payments || []).map(p => {
      const isService = p.transaction_ref && p.transaction_ref.includes("_service_");
      return {
        ...p,
        amount: isService ? Number(p.amount) : Math.round(Number(p.amount) * 26320)
      };
    });

    const totalPaid = convertedPayments.reduce((sum, p) => sum + p.amount, 0);
    const balanceDue = grandTotal - totalPaid;

    const invoiceData: InvoiceData = {
      booking,
      room_charges: roomCharges,
      service_charges: serviceCharges,
      incident_charges: {
        incidents: convertedIncidents,
        total_fine: totalFineAmount
      },
      experience_charges: experienceCharges,
      car_charges: carCharges,
      subtotal,
      vat_rate: vatRate,
      vat_amount: vatAmount,
      grand_total: grandTotal,
      payments: convertedPayments,
      balance_due: balanceDue,
    };

    return NextResponse.json(invoiceData);

  } catch (error) {
    console.error("GET invoice error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
