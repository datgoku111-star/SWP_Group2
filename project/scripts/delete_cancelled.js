const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://rufagrsdrbnjjomhfzei.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1ZmFncnNkcmJuampvbWhmemVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTcwNTEzMSwiZXhwIjoyMDk3MjgxMTMxfQ.33hzhv-0v4z7v40p2ZeigZNoxt81fUSbDKJObnzX8N8";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  try {
    const ids = [
      '76fcd143-03f5-4379-b4c6-834afd6862c9',
      '9d08c086-7a2e-43ba-a56d-2562c0cf3920',
      'e3ca09d8-7111-499e-9dc7-2e4b0ad1256b'
    ];

    console.log("Deleting referencing payments...");
    const { error: payError } = await supabase
      .from('payments')
      .delete()
      .in('booking_id', ids);

    if (payError) {
      console.error("Payments delete failed:", payError);
      return;
    }

    console.log("Deleting bookings:", ids);
    const { error: bookError } = await supabase
      .from('bookings')
      .delete()
      .in('id', ids);

    if (bookError) {
      console.error("Bookings delete failed:", bookError);
    } else {
      console.log("Successfully deleted bookings!");
    }

  } catch (err) {
    console.error("Crash:", err);
  }
}
run();
