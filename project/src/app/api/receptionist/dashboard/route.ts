import { NextResponse } from "next/server";
import { getDashboardStats } from "@/lib/db/reports";
import { getTodaysArrivals, getTodaysDepartures } from "@/lib/db/bookings";
import { getAllRooms } from "@/lib/db/rooms";
import { getCurrentUser } from "@/lib/auth-server";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !["ADMIN", "RECEPTIONIST"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const [stats, arrivals, departures, allRooms] = await Promise.all([
      getDashboardStats(),
      getTodaysArrivals(),
      getTodaysDepartures(),
      getAllRooms(),
    ]);

    const roomsSummary = {
      AVAILABLE: allRooms.filter((r) => r.status === "AVAILABLE").length,
      IN_USE: allRooms.filter((r) => r.status === "IN_USE").length,
      DIRTY: allRooms.filter((r) => r.status === "DIRTY").length,
      MAINTENANCE: allRooms.filter((r) => r.status === "MAINTENANCE").length,
      total: allRooms.length,
    };

    return NextResponse.json({
      stats,
      arrivals,
      departures,
      roomsSummary,
    });
  } catch (error) {
    console.error("GET /api/receptionist/dashboard error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
