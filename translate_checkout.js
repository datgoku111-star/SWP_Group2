const fs = require('fs');
let file = 'project/src/app/checkout/PageMain.tsx';
let content = fs.readFileSync(file, 'utf8');

const replacements = {
  '"Thanh toán cọc (10%)"': '"Deposit Payment (10%)"',
  '"Khách hàng chưa thanh toán thành công qua mã QR. Vui lòng kiểm tra lại!"': '"Guest has not successfully paid via QR. Please check again!"',
  '"Có lỗi xảy ra khi kiểm tra trạng thái thanh toán."': '"Error checking payment status."',
  '"Đã thanh toán"': '"Already paid"'
};

for (const [key, value] of Object.entries(replacements)) {
  content = content.split(key).join(value);
}

fs.writeFileSync(file, content, 'utf8');
