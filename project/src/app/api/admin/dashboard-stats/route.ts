import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

export async function GET() {
  try {
    // 1. Fetch Total Members from users table (matching User Management)
    const { count: usersCount, error: usersError } = await supabaseServer
      .from("users")
      .select("*", { count: "exact", head: true });

    // 2. Fetch Active Bookings
    const { count: bookingsCount, error: bookingsError } = await supabaseServer
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .in("status", ["CONFIRMED", "CHECKED_IN"]);

    // 3. Fetch all members from users to group monthly signups
    const { data: allUsers, error: allUsersError } = await supabaseServer
      .from("users")
      .select("created_at");

    // Group members by month
    const signupCounts: Record<string, number> = {};
    (allUsers || []).forEach((u) => {
      if (!u.created_at) return;
      const date = new Date(u.created_at);
      const monthStr = `T${String(date.getMonth() + 1).padStart(2, "0")}`; // e.g. T01, T02
      signupCounts[monthStr] = (signupCounts[monthStr] || 0) + 1;
    });

    // 4. Fetch all completed payments to group monthly revenue and calculate total revenue
    const { data: allPayments, error: allPaymentsError } = await supabaseServer
      .from("payments")
      .select("amount, created_at")
      .eq("status", "COMPLETED");

    const revenueCounts: Record<string, number> = {};
    let totalRevenue = 0;
    (allPayments || []).forEach((p) => {
      const rawAmt = Number(p.amount || 0);
      // Heuristic: If amount < 10000, convert from USD to VND. Otherwise already in VND.
      const amountInVnd = rawAmt < 10000 ? Math.round(rawAmt * 26320) : rawAmt;

      totalRevenue += amountInVnd;
      if (!p.created_at) return;
      const date = new Date(p.created_at);
      const monthStr = `T${String(date.getMonth() + 1).padStart(2, "0")}`; // e.g. T01, T02
      revenueCounts[monthStr] = (revenueCounts[monthStr] || 0) + amountInVnd;
    });

    // Generate the last 6 months labels (e.g. ["T01", "T02", ...])
    const last6Months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthStr = `T${String(d.getMonth() + 1).padStart(2, "0")}`;
      last6Months.push(monthStr);
    }

    // 5. Fetch role distribution from public.users
    const { data: roleData } = await supabaseServer
      .from("users")
      .select("role");

    const roleCounts: Record<string, number> = {};
    (roleData || []).forEach((u) => {
      const roleName = u.role || "CUSTOMER";
      roleCounts[roleName] = (roleCounts[roleName] || 0) + 1;
    });

    const roleDistribution = Object.entries(roleCounts).map(([key, value]) => ({
      name: key,
      value
    }));

    // 6. Fetch preferred rooms (popularity based on booking count)
    const { data: bookingsData } = await supabaseServer
      .from("bookings")
      .select(`
        room:rooms (
          room_type:room_types (
            name
          )
        )
      `);

    const { data: allRoomTypes } = await supabaseServer
      .from("room_types")
      .select("name");

    const roomTypeCounts: Record<string, number> = {};
    (allRoomTypes || []).forEach((rt: any) => {
      roomTypeCounts[rt.name] = 0;
    });

    let totalBookings = 0;
    (bookingsData || []).forEach((b: any) => {
      const typeName = b.room?.room_type?.name;
      if (typeName !== undefined && typeName !== null) {
        roomTypeCounts[typeName] = (roomTypeCounts[typeName] || 0) + 1;
        totalBookings++;
      }
    });

    const preferredRooms = Object.entries(roomTypeCounts).map(([name, count]) => {
      const percentage = totalBookings > 0 ? Math.round((count / totalBookings) * 100) : 0;
      return {
        name,
        percentage,
        value: `${percentage}%`
      };
    }).sort((a, b) => b.percentage - a.percentage);

    const signupData = last6Months.map(m => ({ month: m, count: signupCounts[m] || 0 }));
    const revenueData = last6Months.map(m => ({ month: m, revenue: revenueCounts[m] || 0 }));

    return NextResponse.json({
      stats: {
        totalUsers: usersCount || 0,
        totalRevenue: totalRevenue || 0,
        activeBookings: bookingsCount || 0,
      },
      monthlySignups: signupData,
      monthlyRevenue: revenueData,
      roleDistribution,
      preferredRooms
    });
  } catch (error) {
    console.error("Dashboard stats api error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
