import { supabaseServer } from "@/lib/supabase";
import type { Room, RoomType, RoomStatus } from "@/types/hotel";

export async function getAvailableRooms(
  checkIn?: string,
  checkOut?: string,
  roomTypeId?: string
) {
  // 1. Edge Case: Validate date range if dates are provided
  if (checkIn || checkOut) {
    if (!checkIn || !checkOut) {
      throw new Error("Validation error: Both checkIn and checkOut dates are required when filtering by date.");
    }
    const dIn = new Date(checkIn);
    const dOut = new Date(checkOut);
    if (isNaN(dIn.getTime()) || isNaN(dOut.getTime())) {
      throw new Error("Validation error: Invalid date format for checkIn or checkOut.");
    }
    if (dOut <= dIn) {
      throw new Error("Invalid booking date range: check-out date must be strictly after check-in date.");
    }
  }

  // 2. Base Query: Only AVAILABLE rooms, optionally filtered by room class (roomTypeId)
  let query = supabaseServer
    .from("rooms")
    .select("*, room_type:room_types(*)")
    .eq("status", "AVAILABLE");

  if (roomTypeId) {
    query = query.eq("room_type_id", roomTypeId);
  }

  // 3. Filter out overlapping bookings (Status NOT CANCELLED, e.g. PENDING, CONFIRMED, CHECKED_IN)
  if (checkIn && checkOut) {
    const { data: bookedRoomIds, error: bookingError } = await supabaseServer
      .from("bookings")
      .select("room_id")
      .neq("status", "CANCELLED")
      .lt("check_in_date", checkOut)
      .gt("check_out_date", checkIn);

    if (bookingError) throw bookingError;

    const excludeIds = (bookedRoomIds || []).map((b) => b.room_id);
    if (excludeIds.length > 0) {
      query = query.not("id", "in", `(${excludeIds.join(",")})`);
    }
  }

  // 4. Filter out temporary room locks from room_locks table (if unexpired)
  try {
    const nowIso = new Date().toISOString();
    const { data: lockedRoomIds, error: lockError } = await supabaseServer
      .from("room_locks")
      .select("room_id")
      .gt("locked_until", nowIso);

    if (!lockError && lockedRoomIds && lockedRoomIds.length > 0) {
      const excludeLockIds = lockedRoomIds.map((l) => l.room_id);
      query = query.not("id", "in", `(${excludeLockIds.join(",")})`);
    }
  } catch (lockErr) {
    // Gracefully handle if room_locks table has not been migrated yet (Issue #6)
    console.warn("Could not query room_locks (table may not exist yet):", lockErr);
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
  
  const room = data as (Room & { deadline?: string });

  // Fetch all future/current bookings for this room
  const { data: bookings } = await supabaseServer
    .from("bookings")
    .select("check_out_date")
    .eq("room_id", id)
    .in("status", ["CONFIRMED", "CHECKED_IN"])
    .order("check_out_date", { ascending: true });

  if (bookings && bookings.length > 0) {
    const currentOrFuture = bookings.find(
      (b) => new Date(b.check_out_date) >= new Date()
    );
    if (currentOrFuture) {
      room.deadline = currentOrFuture.check_out_date;
      room.status = "IN_USE";
    }
  }

  return room;
}

export async function updateRoomStatus(id: string, status: RoomStatus) {
  const nowIso = new Date().toISOString();
  let { data, error } = await supabaseServer
    .from("rooms")
    .update({ status, updated_at: nowIso, status_updated_at: nowIso })
    .eq("id", id)
    .select()
    .single();

  if (error && error.message && error.message.includes("status_updated_at")) {
    console.warn("status_updated_at column not found, falling back to basic status update without timestamp column:");
    const fallback = await supabaseServer
      .from("rooms")
      .update({ status, updated_at: nowIso })
      .eq("id", id)
      .select()
      .single();
    data = fallback.data;
    error = fallback.error;
  }

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

export async function getRoomsWithDeadlines(
  checkIn?: string,
  checkOut?: string,
  roomTypeId?: string
) {
  let query = supabaseServer
    .from("rooms")
    .select("*, room_type:room_types(*)");

  if (roomTypeId) {
    query = query.eq("room_type_id", roomTypeId);
  }

  const { data: roomsData, error } = await query.order("floor").order("room_number");
  if (error) throw error;

  const rooms = roomsData as (Room & { deadline?: string })[];

  // Fetch all future/current bookings
  const { data: bookedRoomIds } = await supabaseServer
    .from("bookings")
    .select("room_id, check_out_date, check_in_date")
    .in("status", ["CONFIRMED", "CHECKED_IN"])
    .order("check_out_date", { ascending: true });

  if (bookedRoomIds && bookedRoomIds.length > 0) {
    for (const room of rooms) {
      const roomBookings = bookedRoomIds.filter((b) => b.room_id === room.id);
      if (roomBookings.length > 0) {
        if (checkIn && checkOut) {
          const overlap = roomBookings.find(
            (b) => b.check_in_date < checkOut && b.check_out_date > checkIn
          );
          if (overlap) {
            room.deadline = overlap.check_out_date;
            room.status = "IN_USE";
          }
        } else {
          const currentOrFuture = roomBookings.find(
            (b) => new Date(b.check_out_date) >= new Date()
          );
          if (currentOrFuture) {
            room.deadline = currentOrFuture.check_out_date;
            room.status = "IN_USE";
          }
        }
      }
    }
  }

  return rooms;
}
