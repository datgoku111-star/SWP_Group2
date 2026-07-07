# TÀI LIỆU KỊCH BẢN KIỂM THỬ (TEST CASES) PHỤC VỤ THUYẾT TRÌNH - NHÓM 2
## Hệ thống Quản lý và Vận hành Khách sạn HSRM (Hotel Operation and Service Management System)

Tài liệu này tổng hợp các kịch bản kiểm thử (Test Cases) quan trọng nhất cho các chức năng cốt lõi (Use Cases) của hệ thống HSRM. Các kịch bản được thiết kế rõ ràng, dễ hiểu để thành viên nhóm có thể dễ dàng sao chép đưa vào slide thuyết trình (PowerPoint / Google Slides).

---

## 1. UC01: ĐĂNG NHẬP HỆ THỐNG (LOGIN SYSTEM)
* **Tác nhân:** Admin, Lễ tân (Receptionist), Khách hàng (Customer), Nhân viên Bếp/Giặt là (Kitchen/Laundry), Buồng phòng (Housekeeping).
* **Quy tắc nghiệp vụ áp dụng:** **BR07 (Security)** - Mật khẩu phải được mã hóa BCrypt khi lưu trữ trong cơ sở dữ liệu.

| Mã Test Case | Loại kiểm thử | Mục tiêu kiểm thử | Điều kiện tiên quyết | Các bước thực hiện | Kết quả mong đợi |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC01_01** | Positive (Hợp lệ) | Đăng nhập thành công với tài khoản Lễ tân | Tài khoản Lễ tân đã được tạo và kích hoạt trong hệ thống. | 1. Truy cập trang đăng nhập `/login`<br>2. Nhập Email và Mật khẩu hợp lệ của Lễ tân.<br>3. Nhấn "Đăng nhập". | - Đăng nhập thành công.<br>- Hệ thống chuyển hướng Lễ tân đến trang Dashboard của Lễ tân (`/dashboard/receptionist`).<br>- Token JWT được lưu trong Cookie. |
| **TC01_02** | Negative (Không hợp lệ) | Đăng nhập thất bại do sai mật khẩu | Tài khoản người dùng tồn tại. | 1. Truy cập trang đăng nhập `/login`<br>2. Nhập Email đúng nhưng Mật khẩu sai.<br>3. Nhấn "Đăng nhập". | - Hệ thống hiển thị thông báo lỗi: "Mật khẩu hoặc Email không chính xác".<br>- Người dùng vẫn ở lại trang đăng nhập, không có Session/Cookie nào được tạo. |
| **TC01_03** | Negative (Không hợp lệ) | Đăng nhập thất bại do tài khoản không tồn tại | Email chưa từng được đăng ký trong hệ thống. | 1. Truy cập trang đăng nhập `/login`<br>2. Nhập một Email chưa đăng ký và mật khẩu bất kỳ.<br>3. Nhấn "Đăng nhập". | - Hệ thống hiển thị thông báo lỗi tương ứng.<br>- Không cho phép truy cập. |

---

## 2. UC03 & UC04: TÌM PHÒNG & ĐẶT PHÒNG (SEARCH & BOOK ROOM)
* **Tác nhân:** Khách hàng (Customer), Lễ tân (Receptionist).
* **Quy tắc nghiệp vụ áp dụng:** 
  * **BR01 (Availability)** - Phòng chỉ có thể được đặt nếu không trùng lặp (overlap) với bất kỳ lịch đặt phòng đang hoạt động nào khác.
  * **BR02 (Room Price)** - Tiền phòng = số đêm lưu trú thực tế $\times$ đơn giá của loại phòng (`price_per_night`).
  * **BR09 (Pending Expiration)** - Đơn đặt phòng chờ thanh toán (Pending) sẽ tự động bị hủy sau 24 giờ nếu không được xác nhận.

