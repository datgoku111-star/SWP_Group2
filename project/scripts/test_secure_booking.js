const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://rufagrsdrbnjjomhfzei.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1ZmFncnNkcmJuampvbWhmemVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTcwNTEzMSwiZXhwIjoyMDk3MjgxMTMxfQ.33hzhv-0v4z7v40p2ZeigZNoxt81fUSbDKJObnzX8N8";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  try {
    const roomId = 'acb0347d-22cf-4726-b8d3-887b9abdaf2f'; // Room 101
    const checkIn = '2026-07-07';
    const checkOut = '2026-07-10';

    // 1. Call is_room_available RPC
    const { data: isAvail, error: availError } = await supabase.rpc('is_room_available', {
      p_room_id: roomId,
      p_check_in: checkIn,
      p_check_out: checkOut
    });
    console.log("is_room_available:", isAvail, "Error:", availError);

    // Get user
    const { data: users } = await supabase.from('users').select('id').limit(1);
    const targetUserId = users?.[0]?.id;

    // 2. Call book_room_secure RPC
    const { data: bookResult, error: bookError } = await supabase.rpc('book_room_secure', {
      p_room_id: roomId,
      p_user_id: targetUserId,
      p_check_in: checkIn,
      p_check_out: checkOut,
      p_num_guests: 1,
      p_total_amount: 6.00,
      p_special_requests: ''
    });
    console.log("book_room_secure:", bookResult, "Error:", bookError);

  } catch (err) {
    console.error("Crash:", err);
  }
}
run();
