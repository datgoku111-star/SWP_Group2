import { NextResponse } from "next/server";
import { getAvailableRooms, getAllRooms } from "@/lib/db/rooms";

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
