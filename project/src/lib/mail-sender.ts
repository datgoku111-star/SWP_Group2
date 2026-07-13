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

/** Sends an email using SMTP transport */
export async function sendEmail({ to, subject, html }: SendMailParams): Promise<boolean> {
  const transporter = createTransporter();
  if (!transporter) {
    console.warn("Skipping sending email because mail transporter is not configured.");
    return false;
  }

  try {
    const info = await transporter.sendMail({
      from: SMTP_FROM,
      to,
      subject,
      html,
    });
    console.log(`Email sent successfully to ${to}. Message ID: ${info.messageId}`);
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
