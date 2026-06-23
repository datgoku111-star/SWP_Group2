const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://rufagrsdrbnjjomhfzei.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1ZmFncnNkcmJuampvbWhmemVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTcwNTEzMSwiZXhwIjoyMDk3MjgxMTMxfQ.33hzhv-0v4z7v40p2ZeigZNoxt81fUSbDKJObnzX8N8";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  try {
    const idsToCancel = [
      '9d08c086-7a2e-43ba-a56d-2562c0cf3920',
      'e3ca09d8-7111-499e-9dc7-2e4b0ad1256b'
    ];

    console.log("Cancelling bookings:", idsToCancel);

    const { data, error } = await supabase
      .from('bookings')
      .update({ status: 'CANCELLED' })
      .in('id', idsToCancel);

    if (error) {
      console.error("Update failed:", error);
    } else {
      console.log("Successfully cancelled bookings. Result:", data);
    }

  } catch (err) {
    console.error("Crash:", err);
  }
}
run();
