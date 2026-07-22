import { supabaseServer } from "@/lib/supabase";
import type { Booking, BookingStatus } from "@/types/hotel";

export async function createBooking(booking: {
  user_id: string;
  room_id: string;
  check_in_date: string;
  check_out_date: string;
  num_guests: number;
  total_amount: number;
  special_requests?: string;
}) {
  // 1. Dynamic Check for overlapping bookings
  const { data: overlaps, error: overlapError } = await supabaseServer
    .from("bookings")
    .select("id")
    .eq("room_id", booking.room_id)
    .not("status", "in", '("CANCELLED","CHECKED_OUT")')
    .lt("check_in_date", booking.check_out_date)
    .gt("check_out_date", booking.check_in_date);

  if (overlapError) throw overlapError;

  if (overlaps && overlaps.length > 0) {
    throw new Error("Phòng không còn trống trong khoảng thời gian đã chọn.");
  }

  // 2. Insert the booking
  const { data, error } = await supabaseServer
    .from("bookings")
    .insert({
      user_id: booking.user_id,
      room_id: booking.room_id,
      check_in_date: booking.check_in_date,
      check_out_date: booking.check_out_date,
      num_guests: booking.num_guests,
      total_amount: booking.total_amount,
      special_requests: booking.special_requests || null,
      status: "PENDING",
    })
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error("Failed to create booking record.");

  // Fetch and return the full booking details
  return await getBookingById(data.id);
}

export async function getBookingById(id: string) {
  const { data, error } = await supabaseServer
    .from("bookings")
    .select("*, room:rooms(*, room_type:room_types(*)), user:users(id, email, full_name, role), guest:guests(*)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as Booking;
}

export async function getBookingsByUser(userId: string) {
  const { data, error } = await supabaseServer
    .from("bookings")
    .select("*, room:rooms(*, room_type:room_types(*))")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Booking[];
}

export async function getAllBookings() {
  const { data, error } = await supabaseServer
    .from("bookings")
    .select("*, room:rooms(*, room_type:room_types(*)), user:users(id, email, full_name, role)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Booking[];
}

export async function getTodaysArrivals() {
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabaseServer
    .from("bookings")
    .select("*, room:rooms(*, room_type:room_types(*)), user:users(id, email, full_name, role)")
    .eq("check_in_date", today)
    .in("status", ["CONFIRMED"])
    .order("created_at");
  if (error) throw error;
  return data as Booking[];
}

export async function getTodaysDepartures() {
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabaseServer
    .from("bookings")
    .select("*, room:rooms(*, room_type:room_types(*)), user:users(id, email, full_name, role)")
    .eq("check_out_date", today)
    .in("status", ["CHECKED_IN"])
    .order("created_at");
  if (error) throw error;
  return data as Booking[];
}

export async function updateBookingStatus(id: string, status: BookingStatus) {
  const { data, error } = await supabaseServer
    .from("bookings")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Booking;
}
