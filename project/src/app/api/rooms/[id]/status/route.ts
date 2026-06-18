import { NextResponse } from "next/server";
import { updateRoomStatus } from "@/lib/db/rooms";
import { getCurrentUser } from "@/lib/auth-server";


export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !["ADMIN", "HOUSEKEEPING", "RECEPTIONIST"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { status } = await request.json();
    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    const room = await updateRoomStatus(params.id, status);
    
    // In a full implementation, we'd also create an audit_logs entry here

    return NextResponse.json(room);
  } catch (error) {
    console.error("PATCH room status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
