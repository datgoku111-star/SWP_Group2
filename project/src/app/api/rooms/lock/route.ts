import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { supabaseServer } from "@/lib/supabase";
import { getAvailableRooms } from "@/lib/db/rooms";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const bodyText = await request.clone().text();
    try {
      const fs = require("fs");
      fs.appendFileSync("lock_errors.txt", `[${new Date().toISOString()}] Request: body=${bodyText}, user=${JSON.stringify(user)}\n`);
    } catch (e) {}

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { room_id, checkIn, checkOut } = await request.json();
    if (!room_id || !checkIn || !checkOut) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Check if the room is still available (neither booked nor locked by other users)
    const availableRooms = await getAvailableRooms(checkIn, checkOut, undefined, user.sub);
    const isRoomAvailable = availableRooms.some((r) => r.id === room_id);

    if (!isRoomAvailable) {
      return NextResponse.json(
        { error: "Room is no longer available or locked by another user" },
        { status: 409 }
      );
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
        console.error("Failed to dynamically insert user on lock:", insertErr);
      }
    }

    // 2. Lock the room for 10 minutes
    const lockedUntil = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { data, error } = await supabaseServer
      .from("room_locks")
      .upsert({
        room_id,
        user_id: user.sub,
        locked_until: lockedUntil,
      }, {
        onConflict: "room_id"
      })
      .select()
      .single();

    if (error) {
      console.error("Upsert room lock error:", error);
      try {
        const fs = require("fs");
        fs.appendFileSync("lock_errors.txt", `[${new Date().toISOString()}] Upsert error: ${JSON.stringify(error)} (room_id: ${room_id}, user_id: ${user.sub})\n`);
      } catch (e) {}
      return NextResponse.json({ error: "Failed to lock room" }, { status: 500 });
    }

    return NextResponse.json({ success: true, lock: data });
  } catch (error: any) {
    console.error("Lock room error:", error);
    try {
      const fs = require("fs");
      fs.appendFileSync("lock_errors.txt", `[${new Date().toISOString()}] Exception: ${error.message || error}\n`);
    } catch (e) {}
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
