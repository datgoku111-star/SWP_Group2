import { NextResponse } from "next/server";
import { supabaseServer as supabase } from "@/lib/supabase";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const body = await request.json();
    const { status } = body;

    if (status !== "RESOLVED" && status !== "PENDING") {
      return NextResponse.json({ error: "Trạng thái không hợp lệ" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("room_incidents")
      .update({
        status,
        resolved_at: status === "RESOLVED" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}