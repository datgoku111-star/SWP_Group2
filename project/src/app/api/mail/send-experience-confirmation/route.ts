import { NextResponse } from "next/server";
import { sendEmail, buildExperienceEmailTemplate } from "@/lib/mail-sender";

export async function POST(request: Request) {
  try {
    const { email, customerName, title, checkInDate, checkOutDate } = await request.json();

    if (!email || !customerName || !title || !checkInDate || !checkOutDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const emailHtml = buildExperienceEmailTemplate({
      customerName,
      experienceTitle: title,
      checkInDate,
      checkOutDate,
    });

    const isSent = await sendEmail({
      to: email,
      subject: `[HSRM Resort] Xác nhận đăng ký trải nghiệm: ${title}`,
      html: emailHtml,
    });

    if (!isSent) {
      // Return 200/202 to avoid breaking client checkout since mailing might be unconfigured or local testing
      return NextResponse.json({ success: false, message: "SMTP mailer not configured or failed to send" }, { status: 202 });
    }

    return NextResponse.json({ success: true, message: "Confirmation email sent successfully" });
  } catch (error) {
    console.error("API send-experience-confirmation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
