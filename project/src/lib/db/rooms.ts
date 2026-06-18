import { supabaseServer } from "@/lib/supabase";
import type { Room, RoomType, RoomStatus } from "@/types/hotel";

export async function getAvailableRooms(
  checkIn?: string,
  checkOut?: string,
  roomTypeId?: string
) {
  let query = supabaseServer
    .from("rooms")
    .select("*, room_type:room_types(*)")
    .eq("status", "AVAILABLE");

  if (roomTypeId) {
    query = query.eq("room_type_id", roomTypeId);
  }

  // If dates provided, filter out rooms that have overlapping bookings
  if (checkIn && checkOut) {
    const { data: bookedRoomIds } = await supabaseServer
      .from("bookings")
      .select("room_id")
      .in("status", ["CONFIRMED", "CHECKED_IN"])
      .lt("check_in_date", checkOut)
      .gt("check_out_date", checkIn);

    const excludeIds = (bookedRoomIds || []).map((b) => b.room_id);
    if (excludeIds.length > 0) {
      query = query.not("id", "in", `(${excludeIds.join(",")})`);
    }
  }

  const { data, error } = await query.order("floor").order("room_number");
  if (error) throw error;
  return data as Room[];
}

export async function getAllRooms() {
  const { data, error } = await supabaseServer
    .from("rooms")
    .select("*, room_type:room_types(*)")
    .order("floor")
    .order("room_number");
  if (error) throw error;
  return data as Room[];
}

export async function getRoomById(id: string) {
  const { data, error } = await supabaseServer
    .from("rooms")
    .select("*, room_type:room_types(*)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as Room;
}

export async function updateRoomStatus(id: string, status: RoomStatus) {
  const { data, error } = await supabaseServer
    .from("rooms")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Room;
}

export async function getRoomTypes() {
  const { data, error } = await supabaseServer
    .from("room_types")
    .select("*")
    .order("name");
  if (error) throw error;
  return data as RoomType[];
}
