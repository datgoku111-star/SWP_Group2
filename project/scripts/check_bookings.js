const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://rufagrsdrbnjjomhfzei.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1ZmFncnNkcmJuampvbWhmemVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTcwNTEzMSwiZXhwIjoyMDk3MjgxMTMxfQ.33hzhv-0v4z7v40p2ZeigZNoxt81fUSbDKJObnzX8N8";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  try {
    // 1. Fetch all rooms
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('id, room_number, status, room_type_id');
    console.log("\n=== ALL PHYSICAL ROOMS IN DB ===");
    console.log(rooms);
    if (roomsError) console.error("Rooms error:", roomsError);

    // 2. Fetch all bookings
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, room_id, check_in_date, check_out_date, status, total_amount');
    console.log("\n=== ALL BOOKINGS IN DB ===");
    console.log(bookings);
    if (bookingsError) console.error("Bookings error:", bookingsError);

  } catch (err) {
    console.error("Crash:", err);
  }
}
run();
