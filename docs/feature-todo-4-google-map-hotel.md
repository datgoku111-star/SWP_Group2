## 1. Mô tả tính năng
Tóm tắt ngắn gọn về tính năng cần triển khai dựa trên TODO trong README.md.
* **Loại tác vụ (Commit Type):** feat (Tính năng mới)
* **Phạm vi ảnh hưởng (Scope):** ui, database, hotel
* **TODO gốc trong README.md:** 
> - [ ] **TODO 4**: Gắn địa chỉ google map cho từng khách sạn.
> (Link tham chiếu: [README.md](file:///D:/Pho/Pho/project/README.md#L48))
---
## 2. Yêu cầu chi tiết
Mô tả chi tiết các luồng xử lý, logic nghiệp vụ hoặc giao diện cần đạt được.
* **Mô tả logic:**
- [ ] Thiết lập cơ sở dữ liệu: Bổ sung cột `google_map_url` vào bảng `hotel_rooms` để có thể tùy biến cấu hình bản đồ nhúng.
- [ ] Giao diện chi tiết khách sạn: Thay đổi mã nhúng Iframe tĩnh (đang để mặc định Eiffel Tower) thành mã nhúng động Google Maps.
- [ ] Luồng xử lý chính: Sử dụng địa chỉ hoặc tên khách sạn lấy từ `hotelRoomData` để tạo chuỗi truy vấn nhúng động: `https://maps.google.com/maps?q={tên_địa_chỉ}&output=embed`.
- [ ] Cập nhật văn bản hiển thị địa chỉ của khách sạn tương ứng theo thông tin từ cơ sở dữ liệu thay vì văn bản tĩnh cũ.
- [ ] Các trường hợp ngoại lệ (Edge cases):
  - Khách sạn chưa có dữ liệu địa chỉ hoặc tên: Dùng địa chỉ fallback truyền từ searchParams (`addressParam`).
* **Các file/module dự kiến chỉnh sửa:**
- `src/app/(listing-detail)/listing-stay-detail/page.tsx`
- `supabase/migrations/003_rooms_crud.sql` (hoặc file migration mới bổ sung cột)
---
## 3. Tiêu chí hoàn thành (Definition of Done)
Các điều kiện bắt buộc phải thỏa mãn để đóng Issue này.
- [ ] Bản đồ hiển thị đúng địa điểm của khách sạn tương ứng khi truy cập trang chi tiết.
- [ ] **Đã xóa hoặc cập nhật dòng TODO tương ứng trong file README.md.**
- [ ] Đã được kiểm thử giao diện hoạt động tốt trên thiết bị di động và máy tính.
- [ ] Pull Request giải quyết Issue này phải đặt tên theo chuẩn: `feat(stay-detail): integrate dynamic google maps location embed based on hotel address (#4)`
