const fs = require('fs');

let filepath = 'project/src/app/dashboard/layout.tsx';
let content = fs.readFileSync(filepath, 'utf8');

// Add CalendarDays to imports
content = content.replace(
    'CalendarCheck,',
    'CalendarCheck,\n  CalendarDays,'
);

// Add Lịch trình trải nghiệm to navItems
const oldLink = `{ name: "Order Foods", href: "/services", icon: UtensilsCrossed, roles: ["CUSTOMER"] },`;
const newLink = `{ name: "Lịch trình trải nghiệm", href: "/experience-schedule", icon: CalendarDays, roles: ["CUSTOMER"] },
    { name: "Order Foods", href: "/services", icon: UtensilsCrossed, roles: ["CUSTOMER"] },`;

content = content.replace(oldLink, newLink);

fs.writeFileSync(filepath, content, 'utf8');
