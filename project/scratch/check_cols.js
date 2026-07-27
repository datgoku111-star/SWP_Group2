const { createClient } = require('@supabase/supabase-js');
const supabase = createClient("https://rufagrsdrbnjjomhfzei.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1ZmFncnNkcmJuampvbWhmemVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTcwNTEzMSwiZXhwIjoyMDk3MjgxMTMxfQ.33hzhv-0v4z7v40p2ZeigZNoxt81fUSbDKJObnzX8N8");

async function run() {
  const { data, error } = await supabase.from('services').select('*');
  console.log("Services:", data);
  console.log("Error:", error);
}

run();
