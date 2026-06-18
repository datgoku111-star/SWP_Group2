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
  // Call the Stored Procedure (RPC) on Supabase for a safe transactional booking
  const { data, error } = await supabaseServer.rpc("book_room_secure", {
    p_room_id: booking.room_id,
    p_user_id: booking.user_id,
    p_check_in: booking.check_in_date,
    p_check_out: booking.check_out_date,
    p_num_guests: booking.num_guests,
    p_total_amount: booking.total_amount,
    p_special_requests: booking.special_requests || null,
  });

  if (error) throw error;

  // Since RPC returns a TABLE, data will be an array
  const result = data && data[0];

  if (!result || result.status === "FAILED") {
    throw new Error(result?.message || "Room is no longer available for the selected dates");
  }

  // Fetch and return the full booking details
  return await getBookingById(result.booking_id);
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
