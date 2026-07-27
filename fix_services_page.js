const fs = require('fs');

let filepath = 'project/src/app/services/page.tsx';
let content = fs.readFileSync(filepath, 'utf8');

// Add DashboardLayout import
if (!content.includes('import DashboardLayout')) {
    content = content.replace(
        'import { useRouter } from "next/navigation";', 
        'import { useRouter } from "next/navigation";\nimport DashboardLayout from "../dashboard/layout";'
    );
}

// Wrap return with DashboardLayout
// Find `return (` that precedes `<div className="container`
content = content.replace(
    /return \(\s*<div className="container([^>]+)>/,
    'return (\n    <DashboardLayout>\n    <div className="container$1>'
);

// Add closing DashboardLayout tag
// The file ends with 
//       )}
//     </div>
//   );
// }
content = content.replace(
    /<\/div>\s*\);\s*}\s*$/,
    '    </div>\n    </DashboardLayout>\n  );\n}\n'
);

// Modify fetchServices
// We'll replace the block:
//         const data = await res.json();
//         setServices(data);
//         const cats = Array.from(new Set(data.map((s: Service) => s.category)));
//         setCategories(cats as string[]);
const fetchReplacement = `        const data = await res.json();
        const foodData = data.filter((s: any) => s.category.toUpperCase() === "FOOD" || s.category.toUpperCase() === "BEVERAGE");
        setServices(foodData);
        const cats = Array.from(new Set(foodData.map((s: any) => s.category)));
        setCategories(cats as string[]);`;

content = content.replace(/const data = await res\.json\(\);\s*setServices\(data\);\s*const cats = Array\.from\(new Set\(data\.map\(\(s: Service\) => s\.category\)\)\);\s*setCategories\(cats as string\[\]\);/, fetchReplacement);

// Change Title and Desc
// {t("servicesTitle")} -> "Order Foods"
// {t("servicesDesc")} -> "Order delicious food and drinks directly to your room."
content = content.replace(/\{t\("servicesTitle"\)\}/, '"Order Foods"');
content = content.replace(/\{t\("servicesDesc"\)\}/, '"Order delicious food and drinks directly to your room."');

fs.writeFileSync(filepath, content, 'utf8');
