import { NextResponse } from "next/server";
import { createBooking, getAllBookings, getBookingsByUser } from "@/lib/db/bookings";
import { getCurrentUser } from "@/lib/auth-server";
import { supabaseServer } from "@/lib/supabase";

async function autoCheckoutOverdue() {
  try {
    const { data: overdueBookings, error: fetchErr } = await supabaseServer
      .from('bookings')
      .select('id, room_id, check_out_date, status')
      .eq('status', 'CHECKED_IN');
      
    if (fetchErr || !overdueBookings) return;
    
    const now = Date.now();
    for (const b of overdueBookings) {
      if (!b.check_out_date) continue;
      // Checkout limit is 12h after 12:00 PM of check_out_date -> midnight of next day
      const limitDate = new Date(b.check_out_date + 'T12:00:00Z').getTime() + 12 * 60 * 60 * 1000;
      if (now > limitDate) {
        console.log(`[Auto-Checkout] Triggered for booking ${b.id}`);
        
        // 1. Mark booking as CHECKED_OUT
        await supabaseServer.from('bookings').update({ 
          status: 'CHECKED_OUT', 
          checkout_message: 'Auto-checked out due to overdue',
          updated_at: new Date().toISOString()
        }).eq('id', b.id);
        
        // 2. Mark room as DIRTY
        const nowIso = new Date().toISOString();
        let urError = await supabaseServer.from('rooms').update({ status: 'DIRTY', updated_at: nowIso, status_updated_at: nowIso }).eq('id', b.room_id);
        if (urError.error && urError.error.message.includes("status_updated_at")) {
           await supabaseServer.from('rooms').update({ status: 'DIRTY', updated_at: nowIso }).eq('id', b.room_id);
        }
      }
    }
  } catch(e) {
    console.error("Auto checkout error:", e);
  }
}



export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role === "CUSTOMER") {
            const bookings = await getBookingsByUser(user.sub);
      return NextResponse.json(bookings);
    }

    if (!["ADMIN", "RECEPTIONIST"].includes(user.role)) {
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

    try {
      const fs = require("fs");
      const logMsg = `[${new Date().toISOString()}] User: ${JSON.stringify(user)}\nData: ${JSON.stringify(data)}\n\n`;
      fs.appendFileSync("D:/Pho/Pho/project/bookings_log.txt", logMsg);
    } catch (e) {}
    
        // Validate Experience Booking
    let isExperience = false;
    let specialReqObj = null;
    try {
      if (data.special_requests) {
        specialReqObj = JSON.parse(data.special_requests);
        if (specialReqObj.isExperience) {
          isExperience = true;
        }
      }
    } catch (e) {}
    
    // Basic validation
    if (!data.check_in_date || !data.check_out_date || (!data.room_id && !isExperience)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (isExperience) {
      // Check if user has an active checked_in booking
      const { data: activeBookings } = await supabaseServer
        .from("bookings")
        .select("id, room_id")
        .eq("user_id", user.sub)
        .eq("status", "CHECKED_IN");
      
      if (!activeBookings || activeBookings.length === 0) {
         return NextResponse.json({ error: "You must check in before booking an experience." }, { status: 400 });
      }
      
      // Attach parent booking ID to special requests
      if (specialReqObj) {
        specialReqObj.parent_booking_id = activeBookings[0].id;
        data.special_requests = JSON.stringify(specialReqObj);
      }
      
      // Assign the room_id from the parent booking if it's missing
      if (!data.room_id) {
        data.room_id = activeBookings[0].room_id;
      }
    }

    // Ensure user exists in public.users to prevent foreign key violations (e.g. after database reseeding)
    const { data: dbUser, error: dbUserErr } = await supabaseServer
      .from("users")
      .select("id")
      .eq("id", user.sub)
      .maybeSingle();

    if (!dbUser) {
      console.log(`User ${user.sub} not found in public.users, dynamically inserting...`);
      const { error: insertErr } = await supabaseServer
        .from("users")
        .insert({
          id: user.sub,
          email: user.email.toLowerCase(),
          full_name: user.name || user.email.split("@")[0],
          phone: "",
          role: user.role || "CUSTOMER",
          is_active: true,
          password_hash: "SUPABASE_AUTH",
        });
      if (insertErr) {
        console.error("Failed to dynamically insert user on booking:", insertErr);
      }
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
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}





