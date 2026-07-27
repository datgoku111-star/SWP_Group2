const fs = require('fs');

let filepath = 'project/src/app/api/bookings/route.ts';
let content = fs.readFileSync(filepath, 'utf8');

const importRegex = /import \{ supabaseServer \} from "@\/lib\/supabase";/;
const newImport = `import { supabaseServer } from "@/lib/supabase";

async function autoCheckoutOverdue() {
  try {
    const { data: overdueBookings, error: fetchErr } = await supabaseServer
      .from('bookings')
      .select('id, room_id, check_out_date, status')
      .eq('status', 'CHECKED_IN');
      
    if (fetchErr || !overdueBookings) return;
    
    const now = Date.now();
    for (const b of overdueBookings) {
      if (!b.check_out_date) continue;
      // Checkout limit is 12h after 12:00 PM of check_out_date -> midnight of next day
      const limitDate = new Date(b.check_out_date + 'T12:00:00Z').getTime() + 12 * 60 * 60 * 1000;
      if (now > limitDate) {
        console.log(\`[Auto-Checkout] Triggered for booking \${b.id}\`);
        
        // 1. Mark booking as CHECKED_OUT
        await supabaseServer.from('bookings').update({ 
          status: 'CHECKED_OUT', 
          checkout_message: 'Auto-checked out due to overdue',
          updated_at: new Date().toISOString()
        }).eq('id', b.id);
        
        // 2. Mark room as DIRTY
        const nowIso = new Date().toISOString();
        let urError = await supabaseServer.from('rooms').update({ status: 'DIRTY', updated_at: nowIso, status_updated_at: nowIso }).eq('id', b.room_id);
        if (urError.error && urError.error.message.includes("status_updated_at")) {
           await supabaseServer.from('rooms').update({ status: 'DIRTY', updated_at: nowIso }).eq('id', b.room_id);
        }
      }
    }
  } catch(e) {
    console.error("Auto checkout error:", e);
  }
}
`;

content = content.replace(importRegex, newImport);

const getRegex = /const bookings = await getAllBookings\(\);/;
const newGet = `autoCheckoutOverdue().catch(console.error);\n    const bookings = await getAllBookings();`;
content = content.replace(getRegex, newGet);

const getByUserRegex = /const bookings = await getBookingsByUser\(user\.sub\);/;
const newGetByUser = `autoCheckoutOverdue().catch(console.error);\n      const bookings = await getBookingsByUser(user.sub);`;
content = content.replace(getByUserRegex, newGetByUser);

fs.writeFileSync(filepath, content, 'utf8');
console.log("Updated bookings API with auto checkout logic.");
