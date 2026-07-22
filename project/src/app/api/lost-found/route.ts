import { NextResponse } from "next/server";
import { supabaseServer as supabase } from "@/lib/supabase";
import { verifyAuthAndRole } from "@/lib/lost-found-auth";
import { CreateLostFoundReportSchema } from "@/types/lost-found-reports";

/**
 * POST /api/lost-found
 * Customer tạo báo cáo đồ thất lạc mới
 */
export async function POST(request: Request) {
  try {
    // 1. Kiểm tra đăng nhập
    const { user, errorResponse } = await verifyAuthAndRole();
    if (errorResponse) return errorResponse;

    const rawBody = await request.json();

    // Chuẩn hóa dữ liệu tương thích giữa tất cả các loại Form
    const normalizedBody = {
      ...rawBody,
      lost_location: rawBody.lost_location || rawBody.where_found || rawBody.location || null,
      contact_phone: rawBody.contact_phone || rawBody.phone || user!.email || "Chưa cập nhật",
      lost_at: rawBody.lost_at || rawBody.found_at || new Date().toISOString(),
    };

    // 2. Validate dữ liệu đầu vào
    const validated = CreateLostFoundReportSchema.safeParse(normalizedBody);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Dữ liệu không hợp lệ", details: validated.error.format() },
        { status: 400 }
      );
    }

    const data = validated.data;
    const currentUserId = user!.sub;

    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    
    let resolvedRoomId: string | null = null;
    let resolvedLocation = data.lost_location || rawBody.where_found || "";

    if (data.room_id && data.room_id.trim() !== "") {
      const inputRoom = data.room_id.trim();
      if (uuidRegex.test(inputRoom)) {
        resolvedRoomId = inputRoom;
      } else {
        // Tra cứu ID phòng từ số phòng (ví dụ "202")
        const { data: matchedRoom } = await supabase
          .from("rooms")
          .select("id, room_number")
          .eq("room_number", inputRoom)
          .maybeSingle();

        if (matchedRoom) {
          resolvedRoomId = matchedRoom.id;
        } else {
          resolvedRoomId = null;
        }
        if (!resolvedLocation.includes(inputRoom)) {
          resolvedLocation = resolvedLocation ? `${resolvedLocation} (Phòng ${inputRoom})` : `Phòng ${inputRoom}`;
        }
      }
    }

    let resolvedBookingId: string | null = null;
    if (data.booking_id && uuidRegex.test(data.booking_id.trim())) {
      resolvedBookingId = data.booking_id.trim();
    }

    // 3. Insert vào bảng lost_found_reports (LUÔN lấy user_id từ Session)
    const { data: newReport, error: insertError } = await supabase
      .from("lost_found_reports")
      .insert({
        user_id: currentUserId,
        booking_id: resolvedBookingId,
        room_id: resolvedRoomId,
        item_name: data.item_name,
        description: data.description || null,
        lost_location: resolvedLocation || null,
        lost_at: data.lost_at ? new Date(data.lost_at).toISOString() : null,
        image_url: data.image_url || null,
        contact_phone: data.contact_phone || user!.email || "Chưa cập nhật",
        status: "PENDING_RECEPTIONIST",
      })
      .select("*")
      .single();

    if (insertError || !newReport) {
      console.error("Lỗi khi tạo báo cáo đồ thất lạc:", insertError);
      return NextResponse.json(
        { error: "Không thể khởi tạo báo cáo đồ thất lạc" },
        { status: 500 }
      );
    }

    // 4. Ghi lịch sử khởi tạo trạng thái
    await supabase.from("lost_found_status_history").insert({
      report_id: newReport.id,
      old_status: null,
      new_status: "PENDING_RECEPTIONIST",
      actor_id: currentUserId,
      actor_role: user!.role,
      note: "Khách hàng gửi báo cáo đồ thất lạc ban đầu",
    });

    return NextResponse.json(
      {
        message: "Tạo báo cáo đồ thất lạc thành công",
        data: newReport,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Lỗi API POST /api/lost-found:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi bất ngờ trên máy chủ" },
      { status: 500 }
    );
  }
}