import { NextResponse } from "next/server";
import { supabaseServer as supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth-server";
import { INCIDENT_STATUS } from "@/contains/incident";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const id = params.id;
    const body = await request.json();
    const { status, note } = body;

    // Validate status is one of the valid INCIDENT_STATUS keys
    const validStatuses = Object.values(INCIDENT_STATUS);
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Trạng thái không hợp lệ" }, { status: 400 });
    }

    // Get current incident to check previous status
    const { data: currentIncident, error: fetchError } = await supabase
      .from("room_incidents")
      .select("status")
      .eq("id", id)
      .single();

    if (fetchError || !currentIncident) {
      return NextResponse.json({ error: "Không tìm thấy sự cố" }, { status: 404 });
    }

    const oldStatus = currentIncident.status;

    // Update status in database
    const { data, error } = await supabase
      .from("room_incidents")
      .update({
        status,
        resolved_at: (status === INCIDENT_STATUS.RESOLVED || status === INCIDENT_STATUS.CLOSED) ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Write history log to incident_history
    await supabase.from("incident_history").insert({
      incident_id: id,
      action: "STATUS_CHANGE",
      old_status: oldStatus,
      new_status: status,
      note: note || `Chuyển trạng thái từ ${oldStatus} sang ${status}`,
      changed_by_user_id: user.id
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("PATCH incident by ID error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}