import { NextResponse } from "next/server";
import { supabaseServer as supabase } from "@/lib/supabase";
import { verifyAuthAndRole } from "@/lib/lost-found-auth";
import { ReceptionistActionSchema } from "@/types/lost-found-reports";
import type { LostFoundReportStatus } from "@/types/lost-found-reports";

/**
 * PATCH /api/receptionist/lost-found/[id]
 * Receptionist xác nhận, từ chối hoặc yêu cầu bổ sung thông tin
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Kiểm tra quyền RECEPTIONIST hoặc ADMIN
    const { user, errorResponse } = await verifyAuthAndRole(["RECEPTIONIST", "ADMIN"]);
    if (errorResponse) return errorResponse;

    const body = await request.json();

    // 2. Validate input
    const validated = ReceptionistActionSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Dữ liệu không hợp lệ", details: validated.error.format() },
        { status: 400 }
      );
    }

    const { action, note } = validated.data;
    const receptionistId = user!.sub;

    // 3. Lấy thông tin report hiện tại
    const { data: existingReport, error: fetchError } = await supabase
      .from("lost_found_reports")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !existingReport) {
      return NextResponse.json(
        { error: "Không tìm thấy báo cáo đồ thất lạc" },
        { status: 404 }
      );
    }

    // Map action thành new_status
    let newStatus: LostFoundReportStatus;
    if (action === "CONFIRMED") {
      newStatus = "CONFIRMED_BY_RECEPTIONIST";
    } else if (action === "REJECTED") {
      newStatus = "REJECTED";
    } else {
      newStatus = "REQUEST_MORE_INFO";
    }

    const now = new Date().toISOString();

    // 4. Update báo cáo
    const { data: updatedReport, error: updateError } = await supabase
      .from("lost_found_reports")
      .update({
        status: newStatus,
        receptionist_id: receptionistId,
        receptionist_note: note || null,
        receptionist_confirmed_at: now,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (updateError || !updatedReport) {
      console.error("Lỗi khi Lễ tân cập nhật báo cáo:", updateError);
      return NextResponse.json(
        { error: "Lỗi hệ thống khi cập nhật báo cáo" },
        { status: 500 }
      );
    }

    // 5. Ghi lịch sử chuyển trạng thái
    await supabase.from("lost_found_status_history").insert({
      report_id: id,
      old_status: existingReport.status,
      new_status: newStatus,
      actor_id: receptionistId,
      actor_role: user!.role,
      note: note || `Lễ tân thực hiện thao tác: ${action}`,
    });

    return NextResponse.json({
      message: `Đã cập nhật trạng thái báo cáo thành ${newStatus}`,
      data: updatedReport,
    });
  } catch (error) {
    console.error("Lỗi API PATCH /api/receptionist/lost-found/[id]:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi bất ngờ trên máy chủ" },
      { status: 500 }
    );
  }
}
