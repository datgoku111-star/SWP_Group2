import { NextResponse } from "next/server";
import { supabaseServer as supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { room_id, booking_id, reporter_id, type, description, fine_amount } = body;

    if (!room_id || !booking_id || !type || !description) {
      return NextResponse.json({ error: "Thiếu trường thông tin bắt buộc" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("room_incidents")
      .insert({
        room_id,
        booking_id,
        reporter_id: reporter_id || null,
        type,
        description,
        fine_amount: Number(fine_amount) || 0,
        status: "PENDING"
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}