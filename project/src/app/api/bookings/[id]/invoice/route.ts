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

    // 2. Fetch completed service orders
    const { data: orders, error: oError } = await supabaseServer
      .from("service_orders")
      .select("id, status, items:service_order_items(*, service:services(*))")
      .eq("booking_id", bookingId)
      .in("status", ["COMPLETED"]);

    // 3. Fetch payments
    const { data: payments, error: pError } = await supabaseServer
      .from("payments")
      .select("*")
      .eq("booking_id", bookingId)
      .eq("status", "COMPLETED");

    // 4. Fetch room incidents that are chargeable and not resolved/closed/cancelled
    const { data: incidents } = await supabaseServer
      .from("room_incidents")
      .select("*")
      .eq("booking_id", bookingId)
      .eq("is_chargeable", true)
      .not("status", "in", '("RESOLVED","CLOSED","CANCELLED")');

    const totalFineAmount = incidents
      ? incidents.reduce((sum, item) => sum + Number(item.approved_charge || item.estimated_charge || 0), 0)
      : 0;

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
    const subtotal = roomCharges + totalServices + totalFineAmount;
    
    // Configurable VAT, usually 10%
    const vatRate = 0.1;
    const vatAmount = subtotal * vatRate;
    const grandTotal = subtotal + vatAmount;

    const totalPaid = (payments || []).reduce((sum, p) => sum + p.amount, 0);
    const balanceDue = grandTotal - totalPaid;

    const invoiceData: InvoiceData = {
      booking,
      room_charges: roomCharges,
      service_charges: serviceCharges,
      incident_charges: {
        incidents: incidents || [],
        total_fine: totalFineAmount
      },
      subtotal,
      vat_rate: vatRate,
      vat_amount: vatAmount,
      grand_total: grandTotal,
      payments: payments || [],
      balance_due: balanceDue,
    };

    return NextResponse.json(invoiceData);

  } catch (error) {
    console.error("GET invoice error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