| Mã Test Case | Loại kiểm thử | Mục tiêu kiểm thử | Điều kiện tiên quyết | Các bước thực hiện | Kết quả mong đợi |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC04_01** | Positive (Hợp lệ) | Khách đặt phòng trống thành công | Có ít nhất 1 phòng thuộc loại phòng được chọn còn trống trong khoảng thời gian yêu cầu. | 1. Chọn ngày nhận phòng (Check-in) và ngày trả phòng (Check-out).<br>2. Chọn loại phòng mong muốn và nhấn "Tìm kiếm".<br>3. Chọn phòng trống hiển thị trong danh sách.<br>4. Nhập thông tin khách hàng và nhấn "Đặt phòng". | - Hệ thống kiểm tra tình trạng phòng và tạo đơn đặt phòng thành công với trạng thái `Booked` hoặc `Pending`.<br>- Tổng số tiền ước tính hiển thị đúng công thức: $Số\_đêm \times Đơn\_giá\_loại\_phòng$ (**BR02**). |
| **TC04_02** | Negative (Trùng lịch - BR01) | Hệ thống từ chối đặt phòng đã bị trùng lịch | Phòng 101 đã có khách đặt từ ngày 01/07/2026 đến 05/07/2026. | 1. Khách hàng thực hiện tìm kiếm phòng từ ngày 03/07/2026 đến 07/07/2026.<br>2. Kiểm tra xem Phòng 101 có xuất hiện trong kết quả tìm kiếm hay không. | - Phòng 101 không xuất hiện trong danh sách phòng trống phục vụ đặt phòng (**BR01**).<br>- Nếu cố tình gửi yêu cầu API đặt Phòng 101 trong khoảng thời gian này, hệ thống sẽ trả về lỗi: "Phòng đã bị đặt trùng lịch". |
| **TC04_03** | Negative (Dữ liệu lỗi) | Hệ thống báo lỗi khi ngày đặt phòng không hợp lệ | Đang ở màn hình đặt phòng. | 1. Chọn ngày Check-in là ngày trong quá khứ hoặc ngày Check-out trước ngày Check-in.<br>2. Nhấn "Tìm kiếm/Đặt phòng". | - Hệ thống ngăn chặn gửi yêu cầu và hiển thị cảnh báo: "Ngày trả phòng phải sau ngày nhận phòng ít nhất 1 ngày". |

---

## 3. UC05: NHẬN PHÒNG VỚI CCCD AI OCR (CHECK-IN WITH AI OCR)
* **Tác nhân:** Lễ tân (Receptionist), Hệ thống AI OCR.
* **Quy tắc nghiệp vụ áp dụng:**
  * **BR06 (Authorization)** - Chỉ có tài khoản với vai trò Lễ tân (Receptionist) mới có quyền thực hiện Check-in / Check-out.
  * **BR10 (Audit)** - Mọi hành động Check-in phải ghi lại nhật ký hệ thống (`audit_logs`).

| Mã Test Case | Loại kiểm thử | Mục tiêu kiểm thử | Điều kiện tiên quyết | Các bước thực hiện | Kết quả mong đợi |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC05_01** | Positive (Hợp lệ) | Check-in thành công bằng cách tải lên ảnh CCCD (AI OCR hoạt động tốt) | Lễ tân đã đăng nhập. Đơn đặt phòng đang ở trạng thái hợp lệ. Dịch vụ AI OCR hoạt động bình thường. | 1. Lễ tân mở màn hình Check-in cho đơn đặt phòng.<br>2. Tải lên ảnh mặt trước CCCD của khách hàng.<br>3. Hệ thống gọi AI OCR để trích xuất dữ liệu.<br>4. Lễ tân xác nhận thông tin đã tự điền và bấm "Xác nhận nhận phòng". | - AI OCR trích xuất chính xác Họ tên, Số CCCD, Ngày sinh, Địa chỉ.<br>- Trạng thái đơn đặt phòng đổi thành `Checked-In`.<br>- Trạng thái phòng đổi thành `IN_USE`.<br>- Nhật ký hệ thống (`audit_logs`) ghi nhận hành động `CHECK_IN` kèm thông tin tài khoản Lễ tân thực hiện (**BR10**). |
| **TC05_02** | Alternative (Ngoại lệ - OCR lỗi) | AI OCR gặp sự cố hoặc ảnh mờ - Lễ tân nhập thủ công | Lễ tân đã đăng nhập. Hệ thống AI OCR bị lỗi kết nối hoặc ảnh tải lên không đọc được. | 1. Lễ tân mở màn hình Check-in.<br>2. Tải lên ảnh CCCD không hợp lệ hoặc hệ thống báo mất kết nối dịch vụ OCR.<br>3. Lễ tân tiến hành nhập các trường thông tin khách hàng bằng tay.<br>4. Nhấn "Xác nhận nhận phòng". | - Hệ thống hiển thị cảnh báo không thể trích xuất tự động và mở chế độ nhập tay.<br>- Cho phép Lễ tân hoàn tất nhận phòng bình thường sau khi nhập đủ thông tin bắt buộc. |
| **TC05_03** | Negative (Phân quyền - BR06) | Hệ thống từ chối quyền Check-in của vai trò khác | Tài khoản đăng nhập có vai trò là Khách hàng (Customer) hoặc Bếp (Kitchen Staff). | 1. Sử dụng tài khoản Customer gửi yêu cầu Check-in tới API `/api/checkin`. | - Yêu cầu bị hệ thống chặn lại.<br>- Trả về mã lỗi `403 Forbidden` (Không có quyền truy cập) (**BR06**). |

