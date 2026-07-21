import nodemailer from "nodemailer";

// Using a standard test SMTP (Ethereal) for development/demonstration
// In production, configure SMTP settings in environment variables
export async function sendReceptionistInvoiceEmail(bookingId: string, roomName: string, totalPrice: number, balanceDue: number) {
  try {
    // Generate test SMTP service account from ethereal.email if no config provided
    let account = {
      user: process.env.SMTP_USER || "test_user",
      pass: process.env.SMTP_PASS || "test_pass"
    };

    let transporter;
    
    if (process.env.SMTP_HOST) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      // Fallback to Ethereal mock email for safe dev testing
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: testAccount.user, // generated ethereal user
          pass: testAccount.pass, // generated ethereal password
        },
      });
    }

    const htmlContent = `
      <h2>New Booking Confirmed!</h2>
      <p>A new booking has been successfully paid and confirmed.</p>
      <hr/>
      <h3>Booking Details</h3>
      <ul>
        <li><strong>Booking ID:</strong> ${bookingId}</li>
        <li><strong>Room:</strong> ${roomName}</li>
        <li><strong>Total Price:</strong> $${totalPrice.toFixed(2)}</li>
        <li><strong>Balance Due at Check-out:</strong> $${balanceDue.toFixed(2)} (excluding future services)</li>
      </ul>
      <p>Please prepare the room for the upcoming check-in.</p>
      <br/>
      <p><em>HSRM Automated System</em></p>
    `;

    // send mail with defined transport object
    const info = await transporter.sendMail({
      from: '"HSRM System" <no-reply@hsrm.local>', // sender address
      to: process.env.RECEPTIONIST_EMAIL || "reception@hsrm.local", // list of receivers
      subject: `[HSRM] Invoice & Confirmation for Booking ${bookingId}`, // Subject line
      html: htmlContent, // html body
    });

    console.log("Message sent: %s", info.messageId);
    if (!process.env.SMTP_HOST) {
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Failed to send email to receptionist:", error);
    return { success: false, error };
  }
}
