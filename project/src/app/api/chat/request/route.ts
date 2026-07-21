import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
  try {
    const { name, phone, requestDetails } = await request.json();

    if (!name || !phone) {
      return NextResponse.json(
        { error: "Họ tên và số điện thoại là bắt buộc" },
        { status: 400 }
      );
    }

    // 1. Save request to Supabase customer_requests table
    const { data: dbData, error: dbError } = await supabaseServer
      .from("customer_requests")
      .insert([
        {
          name,
          phone,
          request_details: requestDetails || "",
          status: "PENDING",
        },
      ])
      .select()
      .single();

    if (dbError) {
      console.error("Supabase insert error:", dbError);
      throw new Error(`Lỗi lưu cơ sở dữ liệu: ${dbError.message}`);
    }

    // 2. Prepare nodemailer transporter
    const smtpHost = process.env.SMTP_HOST;
    const smtpPortStr = process.env.SMTP_PORT || "465";
    const smtpUser = process.env.SMTP_USER;
    const smtpPassRaw = process.env.SMTP_PASS || "";
    const adminEmail = process.env.ADMIN_EMAIL;

    // Clean space from Gmail app passwords if any
    const smtpPass = smtpPassRaw.replace(/\s+/g, "");

    if (!smtpHost || !smtpUser || !smtpPass || !adminEmail) {
      console.warn("SMTP credentials or ADMIN_EMAIL is not fully configured in env.");
      // Even if email configuration is missing, we already saved to DB, so we return success but with a warning.
      return NextResponse.json({
        success: true,
        message: "Lưu cơ sở dữ liệu thành công, nhưng cấu hình gửi email chưa hoàn thiện.",
        id: dbData.id,
      });
    }

    const port = parseInt(smtpPortStr, 10);
    const secure = port === 465; // SSL if port is 465

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: port,
      secure: secure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const currentTime = new Date().toLocaleString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
    });

    // 3. Define HTML content for the administrator email
    const mailHtml = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 24px; text-align: center; color: white;">
          <h2 style="margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.5px;">Fis</h2>
          <p style="margin: 4px 0 0 0; font-size: 13px; color: #94a3b8;">Hệ thống thông báo tự động từ Chatbot</p>
        </div>
        
        <div style="padding: 24px; background-color: #ffffff;">
          <h3 style="margin-top: 0; color: #0f172a; font-size: 18px; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px;">
            Yêu cầu hỗ trợ khách hàng mới
          </h3>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 14px; width: 130px; font-weight: 600;">Họ và tên:</td>
              <td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 700;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 14px; font-weight: 600;">Số điện thoại:</td>
              <td style="padding: 8px 0; color: #0088cc; font-size: 14px; font-weight: 700;">
                <a href="tel:${phone}" style="color: #0284c7; text-decoration: none;">${phone}</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 14px; font-weight: 600;">Thời gian:</td>
              <td style="padding: 8px 0; color: #334155; font-size: 14px;">${currentTime} (Giờ Việt Nam)</td>
            </tr>
          </table>
          
          <div style="margin-top: 24px; padding: 16px; background-color: #f8fafc; border-left: 4px solid #0284c7; border-radius: 4px;">
            <p style="margin: 0 0 8px 0; color: #475569; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Nội dung yêu cầu:</p>
            <p style="margin: 0; color: #1e293b; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${requestDetails || "Không có nội dung chi tiết (Khách chỉ gửi thông tin liên hệ)."}</p>
          </div>
          
          <div style="margin-top: 32px; text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin" 
               style="display: inline-block; background-color: #0284c7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; transition: background-color 0.2s;">
              Đi tới trang quản trị
            </a>
          </div>
        </div>
        
        <div style="background-color: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
          Đây là email tự động. Vui lòng không trả lời trực tiếp email này.<br>
          &copy; 2026 Fis. All rights reserved.
        </div>
      </div>
    `;

    // 4. Send the mail
    await transporter.sendMail({
      from: `"Fis Chatbot" <${smtpUser}>`,
      to: adminEmail,
      subject: `[Yêu cầu hỗ trợ] Khách hàng ${name} - SĐT: ${phone}`,
      html: mailHtml,
    });

    return NextResponse.json({
      success: true,
      id: dbData.id,
      message: "Thông tin liên hệ đã được lưu và gửi tới email Quản trị viên.",
    });
  } catch (error: any) {
    console.error("API error at /api/chat/request:", error);
    return NextResponse.json(
      { error: error.message || "Đã xảy ra lỗi hệ thống" },
      { status: 500 }
    );
  }
}
