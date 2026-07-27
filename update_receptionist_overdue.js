const fs = require('fs');

let filepath = 'project/src/components/ReceptionistServiceHub.tsx';
let content = fs.readFileSync(filepath, 'utf8');

// 1. In the grid mapping, add currentBooking and isOverdue check.
const gridMapRegex = /const currentBadge = statusBadge\[room\.status as keyof typeof statusBadge\] \|\| statusBadge\.AVAILABLE;/;
const newGridMap = `const currentBadge = statusBadge[room.status as keyof typeof statusBadge] || statusBadge.AVAILABLE;
              const currentBooking = bookings.find((b: any) => b.room_id === room.id && b.status === "CHECKED_IN");
              let isOverdue = false;
              if (currentBooking && currentBooking.check_out_date) {
                // If today is past the checkout date
                const checkoutDate = new Date(currentBooking.check_out_date).setHours(0,0,0,0);
                const today = new Date().setHours(0,0,0,0);
                if (today > checkoutDate) isOverdue = true;
              }
`;
content = content.replace(gridMapRegex, newGridMap);

// 2. Display Overdue badge and button
const actionsRegex = /\{\/\* Actions based on status \*\/\}\s*<div className="pt-3 border-t border-neutral-200\/60 dark:border-neutral-700\/60 flex items-center gap-2">/;
const newActions = `{/* Actions based on status */}
                  {isOverdue && (
                    <div className="mt-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 border border-red-200 dark:border-red-800">
                      <span>⚠️ QUÁ HẠN TRẢ PHÒNG</span>
                      <button 
                        onClick={async () => {
                          try {
                            const res = await fetch('/api/receptionist/checkout-request', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ bookingId: currentBooking.id, action: 'REQUEST_OVERDUE' })
                            });
                            if (res.ok) {
                              alert('Đã gửi yêu cầu trả phòng cho khách.');
                              fetchAllData();
                            } else {
                              alert('Lỗi khi gửi yêu cầu trả phòng.');
                            }
                          } catch (e) {
                            alert('Lỗi hệ thống.');
                          }
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg mt-1 w-full"
                      >
                        Gửi yêu cầu trả phòng
                      </button>
                    </div>
                  )}
                  <div className="pt-3 border-t border-neutral-200/60 dark:border-neutral-700/60 flex flex-wrap gap-2">`;
content = content.replace(actionsRegex, newActions);

fs.writeFileSync(filepath, content, 'utf8');
console.log("Updated ReceptionistServiceHub");
