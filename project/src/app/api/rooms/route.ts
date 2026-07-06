import { NextResponse } from "next/server";
import { getAvailableRooms, getAllRooms } from "@/lib/db/rooms";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const checkIn = searchParams.get("checkIn") || undefined;
    const checkOut = searchParams.get("checkOut") || undefined;
    const type = searchParams.get("type") || undefined;
    const all = searchParams.get("all") === "true";

    if (!all && (checkIn || checkOut)) {
      if (!checkIn || !checkOut) {
        return NextResponse.json(
          { error: "Validation error: Both checkIn and checkOut dates are required when querying availability", rooms: [] },
          { status: 400 }
        );
      }
      const dIn = new Date(checkIn);
      const dOut = new Date(checkOut);
      if (isNaN(dIn.getTime()) || isNaN(dOut.getTime())) {
        return NextResponse.json(
          { error: "Validation error: Invalid date format for checkIn or checkOut", rooms: [] },
          { status: 400 }
        );
      }
      if (dOut <= dIn) {
        return NextResponse.json(
          { error: "Invalid booking date range: check-out date must be strictly after check-in date", rooms: [] },
          { status: 400 }
        );
      }
    }

    let rooms;
    if (all) {
      rooms = await getAllRooms();
    } else {
      rooms = await getAvailableRooms(checkIn, checkOut, type);
    }

    return NextResponse.json(rooms);
  } catch (error) {
    console.error("GET rooms error:", error);
    if (error instanceof Error && (error.message.includes("Validation error") || error.message.includes("Invalid booking date range"))) {
      return NextResponse.json(
        { error: error.message, rooms: [] },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
