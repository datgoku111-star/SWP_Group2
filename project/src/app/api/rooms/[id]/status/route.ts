import { NextResponse } from "next/server";
import { updateRoomStatus, getRoomById } from "@/lib/db/rooms";
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

    // Retrieve current room to check status transition
    const currentRoom = await getRoomById(params.id);
    if (!currentRoom) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Role-based state transition constraints
    if (user.role === "HOUSEKEEPING") {
      const allowed = 
        (currentRoom.status === "DIRTY" && status === "CLEANING") ||
        (currentRoom.status === "CLEANING" && status === "AVAILABLE");

      if (!allowed) {
        return NextResponse.json(
          { error: `Invalid status transition for Housekeeping: from ${currentRoom.status} to ${status}` },
          { status: 400 }
        );
      }
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
