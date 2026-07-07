import { NextResponse } from "next/server";
import { getAvailableRooms, getAllRooms } from "@/lib/db/rooms";
import { getCurrentUser } from "@/lib/auth-server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const checkIn = searchParams.get("checkIn") || undefined;
    const checkOut = searchParams.get("checkOut") || undefined;
    const type = searchParams.get("type") || undefined;
    const all = searchParams.get("all") === "true";

    const user = await getCurrentUser();
    const currentUserId = user?.sub || undefined;

    let rooms;
    if (all) {
      rooms = await getAllRooms();
    } else {
      rooms = await getAvailableRooms(checkIn, checkOut, type, currentUserId);
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
