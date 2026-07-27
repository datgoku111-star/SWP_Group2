import nodemailer from "nodemailer";

// Retrieve SMTP credentials from environment variables
const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const SMTP_FROM = process.env.SMTP_FROM || `"HSRM Resort Booking" <noreply@hotel.com>`;

// Create transporter only if user & pass are provided
const createTransporter = () => {
  if (!SMTP_USER || !SMTP_PASS) {
    console.warn("WARNING: SMTP credentials (SMTP_USER/SMTP_PASS) are missing in environment variables. Mailer is disabled.");
    return null;
  }
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // true for 465, false for others
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
};

export interface SendMailParams {
  to: string;
  subject: string;
  html: string;
}

/** Sends an email using SMTP transport (falls back to Ethereal mock in dev/testing if credentials are missing) */
export async function sendEmail({ to, subject, html }: SendMailParams): Promise<boolean> {
  let transporter = createTransporter();
  let isEthereal = false;

  if (!transporter) {
    console.log("No SMTP credentials configured. Email sending is skipped in dev environment.");
    return false;
  }

  try {
    const info = await transporter.sendMail({
      from: isEthereal ? '"HSRM System" <no-reply@hsrm.local>' : SMTP_FROM,
      to,
      subject,
      html,
    });
    console.log(`Email sent successfully to ${to}. Message ID: ${info.messageId}`);
    if (isEthereal) {
      console.log(`Ethereal Email Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
    return true;
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
    return false;
  }
}

/** Formats a date into a localized Vietnamese string */
export function formatVietnameseDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch (e) {
    return dateStr;
  }
}

/** Formats a number to VND format */
export function formatCurrency(x?: number): string {
  if (x === undefined || x === null) return "0 VND";
  return `${x.toLocaleString("vi-VN")} VND`;
}

/** Builds a professional Vietnamese HTML email template for experience bookings */
export function buildExperienceEmailTemplate(params: {
  customerName: string;
  experienceTitle: string;
  checkInDate: string;
  checkOutDate: string;
}): string {
  const formattedCheckIn = formatVietnameseDate(params.checkInDate);
  const formattedCheckOut = formatVietnameseDate(params.checkOutDate);

  return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Xác nhận đặt dịch vụ trải nghiệm</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333333;
          background-color: #f9f9f9;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background: #ffffff;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }
        .header {
          background-color: #1e3a8a;
          color: #ffffff;
          padding: 24px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
        }
        .content {
          padding: 24px;
        }
        .content p {
          margin: 0 0 16px;
        }
        .highlight {
          color: #1e3a8a;
          font-weight: bold;
        }
        .schedule-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        .schedule-table th, .schedule-table td {
          border: 1px solid #e5e7eb;
          padding: 12px;
          text-align: left;
        }
        .schedule-table th {
          background-color: #f3f4f6;
          font-weight: 600;
          color: #374151;
        }
        .schedule-table td {
          color: #4b5563;
        }
        .footer {
          background-color: #f9fafb;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #9ca3af;
          border-top: 1px solid #e5e7eb;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Xác Nhận Đăng Ký Trải Nghiệm</h1>
        </div>
        <div class="content">
          <p>Kính chào Quý khách <span class="highlight">${params.customerName}</span>,</p>
          <p>Cảm ơn Quý khách đã đặt dịch vụ trải nghiệm <span class="highlight">${params.experienceTitle}</span> tại hệ thống Resort của chúng tôi.</p>
          <p>Chúng tôi xin gửi đến Quý khách thông tin lịch trình và thời gian chi tiết của dịch vụ như sau:</p>

          <table class="schedule-table">
            <thead>
              <tr>
                <th>Hoạt động</th>
                <th>Thời gian</th>
                <th>Chi tiết lịch trình</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="font-weight: 600;">🏨 Check-in Khách sạn</td>
                <td><strong>14:00</strong></td>
                <td>Ngày nhận phòng: ${formattedCheckIn}</td>
              </tr>
              <tr>
                <td style="font-weight: 600;">🚌 Khởi hành Tour</td>
                <td><strong>07:30</strong></td>
                <td>Ngày tham gia: ${formattedCheckIn} (Xe đón tại sảnh Resort)</td>
              </tr>
              <tr>
                <td style="font-weight: 600;">🎯 Tham gia Hoạt động</td>
                <td><strong>08:30 - 11:30</strong></td>
                <td>Hoạt động trải nghiệm: ${params.experienceTitle}</td>
              </tr>
              <tr>
                <td style="font-weight: 600;">🔑 Check-out Khách sạn</td>
                <td><strong>12:00</strong></td>
                <td>Ngày trả phòng: ${formattedCheckOut}</td>
              </tr>
            </tbody>
          </table>

          <p><strong>Lưu ý quan trọng:</strong> Quý khách vui lòng có mặt tại sảnh Resort trước giờ khởi hành tour 15 phút (lúc 07:15) và mang theo trang phục phù hợp để có một chuyến đi trải nghiệm trọn vẹn nhất.</p>
          <p>Nếu cần hỗ trợ thêm, Quý khách vui lòng liên hệ quầy lễ tân hoặc gọi điện tới số hotline chăm sóc khách hàng của chúng tôi.</p>
          <p>Chúc Quý khách có một kỳ nghỉ thật vui vẻ và đáng nhớ!</p>
          <br>
          <p>Trân trọng,<br><span class="highlight">Đội ngũ HSRM Resort</span></p>
        </div>
        <div class="footer">
          <p>Email này được gửi tự động từ hệ thống quản lý HSRM. Vui lòng không trả lời trực tiếp email này.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export interface BookingConfirmationEmailParams {
  bookingId: string;
  customerName: string;
  email: string;
  phone: string;
  roomNumber: string;
  roomTypeName: string;
  checkInDate: string;
  checkOutDate: string;
  numGuests: number;
  totalPrice: number;
  depositAmount: number;
  specialRequests?: string;
}

/** Builds a professional Vietnamese HTML email template for booking deposit confirmation */
export function buildBookingConfirmationEmailTemplate(params: BookingConfirmationEmailParams): string {
  const formattedCheckIn = formatVietnameseDate(params.checkInDate);
  const formattedCheckOut = formatVietnameseDate(params.checkOutDate);
  const formattedTotal = formatCurrency(params.totalPrice);
  const formattedDeposit = formatCurrency(params.depositAmount);
  const remaining = formatCurrency(Math.max(0, params.totalPrice - params.depositAmount));

  return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Xác nhận Đặt phòng & Thanh toán Cọc</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333333; background-color: #f9f9f9; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); }
        .header { background-color: #0f172a; color: #ffffff; padding: 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 22px; font-weight: 600; }
        .content { padding: 24px; }
        .highlight { color: #0f172a; font-weight: bold; }
        .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .info-table th, .info-table td { border: 1px solid #e5e7eb; padding: 12px; text-align: left; }
        .info-table th { background-color: #f3f4f6; font-weight: 600; color: #374151; width: 40%; }
        .info-table td { color: #4b5563; }
        .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>XÁC NHẬN ĐẶT PHÒNG & THANH TOÁN CỌC</h1>
        </div>
        <div class="content">
          <p>Kính chào Quý khách <span class="highlight">${params.customerName}</span>,</p>
          <p>Cảm ơn Quý khách đã lựa chọn HSRM Resort. Chúng tôi xin xác nhận đã nhận được khoản cọc và xác nhận đơn đặt phòng của Quý khách thành công.</p>
          <p>Dưới đây là thông tin chi tiết đặt phòng của Quý khách:</p>

          <table class="info-table">
            <tbody>
              <tr>
                <th>Mã đặt phòng</th>
                <td class="highlight">${params.bookingId}</td>
              </tr>
              <tr>
                <th>Khách hàng</th>
                <td>${params.customerName}</td>
              </tr>
              <tr>
                <th>Số điện thoại</th>
                <td>${params.phone || "N/A"}</td>
              </tr>
              <tr>
                <th>Email</th>
                <td>${params.email || "N/A"}</td>
              </tr>
              <tr>
                <th>Số phòng</th>
                <td class="highlight">${params.roomNumber}</td>
              </tr>
              <tr>
                <th>Loại phòng</th>
                <td>${params.roomTypeName}</td>
              </tr>
              <tr>
                <th>Ngày nhận phòng</th>
                <td><strong>${formattedCheckIn}</strong> (sau 14:00)</td>
              </tr>
              <tr>
                <th>Ngày trả phòng</th>
                <td><strong>${formattedCheckOut}</strong> (trước 12:00)</td>
              </tr>
              <tr>
                <th>Số lượng khách</th>
                <td>${params.numGuests} người</td>
              </tr>
              <tr>
                <th>Tổng tiền phòng</th>
                <td><strong>${formattedTotal}</strong></td>
              </tr>
              <tr>
                <th>Số tiền đã cọc</th>
                <td style="color: #10b981; font-weight: bold;">${formattedDeposit}</td>
              </tr>
              <tr>
                <th>Còn lại cần thanh toán</th>
                <td><strong>${remaining}</strong></td>
              </tr>
              ${params.specialRequests ? `
              <tr>
                <th>Yêu cầu đặc biệt</th>
                <td>${params.specialRequests}</td>
              </tr>
              ` : ""}
            </tbody>
          </table>

          <p><strong>Lưu ý khi check-in:</strong> Quý khách vui lòng xuất trình căn cước công dân hoặc hộ chiếu khi làm thủ tục nhận phòng tại quầy lễ tân.</p>
          <p>Nếu có bất kỳ thay đổi nào hoặc cần hỗ trợ thêm, Quý khách vui lòng liên hệ với bộ phận lễ tân qua hotline hoặc trả lời trực tiếp email này.</p>
          <p>Chúc Quý khách có một kỳ nghỉ tuyệt vời tại HSRM Resort!</p>
          <br>
          <p>Trân trọng,<br><span class="highlight">Đội ngũ HSRM Resort</span></p>
        </div>
        <div class="footer">
          <p>Email này được gửi tự động từ hệ thống quản lý HSRM Resort. Vui lòng không trả lời trực tiếp email này.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export interface CheckoutEmailParams {
  bookingId: string;
  customerName: string;
  email: string;
  phone: string;
  roomNumber: string;
  roomTypeName: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  basePrice: number;
  roomCharges: number;
  serviceCharges: number;
  serviceOrders: any[];
  experienceCharges?: number;
  incidentCharges: number;
  incidents: any[];
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  depositPaid: number;
  finalPaid: number;
  paymentMethod: string;
  transactionRef: string;
}

/** Builds a professional Vietnamese HTML email template for checkout and final invoice */
export function buildCheckoutEmailTemplate(params: CheckoutEmailParams): string {
  const formattedCheckIn = formatVietnameseDate(params.checkInDate);
  const formattedCheckOut = formatVietnameseDate(params.checkOutDate);
  
  // Service orders HTML
  let serviceOrdersHtml = "";
  if (params.serviceOrders && params.serviceOrders.length > 0) {
    serviceOrdersHtml = `
      <div style="margin-top: 15px;">
        <h4 style="margin: 0 0 5px; color: #0f172a; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Chi tiết dịch vụ phụ trợ</h4>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 13px;">
          <thead>
            <tr style="background-color: #f9fafb;">
              <th style="padding: 6px 8px; border: 1px solid #e5e7eb; text-align: left;">Dịch vụ</th>
              <th style="padding: 6px 8px; border: 1px solid #e5e7eb; text-align: right;">Đơn giá</th>
              <th style="padding: 6px 8px; border: 1px solid #e5e7eb; text-align: center;">SL</th>
              <th style="padding: 6px 8px; border: 1px solid #e5e7eb; text-align: right;">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
    `;
    params.serviceOrders.forEach((order) => {
      if (order.items && order.items.length > 0) {
        order.items.forEach((item: any) => {
          serviceOrdersHtml += `
            <tr>
              <td style="padding: 6px 8px; border: 1px solid #e5e7eb;">${item.service?.name || "Dịch vụ"}</td>
              <td style="padding: 6px 8px; border: 1px solid #e5e7eb; text-align: right;">${formatCurrency(item.unit_price)}</td>
              <td style="padding: 6px 8px; border: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
              <td style="padding: 6px 8px; border: 1px solid #e5e7eb; text-align: right;">${formatCurrency(item.subtotal)}</td>
            </tr>
          `;
        });
      } else {
        // Fallback for orders without structured items but having total_amount
        let orderName = "Dịch vụ phòng";
        if (order.notes) {
          try {
            const notesObj = JSON.parse(order.notes);
            if (notesObj.is_car_rental) {
              orderName = `Thuê xe (${notesObj.car_type})`;
            }
          } catch(e) {}
        }
        serviceOrdersHtml += `
          <tr>
            <td colspan="3" style="padding: 6px 8px; border: 1px solid #e5e7eb;">${orderName} (Mã đơn: ${order.id.slice(0,8)})</td>
            <td style="padding: 6px 8px; border: 1px solid #e5e7eb; text-align: right;">${formatCurrency(order.total_amount)}</td>
          </tr>
        `;
      }
    });
    serviceOrdersHtml += `
          </tbody>
        </table>
      </div>
    `;
  }

  // Incidents HTML
  let incidentsHtml = "";
  if (params.incidents && params.incidents.length > 0) {
    incidentsHtml = `
      <div style="margin-top: 15px;">
        <h4 style="margin: 0 0 5px; color: #b91c1c; border-bottom: 1px solid #fecaca; padding-bottom: 5px;">Phụ thu đền bù / Sự cố (Incidents)</h4>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 13px;">
          <thead>
            <tr style="background-color: #fef2f2;">
              <th style="padding: 6px 8px; border: 1px solid #fca5a5; text-align: left; color: #b91c1c;">Mô tả sự cố</th>
              <th style="padding: 6px 8px; border: 1px solid #fca5a5; text-align: right; color: #b91c1c; width: 30%;">Phí đền bù</th>
            </tr>
          </thead>
          <tbody>
    `;
    params.incidents.forEach((inc) => {
      const charge = inc.approved_charge || inc.estimated_charge || inc.fine_amount || 0;
      incidentsHtml += `
        <tr>
          <td style="padding: 6px 8px; border: 1px solid #fca5a5;">${inc.description || "Hư hại tài sản"}</td>
          <td style="padding: 6px 8px; border: 1px solid #fca5a5; text-align: right; font-weight: bold; color: #b91c1c;">${formatCurrency(charge)}</td>
        </tr>
      `;
    });
    incidentsHtml += `
          </tbody>
        </table>
      </div>
    `;
  }

  return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Hóa đơn Thanh toán & Xác nhận Check-out</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.5; color: #333333; background-color: #f4f4f5; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background: #ffffff; border: 1px solid #e4e4e7; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05); }
        .header { background-color: #0f172a; color: #ffffff; padding: 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.5px; }
        .header p { margin: 5px 0 0; font-size: 14px; opacity: 0.8; }
        .content { padding: 24px; }
        .section-title { font-size: 16px; font-weight: 600; color: #0f172a; border-left: 4px solid #0f172a; padding-left: 8px; margin: 20px 0 10px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
        .grid-item { font-size: 13px; color: #52525b; }
        .grid-item strong { color: #0f172a; }
        .invoice-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .invoice-table th, .invoice-table td { border-bottom: 1px solid #e4e4e7; padding: 10px 8px; text-align: left; font-size: 13px; }
        .invoice-table th { font-weight: 600; color: #71717a; background-color: #fafafa; }
        .invoice-table td { color: #27272a; }
        .total-section { margin-top: 20px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; }
        .total-row { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 8px; color: #475569; }
        .total-row.grand { font-size: 16px; font-weight: 700; color: #0f172a; border-top: 1px dashed #cbd5e1; padding-top: 8px; margin-top: 8px; }
        .footer { background-color: #f4f4f5; padding: 20px; text-align: center; font-size: 12px; color: #71717a; border-top: 1px solid #e4e4e7; }
        .thank-you { text-align: center; font-size: 15px; font-weight: 600; color: #0f172a; margin: 25px 0 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>HÓA ĐƠN CHECK-OUT & THANH TOÁN</h1>
          <p>Cảm ơn Quý khách đã lưu trú tại HSRM Resort</p>
        </div>
        <div class="content">
          <p>Kính chào Quý khách <strong>${params.customerName}</strong>,</p>
          <p>Thủ tục trả phòng (check-out) cho phòng <strong>${params.roomNumber}</strong> của Quý khách đã hoàn tất thành công. Dưới đây là chi tiết hóa đơn thanh toán cuối cùng của Quý khách:</p>

          <div class="section-title">Thông tin chung</div>
          <table style="width: 100%; font-size: 13px; margin-bottom: 20px; border-collapse: collapse;">
            <tr>
              <td style="padding: 4px 0; color: #71717a;">Mã đặt phòng:</td>
              <td style="padding: 4px 0; font-weight: 600; text-align: right;">${params.bookingId}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #71717a;">Khách hàng:</td>
              <td style="padding: 4px 0; font-weight: 600; text-align: right;">${params.customerName}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #71717a;">Thời gian lưu trú:</td>
              <td style="padding: 4px 0; font-weight: 600; text-align: right;">${formattedCheckIn} - ${formattedCheckOut} (${params.nights} đêm)</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #71717a;">Phòng:</td>
              <td style="padding: 4px 0; font-weight: 600; text-align: right;">Phòng ${params.roomNumber} (${params.roomTypeName})</td>
            </tr>
          </table>

          <div class="section-title">Chi tiết chi phí</div>
          <table class="invoice-table">
            <thead>
              <tr>
                <th>Khoản mục</th>
                <th style="text-align: right;">Đơn giá/Chi tiết</th>
                <th style="text-align: right;">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Tiền phòng (${params.nights} đêm)</td>
                <td style="text-align: right;">${formatCurrency(params.basePrice)} / đêm</td>
                <td style="text-align: right; font-weight: 600;">${formatCurrency(params.roomCharges)}</td>
              </tr>
              <tr>
                <td>Tổng chi phí dịch vụ phụ trợ</td>
                <td style="text-align: right;">Ăn uống, thuê xe, giặt là...</td>
                <td style="text-align: right; font-weight: 600;">${formatCurrency(params.serviceCharges)}</td>
              </tr>
              ${params.incidentCharges > 0 ? `
              <tr style="color: #b91c1c;">
                <td>Phụ thu đền bù sự cố</td>
                <td style="text-align: right;">Hư hại tài sản</td>
                <td style="text-align: right; font-weight: 600;">${formatCurrency(params.incidentCharges)}</td>
              </tr>
              ` : ""}
            </tbody>
          </table>

          ${serviceOrdersHtml}
          ${incidentsHtml}

          <div class="total-section">
            <div class="total-row">
              <span>Cộng phụ thu (Subtotal):</span>
              <span>${formatCurrency(params.subtotal)}</span>
            </div>
            <div class="total-row">
              <span>Thuế VAT (${(params.vatRate * 100).toFixed(0)}%):</span>
              <span>${formatCurrency(params.vatAmount)}</span>
            </div>
            <div class="total-row" style="color: #10b981; font-weight: 600;">
              <span>Đã thanh toán trước / Tiền cọc (Deductions):</span>
              <span>-${formatCurrency(params.depositPaid)}</span>
            </div>
            <div class="total-row" style="color: #0f172a; font-weight: 600;">
              <span>Đã thanh toán khi check-out:</span>
              <span>${formatCurrency(params.finalPaid)}</span>
            </div>
            <div class="total-row grand">
              <span>Số dư còn lại (Balance Due):</span>
              <span style="color: #10b981;">0 VND</span>
            </div>
          </div>

          <table style="width: 100%; font-size: 12px; margin-top: 15px; color: #71717a; border-collapse: collapse; background-color: #f9fafb; border-radius: 4px; padding: 10px;">
            <tr>
              <td style="padding: 8px;">
                <strong>Phương thức thanh toán check-out:</strong> ${params.paymentMethod}<br/>
                ${params.transactionRef ? `<strong>Mã giao dịch check-out:</strong> ${params.transactionRef}` : ""}
              </td>
            </tr>
          </table>

          <div class="thank-you">Rất hân hạnh được phục vụ Quý khách!</div>
          <p style="text-align: center; font-size: 13px; color: #71717a;">Hy vọng sẽ được đón tiếp Quý khách quay trở lại HSRM Resort trong những kỳ nghỉ tiếp theo.</p>
          <br>
          <p>Trân trọng,<br><strong>Đội ngũ quản lý HSRM Resort</strong></p>
        </div>
        <div class="footer">
          <p>Email này được gửi tự động từ hệ thống quản lý HSRM Resort. Vui lòng không trả lời trực tiếp email này.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}


