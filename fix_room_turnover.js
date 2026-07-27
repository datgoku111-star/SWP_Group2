const fs = require('fs');

let filepath = 'project/src/app/dashboard/housekeeping/page.tsx';
let content = fs.readFileSync(filepath, 'utf8');

content = content.replace(
  'status: "AVAILABLE" | "IN_USE" | "DIRTY" | "MAINTENANCE";',
  'status: "AVAILABLE" | "IN_USE" | "DIRTY" | "CLEANING" | "MAINTENANCE";'
);

fs.writeFileSync(filepath, content, 'utf8');
console.log("Updated RoomTurnover type.");
