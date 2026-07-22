import { NextResponse } from "next/server";
import { supabaseServer as supabase } from "@/lib/supabase";
import { verifyAuthAndRole } from "@/lib/lost-found-auth";

/**
 * GET /api/admin/lost-found
 * Admin xem các báo cáo đồ thất lạc đã được Receptionist xác nhận (hoặc toàn bộ)
 */
export async function GET(request: Request) {
  try {
    const { errorResponse } = await verifyAuthAndRole(["ADMIN"]);
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");
    const search = searchParams.get("search");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const roomId = searchParams.get("roomId");

    let query = supabase
      .from("lost_found_reports")
      .select(`
        *,
        users:user_id (full_name, email, phone),
        rooms:room_id (room_number),
        receptionist:receptionist_id (full_name),
        admin:admin_id (full_name)
      `)
      // Admin chủ yếu quản lý từ CONFIRMED_BY_RECEPTIONIST trở đi
      .neq("status", "PENDING_RECEPTIONIST")
      .order("created_at", { ascending: false });

    if (statusFilter && statusFilter !== "ALL") {
      query = query.eq("status", statusFilter);
    }

    if (roomId) {
      query = query.eq("room_id", roomId);
    }

    if (startDate) {
      query = query.gte("created_at", `${startDate}T00:00:00.000Z`);
    }

    if (endDate) {
      query = query.lte("created_at", `${endDate}T23:59:59.999Z`);
    }

    const { data: reports, error } = await query;

    if (error) {
      console.error("Lỗi khi truy vấn báo cáo cho Admin:", error);
      return NextResponse.json(
        { error: "Không thể lấy danh sách báo cáo quản lý" },
        { status: 500 }
      );
    }

    let formattedReports = (reports || []).map((item: any) => ({
      ...item,
      user_name: item.users?.full_name || "Khách hàng",
      user_email: item.users?.email || "",
      room_number: item.rooms?.room_number || null,
      receptionist_name: item.receptionist?.full_name || null,
      admin_name: item.admin?.full_name || null,
    }));

    // Lọc theo từ khóa tìm kiếm nếu có
    if (search && search.trim() !== "") {
      const lowerSearch = search.toLowerCase();
      formattedReports = formattedReports.filter(
        (r: any) =>
          r.item_name?.toLowerCase().includes(lowerSearch) ||
          r.user_name?.toLowerCase().includes(lowerSearch) ||
          r.user_email?.toLowerCase().includes(lowerSearch) ||
          r.contact_phone?.includes(lowerSearch) ||
          r.room_number?.toLowerCase().includes(lowerSearch)
      );
    }

    return NextResponse.json({
      data: formattedReports,
    });
  } catch (error) {
    console.error("Lỗi API GET /api/admin/lost-found:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi hệ thống" },
      { status: 500 }
    );
  }
}
