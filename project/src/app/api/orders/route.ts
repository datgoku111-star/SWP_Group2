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
      const statuses = statusParams.split(",").map((s) => s.trim().toUpperCase());
      let orders = await getPendingOrders(statuses);

      // Food/Beverage Segmentation for Chef / Kitchen role or explicit query parameter
      const categoryParam = searchParams.get("category");
      if (categoryParam || user.role === "KITCHEN") {
        const allowedCategories = categoryParam
          ? categoryParam.split(",").map((c) => c.trim().toUpperCase())
          : ["FOOD", "BEVERAGE"];

        orders = orders
          .map((order: any) => {
            const filteredItems = (order.items || []).filter(
              (item: any) =>
                item.service?.category &&
                allowedCategories.includes(item.service.category.toUpperCase())
            );
            return {
              ...order,
              items: filteredItems,
            };
          })
          .filter((order: any) => order.items && order.items.length > 0);
      }

      // If viewing specifically as KITCHEN role, hide PENDING orders that have not yet been approved/forwarded by Receptionist
      if (user.role === "KITCHEN") {
        orders = orders.filter((order: any) => {
          if (order.status === "PENDING") {
            return order.notes && order.notes.includes("[FORWARDED_TO_KITCHEN]");
          }
          return true;
        });
      }

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
