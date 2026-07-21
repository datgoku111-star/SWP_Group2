const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://rufagrsdrbnjjomhfzei.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1ZmFncnNkcmJuampvbWhmemVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTcwNTEzMSwiZXhwIjoyMDk3MjgxMTMxfQ.33hzhv-0v4z7v40p2ZeigZNoxt81fUSbDKJObnzX8N8";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  try {
    const checkIn = '2023-02-05';
    const checkOut = '2023-02-22';
    
    // Test the exact database query
    let query = supabase
      .from("rooms")
      .select("*, room_type:room_types(*)")
      .eq("status", "AVAILABLE");

    const { data: bookedRoomIds } = await supabase
      .from("bookings")
      .select("room_id")
      .in("status", ["CONFIRMED", "CHECKED_IN"])
      .lt("check_in_date", checkOut)
      .gt("check_out_date", checkIn);

    console.log("Booked room IDs with overlapping CONFIRMED/CHECKED_IN bookings:", bookedRoomIds);

    const excludeIds = (bookedRoomIds || []).map((b) => b.room_id);
    if (excludeIds.length > 0) {
      query = query.not("id", "in", `(${excludeIds.join(",")})`);
    }

    const { data, error } = await query.order("floor").order("room_number");
    console.log("Available rooms count:", data?.length, "Error:", error);
    console.log("Available rooms:", data);

  } catch (err) {
    console.error("Crash:", err);
  }
}
run();
