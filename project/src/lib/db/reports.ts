import { supabaseServer } from "@/lib/supabase";
import type { DashboardStats } from "@/types/hotel";

export async function getRevenueByPeriod(startDate: string, endDate: string) {
  const { data, error } = await supabaseServer
    .from("payments")
    .select("amount, method, created_at")
    .eq("status", "COMPLETED")
    .gte("created_at", startDate)
    .lte("created_at", endDate)
    .order("created_at");
  if (error) throw error;
  return data;
}

export async function getOccupancyRate() {
  const { data: rooms } = await supabaseServer
    .from("rooms")
    .select("status");

  if (!rooms || rooms.length === 0) return 0;
  const occupied = rooms.filter((r) => r.status === "IN_USE").length;
  return Math.round((occupied / rooms.length) * 100);
}

export async function getTopServices(limit = 10) {
  const { data, error } = await supabaseServer
    .from("service_order_items")
    .select("service_id, quantity, service:services(name, category)")
    .order("quantity", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const today = new Date().toISOString().split("T")[0];

  const [roomsRes, arrivalsRes, departuresRes, ordersRes, paymentsRes] =
    await Promise.all([
      supabaseServer.from("rooms").select("status"),
      supabaseServer
        .from("bookings")
        .select("id")
        .eq("check_in_date", today)
        .in("status", ["CONFIRMED"]),
      supabaseServer
        .from("bookings")
        .select("id")
        .eq("check_out_date", today)
        .in("status", ["CHECKED_IN"]),
      supabaseServer
        .from("service_orders")
        .select("id")
        .eq("status", "PENDING"),
      supabaseServer
        .from("payments")
        .select("amount")
        .eq("status", "COMPLETED")
        .gte("created_at", `${today}T00:00:00`)
        .lte("created_at", `${today}T23:59:59`),
    ]);

  const rooms = roomsRes.data || [];
  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter((r) => r.status === "IN_USE").length;
  const availableRooms = rooms.filter((r) => r.status === "AVAILABLE").length;
  const revenueToday = (paymentsRes.data || []).reduce(
    (sum, p) => sum + (p.amount || 0),
    0
  );

  return {
    total_rooms: totalRooms,
    occupied_rooms: occupiedRooms,
    available_rooms: availableRooms,
    todays_arrivals: (arrivalsRes.data || []).length,
    todays_departures: (departuresRes.data || []).length,
    pending_orders: (ordersRes.data || []).length,
    revenue_today: revenueToday,
    occupancy_rate: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
  };
}
