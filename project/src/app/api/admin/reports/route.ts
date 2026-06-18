import { NextResponse } from "next/server";
import { getDashboardStats } from "@/lib/db/reports";
import { getCurrentUser } from "@/lib/auth-server";


export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !["ADMIN", "RECEPTIONIST"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const stats = await getDashboardStats();

    return NextResponse.json({ stats });
  } catch (error) {
    console.error("GET reports error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
