import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth-server";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !["ADMIN", "RECEPTIONIST"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("query") || searchParams.get("q") || "").trim().toLowerCase();
    const statusFilter = searchParams.get("status") || "";

    // Build base query
    let dbQuery = supabaseServer
      .from("bookings")
      .select("*, room:rooms(*, room_type:room_types(*)), user:users(*), guest:guests(*)")
      .order("created_at", { ascending: false })
      .limit(200);

    if (statusFilter) {
      dbQuery = dbQuery.eq("status", statusFilter);
    }

    const { data: bookings, error } = await dbQuery;
    if (error) {
      console.error("Database error in booking search:", error);
      throw error;
    }

    let results = bookings || [];

    if (query) {
      results = results.filter((b: any) => {
        const idMatch = b.id?.toLowerCase().includes(query);
        const userMatch = b.user?.full_name?.toLowerCase().includes(query) ||
                          b.user?.email?.toLowerCase().includes(query) ||
                          b.user?.phone?.toLowerCase().includes(query);
        const guestMatch = b.guest?.full_name?.toLowerCase().includes(query) ||
                           b.guest?.id_card_number?.toLowerCase().includes(query) ||
                           b.guest?.phone?.toLowerCase().includes(query);
        const roomMatch = b.room?.room_number?.toLowerCase().includes(query);

        return idMatch || userMatch || guestMatch || roomMatch;
      });
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("GET /api/bookings/search error:", error);
    return NextResponse.json({ error: "Failed to search bookings" }, { status: 500 });
  }
}
