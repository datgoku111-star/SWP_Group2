const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
const PayOS = require("@payos/node");
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
  process.env.PAYOS_CHECKSUM_KEY || "",
);

// Initialize Supabase Client (using service role key for admin privileges)
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://rufagrsdrbnjjomhfzei.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// In-memory mapping to link numeric orderCode with bookingId and roomName
const orderMap = new Map();

// API 1: Create payment link

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

// API 2: Webhook callback tinh diem thuong & cap nhat trang thai
app.post("/api/payment/webhook", async (req, res) => {
  try {
    const webhookData = payOS.verifyPaymentWebhookData(req.body);
    console.log("PayOS Webhook received and verified:", webhookData);
    const { orderCode, amount } = webhookData;
    
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
        
        // --- 🚀 KHU VỰC TÍCH HỢP HỆ THỐNG ĐIỂM LOYALTY THEO SPECS ---
        // Lấy thông tin booking để kiểm tra trạng thái cũ (Chống cộng trùng điểm)
        const { data: currentBooking } = await supabase
          .from("bookings")
          .select("user_id, status")
          .eq("id", bookingId)
          .single();

        // Edge case: Nếu đơn đã được xử lý thành CONFIRMED / CHECKED_OUT từ trước -> Bỏ qua không cộng điểm tiếp
        if (currentBooking && currentBooking.status !== "CONFIRMED" && currentBooking.status !== "CHECKED_OUT") {
          
          // Tính điểm thưởng tự động: 100k VND = 1 điểm
          const pointsToEarn = Math.floor(amount / 100000);

          if (pointsToEarn > 0 && currentBooking.user_id) {
            // Lấy điểm hiện tại của tài khoản khách từ bảng users
            const { data: userProfile } = await supabase
              .from("users")
              .select("loyalty_points")
              .eq("id", currentBooking.user_id)
              .single();

            const currentPoints = userProfile?.loyalty_points || 0;
            const newPoints = currentPoints + pointsToEarn;

            // Cập nhật điểm tích lũy trực tiếp vào bảng users
            await supabase
              .from("users")
              .update({ loyalty_points: newPoints })
              .eq("id", currentBooking.user_id);

            console.log(`[Loyalty Success] Đã cộng tự động +${pointsToEarn} điểm cho khách hàng ID: ${currentBooking.user_id}`);
          }
        }
        // --- 🚀 KẾT THÚC KHU VỰC TÍCH HỢP ĐIỂM LOYALTY ---

        // 2b. Nếu là đặt phòng: cập nhật booking thành CONFIRMED
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`PayOS Backend running on port ${PORT}`));