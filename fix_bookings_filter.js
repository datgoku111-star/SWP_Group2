const fs = require('fs');

function updateFile(filePath, filterCondition) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace fetchBookings logic
  const fetchPattern = /if \(user\?\.role === "CUSTOMER"\) \{\s*setBookings\(data\.filter\(\(b: Booking\) => b\.user_id === user\.id\)\);\s*\} else \{\s*setBookings\(data.*?\);\s*\}/g;
  
  // If the file already has the wrong replacement
  const fetchPattern2 = /if \(user\?\.role === "CUSTOMER"\) \{\s*setBookings\(data\.filter\(\(b: Booking\) => b\.user_id === user\.id\)\);\s*\} else \{\s*setBookings\(data\);\s*\}/g;
  
  const fetchReplacement = `let filtered = data.filter((b: any) => ${filterCondition});
        if (user?.role === "CUSTOMER") {
          filtered = filtered.filter((b: any) => b.user_id === user.id);
        }
        setBookings(filtered);`;
        
  if (content.match(fetchPattern)) {
      content = content.replace(fetchPattern, fetchReplacement);
  } else if (content.match(fetchPattern2)) {
      content = content.replace(fetchPattern2, fetchReplacement);
  } else {
      // Manual replace for whatever is there
      content = content.replace(/if \(user\?\.role === "CUSTOMER"\) \{[\s\S]*?\} else \{[\s\S]*?\}/, fetchReplacement);
  }

  // Replace handleSearch logic
  const searchPattern = /setBookings\(Array\.isArray\(data\) \? data : \[\]\);/g;
  const searchReplacement = `let filtered = Array.isArray(data) ? data : [];
        filtered = filtered.filter((b: any) => ${filterCondition});
        if (user?.role === "CUSTOMER") {
          filtered = filtered.filter((b: any) => b.user_id === user.id);
        }
        setBookings(filtered);`;
  content = content.replace(searchPattern, searchReplacement);

  fs.writeFileSync(filePath, content, 'utf8');
}

// 1. Update bookings/page.tsx
updateFile('project/src/app/bookings/page.tsx', 'b.room_id !== "99999999-9999-9999-9999-999999999999" && b.room_id !== "88888888-8888-8888-8888-888888888888"');

// 2. Update booked-experiences/page.tsx
updateFile('project/src/app/booked-experiences/page.tsx', 'b.room_id === "99999999-9999-9999-9999-999999999999"');

