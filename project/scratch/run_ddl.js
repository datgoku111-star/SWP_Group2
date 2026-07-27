const { createClient } = require('@supabase/supabase-js');
const supabase = createClient("https://rufagrsdrbnjjomhfzei.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1ZmFncnNkcmJuampvbWhmemVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTcwNTEzMSwiZXhwIjoyMDk3MjgxMTMxfQ.33hzhv-0v4z7v40p2ZeigZNoxt81fUSbDKJObnzX8N8");

async function run() {
  const sql = `
    CREATE TABLE IF NOT EXISTS public.car_bookings (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
      car_type VARCHAR(50) NOT NULL,
      pickup_date TIMESTAMPTZ NOT NULL,
      dropoff_date TIMESTAMPTZ NOT NULL,
      total_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );
  `;
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
  console.log("data:", data);
  console.log("error:", error);
}

run();
