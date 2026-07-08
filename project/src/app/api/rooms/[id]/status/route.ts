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

    // Role-based flow validation
    if (user.role === "HOUSEKEEPING") {
      let currentRoom;
      try {
        currentRoom = await getRoomById(params.id);
      } catch (err) {
        return NextResponse.json({ error: "Room not found" }, { status: 404 });
      }

      // Housekeeping can ONLY change DIRTY -> CLEANING, or CLEANING -> AVAILABLE
      if (currentRoom.status === "DIRTY" && status !== "CLEANING") {
        return NextResponse.json(
          { error: "Housekeeping can only update DIRTY rooms to CLEANING." },
          { status: 403 }
        );
      }
      if (currentRoom.status === "CLEANING" && status !== "AVAILABLE") {
        return NextResponse.json(
          { error: "Housekeeping can only update CLEANING rooms to AVAILABLE." },
          { status: 403 }
        );
      }
      if (currentRoom.status !== "DIRTY" && currentRoom.status !== "CLEANING") {
        return NextResponse.json(
          { error: `Housekeeping cannot update rooms with status ${currentRoom.status}. Only DIRTY or CLEANING rooms can be processed.` },
          { status: 403 }
        );
      }
    }
    // Receptionist & Admin can override room status to any state at any time

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
