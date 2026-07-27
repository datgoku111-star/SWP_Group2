const fs = require('fs');

let filepath = 'project/src/app/dashboard/housekeeping/page.tsx';
let content = fs.readFileSync(filepath, 'utf8');

// 1. Add state variables inside HousekeepingDashboardHub
const stateInsertionPoint = 'const [checkoutRequests, setCheckoutRequests] = useState<any[]>([]);';
if (content.includes(stateInsertionPoint) && !content.includes('reportingRoomId')) {
  const newStates = `  const [checkoutRequests, setCheckoutRequests] = useState<any[]>([]);
  const [reportingRoomId, setReportingRoomId] = useState<string | null>(null);
  const [selectedDamages, setSelectedDamages] = useState<{name: string, price: number}[]>([]);
  const [customDamageName, setCustomDamageName] = useState("");
  const [customDamagePrice, setCustomDamagePrice] = useState("");
  const [isSubmittingDamage, setIsSubmittingDamage] = useState(false);
  
  const PREDEFINED_DAMAGES = [
    { name: "Hỏng chăn", price: 50000 },
    { name: "Hỏng gối", price: 40000 },
    { name: "Hỏng bình nước", price: 30000 },
    { name: "Hỏng điều hòa", price: 100000 },
  ];
  
  const handleToggleDamage = (damage: {name: string, price: number}) => {
    setSelectedDamages(prev => 
      prev.find(d => d.name === damage.name) 
        ? prev.filter(d => d.name !== damage.name)
        : [...prev, damage]
    );
  };
  
  const submitDamageReport = async () => {
    if (!reportingRoomId) return;
    
    let allDamages = [...selectedDamages];
    if (customDamageName && customDamagePrice) {
      allDamages.push({ name: customDamageName, price: Number(customDamagePrice) || 0 });
    }
    
    if (allDamages.length === 0) {
      alert("Vui lòng chọn ít nhất một mục hỏng hóc hoặc nhập tùy chỉnh.");
      return;
    }
    
    const totalCharge = allDamages.reduce((sum, item) => sum + item.price, 0);
    const description = allDamages.map(d => \`\${d.name} (\${d.price.toLocaleString()}đ)\`).join(', ');
    
    setIsSubmittingDamage(true);
    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_id: reportingRoomId,
          incident_type: 'DAMAGE',
          severity: 'MEDIUM',
          description: description,
          estimated_charge: totalCharge,
          is_chargeable: true
        })
      });
      
      if (!res.ok) throw new Error("Failed to report incident");
      
      await changeStatus(reportingRoomId, "MAINTENANCE", \`Báo hỏng: \${description}\`);
      setReportingRoomId(null);
      setSelectedDamages([]);
      setCustomDamageName("");
      setCustomDamagePrice("");
    } catch (err) {
      alert("Lỗi khi báo hỏng: " + (err as Error).message);
    } finally {
      setIsSubmittingDamage(false);
    }
  };`;
  content = content.replace(stateInsertionPoint, newStates);
}

// 3. Add Modal at the end of the file before the last </div>
const modalJSX = `
      {/* DAMAGE REPORT MODAL */}
      {reportingRoomId && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              Báo Hỏng Hóc / Thất Thoát
            </h3>
            
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
              Vui lòng chọn các mục tài sản bị hỏng hóc hoặc điền thêm mục khác. Hệ thống sẽ tự động cập nhật phí phạt vào hóa đơn checkout của phòng.
            </p>
            
            <div className="space-y-3 mb-6 max-h-[50vh] overflow-y-auto pr-2">
              {PREDEFINED_DAMAGES.map((damage) => (
                <label key={damage.name} className="flex items-center justify-between p-3 rounded-2xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded border-neutral-300 text-red-600 focus:ring-red-500"
                      checked={!!selectedDamages.find(d => d.name === damage.name)}
                      onChange={() => handleToggleDamage(damage)}
                    />
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">{damage.name}</span>
                  </div>
                  <span className="text-red-600 font-bold">{damage.price.toLocaleString()}đ</span>
                </label>
              ))}
              
              <div className="p-3 rounded-2xl border border-neutral-200 dark:border-neutral-700 mt-4">
                <div className="text-sm font-semibold mb-2 text-neutral-700 dark:text-neutral-300">Mục khác (Tùy chỉnh)</div>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Tên tài sản hỏng..." 
                    value={customDamageName}
                    onChange={(e) => setCustomDamageName(e.target.value)}
                    className="flex-1 rounded-xl border-neutral-300 dark:border-neutral-600 dark:bg-neutral-800 text-sm"
                  />
                  <input 
                    type="number" 
                    placeholder="Giá (VNĐ)" 
                    value={customDamagePrice}
                    onChange={(e) => setCustomDamagePrice(e.target.value)}
                    className="w-32 rounded-xl border-neutral-300 dark:border-neutral-600 dark:bg-neutral-800 text-sm"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setReportingRoomId(null)}
                className="flex-1 py-3 px-4 rounded-2xl font-bold bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 transition-all text-sm"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={submitDamageReport}
                disabled={isSubmittingDamage || (selectedDamages.length === 0 && !customDamageName)}
                className="flex-1 py-3 px-4 rounded-2xl font-bold bg-red-600 text-white hover:bg-red-700 transition-all text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmittingDamage ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Xác nhận
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}`;

content = content.replace(/<\/div>\s*<\/div>\s*\)\s*;\s*\}\s*$/m, "</div>\n" + modalJSX);

fs.writeFileSync(filepath, content, 'utf8');
console.log('Updated page.tsx with Modal');
