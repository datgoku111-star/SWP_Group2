import { NextResponse } from "next/server";
import { supabaseServer as supabase } from "@/lib/supabase";
import { verifyAuthAndRole } from "@/lib/lost-found-auth";

/**
 * GET /api/lost-found/my-reports
 * Customer xem danh sách báo cáo do chính mình tạo
 */
export async function GET() {
  try {
    const { user, errorResponse } = await verifyAuthAndRole();
    if (errorResponse) return errorResponse;

    const currentUserId = user!.sub;

    const { data: reports, error } = await supabase
      .from("lost_found_reports")
      .select(`
        *,
        rooms:room_id (room_number)
      `)
      .eq("user_id", currentUserId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Lỗi truy vấn my-reports:", error);
      return NextResponse.json(
        { error: "Không thể lấy danh sách báo cáo đồ thất lạc" },
        { status: 500 }
      );
    }

    const formattedReports = (reports || []).map((item: any) => ({
      ...item,
      room_number: item.rooms?.room_number || null,
    }));

    return NextResponse.json({
      data: formattedReports,
    });
  } catch (error) {
    console.error("Lỗi API GET /api/lost-found/my-reports:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi hệ thống" },
      { status: 500 }
    );
  }
}
