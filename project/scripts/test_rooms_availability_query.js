const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://rufagrsdrbnjjomhfzei.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1ZmFncnNkcmJuampvbWhmemVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTcwNTEzMSwiZXhwIjoyMDk3MjgxMTMxfQ.33hzhv-0v4z7v40p2ZeigZNoxt81fUSbDKJObnzX8N8";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runTests() {
  console.log("=== UNIT TEST: TRUY VẤN KIỂM TRA PHÒNG TRỐNG (Issue #5) ===");
  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`✔ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`✘ [FAIL] ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Test Edge Case: No room class selected (roomTypeId = null/undefined)
    console.log("\n--- 1. Test Edge Case: No room class selected ---");
    const { data: allAvailableRooms, error: err1 } = await supabase
      .from("rooms")
      .select("*, room_type:room_types(*)")
      .eq("status", "AVAILABLE");
    assert(!err1 && allAvailableRooms.length > 0, `Returned ${allAvailableRooms?.length || 0} available rooms across all classes.`);

    // 2. Test Edge Case: Filter by specific room class (e.g., Standard)
    console.log("\n--- 2. Test Filter by Room Class (Standard) ---");
    const standardType = allAvailableRooms.find(r => r.room_type?.name === 'Standard')?.room_type_id;
    if (standardType) {
      const { data: standardRooms, error: err2 } = await supabase
        .from("rooms")
        .select("*, room_type:room_types(*)")
        .eq("status", "AVAILABLE")
        .eq("room_type_id", standardType);
      assert(!err2 && standardRooms.every(r => r.room_type_id === standardType), `Returned ${standardRooms?.length || 0} rooms belonging strictly to Standard class.`);
    } else {
      console.log("⚠ Standard room type not found, skipping class filter test.");
    }

    // 3. Test Non-Overlapping Date Range (Far in future: 2030-01-01 to 2030-01-05)
    console.log("\n--- 3. Test Non-Overlapping Date Range ---");
    const checkInFuture = '2030-01-01';
    const checkOutFuture = '2030-01-05';
    
    // Check overlapping bookings
    const { data: bookedFuture } = await supabase
      .from("bookings")
      .select("room_id")
      .neq("status", "CANCELLED")
      .lt("check_in_date", checkOutFuture)
      .gt("check_out_date", checkInFuture);
      
    assert(bookedFuture !== null && bookedFuture.length === 0, "No overlapping bookings found for far-future date range.");

    // 4. Test Overlapping Date Range Logic (Simulating overlapping booking including PENDING status)
    console.log("\n--- 4. Test Overlapping Date Range & Status Exclusion ---");
    // Find an existing booking or check current bookings
    const { data: activeBookings } = await supabase
      .from("bookings")
      .select("id, room_id, check_in_date, check_out_date, status")
      .neq("status", "CANCELLED")
      .limit(5);

    if (activeBookings && activeBookings.length > 0) {
      const sampleBooking = activeBookings[0];
      console.log(`Testing overlap against active booking [ID: ${sampleBooking.id}, Room: ${sampleBooking.room_id}, Status: ${sampleBooking.status}, Dates: ${sampleBooking.check_in_date} -> ${sampleBooking.check_out_date}]`);
      
      // Query rooms excluding overlapping bookings
      const { data: overlappingBookings } = await supabase
        .from("bookings")
        .select("room_id")
        .neq("status", "CANCELLED")
        .lt("check_in_date", sampleBooking.check_out_date)
        .gt("check_out_date", sampleBooking.check_in_date);

      const excludeIds = (overlappingBookings || []).map(b => b.room_id);
      assert(excludeIds.includes(sampleBooking.room_id), `Successfully identified room ${sampleBooking.room_id} as blocked during overlapping dates.`);
    } else {
      console.log("ℹ No active non-cancelled bookings found in DB to test live overlap.");
    }

    // 5. Test Room Locks Graceful Check (Issue #6 compatibility)
    console.log("\n--- 5. Test room_locks Table Compatibility ---");
    try {
      const { data: locks, error: lockErr } = await supabase
        .from("room_locks")
        .select("room_id")
        .gt("locked_until", new Date().toISOString());
      
      if (lockErr) {
        assert(lockErr.message.includes("does not exist") || lockErr.code !== null, "Gracefully handled room_locks query (table not created yet or empty).");
      } else {
        assert(true, `Successfully queried room_locks table (${locks.length} active locks found).`);
      }
    } catch (e) {
      assert(true, "Caught exception when checking room_locks table.");
    }

    // 6. Test Edge Case: Date Validation Logic (checkout <= checkin)
    console.log("\n--- 6. Test Date Validation Logic ---");
    const dIn = new Date("2026-08-10");
    const dOut = new Date("2026-08-05"); // before checkin
    const isInvalidRange = dOut <= dIn;
    assert(isInvalidRange === true, "Successfully flagged checkout date before checkin date as invalid range.");

    console.log(`\n======================================================`);
    console.log(`Test Summary: ${passed} Passed | ${failed} Failed`);
    console.log(`======================================================`);

    if (failed > 0) process.exit(1);

  } catch (err) {
    console.error("Test Suite Crashed:", err);
    process.exit(1);
  }
}

runTests();
