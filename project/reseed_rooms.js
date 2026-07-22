const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
let supabaseUrl = '';
let supabaseKey = '';

envContent.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
    supabaseUrl = line.split('=')[1].trim();
  } else if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
    supabaseKey = line.split('=')[1].trim();
  }
});

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function reseedRooms() {
  try {
    console.log("Fetching room types...");
    const { data: roomTypes, error: typeError } = await supabase.from('room_types').select('id, name');
    if (typeError) throw typeError;

    const standardType = roomTypes.find(rt => rt.name === 'Standard')?.id;
    const deluxeType = roomTypes.find(rt => rt.name === 'Deluxe')?.id;
    const suiteType = roomTypes.find(rt => rt.name === 'Suite')?.id;
    const familyType = roomTypes.find(rt => rt.name === 'Family')?.id;

    console.log("Clearing order_items...");
    const { error: e0 } = await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (e0) console.log("order_items skip:", e0.message);

    console.log("Clearing service_orders...");
    const { error: e00 } = await supabase.from('service_orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (e00) console.log("service_orders skip:", e00.message);

    console.log("Clearing payments related to bookings...");
    const { error: e2 } = await supabase.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (e2) console.log("payments skip:", e2.message);

    console.log("Clearing customer_requests related to bookings...");
    const { error: e3 } = await supabase.from('customer_requests').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (e3) console.log("customer_requests skip:", e3.message);

    console.log("Clearing existing bookings...");
    const { error: e4 } = await supabase.from('bookings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (e4) throw e4;
    
    console.log("Clearing existing rooms...");
    const { error: deleteRoomsError } = await supabase.from('rooms').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (deleteRoomsError) throw deleteRoomsError;

    const roomsToInsert = [
      // Standard (7 rooms)
      { room_number: '101', floor: 1, room_type_id: standardType, notes: 'SINGLE', status: 'AVAILABLE' },
      { room_number: '102', floor: 1, room_type_id: standardType, notes: 'SINGLE', status: 'AVAILABLE' },
      { room_number: '103', floor: 1, room_type_id: standardType, notes: 'DOUBLE', status: 'AVAILABLE' },
      { room_number: '201', floor: 2, room_type_id: standardType, notes: 'SINGLE', status: 'AVAILABLE' },
      { room_number: '202', floor: 2, room_type_id: standardType, notes: 'DOUBLE', status: 'AVAILABLE' },
      { room_number: '301', floor: 3, room_type_id: standardType, notes: 'SINGLE', status: 'AVAILABLE' },
      { room_number: '401', floor: 4, room_type_id: standardType, notes: 'DOUBLE', status: 'AVAILABLE' },

      // Deluxe (7 rooms)
      { room_number: '104', floor: 1, room_type_id: deluxeType, notes: 'SINGLE', status: 'AVAILABLE' },
      { room_number: '105', floor: 1, room_type_id: deluxeType, notes: 'DOUBLE', status: 'AVAILABLE' },
      { room_number: '203', floor: 2, room_type_id: deluxeType, notes: 'SINGLE', status: 'AVAILABLE' },
      { room_number: '204', floor: 2, room_type_id: deluxeType, notes: 'DOUBLE', status: 'AVAILABLE' },
      { room_number: '302', floor: 3, room_type_id: deluxeType, notes: 'SINGLE', status: 'AVAILABLE' },
      { room_number: '303', floor: 3, room_type_id: deluxeType, notes: 'DOUBLE', status: 'AVAILABLE' },
      { room_number: '402', floor: 4, room_type_id: deluxeType, notes: 'DOUBLE', status: 'AVAILABLE' },

      // Suite (7 rooms)
      { room_number: '106', floor: 1, room_type_id: suiteType, notes: 'DOUBLE', status: 'AVAILABLE' },
      { room_number: '205', floor: 2, room_type_id: suiteType, notes: 'SINGLE', status: 'AVAILABLE' },
      { room_number: '206', floor: 2, room_type_id: suiteType, notes: 'DOUBLE', status: 'AVAILABLE' },
      { room_number: '304', floor: 3, room_type_id: suiteType, notes: 'SINGLE', status: 'AVAILABLE' },
      { room_number: '305', floor: 3, room_type_id: suiteType, notes: 'DOUBLE', status: 'AVAILABLE' },
      { room_number: '403', floor: 4, room_type_id: suiteType, notes: 'DOUBLE', status: 'AVAILABLE' },
      { room_number: '404', floor: 4, room_type_id: suiteType, notes: 'SINGLE', status: 'AVAILABLE' },

      // Family (7 rooms)
      { room_number: '107', floor: 1, room_type_id: familyType, notes: 'DOUBLE', status: 'AVAILABLE' },
      { room_number: '207', floor: 2, room_type_id: familyType, notes: 'DOUBLE', status: 'AVAILABLE' },
      { room_number: '208', floor: 2, room_type_id: familyType, notes: 'DOUBLE', status: 'AVAILABLE' },
      { room_number: '306', floor: 3, room_type_id: familyType, notes: 'DOUBLE', status: 'AVAILABLE' },
      { room_number: '307', floor: 3, room_type_id: familyType, notes: 'DOUBLE', status: 'AVAILABLE' },
      { room_number: '405', floor: 4, room_type_id: familyType, notes: 'DOUBLE', status: 'AVAILABLE' },
      { room_number: '406', floor: 4, room_type_id: familyType, notes: 'DOUBLE', status: 'AVAILABLE' },
    ];

    console.log("Inserting 28 new rooms...");
    const { error: insertError } = await supabase.from('rooms').insert(roomsToInsert);
    if (insertError) throw insertError;

    console.log("Successfully reseeded 28 rooms!");
  } catch (err) {
    console.error("Error reseeding rooms:", err);
  }
}

reseedRooms();
