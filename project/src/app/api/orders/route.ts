import { NextResponse } from "next/server";
import { createServiceOrder, getPendingOrders, getOrdersByBooking } from "@/lib/db/services";
import { getCurrentUser } from "@/lib/auth-server";


export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get("booking_id");
    const statusParams = searchParams.get("status");

    // Staff wants pending queue
    if (statusParams && ["ADMIN", "KITCHEN", "RECEPTIONIST"].includes(user.role)) {
      const orders = await getPendingOrders();
      return NextResponse.json(orders);
    }

    // specific booking orders
    if (bookingId) {
      const orders = await getOrdersByBooking(bookingId);
      return NextResponse.json(orders);
    }

    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });

  } catch (error) {
    console.error("GET orders error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await request.json();
    
    if (!data.booking_id || !data.items || data.items.length === 0) {
      return NextResponse.json({ error: "Missing booking_id or items" }, { status: 400 });
    }

    const order = await createServiceOrder(data);
    return NextResponse.json(order, { status: 201 });

  } catch (error) {
    console.error("POST order error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
