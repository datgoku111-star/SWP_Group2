import { NextResponse } from "next/server";
import { getRoomById } from "@/lib/db/rooms";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const room = await getRoomById(params.id);
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }
    return NextResponse.json(room);
  } catch (error) {
    console.error("GET room by id error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
