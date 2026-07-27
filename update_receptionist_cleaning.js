const fs = require('fs');

let filepath = 'project/src/components/ReceptionistServiceHub.tsx';
let content = fs.readFileSync(filepath, 'utf8');

// 1. Update Legend
const oldLegend = `<span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500"></span> Chưa Dọn (DIRTY)</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500"></span> Bảo Trì (MAINTENANCE)</span>`;
const newLegend = `<span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500"></span> Chưa Dọn (DIRTY)</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-400"></span> Đang Dọn (CLEANING)</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500"></span> Bảo Trì (MAINTENANCE)</span>`;
if (content.includes('Chưa Dọn (DIRTY)</span>')) {
  content = content.replace(oldLegend, newLegend);
}

// 2. Update statusBorder and statusBadge
const oldBorders = `const statusBorder = {
                AVAILABLE: "border-emerald-500/60 bg-emerald-50/30 dark:bg-emerald-950/20",
                IN_USE: "border-blue-500/60 bg-blue-50/30 dark:bg-blue-950/20",
                DIRTY: "border-amber-500/60 bg-amber-50/30 dark:bg-amber-950/20",
                MAINTENANCE: "border-red-500/60 bg-red-50/30 dark:bg-red-950/20",
              };`;
const newBorders = `const statusBorder = {
                AVAILABLE: "border-emerald-500/60 bg-emerald-50/30 dark:bg-emerald-950/20",
                IN_USE: "border-blue-500/60 bg-blue-50/30 dark:bg-blue-950/20",
                DIRTY: "border-amber-500/60 bg-amber-50/30 dark:bg-amber-950/20",
                CLEANING: "border-blue-400/60 bg-blue-50/40 dark:bg-blue-900/30",
                MAINTENANCE: "border-red-500/60 bg-red-50/30 dark:bg-red-950/20",
              };`;
if (content.includes('DIRTY: "border-amber-500/60 bg-amber-50/30 dark:bg-amber-950/20"')) {
  content = content.replace(oldBorders, newBorders);
}

const oldBadges = `const statusBadge = {
                AVAILABLE: { label: "✨ Trống Sẵn Sàng", color: "bg-emerald-600 text-white" },
                IN_USE: { label: "👤 Đang Có Khách", color: "bg-blue-600 text-white" },
                DIRTY: { label: "🧹 Chờ Dọn Dẹp", color: "bg-amber-500 text-white" },
                MAINTENANCE: { label: "🔧 Bảo Trì Kỹ Thuật", color: "bg-red-600 text-white" },
              };`;
const newBadges = `const statusBadge = {
                AVAILABLE: { label: "✨ Trống Sẵn Sàng", color: "bg-emerald-600 text-white" },
                IN_USE: { label: "👤 Đang Có Khách", color: "bg-blue-600 text-white" },
                DIRTY: { label: "🧹 Chờ Dọn Dẹp", color: "bg-amber-500 text-white" },
                CLEANING: { label: "⏳ Đang Dọn Dẹp", color: "bg-blue-500 text-white animate-pulse" },
                MAINTENANCE: { label: "🔧 Bảo Trì Kỹ Thuật", color: "bg-red-600 text-white" },
              };`;
if (content.includes('DIRTY: { label: "🧹 Chờ Dọn Dẹp", color: "bg-amber-500 text-white" }')) {
  content = content.replace(oldBadges, newBadges);
}

// 3. Table list colors
const oldListColor = `room.status === "DIRTY" ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" :
                          "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"`;
const newListColor = `room.status === "DIRTY" ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" :
                          room.status === "CLEANING" ? "bg-blue-200 text-blue-900 dark:bg-blue-900/50 dark:text-blue-200" :
                          "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"`;
if (content.includes(oldListColor)) {
  content = content.replace(oldListColor, newListColor);
}

fs.writeFileSync(filepath, content, 'utf8');
console.log("Updated ReceptionistServiceHub for CLEANING status");
