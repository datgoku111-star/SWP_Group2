import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { supabaseServer } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { room_id } = await request.json();
    if (!room_id) {
      return NextResponse.json({ error: "Missing room_id" }, { status: 400 });
    }

    // Delete the lock for this room and user
    const { error } = await supabaseServer
      .from("room_locks")
      .delete()
      .eq("room_id", room_id)
      .eq("user_id", user.sub);

    if (error) {
      console.error("Unlock room error:", error);
      return NextResponse.json({ error: "Failed to unlock room" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unlock room error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
