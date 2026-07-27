import { NextResponse } from "next/server";
import { supabaseServer as supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth-server";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const incidentId = params.id;
    const roomId = incidentId.startsWith("incident-") ? incidentId.replace("incident-", "") : incidentId;

    const body = await request.json();
    const { status, approved_charge, is_chargeable } = body;

    // Fetch original room
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (roomError || !room) {
      return NextResponse.json({ error: "Không tìm thấy phòng tương ứng với sự cố" }, { status: 404 });
    }

    if (!room.notes || !room.notes.includes('DAMAGE:')) {
      return NextResponse.json({ error: "Không tìm thấy sự cố đang hoạt động cho phòng này" }, { status: 404 });
    }

    const parts = room.notes.split('DAMAGE:');
    const bedConfig = parts[0].trim().replace(/\s*\|\s*$/, '');
    const jsonStr = parts[1].trim();
    const damageData = JSON.parse(jsonStr);

    let newNotes = room.notes;
    let newStatus = room.status;

    // If resolved or closed, clear the damage metadata and restore room to AVAILABLE
    if (status === 'RESOLVED' || status === 'CLOSED' || status === 'AVAILABLE') {
      newNotes = bedConfig;
      newStatus = 'AVAILABLE';
    } else {
      if (status !== undefined) {
        damageData.status = status;
      }
      if (approved_charge !== undefined) {
        damageData.approved_charge = Number(approved_charge);
      }
      if (is_chargeable !== undefined) {
        damageData.is_chargeable = Boolean(is_chargeable);
      }
      newNotes = `${bedConfig} | DAMAGE: ${JSON.stringify(damageData)}`;
    }

    // Update room
    const { error: updateError } = await supabase
      .from('rooms')
      .update({
        notes: newNotes,
        status: newStatus,
        status_updated_at: new Date().toISOString()
      })
      .eq('id', roomId);

    if (updateError) {
      console.error("Failed to update virtual incident PATCH:", updateError);
      return NextResponse.json({ error: "Lỗi server khi cập nhật sự cố" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: { id: incidentId, status: newStatus } });
  } catch (error: any) {
    console.error("PATCH incident by ID error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}