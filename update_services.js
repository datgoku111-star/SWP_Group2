const fs = require('fs');

let file = 'project/src/app/services/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'const data = await res.json();\n        setServices(data);',
  'let data = await res.json();\n        data = data.filter((s: any) => s.category === "FOOD" || s.category === "BEVERAGE");\n        setServices(data);'
);

content = content.replace(
  '{t("title")}',
  '{"Order Foods"}'
);

content = content.replace(
  '{t("subtitle")}',
  '{"Order delicious meals and beverages straight to your room."}'
);

content = content.replace(
  '<title>Order Service | HotelOS</title>',
  '<title>Order Foods | HotelOS</title>'
);

fs.writeFileSync(file, content, 'utf8');
