const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
const { PayOS } = require("@payos/node");
require("dotenv").config({ path: "../.env.local" }); // Load project's env variables
const http = require("http");

function triggerNextJsEmail(emailData) {
  const domain = process.env.FRONTEND_URL || "http://localhost:3000";
  const url = new URL(`${domain}/api/mail/send-experience-confirmation`);
  
  const postData = JSON.stringify(emailData);
  
  const options = {
    hostname: url.hostname,
    port: url.port || 80,
    path: url.pathname,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(postData),
    },
  };

  const req = http.request(options, (res) => {
    console.log(`Email trigger status: ${res.statusCode}`);
  });

  req.on("error", (e) => {
    console.error(`Problem with email trigger request: ${e.message}`);
  });

  req.write(postData);
  req.end();
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

      // Check if this is an experience booking and trigger confirmation email
      try {
        const { data: bookingData } = await supabase
          .from("bookings")
          .select("*")
          .eq("id", bookingId)
          .single();

        if (bookingData && bookingData.special_requests) {
          const meta = JSON.parse(bookingData.special_requests);
          if (meta && meta.isExperience) {
            const { data: userData } = await supabase
              .from("users")
              .select("email, full_name")
              .eq("id", bookingData.user_id)
              .single();

            if (userData && userData.email) {
              console.log(`Triggering email for experience booking: ${meta.title} to ${userData.email}`);
              triggerNextJsEmail({
                email: userData.email,
                customerName: userData.full_name || "Customer",
                title: meta.title,
                checkInDate: bookingData.check_in_date,
                checkOutDate: bookingData.check_out_date,
              });
            }
          }
        }
      } catch (err) {
        console.error("Error in webhook experience email trigger:", err.message);
      }

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
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Webhook verification failed:", error);
    return res.status(400).send("Invalid signature");
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`PayOS Backend running on port ${PORT}`));
