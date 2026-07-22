import { NextResponse } from "next/server";
import { updateOrderStatus } from "@/lib/db/services";
import { getCurrentUser } from "@/lib/auth-server";


export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !["ADMIN", "KITCHEN", "RECEPTIONIST", "CUSTOMER"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { status, notes } = body;
    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    const order = await updateOrderStatus(params.id, status, notes);
    return NextResponse.json(order);
  } catch (error) {
    console.error("PATCH order status error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
