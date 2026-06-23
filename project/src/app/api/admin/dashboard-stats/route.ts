import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

export async function GET() {
  try {
    // 1. Fetch Total Members from profiles table (matching User Management)
    const { count: usersCount, error: usersError } = await supabaseServer
      .from("profiles")
      .select("*", { count: "exact", head: true });

    // 2. Fetch Active Bookings
    const { count: bookingsCount, error: bookingsError } = await supabaseServer
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .in("status", ["CONFIRMED", "CHECKED_IN"]);

    // 3. Fetch all members from profiles to group monthly signups
    const { data: allUsers, error: allUsersError } = await supabaseServer
      .from("profiles")
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
      totalRevenue += Number(p.amount || 0);
      if (!p.created_at) return;
      const date = new Date(p.created_at);
      const monthStr = `T${String(date.getMonth() + 1).padStart(2, "0")}`; // e.g. T01, T02
      revenueCounts[monthStr] = (revenueCounts[monthStr] || 0) + Number(p.amount || 0);
    });

    // Generate the last 6 months labels (e.g. ["T01", "T02", ...])
    const last6Months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthStr = `T${String(d.getMonth() + 1).padStart(2, "0")}`;
      last6Months.push(monthStr);
    }

    const signupData = last6Months.map(m => ({ month: m, count: signupCounts[m] || 0 }));
    const revenueData = last6Months.map(m => ({ month: m, revenue: revenueCounts[m] || 0 }));

    return NextResponse.json({
      stats: {
        totalUsers: usersCount || 0,
        totalRevenue: totalRevenue || 0,
        activeBookings: bookingsCount || 0,
      },
      monthlySignups: signupData,
      monthlyRevenue: revenueData
    });
  } catch (error) {
    console.error("Dashboard stats api error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
