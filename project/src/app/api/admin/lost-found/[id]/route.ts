import { NextResponse } from "next/server";
import { supabaseServer as supabase } from "@/lib/supabase";
import { verifyAuthAndRole } from "@/lib/lost-found-auth";
import { AdminActionSchema } from "@/types/lost-found-reports";

/**
 * PATCH /api/admin/lost-found/[id]
 * Admin cập nhật trạng thái, phân công nhân viên và ghi chú quá trình tìm kiếm/hoàn trả
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Kiểm tra quyền ADMIN
    const { user, errorResponse } = await verifyAuthAndRole(["ADMIN"]);
    if (errorResponse) return errorResponse;

    const body = await request.json();

    // 2. Validate dữ liệu
    const validated = AdminActionSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Dữ liệu không hợp lệ", details: validated.error.format() },
        { status: 400 }
      );
    }

    const { status, assigned_staff_name, admin_note } = validated.data;
    const adminId = user!.sub;

    // 3. Lấy báo cáo hiện tại
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

    const now = new Date().toISOString();
    const updatePayload: Record<string, any> = {
      status,
      admin_id: adminId,
      updated_at: now,
    };

    if (assigned_staff_name !== undefined) {
      updatePayload.assigned_staff_name = assigned_staff_name || null;
    }

    if (admin_note !== undefined) {
      updatePayload.admin_note = admin_note || null;
    }

    // Nếu chuyển sang FOUND và chưa có found_at
    if (status === "FOUND" && !existingReport.found_at) {
      updatePayload.found_at = now;
    }

    // Nếu chuyển sang RETURNED_TO_CUSTOMER và chưa có returned_at
    if (status === "RETURNED_TO_CUSTOMER" && !existingReport.returned_at) {
      updatePayload.returned_at = now;
    }

    // 4. Update báo cáo
    const { data: updatedReport, error: updateError } = await supabase
      .from("lost_found_reports")
      .update(updatePayload)
      .eq("id", id)
      .select("*")
      .single();

    if (updateError || !updatedReport) {
      console.error("Lỗi khi Admin cập nhật báo cáo:", updateError);
      return NextResponse.json(
        { error: "Không thể cập nhật báo cáo" },
        { status: 500 }
      );
    }

    // 5. Ghi lịch sử trạng thái
    await supabase.from("lost_found_status_history").insert({
      report_id: id,
      old_status: existingReport.status,
      new_status: status,
      actor_id: adminId,
      actor_role: user!.role,
      note: admin_note || `Admin cập nhật trạng thái thành ${status}`,
    });

    return NextResponse.json({
      message: "Cập nhật tiến trình quản lý đồ thất lạc thành công",
      data: updatedReport,
    });
  } catch (error) {
    console.error("Lỗi API PATCH /api/admin/lost-found/[id]:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi bất ngờ trên máy chủ" },
      { status: 500 }
    );
  }
}
