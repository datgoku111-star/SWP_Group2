const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
const { PayOS } = require("@payos/node");
const nodemailer = require("nodemailer");
require("dotenv").config({ path: "../.env.local" }); // Load project's env variables

async function sendInvoiceEmail(bookingId, roomName, amount) {
  try {
    let transporter;
    if (process.env.SMTP_HOST) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
    } else {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email", port: 587, secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
    }
    const info = await transporter.sendMail({
      from: '"HSRM System" <no-reply@hsrm.local>',
      to: process.env.RECEPTIONIST_EMAIL || "reception@hsrm.local",
      subject: `[HSRM] Invoice & Confirmation for Booking ${bookingId}`,
      html: `<h2>New Booking Confirmed!</h2><p>Booking ID: ${bookingId}</p><p>Room: ${roomName}</p><p>Amount Paid: ${amount} VND</p><p>Please prepare the room for the upcoming check-in.</p>`,
    });
    console.log("Invoice email sent to receptionist: %s", info.messageId);
    if (!process.env.SMTP_HOST) console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  } catch (err) {
    console.error("Failed to send invoice email:", err);
  }
}

const app = express();
app.use(cors());
app.use(express.json());

// Initialize PayOS SDK
const payOS = new PayOS(
  process.env.PAYOS_CLIENT_ID || "",
  process.env.PAYOS_API_KEY || "",
  process.env.PAYOS_CHECKSUM_KEY || ""
);

// Initialize Supabase Client (using service role key for admin privileges)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://rufagrsdrbnjjomhfzei.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// In-memory mapping to link numeric orderCode with bookingId and roomName
// (In production, you would store this in a database table or cache like Redis)
const orderMap = new Map();

// API 1: Create payment link
app.post("/api/payment/create-embedded-link", async (req, res) => {
  try {
    const { bookingId, roomName, totalPrice } = req.body;

    if (!bookingId || !roomName || !totalPrice) {
      return res.status(400).json({ error: "Missing bookingId, roomName, or totalPrice" });
    }

    // Generate a unique 6-digit to 10-digit numeric orderCode
    const orderCode = Math.floor(100000 + Math.random() * 900000);

    // Save mapping in memory
    orderMap.set(orderCode, { bookingId, roomName });

    // Store pending payment in payments table
    const { error: paymentError } = await supabase
      .from("payments")
      .insert({
        booking_id: bookingId,
        amount: totalPrice,
        method: "TRANSFER",
        status: "PENDING",
        transaction_ref: orderCode.toString(),
      });

    if (paymentError) {
      console.error("Error creating pending payment in Supabase:", paymentError);
    }

    // Call PayOS SDK
    const domain = process.env.FRONTEND_URL || "http://localhost:3000";
    const amountInVnd = Math.round(Number(totalPrice) * 23000); // Convert USD to VND (e.g. 1 USD = 23,000 VND)

    const paymentLinkData = {
      orderCode,
      amount: amountInVnd,
      description: `Pay ${roomName.slice(0, 15)}`.replace(/[^a-zA-Z0-9 ]/g, ""), // Keep descriptive letters & numbers
      returnUrl: `${domain}/pay-done?bookingId=${bookingId}&status=success`,
      cancelUrl: `${domain}/checkout?bookingId=${bookingId}&status=cancel`,
    };

    const paymentLink = await payOS.createPaymentLink(paymentLinkData);

    return res.status(200).json({
      orderCode,
      checkoutUrl: paymentLink.checkoutUrl,
      qrCode: paymentLink.qrCode || `https://api.vietqr.io/image/970418-00123456789-Q4zS9vP.jpg?accountName=HOTEL&amount=${amountInVnd}&addInfo=${paymentLinkData.description}`,
      amount: amountInVnd,
      description: paymentLinkData.description,
    });
  } catch (error) {
    console.error("Create payment link failed:", error);
    return res.status(500).json({ error: error.message || "Failed to create payment link" });
  }
});

// API 2: Webhook callback
app.post("/api/payment/webhook", async (req, res) => {
  try {
    // Verify Webhook signature
    const webhookData = payOS.verifyPaymentWebhookData(req.body);
    console.log("PayOS Webhook received and verified:", webhookData);

    const { orderCode } = webhookData;

    // Find booking mapping
    const mapping = orderMap.get(orderCode);
    let bookingId = mapping?.bookingId;
    let roomName = mapping?.roomName;

    // If not in memory (e.g. server restarted), look it up in Supabase payments table
    if (!bookingId) {
      const { data: payment } = await supabase
        .from("payments")
        .select("booking_id")
        .eq("transaction_ref", orderCode.toString())
        .single();
      
      if (payment) {
        bookingId = payment.booking_id;
        // Look up booking to get room details
        const { data: booking } = await supabase
          .from("bookings")
          .select("*, room:rooms(*)")
          .eq("id", bookingId)
          .single();
        if (booking) {
          // Fetch room type name
          const { data: roomType } = await supabase
            .from("room_types")
            .select("name")
            .eq("id", booking.room.room_type_id)
            .single();
          roomName = roomType?.name;
        }
      }
    }

    if (bookingId) {
      console.log(`Processing successful payment for booking: ${bookingId}`);

      // Update payment status in Supabase to COMPLETED
      await supabase
        .from("payments")
        .update({ status: "COMPLETED" })
        .eq("transaction_ref", orderCode.toString());

      // Update booking status to CONFIRMED
      await supabase
        .from("bookings")
        .update({ status: "CONFIRMED", updated_at: new Date().toISOString() })
        .eq("id", bookingId);

      // Decrement available rooms in hotel_rooms matching roomName
      if (roomName) {
        const { data: hotelRoom } = await supabase
          .from("hotel_rooms")
          .select("id, available_rooms")
          .eq("title", roomName)
          .single();

        if (hotelRoom && hotelRoom.available_rooms > 0) {
          await supabase
            .from("hotel_rooms")
            .update({ available_rooms: hotelRoom.available_rooms - 1 })
            .eq("id", hotelRoom.id);
          console.log(`Updated hotel_rooms available count for ${roomName}`);
        }
      }

      // Clean up mapping
      orderMap.delete(orderCode);

      // Trigger Email to Receptionist
      // Fetch the actual amount from payments if needed or just pass a generic text
      let amountPaid = "the required amount";
      const { data: paymentInfo } = await supabase
        .from("payments")
        .select("amount")
        .eq("transaction_ref", orderCode.toString())
        .single();
      if (paymentInfo) {
        amountPaid = paymentInfo.amount;
      }
      await sendInvoiceEmail(bookingId, roomName || "Unknown Room", amountPaid);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Webhook verification failed:", error);
    return res.status(400).send("Invalid signature");
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`PayOS Backend running on port ${PORT}`));
