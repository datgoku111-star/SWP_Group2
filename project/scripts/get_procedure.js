const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://rufagrsdrbnjjomhfzei.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1ZmFncnNkcmJuampvbWhmemVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTcwNTEzMSwiZXhwIjoyMDk3MjgxMTMxfQ.33hzhv-0v4z7v40p2ZeigZNoxt81fUSbDKJObnzX8N8";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  try {
    const { data, error } = await supabase.rpc('get_proc_def_raw', {}); // if doesn't exist, query pg_catalog
    console.log("RPC test:", data, error);

    const { data: procDef, error: procError } = await supabase.rawPg`
      SELECT pg_get_functiondef(p.oid) 
      FROM pg_proc p 
      WHERE p.proname = 'book_room_secure';
    `;
    console.log("Function Def:", procDef, procError);
  } catch (err) {
    // Try general pg query
    try {
      const { data, error } = await supabase
        .from('pg_proc')
        .select('*')
        .eq('proname', 'book_room_secure');
      console.log("pg_proc count:", data?.length, "Error:", error);
    } catch (e) {
      console.error(e);
    }
  }
}

// Alternative using standard SQL query if rawPg is not available
async function runAlternative() {
  try {
    // Let's run a query to get function definition using a select on pg_proc
    const { data, error } = await supabase
      .rpc('exec_sql', { sql_query: `
        SELECT pg_get_functiondef(p.oid) as definition
        FROM pg_proc p 
        WHERE p.proname = 'book_room_secure';
      `});
    console.log("Alternative RPC results:", data, error);
  } catch (err) {
    console.error("Alternative failed:", err);
  }
}

runAlternative();
