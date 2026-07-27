const fs = require('fs');
let file = 'project/src/app/dashboard/housekeeping/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const replacements = {
  'TỔNG ĐÀI ĐIỀU HÀNH DỌN DẸP & BẢO TRÌ (Housekeeping & Maintenance)': 'Housekeeping & Maintenance Dashboard',
  'Giám sát theo thời gian thực trạng thái phòng, nhận yêu cầu dọn dẹp khẩn cấp từ Lễ tân hoặc khách hàng. Cập nhật trạng thái ngay sau khi hoàn tất.': 'Monitor real-time room status, receive urgent cleaning requests. Update status immediately upon completion.',
  'Làm mới': 'Refresh',
  'CẦN DỌN GẤP': 'URGENT CLEANING',
  'Phòng bẩn sau trả': 'Dirty rooms after checkout',
  'BẢO TRÌ': 'MAINTENANCE',
  'Hư hỏng cần sửa': 'Damages to fix',
  'ĐANG Ở': 'IN USE',
  'Dọn dẹp hằng ngày': 'Daily cleaning',
  'TRỐNG & SẠCH': 'AVAILABLE & CLEAN',
  'Sẵn sàng đón khách': 'Ready for guests',
  'ĐỒ GIẶT ỦI': 'LAUNDRY',
  'Đơn giặt ủi cần thu': 'Laundry to collect',
  'Kiểm Tra (CHECKOUT)': 'CHECKOUT INSPECT',
  'Khách yêu cầu trả phòng': 'Checkout requests',
  'LUỒNG DỌN DẸP KHẨN CẤP (Phòng Bẩn)': 'URGENT CLEANING FLOW (Dirty Rooms)',
  'Lễ tân đang hối thúc dọn dẹp các phòng này để có phòng giao cho khách check-in sớm.': 'Receptionist is requesting urgent cleaning to hand over to early check-in guests.',
  'Không có phòng nào cần dọn gấp. Bạn có thể nghỉ ngơi!': 'No urgent cleaning required. You can rest!',
  'Bắt đầu dọn': 'Start Cleaning',
  'Phòng sạch (Sẵn sàng)': 'Cleaned (Ready)',
  'LUỒNG BẢO TRÌ SỬA CHỮA': 'MAINTENANCE FLOW',
  'Các phòng đang bị hỏng hóc vật tư, cần sửa chữa ngay để đưa vào sử dụng.': 'Rooms with broken equipment, need urgent repair to be ready for use.',
  'Không có phòng nào báo hỏng hóc.': 'No rooms reported for maintenance.',
  'Bắt đầu sửa': 'Start Repair',
  'Đã sửa xong': 'Repaired',
  'LUỒNG DỌN PHÒNG ĐANG Ở (Make-up Room)': 'IN USE CLEANING FLOW (Make-up Room)',
  'Dọn dẹp, thay ga, bổ sung nước/khăn cho khách đang lưu trú.': 'Clean, change bed sheets, replenish water/towels for staying guests.',
  'Không có phòng đang lưu trú nào cần dọn lúc này.': 'No in-use rooms need cleaning at this moment.',
  'Đã dọn xong phòng': 'Finished cleaning room',
  'Báo cáo hỏng hóc': 'Report damage',
  'KHU VỰC PHÒNG TRỐNG (Kiểm tra định kỳ)': 'AVAILABLE ROOMS (Routine Check)',
  'Phòng đã sạch, chỉ cần đi kiểm tra lại mùi hương, nhiệt độ, dọn bụi nhẹ trước khi khách vào.': 'Rooms are clean, just need to check scent, temperature, and light dusting before guests arrive.',
  'Không có phòng trống nào cần kiểm tra.': 'No available rooms to check.',
  'Báo bẩn (Khách làm bẩn)': 'Report dirty (Guest dirtied)',
  'LUỒNG KIỂM TRA TRẢ PHÒNG (Checkout Inspection)': 'CHECKOUT INSPECTION FLOW',
  'Khách hàng gửi yêu cầu trả phòng. Lễ tân đã điều động bạn lên kiểm tra xem có hư hỏng hay mất mát đồ đạc gì không trước khi khách thanh toán.': 'Guest requested checkout. Receptionist dispatched you to inspect for damages or lost items before payment.',
  'Không có yêu cầu kiểm tra phòng nào hiện tại.': 'No checkout inspection requests at the moment.',
  'Báo cáo an toàn & Hoàn tất': 'Report safe & Complete',
  'Báo cáo hư hỏng đồ (Cộng tiền)': 'Report damages (Add to bill)',
  'Nhập tên đồ vật hỏng (VD: Vỡ ly thủy tinh, rách khăn...)': 'Enter damaged item (e.g. Broken glass, torn towel...)',
  'Chi phí ước tính (VND) để báo Lễ tân thu thêm': 'Estimated cost (VND) to charge at reception',
  'Gửi báo cáo hư hỏng': 'Submit damage report',
  'LUỒNG THU GOM ĐỒ GIẶT ỦI': 'LAUNDRY COLLECTION FLOW',
  'Khách hàng đặt dịch vụ giặt ủi, cần lên thu gom đồ mang xuống phòng giặt.': 'Guests ordered laundry, need to collect clothes and bring to laundry room.',
  'Không có đơn giặt ủi nào cần thu gom.': 'No laundry orders to collect.',
  'Xác nhận đã thu gom đồ': 'Confirm collected',
  'Khách đang chờ': 'Guest waiting',
  'Khách sắp trả': 'Guest leaving soon',
  'Không rõ': 'Unknown'
};

for (const [key, value] of Object.entries(replacements)) {
  content = content.split(key).join(value);
}

fs.writeFileSync(file, content, 'utf8');