---

## 4. UC06 & UC07: ĐẶT DỊCH VỤ & XỬ LÝ DỊCH VỤ (ORDER & PROCESS SERVICE)
* **Tác nhân:** Khách hàng (Customer), Nhân viên Bếp/Giặt là (Kitchen/Laundry Staff).
* **Quy tắc nghiệp vụ áp dụng:**
  * **BR03 (Workflow)** - Trạng thái đơn dịch vụ bắt buộc đi theo đúng luồng: `ORDERED` (Đã đặt) $\rightarrow$ `PROCESSING` (Đang xử lý) $\rightarrow$ `COMPLETED` (Đã hoàn thành) / `CANCELLED` (Đã hủy).

| Mã Test Case | Loại kiểm thử | Mục tiêu kiểm thử | Điều kiện tiên quyết | Các bước thực hiện | Kết quả mong đợi |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC06_01** | Positive (Hợp lệ) | Khách hàng đặt dịch vụ thành công trong thời gian lưu trú | Khách hàng đang lưu trú tại phòng (trạng thái booking là `Checked-In`). | 1. Khách hàng mở trang "Gọi dịch vụ" (`/services`).<br>2. Chọn món ăn (ví dụ: Phở bò) và số lượng: 2.<br>3. Nhấn đặt đơn dịch vụ. | - Đơn dịch vụ được tạo thành công với trạng thái ban đầu là `ORDERED` (**BR03**).<br>- Nhân viên bếp nhận được thông báo thời gian thực (Real-time Socket.io) trên màn hình làm việc của mình. |
| **TC06_02** | Positive (Xử lý đơn) | Nhân viên Bếp cập nhật trạng thái đơn dịch vụ | Đơn dịch vụ tồn tại ở trạng thái `ORDERED`. Nhân viên bếp đã đăng nhập. | 1. Nhân viên Bếp mở danh sách hàng đợi dịch vụ.<br>2. Chọn đơn dịch vụ vừa nhận và bấm "Bắt đầu chế biến" (đổi sang `PROCESSING`).<br>3. Sau khi làm xong, nhấn "Hoàn thành" (đổi sang `COMPLETED`). | - Trạng thái đơn dịch vụ cập nhật lần lượt từ `ORDERED` $\rightarrow$ `PROCESSING` $\rightarrow$ `COMPLETED` đúng quy trình (**BR03**).<br>- Khách hàng nhận được thông báo trạng thái đơn dịch vụ được cập nhật trên thiết bị của mình. |
| **TC06_03** | Negative (Không hợp lệ) | Khách hàng chưa check-in không được đặt dịch vụ | Tài khoản khách hàng có booking trạng thái là `Booked` (Chưa check-in) hoặc `Checked-Out`. | 1. Khách hàng cố gắng truy cập trang gọi dịch vụ hoặc gửi yêu cầu API đặt dịch vụ. | - Hệ thống từ chối yêu cầu và hiển thị lỗi: "Bạn phải check-in nhận phòng trước khi gọi dịch vụ". |

---

## 5. UC10: THANH TOÁN & TRẢ PHÒNG (PAYMENT & CHECK-OUT)
* **Tác nhân:** Lễ tân (Receptionist), Khách hàng (Customer).
* **Quy tắc nghiệp vụ áp dụng:**
  * **BR04 (Billable Services)** - Chỉ những đơn dịch vụ có trạng thái `COMPLETED` mới được đưa vào hóa đơn thanh toán cuối cùng.
  * **BR05 (Room Status Clean)** - Sau khi hoàn tất Trả phòng (Check-out), trạng thái của phòng đó tự động chuyển từ `IN_USE` sang `DIRTY` (Cần dọn dẹp).
  * **BR08 (Single Invoice)** - Mỗi lượt đặt phòng chỉ có duy nhất một hóa đơn thanh toán cuối cùng.
  * **BR10 (Audit)** - Ghi lại lịch sử thanh toán và check-out vào `audit_logs`.

