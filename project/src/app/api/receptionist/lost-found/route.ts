import { NextResponse } from "next/server";
import { supabaseServer as supabase } from "@/lib/supabase";
import { verifyAuthAndRole } from "@/lib/lost-found-auth";

/**
 * GET /api/receptionist/lost-found
 * Receptionist xem các báo cáo đồ thất lạc (bao gồm thống kê số lượng chờ xử lý)
 */
export async function GET(request: Request) {
  try {
    const { errorResponse } = await verifyAuthAndRole(["RECEPTIONIST", "ADMIN"]);
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");

    let query = supabase
      .from("lost_found_reports")
      .select(`
        *,
        users:user_id (full_name, email, phone),
        rooms:room_id (room_number)
      `)
      .order("created_at", { ascending: false });

    if (statusFilter) {
      query = query.eq("status", statusFilter);
    }

    const { data: reports, error } = await query;

    if (error) {
      console.error("Lỗi khi truy vấn báo cáo của Receptionist:", error);
      return NextResponse.json(
        { error: "Không thể lấy danh sách báo cáo đồ thất lạc" },
        { status: 500 }
      );
    }

    // Đếm số lượng yêu cầu đang chờ xử lý (PENDING_RECEPTIONIST)
    const { count: pendingCount } = await supabase
      .from("lost_found_reports")
      .select("*", { count: "exact", head: true })
      .eq("status", "PENDING_RECEPTIONIST");

    const formattedReports = (reports || []).map((item: any) => ({
      ...item,
      user_name: item.users?.full_name || "Khách hàng",
      user_email: item.users?.email || "",
      room_number: item.rooms?.room_number || null,
    }));

    return NextResponse.json({
      pendingCount: pendingCount || 0,
      data: formattedReports,
    });
  } catch (error) {
    console.error("Lỗi API GET /api/receptionist/lost-found:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi hệ thống" },
      { status: 500 }
    );
  }
}
