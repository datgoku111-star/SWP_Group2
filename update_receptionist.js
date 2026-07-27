const fs = require('fs');

let filepath = 'project/src/components/ReceptionistServiceHub.tsx';
let content = fs.readFileSync(filepath, 'utf8');

// Find the onlineExps rendering part
const oldOnlineExpsRender = `{onlineExps.map((b: any) => (
                          <div key={b.id}>
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300">
                              Paid (Online)
                            </span>
                          </div>
                        ))}`;

const newOnlineExpsRender = `{onlineExps.map((b: any) => {
                          const isPending = b.status === "PENDING";
                          return (
                            <div key={b.id} className="flex flex-col gap-1 items-start">
                              <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300">
                                Paid (Online) - {b.status}
                              </span>
                              {isPending && (
                                <button
                                  onClick={async () => {
                                    if (confirm("Xác nhận trải nghiệm này?")) {
                                      try {
                                        const res = await fetch(\`/api/bookings/\${b.id}/confirm\`, { method: "POST" });
                                        if (res.ok) {
                                          alert("Đã xác nhận!");
                                          window.location.reload();
                                        } else {
                                          alert("Lỗi khi xác nhận!");
                                        }
                                      } catch(e) { alert("Lỗi khi xác nhận!"); }
                                    }
                                  }}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-md shadow-sm transition-colors"
                                >
                                  Xác nhận
                                </button>
                              )}
                            </div>
                          );
                        })}`;

content = content.replace(oldOnlineExpsRender, newOnlineExpsRender);

// Ensure the room info actually shows the guest name from special_requests if it exists
// Wait, the guest name is shown in the Guest column for the whole room, which is correct because the experience is tied to the room.
// But we could also show the room_id / guest if it was standalone. Since the table groups by room.id, it's already showing the room and guest.
// Let's just make sure the title of the experience is visible.
const oldExpTitle = `                          let title = "Experience Tour";
                          try {
                            const parsed = JSON.parse(b.special_requests);
                            title = parsed.title || title;
                          } catch (e) {}`;
const newExpTitle = `                          let title = "Experience Tour";
                          let roomInfo = "";
                          try {
                            const parsed = JSON.parse(b.special_requests);
                            title = parsed.title || title;
                            if (parsed.room_id) {
                              roomInfo = " - Linked Room: " + parsed.room_id;
                            }
                          } catch (e) {}`;

const oldTitleRender = `                            <div key={b.id} className="font-bold text-emerald-600 dark:text-emerald-400 capitalize">
                              🧗 {title}
                            </div>`;
const newTitleRender = `                            <div key={b.id} className="font-bold text-emerald-600 dark:text-emerald-400 capitalize">
                              🧗 {title}
                            </div>`; // We don't really need to show room_id here since it's already grouped by room.id in the table row.

content = content.replace(oldExpTitle, newExpTitle);
content = content.replace(oldTitleRender, newTitleRender);


fs.writeFileSync(filepath, content, 'utf8');