| Mã Test Case | Loại kiểm thử | Mục tiêu kiểm thử | Điều kiện tiên quyết | Các bước thực hiện | Kết quả mong đợi |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC10_01** | Positive (Hợp lệ) | Tính toán hóa đơn chính xác gồm tiền phòng và dịch vụ hoàn thành | Phòng 101 ở 2 đêm (giá 500k/đêm). Đơn dịch vụ 1: 2 tô phở (100k) trạng thái `COMPLETED`. Đơn dịch vụ 2: 1 nước ngọt (20k) trạng thái `PROCESSING`. | 1. Lễ tân bấm mở màn hình "Thanh toán & Trả phòng" cho phòng 101.<br>2. Xem bảng kê chi tiết hóa đơn tạm tính. | - Tiền phòng tính đúng: $2 \times 500.000 = 1.000.000$ VND.<br>- Tiền dịch vụ chỉ bao gồm đơn đã hoàn thành: $100.000$ VND, không tính đơn nước ngọt đang xử lý (**BR04**).<br>- Tổng hóa đơn hiển thị chính xác: $1.100.000$ VND. |
| **TC10_02** | Positive (Thanh toán) | Thực hiện thanh toán và check-out hoàn tất | Đang ở màn hình thanh toán phòng 101. | 1. Chọn phương thức thanh toán: "Tiền mặt".<br>2. Nhấn "Xác nhận Thanh toán & Trả phòng". | - Hệ thống ghi nhận trạng thái thanh toán của hóa đơn là `Paid`.<br>- Booking chuyển trạng thái sang `Checked-Out`.<br>- Phòng 101 tự động đổi trạng thái thành `DIRTY` (**BR05**).<br>- Một bản ghi lịch sử được chèn vào bảng `audit_logs` (**BR10**). |
| **TC10_03** | Negative (Thanh toán lại) | Ngăn chặn việc thanh toán lần thứ 2 cho cùng 1 booking | Đơn đặt phòng đã được thanh toán và check-out thành công trước đó. | 1. Lễ tân cố tình gửi lại yêu cầu tạo thanh toán qua API cho booking ID này lần nữa. | - Hệ thống từ chối yêu cầu và trả về lỗi: "Hóa đơn cho lượt đặt phòng này đã được quyết toán" (**BR08**). |

---

## 6. UC08: CẬP NHẬT TRẠNG THÁI PHÒNG (UPDATE ROOM STATUS)
* **Tác nhân:** Nhân viên buồng phòng (Housekeeping), Admin.
* **Quy tắc nghiệp vụ áp dụng:** **BR05 (Room after Checkout)**, **BR10 (Audit)**.

| Mã Test Case | Loại kiểm thử | Mục tiêu kiểm thử | Điều kiện tiên quyết | Các bước thực hiện | Kết quả mong đợi |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC08_01** | Positive (Hợp lệ) | Cập nhật phòng từ Dơ (Dirty) sang Trống (Available) sau khi dọn xong | Phòng 101 đang có trạng thái `DIRTY` (sau khi khách trả phòng). Nhân viên buồng phòng đã đăng nhập. | 1. Nhân viên mở màn hình danh sách phòng dọn dẹp.<br>2. Chọn Phòng 101.<br>3. Thay đổi trạng thái phòng thành `AVAILABLE` (Sẵn sàng đón khách).<br>4. Nhấn "Lưu thay đổi". | - Trạng thái Phòng 101 đổi sang `AVAILABLE` thành công.<br>- Phòng 101 ngay lập tức xuất hiện trở lại trong kết quả tìm kiếm phòng trống khi khách hàng đặt phòng trực tuyến. |

---

## 7. UC11: XEM BÁO CÁO DOANH THU (VIEW REVENUE REPORT)
* **Tác nhân:** Quản trị viên (Admin).
* **Quy tắc nghiệp vụ áp dụng:** **BR04 (Billable Services)**.

| Mã Test Case | Loại kiểm thử | Mục tiêu kiểm thử | Điều kiện tiên quyết | Các bước thực hiện | Kết quả mong đợi |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC11_01** | Positive (Hợp lệ) | Thống kê doanh thu hiển thị đúng số tiền thực thu | Có các giao dịch thanh toán thành công trong ngày. Admin đã đăng nhập. | 1. Admin truy cập trang báo cáo doanh thu (`/admin/reports`).<br>2. Chọn bộ lọc thời gian: "Hôm nay".<br>3. Nhấn "Tải báo cáo". | - Báo cáo hiển thị chi tiết tổng doanh thu thực nhận từ tiền phòng và tiền dịch vụ đã hoàn thành (các đơn `COMPLETED`).<br>- Biểu đồ trực quan hóa dữ liệu chính xác theo nguồn dữ liệu từ bảng `payments`. |
