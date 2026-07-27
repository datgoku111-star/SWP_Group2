const fs = require('fs');

let filepath = 'project/src/app/checkout/PageMain.tsx';
let content = fs.readFileSync(filepath, 'utf8');

// 1. Fix Deposit text
const oldDepositText = `              <span>{t("checkoutDeposit") || "Deposit Payment (10%)"}</span>`;
const newDepositText = `              <span>{isExperience ? "Thanh toán (100%)" : t("checkoutDeposit") || "Deposit Payment (10%)"}</span>`;
content = content.replace(oldDepositText, newDepositText);

// 2. Inject dropdown
const oldHeading = `        <h2 className="text-3xl lg:text-4xl font-semibold">
          {t("checkoutConfirmAndPay")}
        </h2>`;
const newHeading = `        <h2 className="text-3xl lg:text-4xl font-semibold">
          {t("checkoutConfirmAndPay")}
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
content = content.replace(oldHeading, newHeading);

// 3. Update PayOS text
const oldPayOSText = `confirm your room booking immediately.`;
const newPayOSText = `confirm your {isExperience ? 'experience' : 'room'} booking immediately.`;
content = content.replace(oldPayOSText, newPayOSText);

fs.writeFileSync(filepath, content, 'utf8');
