import { NextResponse } from "next/server";
import { supabaseServer as supabase } from "@/lib/supabase";
import { verifyAuthAndRole, isOwnerOrStaff } from "@/lib/lost-found-auth";

/**
 * GET /api/lost-found/[id]/history
 * Lấy danh sách lịch sử thay đổi trạng thái của báo cáo đồ thất lạc
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Kiểm tra đăng nhập
    const { user, errorResponse } = await verifyAuthAndRole();
    if (errorResponse) return errorResponse;

    // 2. Lấy thông tin report để kiểm tra quyền sở hữu
    const { data: report, error: reportError } = await supabase
      .from("lost_found_reports")
      .select("user_id")
      .eq("id", id)
      .single();

    if (reportError || !report) {
      return NextResponse.json(
        { error: "Không tìm thấy báo cáo đồ thất lạc" },
        { status: 404 }
      );
    }

    if (!isOwnerOrStaff(user!.sub, report.user_id, user!.role)) {
      return NextResponse.json(
        { error: "Bạn không có quyền xem lịch sử của báo cáo này" },
        { status: 403 }
      );
    }

    // 3. Truy vấn lịch sử thay đổi trạng thái
    const { data: history, error: historyError } = await supabase
      .from("lost_found_status_history")
      .select(`
        *,
        users:actor_id (full_name, email, role)
      `)
      .eq("report_id", id)
      .order("created_at", { ascending: true });

    if (historyError) {
      console.error("Lỗi khi truy vấn history:", historyError);
      return NextResponse.json(
        { error: "Không thể lấy lịch sử thay đổi trạng thái" },
        { status: 500 }
      );
    }

    const formattedHistory = (history || []).map((h: any) => ({
      ...h,
      actor_name: h.users?.full_name || "Hệ thống",
    }));

    return NextResponse.json({
      data: formattedHistory,
    });
  } catch (error) {
    console.error("Lỗi API GET /api/lost-found/[id]/history:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi bất ngờ" },
      { status: 500 }
    );
  }
}
