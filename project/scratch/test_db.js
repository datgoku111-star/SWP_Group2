const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://rufagrsdrbnjjomhfzei.supabase.co";
const supabaseServiceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1ZmFncnNkcmJuampvbWhmemVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTcwNTEzMSwiZXhwIjoyMDk3MjgxMTMxfQ.33hzhv-0v4z7v40p2ZeigZNoxt81fUSbDKJObnzX8N8";

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function test() {
  console.log("Querying users...");
  const { data, error } = await supabase.from("users").select("*");
  if (error) {
    console.error("Error querying users:", error);
  } else {
    console.log("Users in database:", data);
  }
}

test();
