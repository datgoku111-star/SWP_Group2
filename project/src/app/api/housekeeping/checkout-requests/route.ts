import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth-server";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !["ADMIN", "HOUSEKEEPING", "RECEPTIONIST"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { data: checkoutRequests, error } = await supabaseServer
      .from("bookings")
      .select("*, room:rooms(*, room_type:room_types(*)), guest:guests(*), user:users(*)")
      .eq("status", "CHECKED_IN")
      .in("checkout_step", ["INSPECTING"])
      .order("checkout_requested_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(checkoutRequests);
  } catch (error) {
    console.error("GET /api/housekeeping/checkout-requests error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
