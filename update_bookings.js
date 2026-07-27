const fs = require('fs');

// 1. Update bookings/page.tsx
let file1 = 'project/src/app/bookings/page.tsx';
let content1 = fs.readFileSync(file1, 'utf8');

// Filter out cars and experiences in the fetchBookings
content1 = content1.replace(
  'setBookings(data);',
  'setBookings(data.filter((b: any) => b.room_id !== "99999999-9999-9999-9999-999999999999" && b.room_id !== "88888888-8888-8888-8888-888888888888"));'
);

fs.writeFileSync(file1, content1, 'utf8');

// 2. Update booked-experiences/page.tsx
let file2 = 'project/src/app/booked-experiences/page.tsx';
let content2 = fs.readFileSync(file2, 'utf8');

// Filter ONLY experiences
content2 = content2.replace(
  'setBookings(data);',
  'setBookings(data.filter((b: any) => b.room_id === "99999999-9999-9999-9999-999999999999"));'
);

// Change titles
content2 = content2.replace(
  '{user?.role === "CUSTOMER" ? "My Bookings" : "Reservations & Billing Management"}',
  '{"Booked Experiences"}'
);
content2 = content2.replace(
  '{isStaff\n              ? "Filter all reservations across statuses, check-in guests, perform check-out & print invoices."\n              : "Review your upcoming and past stays with Chisfis."}',
  '{"Review your booked experience tours and activities."}'
);
content2 = content2.replace(
  '<title>My Bookings | HotelOS</title>',
  '<title>Booked Experiences | HotelOS</title>'
);

fs.writeFileSync(file2, content2, 'utf8');
