const fs = require('fs');

let filepath = 'project/src/app/checkout/PageMain.tsx';
let content = fs.readFileSync(filepath, 'utf8');

// 1. Add states for checked-in rooms
if (!content.includes('const [checkedInRooms, setCheckedInRooms]')) {
    content = content.replace(
        'const [lockedRoom, setLockedRoom] = useState<any>(null);',
        'const [lockedRoom, setLockedRoom] = useState<any>(null);\n  const [checkedInRooms, setCheckedInRooms] = useState<any[]>([]);\n  const [selectedCheckedInRoom, setSelectedCheckedInRoom] = useState<string>("");'
    );
}

// 2. Update specialRequestsValue to include room_id
const oldSpecial = `  const specialRequestsValue = isExperience
    ? JSON.stringify({ isExperience: true, title: titleParam, category: categoryParam })
    : "";`;
const newSpecial = `  const specialRequestsValue = isExperience
    ? JSON.stringify({ isExperience: true, title: titleParam, category: categoryParam, room_id: selectedCheckedInRoom })
    : "";`;
content = content.replace(oldSpecial, newSpecial);

// 3. Update the lockTargetRoom bypass for isExperience
const oldBypass = `        if (!isRoomBooking) {
          // For non-room bookings (experiences/cars), we bypass availability checks and locks.
          // We just fetch any room to satisfy the DB bookings schema foreign key constraint.
          const roomsRes = await fetch("/api/rooms?all=true");
          if (!roomsRes.ok) throw new Error("Failed to load room details.");
          const rooms = await roomsRes.json();
          if (rooms && rooms.length > 0) {
            setLockedRoom({ room_id: rooms[0].id, dummy: true });
          } else {
            throw new Error("No rooms found in database to link the booking.");
          }
          return;
        }`;

const newBypass = `        if (!isRoomBooking) {
          if (isExperience) {
            const bRes = await fetch("/api/bookings");
            if (bRes.ok) {
              const allB = await bRes.json();
              // user object might have id or sub
              const uid = user.id || user.sub;
              const activeB = allB.filter((b: any) => b.user_id === uid && b.status === "CHECKED_IN");
              setCheckedInRooms(activeB);
              if (activeB.length > 0) {
                setSelectedCheckedInRoom(activeB[0].room_id);
                setLockedRoom({ room_id: activeB[0].room_id, dummy: true });
              } else {
                setError("Bạn phải có phòng đang nhận (CHECKED_IN) mới có thể đặt Trải nghiệm.");
              }
            }
            return;
          }

          // For cars, just pick any room
          const roomsRes = await fetch("/api/rooms?all=true");
          if (!roomsRes.ok) throw new Error("Failed to load room details.");
          const rooms = await roomsRes.json();
          if (rooms && rooms.length > 0) {
            setLockedRoom({ room_id: rooms[0].id, dummy: true });
          } else {
            throw new Error("No rooms found in database to link the booking.");
          }
          return;
        }`;
content = content.replace(oldBypass, newBypass);

// 4. Update the depositAmount calculation
const oldDepositCalc = `    const depositAmount = typeParam === "service" ? total : total * 0.1;`;
const newDepositCalc = `    const depositAmount = (typeParam === "service" || isExperience) ? total : total * 0.1;`;
content = content.replace(oldDepositCalc, newDepositCalc);

// 5. Update checkout UI to show dropdown
const uiInjectionPoint = `          {/* HEADING */}
          <h2 className="text-3xl font-semibold">
            {t("checkoutTitle") || "Confirm and payment"}
          </h2>`;

const uiNew = `          {/* HEADING */}
          <h2 className="text-3xl font-semibold">
            {t("checkoutTitle") || "Confirm and payment"}
          </h2>
          
          {isExperience && checkedInRooms.length > 0 && (
            <div className="mt-4 p-4 border border-neutral-200 dark:border-neutral-700 rounded-xl">
              <label className="block text-sm font-medium mb-2">Chọn phòng bạn đang ở để Lễ Tân xác nhận:</label>
              <select 
                className="w-full p-2 border border-neutral-300 rounded-lg dark:bg-neutral-800 dark:border-neutral-700"
                value={selectedCheckedInRoom}
                onChange={(e) => {
                  setSelectedCheckedInRoom(e.target.value);
                  setLockedRoom({ room_id: e.target.value, dummy: true });
                }}
              >
                {checkedInRooms.map((b) => (
                  <option key={b.id} value={b.room_id}>
                    Phòng {b.room?.room_number || b.room_id} (Check-in: {new Date(b.check_in_date).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>
          )}
          {isExperience && checkedInRooms.length === 0 && (
            <div className="mt-4 p-4 bg-red-100 text-red-600 rounded-xl">
              Bạn không có phòng nào đang trong trạng thái CHECKED_IN. Vui lòng nhận phòng trước khi đặt trải nghiệm.
            </div>
          )}`;
content = content.replace(uiInjectionPoint, uiNew);

// Ensure the handlePayOSPayment also correctly blocks if no room
const oldHandlePayOS = `    try {
      let bookingId = paymentInfo?.bookingId || "";`;
const newHandlePayOS = `    if (isExperience && !selectedCheckedInRoom) {
      alert("Bạn phải chọn phòng đang ở để đặt trải nghiệm!");
      return;
    }
    try {
      let bookingId = paymentInfo?.bookingId || "";`;
content = content.replace(oldHandlePayOS, newHandlePayOS);

fs.writeFileSync(filepath, content, 'utf8');
