const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://rufagrsdrbnjjomhfzei.supabase.co";
const supabaseServiceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1ZmFncnNkcmJuampvbWhmemVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTcwNTEzMSwiZXhwIjoyMDk3MjgxMTMxfQ.33hzhv-0v4z7v40p2ZeigZNoxt81fUSbDKJObnzX8N8";

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function check() {
  console.log("--- Querying auth.users ---");
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    console.error("Error listing auth.users:", authError);
  } else {
    console.log("Auth users count:", authUsers.users.length);
    authUsers.users.forEach(u => {
      console.log(`ID: ${u.id}, Email: ${u.email}, CreatedAt: ${u.created_at}`);
    });
  }

  console.log("\n--- Querying public.users ---");
  const { data: publicUsers, error: publicError } = await supabase.from("users").select("id, email, full_name, role, created_at");
  if (publicError) {
    console.error("Error listing public.users:", publicError);
  } else {
    console.log("Public users count:", publicUsers.length);
    publicUsers.forEach(u => {
      console.log(`ID: ${u.id}, Email: ${u.email}, Name: ${u.full_name}, Role: ${u.role}, CreatedAt: ${u.created_at}`);
    });
  }
}

check();
