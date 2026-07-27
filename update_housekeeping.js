const fs = require('fs');

let filepath = 'project/src/app/dashboard/housekeeping/page.tsx';
let content = fs.readFileSync(filepath, 'utf8');

// 1. Update `dirtyRooms`
content = content.replace(
  'const dirtyRooms = rooms.filter((r) => r.status === "DIRTY");',
  'const dirtyRooms = rooms.filter((r) => r.status === "DIRTY" || r.status === "CLEANING");'
);

// 2. Add Clock and Spray icons to lucide-react import
content = content.replace(
  /import \{ (.*) \} from "lucide-react";/,
  (match, p1) => {
    if (!p1.includes("SprayCan")) p1 += ", SprayCan, Zap";
    return `import { ${p1} } from "lucide-react";`;
  }
);

// 3. Update the Badge inside DIRTY_FLOW
// Current:
// <span className="text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-200 dark:bg-amber-900/60 px-3 py-1 rounded-full uppercase">
//   Chờ Dọn (DIRTY)
// </span>
const currentBadge = `<span className="text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-200 dark:bg-amber-900/60 px-3 py-1 rounded-full uppercase">
                      Chờ Dọn (DIRTY)
                    </span>`;
const newBadge = `                    {room.status === "DIRTY" ? (
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-200 dark:bg-amber-900/60 px-3 py-1 rounded-full uppercase shadow-sm">
                        🧹 Chờ Dọn (DIRTY)
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-200 dark:bg-blue-900/60 px-3 py-1 rounded-full uppercase shadow-sm animate-pulse">
                        ⏳ Đang Dọn Dẹp (CLEANING)
                      </span>
                    )}`;
if (content.includes('Chờ Dọn (DIRTY)')) {
  // Let's use string replace for the exact badge
  content = content.replace(currentBadge, newBadge);
}

// 4. Update the actions
const oldActionsStart = `<div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => changeStatus(room.id, "AVAILABLE")}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-2xl transition-all shadow flex items-center justify-center gap-2 text-sm"
                    >
                      <Sparkles className="w-4 h-4" />
                      ✨ HOÀN TẤT DỌN DẸP (➔ AVAILABLE)
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt("Nhập lý do hỏng hóc cần bảo trì (VD: Hỏng điều hòa, rò nước...):", "Hỏng thiết bị điện nước");
                        if (reason !== null) changeStatus(room.id, "MAINTENANCE", reason);
                      }}
                      className="bg-red-100 dark:bg-red-900/40 hover:bg-red-200 text-red-800 dark:text-red-300 font-semibold py-3 px-4 rounded-2xl transition-all text-sm flex items-center gap-1.5"
                      title="Báo lỗi kỹ thuật / chuyển sang Luồng 2"
                    >
                      <Wrench className="w-4 h-4" />
                      Báo Hỏng
                    </button>
                  </div>`;
const newActionsStart = `<div className="flex flex-col gap-3 pt-2">
                    {room.status === "DIRTY" && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => changeStatus(room.id, "CLEANING", "Đang dọn nhanh (20p)")}
                          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2.5 px-3 rounded-xl transition-all shadow flex items-center justify-center gap-1.5 text-xs"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          Dọn nhanh 20p
                        </button>
                        <button
                          onClick={() => changeStatus(room.id, "CLEANING", "Đang dọn kỹ (45p)")}
                          className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2.5 px-3 rounded-xl transition-all shadow flex items-center justify-center gap-1.5 text-xs"
                        >
                          <SprayCan className="w-3.5 h-3.5" />
                          Dọn kỹ 45p
                        </button>
                      </div>
                    )}
                    
                    {room.status === "CLEANING" && (
                      <button
                        onClick={() => changeStatus(room.id, "AVAILABLE")}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-2xl transition-all shadow flex items-center justify-center gap-2 text-sm"
                      >
                        <Sparkles className="w-4 h-4" />
                        ✨ HOÀN TẤT DỌN DẸP (➔ AVAILABLE)
                      </button>
                    )}
                    
                    {room.status === "DIRTY" && (
                      <button
                        onClick={() => {
                          const reason = prompt("Nhập lý do hỏng hóc cần bảo trì (VD: Hỏng điều hòa, rò nước...):", "Hỏng thiết bị điện nước");
                          if (reason !== null) changeStatus(room.id, "MAINTENANCE", reason);
                        }}
                        className="bg-red-100 dark:bg-red-900/40 hover:bg-red-200 text-red-800 dark:text-red-300 font-semibold py-2 px-4 rounded-xl transition-all text-xs flex items-center justify-center gap-1.5 mx-auto"
                        title="Báo lỗi kỹ thuật / chuyển sang Luồng 2"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        Báo Hỏng / Bảo trì
                      </button>
                    )}
                  </div>`;
content = content.replace(oldActionsStart, newActionsStart);

fs.writeFileSync(filepath, content, 'utf8');
console.log("Updated housekeeping dashboard.");
