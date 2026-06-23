const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
const PayOS = require("@payos/node");
require("dotenv").config({ path: "../.env.local" }); // Load project's env variables

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
{/*app.post("/api/payment/create-embedded-link", async (req, res) => {
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
});*/}

app.post("/api/payment/create-embedded-link", async (req, res) => {
  try {
    const { bookingId, serviceOrderId, type, roomName, totalPrice } = req.body;
    if (!bookingId || !roomName || !totalPrice) {
      return res.status(400).json({ error: "Missing bookingId, roomName, or totalPrice" });
    }
    const orderCode = Math.floor(100000 + Math.random() * 900000);
    // Lưu mapping thanh toán dịch vụ hoặc đặt phòng
    orderMap.set(orderCode, { bookingId, serviceOrderId, type: type || "room", roomName });
    // Tạo thanh toán PENDING trong database
    const transactionRef = type === "service" ? `${orderCode}_service_${serviceOrderId}` : orderCode.toString();
    const { error: paymentError } = await supabase
      .from("payments")
      .insert({
        booking_id: bookingId,
        amount: totalPrice,
        method: "TRANSFER",
        status: "PENDING",
        transaction_ref: transactionRef,
      });
    if (paymentError) {
      console.error("Error creating pending payment in Supabase:", paymentError);
    }
    const domain = process.env.FRONTEND_URL || "http://localhost:3000";
    const amountInVnd = type === "service" ? Math.round(Number(totalPrice)) : Math.round(Number(totalPrice) * 26320);
    const paymentLinkData = {
      orderCode,
      amount: amountInVnd,
      description: `Pay ${roomName.slice(0, 15)}`.replace(/[^a-zA-Z0-9 ]/g, ""),
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

{/* tay them */}

// API 2: Webhook callback
{/*app.post("/api/payment/webhook", async (req, res) => {
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
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Webhook verification failed:", error);
    return res.status(400).send("Invalid signature");
  }
});*/}

app.post("/api/payment/webhook", async (req, res) => {
  try {
    const webhookData = payOS.verifyPaymentWebhookData(req.body);
    console.log("PayOS Webhook received and verified:", webhookData);
    const { orderCode } = webhookData;
    
    let type = "room";
    let serviceOrderId = "";
    let bookingId = "";
    let roomName = "";
    
    const mapping = orderMap.get(orderCode);
    if (mapping) {
      type = mapping.type;
      serviceOrderId = mapping.serviceOrderId;
      bookingId = mapping.bookingId;
      roomName = mapping.roomName;
    } else {
      // Lookup the payment from DB
      const { data: payment } = await supabase
        .from("payments")
        .select("*")
        .like("transaction_ref", `${orderCode}%`)
        .single();
        
      if (payment) {
        bookingId = payment.booking_id;
        const refStr = payment.transaction_ref;
        if (refStr.includes("_service_")) {
          type = "service";
          serviceOrderId = refStr.split("_service_")[1];
        }
      }
    }

    if (bookingId) {
      // 1. Cập nhật bảng payments thành COMPLETED
      await supabase
        .from("payments")
        .update({ status: "COMPLETED" })
        .like("transaction_ref", `${orderCode}%`);

      if (type === "service" && serviceOrderId) {
        console.log(`Processing successful payment for food order: ${serviceOrderId}`);
        // 2a. Nếu là dịch vụ: chuyển trạng thái dịch vụ sang IN_PROGRESS (để bếp làm món)
        await supabase
          .from("service_orders")
          .update({ status: "IN_PROGRESS" })
          .eq("id", serviceOrderId);
      } else {
        console.log(`Processing successful payment for room booking: ${bookingId}`);
        // 2b. Nếu là đặt phòng: cập nhật booking thành CONFIRMED
        await supabase
          .from("bookings")
          .update({ status: "CONFIRMED", updated_at: new Date().toISOString() })
          .eq("id", bookingId);
        
        // Find roomName if not available (lost from memory mapping)
        let targetRoomName = roomName;
        if (!targetRoomName) {
          const { data: bookingData } = await supabase
            .from("bookings")
            .select("*, room:rooms(*, room_type:room_types(*))")
            .eq("id", bookingId)
            .single();
          if (bookingData && bookingData.room && bookingData.room.room_type) {
            targetRoomName = bookingData.room.room_type.name;
          }
        }

        if (targetRoomName) {
          const { data: hotelRoom } = await supabase
            .from("hotel_rooms")
            .select("id, available_rooms")
            .eq("title", targetRoomName)
            .single();
          if (hotelRoom && hotelRoom.available_rooms > 0) {
            await supabase
              .from("hotel_rooms")
              .update({ available_rooms: hotelRoom.available_rooms - 1 })
              .eq("id", hotelRoom.id);
            console.log(`Updated hotel_rooms count for ${targetRoomName}`);
          }
        }
      }
      orderMap.delete(orderCode);
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Webhook verification failed:", error);
    return res.status(400).send("Invalid signature");
  }
});

{/* tay them */}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`PayOS Backend running on port ${PORT}`));
