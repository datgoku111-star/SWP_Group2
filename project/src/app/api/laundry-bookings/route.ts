import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth-server";

// GET /api/laundry-bookings
// Trả về tất cả các yêu cầu dịch vụ giặt là
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get("booking_id");

    // Lấy tất cả đơn hàng dịch vụ cùng các món đồ liên kết
    let query = supabaseServer
      .from("service_orders")
      .select("*, items:service_order_items(*, service:services(*)), booking:bookings(*, user:users(*), room:rooms(*, room_type:room_types(*)), guest:guests(*))");

    if (bookingId) {
      query = query.eq("booking_id", bookingId);
    }

    const { data: orders, error } = await query.order("created_at", { ascending: false });
    if (error) throw error;

    // Lọc chỉ lấy đơn giặt là (ghi chú dạng JSON chứa is_laundry_service = true)
    const laundryBookings = (orders || [])
      .filter((order: any) => {
        try {
          if (!order.notes) return false;
          const notesObj = JSON.parse(order.notes);
          return notesObj.is_laundry_service === true;
        } catch (e) {
          return false;
        }
      })
      .map((order: any) => {
        try {
          const notesObj = JSON.parse(order.notes || "{}");
          return {
            id: order.id,
            booking_id: order.booking_id,
            status: order.status, // PENDING, IN_PROGRESS, COMPLETED, CANCELLED
            total_amount: order.total_amount,
            created_at: order.created_at,
            updated_at: order.updated_at,
            booking: order.booking,
            items: order.items,
            service_type: notesObj.service_type,
            customer_notes: notesObj.customer_notes,
            room_number: notesObj.room_number,
            status_text: notesObj.status_text, // Custom status: pending, assigned, washing, washed, ready_to_receive, delivered
          };
        } catch (e) {
          return null;
        }
      })
      .filter(Boolean);

    // Nếu là khách hàng, chỉ trả về đơn hàng của chính họ
    if (user.role === "CUSTOMER") {
      const filtered = laundryBookings.filter((lb: any) => lb.booking?.user_id === user.sub);
      return NextResponse.json(filtered);
    }

    return NextResponse.json(laundryBookings);
  } catch (error: any) {
    console.error("GET laundry bookings error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

// POST /api/laundry-bookings
// Tạo mới một đơn dịch vụ giặt là (trạng thái ban đầu: pending)
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { booking_id, service_type, items, room_number, customer_notes } = data;

    if (!booking_id || !service_type || !items || items.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Lấy thông tin giá dịch vụ gốc từ DB
    const serviceIds = items.map((i: any) => i.service_id);
    const { data: dbServices, error: dbError } = await supabaseServer
      .from("services")
      .select("id, name, price")
      .in("id", serviceIds);

    if (dbError || !dbServices) {
      throw new Error("Failed to fetch laundry services price list");
    }

    const priceMap = new Map(dbServices.map((s) => [s.id, s.price]));

    // Xác định hệ số nhân theo loại hình giặt
    let multiplier = 1.0;
    if (service_type === "Dry Cleaning") {
      multiplier = 1.5;
    } else if (service_type === "Pressing Only") {
      multiplier = 0.8;
    }

    // Tính toán đơn giá đã áp dụng hệ số nhân và tổng tiền
    let totalAmount = 0;
    const itemsWithAdjustedPrices = items.map((item: any) => {
      const basePrice = priceMap.get(item.service_id) || 0;
      const unitPrice = Math.round(basePrice * multiplier);
      const subtotal = unitPrice * item.quantity;
      totalAmount += subtotal;
      return {
        service_id: item.service_id,
        quantity: item.quantity,
        unit_price: unitPrice,
        subtotal,
      };
    });

    // Tạo ghi chú metadata lưu trữ chi tiết đơn hàng
    const notes = JSON.stringify({
      is_laundry_service: true,
      service_type,
      customer_notes: customer_notes || "",
      room_number: room_number || "P-VIP",
      status_text: "pending",
    });

    // 1. Insert order
    const { data: order, error: orderError } = await supabaseServer
      .from("service_orders")
      .insert({
        booking_id,
        status: "PENDING",
        total_amount: totalAmount,
        notes,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // 2. Insert order items
    const orderItemsToInsert = itemsWithAdjustedPrices.map((item: any) => ({
      order_id: order.id,
      service_id: item.service_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.subtotal,
    }));

    const { error: itemsError } = await supabaseServer
      .from("service_order_items")
      .insert(orderItemsToInsert);

    if (itemsError) throw itemsError;

    return NextResponse.json({ ...order, items: orderItemsToInsert }, { status: 201 });
  } catch (error: any) {
    console.error("POST laundry booking error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/laundry-bookings
// Cập nhật trạng thái đơn giặt là
export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing order ID" }, { status: 400 });
    }

    const data = await request.json();
    const { status, status_text } = data; 

    // Lấy thông tin đơn hàng hiện tại
    const { data: order, error: fetchError } = await supabaseServer
      .from("service_orders")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ error: "Laundry booking not found" }, { status: 404 });
    }

    let notesObj = {};
    try {
      notesObj = JSON.parse(order.notes || "{}");
    } catch (e) {}

    // Cập nhật trường status_text trong ghi chú JSON
    const updatedNotes = JSON.stringify({
      ...notesObj,
      status_text: status_text || (notesObj as any).status_text || status,
    });

    const { data: updatedOrder, error: updateError } = await supabaseServer
      .from("service_orders")
      .update({
        status: status || order.status,
        notes: updatedNotes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw updateError;
    return NextResponse.json(updatedOrder);
  } catch (error: any) {
    console.error("PATCH laundry booking error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
