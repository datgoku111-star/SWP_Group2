import { NextResponse } from "next/server";
import { getAvailableRooms, getAllRooms, updateRoomStatus } from "@/lib/db/rooms";
import { supabaseServer } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const checkIn = searchParams.get("checkIn") || undefined;
    const checkOut = searchParams.get("checkOut") || undefined;
    const type = searchParams.get("type") || undefined;
    const all = searchParams.get("all") === "true";

    let rooms;
    if (all) {
      rooms = await getAllRooms();
    } else {
      rooms = await getAvailableRooms(checkIn, checkOut, type);
    }

    return NextResponse.json(rooms);
  } catch (error) {
    console.error("GET rooms error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { room_number, floor, room_type_id, status, notes } = body;

    if (!room_number || floor === undefined || !room_type_id) {
      return NextResponse.json({ error: "Thiếu số phòng, tầng hoặc hạng phòng" }, { status: 400 });
    }

    const { data: newRoom, error } = await supabaseServer
      .from("rooms")
      .insert({
        room_number,
        floor: Number(floor),
        room_type_id,
        status: status || "AVAILABLE",
        notes: notes || ""
      })
      .select("*, room_type:room_types(*)")
      .single();

    if (error) throw error;
    return NextResponse.json({ message: "Tạo phòng thành công", room: newRoom });
  } catch (error: any) {
    console.error("POST rooms error:", error);
    return NextResponse.json({ error: error.message || "Failed to create room" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, room_number, floor, room_type_id, status, notes } = body;

    if (!id) {
      return NextResponse.json({ error: "Thiếu ID phòng" }, { status: 400 });
    }

    const { data: updatedRoom, error } = await supabaseServer
      .from("rooms")
      .update({
        room_number,
        floor: floor !== undefined ? Number(floor) : undefined,
        room_type_id,
        status,
        notes,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select("*, room_type:room_types(*)")
      .single();

    if (error) throw error;
    return NextResponse.json({ message: "Cập nhật phòng thành công", room: updatedRoom });
  } catch (error: any) {
    console.error("PUT rooms error:", error);
    return NextResponse.json({ error: error.message || "Failed to update room" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Thiếu ID phòng cần xóa" }, { status: 400 });
    }

    const { error } = await supabaseServer
      .from("rooms")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ message: "Xóa phòng thành công" });
  } catch (error: any) {
    console.error("DELETE rooms error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete room" }, { status: 500 });
  }
}
