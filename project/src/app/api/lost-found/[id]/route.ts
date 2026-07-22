import { NextResponse } from "next/server";
import { supabaseServer as supabase } from "@/lib/supabase";
import { verifyAuthAndRole, isOwnerOrStaff } from "@/lib/lost-found-auth";
import { UpdateLostFoundReportCustomerSchema } from "@/types/lost-found-reports";

/**
 * GET /api/lost-found/[id]
 * Lấy thông tin chi tiết của 1 báo cáo đồ thất lạc
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { user, errorResponse } = await verifyAuthAndRole();
    if (errorResponse) return errorResponse;

    const { data: report, error } = await supabase
      .from("lost_found_reports")
      .select(`
        *,
        users:user_id (full_name, email, phone),
        rooms:room_id (room_number),
        receptionist:receptionist_id (full_name),
        admin:admin_id (full_name)
      `)
      .eq("id", id)
      .single();

    if (error || !report) {
      return NextResponse.json(
        { error: "Không tìm thấy báo cáo đồ thất lạc" },
        { status: 404 }
      );
    }

    if (!isOwnerOrStaff(user!.sub, report.user_id, user!.role)) {
      return NextResponse.json(
        { error: "Bạn không có quyền truy cập báo cáo này" },
        { status: 403 }
      );
    }

    const formattedReport = {
      ...report,
      user_name: report.users?.full_name || "Khách hàng",
      user_email: report.users?.email || "",
      room_number: report.rooms?.room_number || null,
      receptionist_name: report.receptionist?.full_name || null,
      admin_name: report.admin?.full_name || null,
    };

    return NextResponse.json({ data: formattedReport });
  } catch (error) {
    console.error("Lỗi API GET /api/lost-found/[id]:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi bất ngờ" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/lost-found/[id]
 * Customer bổ sung thông tin khi Receptionist yêu cầu (trạng thái REQUEST_MORE_INFO)
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { user, errorResponse } = await verifyAuthAndRole();
    if (errorResponse) return errorResponse;

    // 1. Lấy thông tin báo cáo
    const { data: report, error: fetchError } = await supabase
      .from("lost_found_reports")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !report) {
      return NextResponse.json(
        { error: "Không tìm thấy báo cáo đồ thất lạc" },
        { status: 404 }
      );
    }

    // 2. Chỉ chính chủ mới được sửa khi được yêu cầu bổ sung
    if (report.user_id !== user!.sub) {
      return NextResponse.json(
        { error: "Bạn chỉ có thể cập nhật báo cáo của chính mình" },
        { status: 403 }
      );
    }

    if (report.status !== "REQUEST_MORE_INFO" && report.status !== "PENDING_RECEPTIONIST") {
      return NextResponse.json(
        { error: "Báo cáo này hiện tại không thể chỉnh sửa" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validated = UpdateLostFoundReportCustomerSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Dữ liệu không hợp lệ", details: validated.error.format() },
        { status: 400 }
      );
    }

    const data = validated.data;
    const oldStatus = report.status;
    const newStatus = "PENDING_RECEPTIONIST"; // Chuyển lại PENDING để Lễ tân duyệt tiếp

    const { data: updatedReport, error: updateError } = await supabase
      .from("lost_found_reports")
      .update({
        item_name: data.item_name !== undefined ? data.item_name : report.item_name,
        description: data.description !== undefined ? data.description : report.description,
        lost_location: data.lost_location !== undefined ? data.lost_location : report.lost_location,
        lost_at: data.lost_at ? new Date(data.lost_at).toISOString() : report.lost_at,
        contact_phone: data.contact_phone !== undefined ? data.contact_phone : report.contact_phone,
        image_url: data.image_url !== undefined ? data.image_url : report.image_url,
        booking_id: data.booking_id !== undefined ? (data.booking_id || null) : report.booking_id,
        room_id: data.room_id !== undefined ? (data.room_id || null) : report.room_id,
        status: newStatus,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (updateError || !updatedReport) {
      console.error("Lỗi khi Customer cập nhật báo cáo:", updateError);
      return NextResponse.json(
        { error: "Không thể cập nhật báo cáo" },
        { status: 500 }
      );
    }

    // Ghi lịch sử
    await supabase.from("lost_found_status_history").insert({
      report_id: id,
      old_status: oldStatus,
      new_status: newStatus,
      actor_id: user!.sub,
      actor_role: user!.role,
      note: "Khách hàng đã bổ sung thông tin theo yêu cầu của Lễ tân",
    });

    return NextResponse.json({
      message: "Đã cập nhật thông tin báo cáo thành công",
      data: updatedReport,
    });
  } catch (error) {
    console.error("Lỗi API PATCH /api/lost-found/[id]:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi hệ thống" },
      { status: 500 }
    );
  }
}
