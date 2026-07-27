const fs = require('fs');

let filepath = 'project/src/app/bookings/page.tsx';
let content = fs.readFileSync(filepath, 'utf8');

// I need to add a banner if booking.checkout_step === 'OVERDUE_REQUESTED'
// In the map function rendering table rows or cards. Let's look for tr map
// Actually I can just add a warning below the booking.status column or inside the actions column.

const rowStart = `<tr key={booking.id} className="group hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">`;

if (content.includes(rowStart)) {
  const trReplacement = `<tr key={booking.id} className={\`group hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors \${booking.checkout_step === 'OVERDUE_REQUESTED' ? 'bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500' : ''}\`}>`;
  content = content.replace(rowStart, trReplacement);
}

// In the actions column or below the room number
const roomIdCell = `<td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded text-xs">
                            {booking.room_id.slice(0, 8)}
                          </span>
                        </div>
                      </td>`;
const newRoomIdCell = `<td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded text-xs">
                              {booking.room_id.slice(0, 8)}
                            </span>
                          </div>
                          {booking.checkout_step === 'OVERDUE_REQUESTED' && (
                            <div className="text-xs text-red-600 dark:text-red-400 font-bold max-w-[150px]">
                              ⚠️ Quá hạn trả phòng. Vui lòng liên hệ Lễ tân.
                            </div>
                          )}
                        </div>
                      </td>`;
content = content.replace(roomIdCell, newRoomIdCell);

fs.writeFileSync(filepath, content, 'utf8');
console.log("Updated bookings page.");
