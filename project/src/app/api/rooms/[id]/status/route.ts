import { NextResponse } from "next/server";
import { updateRoomStatus, getRoomById } from "@/lib/db/rooms";
import { getCurrentUser } from "@/lib/auth-server";
import { supabaseServer } from "@/lib/supabase";


export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !["ADMIN", "HOUSEKEEPING", "RECEPTIONIST"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { status, notes } = await request.json();
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

      // Housekeeping can change status to MAINTENANCE for any room (e.g. reporting damage)
      // They can also transition MAINTENANCE -> AVAILABLE (confirming repair is done)
      if (status === "MAINTENANCE") {
        // Allowed
      } else if (currentRoom.status === "MAINTENANCE" && status === "AVAILABLE") {
        // Allowed (releasing room from maintenance)
      } else {
        // Housekeeping can change DIRTY -> CLEANING or AVAILABLE directly
        if (currentRoom.status === "DIRTY" && status !== "CLEANING" && status !== "AVAILABLE") {
          return NextResponse.json(
            { error: "Housekeeping can only update DIRTY rooms to CLEANING or AVAILABLE." },
            { status: 403 }
          );
        }
        if (currentRoom.status === "CLEANING" && status !== "AVAILABLE") {
          return NextResponse.json(
            { error: "Housekeeping can only update CLEANING rooms to AVAILABLE." },
            { status: 403 }
          );
        }
        if (currentRoom.status !== "DIRTY" && currentRoom.status !== "CLEANING" && currentRoom.status !== "MAINTENANCE") {
          // Allow if housekeeping is only updating notes/stayover without changing status
          if (status !== currentRoom.status) {
            return NextResponse.json(
              { error: `Housekeeping cannot update rooms with status ${currentRoom.status}. Only DIRTY or CLEANING rooms can be processed.` },
              { status: 403 }
            );
          }
        }
      }
    }
    // Receptionist & Admin can override room status to any state at any time

    const nowIso = new Date().toISOString();
    const updatePayload: any = { status, updated_at: nowIso, status_updated_at: nowIso };
    if (notes !== undefined) {
      updatePayload.notes = notes;
    }

    let { data: room, error } = await supabaseServer
      .from("rooms")
      .update(updatePayload)
      .eq("id", params.id)
      .select("*, room_type:room_types(*)")
      .single();

    if (error && error.message && error.message.includes("status_updated_at")) {
      const fallbackPayload = { ...updatePayload };
      delete fallbackPayload.status_updated_at;
      const fallback = await supabaseServer
        .from("rooms")
        .update(fallbackPayload)
        .eq("id", params.id)
        .select("*, room_type:room_types(*)")
        .single();
      room = fallback.data;
      error = fallback.error;
    }

    if (error) throw error;

    return NextResponse.json(room);
  } catch (error) {
    console.error("PATCH room status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
