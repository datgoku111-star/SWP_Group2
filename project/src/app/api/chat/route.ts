import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `
Bạn là một trợ lý ảo thông minh, thân thiện và chuyên nghiệp của khách sạn "Fis". 
Nhiệm vụ của bạn là hỗ trợ khách hàng giải đáp thắc mắc dựa trên thông tin chính thức được cung cấp dưới đây.

--- THÔNG TIN KHÁCH SẠN ---
1. Giờ nhận/trả phòng: Check-in sau 14:00, Check-out trước 12:00 trưa.
2. Giá phòng: 
   - Phòng Standard (1 giường đôi): 600.000đ/đêm.
   - Phòng Deluxe (Hướng biển, 1 giường lớn): 1.200.000đ/đêm.
   - Phòng Suite (Cao cấp, phòng khách riêng): 2.500.000đ/đêm.
3. Tiện ích: Miễn phí bữa sáng buffet từ 6:30 - 9:30, bể bơi vô cực tầng thượng mở cửa đến 22:00. Khách sạn có chỗ đỗ xe ô tô miễn phí.
4. Wifi: Tên mạng "Grand_Ocean_Guest", mật khẩu: "welcome2026".
5. Chính sách hủy phòng: Hoàn tiền 100% nếu hủy trước 48 giờ so với ngày check-in.

--- NGUYÊN TẮC HOẠT ĐỘNG ---
- Chỉ trả lời các thông tin dựa trên dữ liệu trên. Nếu khách hỏi thông tin không có sẵn (ví dụ: "khách sạn còn phòng trống tối nay không?"), hãy trả lời rằng bạn không thể kiểm tra trực tiếp trạng thái phòng theo thời gian thực và gợi ý họ kết nối với CSKH.
- NGÔN NGỮ: Sử dụng tiếng Việt lịch sự, xưng hô "Dạ, em chào anh/chị" và kết thúc bằng "ạ".

--- ĐIỀU KIỆN KÍCH HOẠT CSKH (QUAN TRỌNG) ---
Bạn phải đặt giá trị triggerForm: true khi và chỉ khi xảy ra một trong các trường hợp sau:
1. Khách hàng chủ động yêu cầu: "gặp nhân viên", "nói chuyện với người thật", "gọi CSKH", "cho gặp quản lý", "hotline", v.v.
2. Khách hàng muốn xử lý các tác vụ bạn không có quyền/không có dữ liệu: "đặt phòng ngay", "hủy phòng đã đặt", "xin giảm giá riêng", "kiểm tra phòng trống ngày mai".

--- ĐỊNH DẠNG ĐẦU RA (BẮT BUỘC) ---
Luôn trả về kết quả dưới định dạng JSON nguyên bản, không nằm trong khối markdown (không có \`\`\`json ... \`\`\`), theo cấu trúc sau:
{
  "reply": "Chuỗi văn bản câu trả lời của bạn ở đây",
  "triggerForm": true hoặc false
}
`;

// Local rule-based fallback if GEMINI_API_KEY is not configured
function ruleBasedReply(message: string): { reply: string; triggerForm: boolean } {
  const lowercaseMsg = message.toLowerCase();

  // Check triggerForm conditions
  if (
    lowercaseMsg.includes("nhân viên") ||
    lowercaseMsg.includes("người thật") ||
    lowercaseMsg.includes("quản lý") ||
    lowercaseMsg.includes("cskh") ||
    lowercaseMsg.includes("hotline") ||
    lowercaseMsg.includes("gọi") ||
    lowercaseMsg.includes("đặt phòng") ||
    lowercaseMsg.includes("hủy phòng") ||
    lowercaseMsg.includes("giảm giá") ||
    lowercaseMsg.includes("khuyến mãi") ||
    lowercaseMsg.includes("còn phòng")
  ) {
    return {
      reply: "Dạ, em chào anh/chị. Yêu cầu này nằm ngoài phạm vi hỗ trợ tự động của em. Em xin phép chuyển thông tin này tới bộ phận Chăm sóc khách hàng (CSKH) để hỗ trợ anh/chị trực tiếp ngay lập tức ạ.",
      triggerForm: true,
    };
  }

  // Check standard Q&A
  if (lowercaseMsg.includes("wifi") || lowercaseMsg.includes("mạng")) {
    return {
      reply: "Dạ, em chào anh/chị. Mạng Wifi của khách sạn là \"Grand_Ocean_Guest\" với mật khẩu đăng nhập là \"welcome2026\" ạ.",
      triggerForm: false,
    };
  }

  if (lowercaseMsg.includes("giờ") || lowercaseMsg.includes("nhận phòng") || lowercaseMsg.includes("trả phòng") || lowercaseMsg.includes("checkin") || lowercaseMsg.includes("checkout")) {
    return {
      reply: "Dạ, em chào anh/chị. Thời gian nhận phòng (Check-in) của khách sạn là sau 14:00 và thời gian trả phòng (Check-out) là trước 12:00 trưa ạ.",
      triggerForm: false,
    };
  }

  if (lowercaseMsg.includes("giá phòng") || lowercaseMsg.includes("phòng") || lowercaseMsg.includes("bao nhiêu")) {
    return {
      reply: "Dạ, em chào anh/chị. Hiện khách sạn đang có 3 hạng phòng chính là:\n1. Phòng Standard (1 giường đôi): 600.000đ/đêm.\n2. Phòng Deluxe (Hướng biển, 1 giường lớn): 1.200.000đ/đêm.\n3. Phòng Suite (Cao cấp, phòng khách riêng): 2.500.000đ/đêm ạ.",
      triggerForm: false,
    };
  }

  if (lowercaseMsg.includes("bữa sáng") || lowercaseMsg.includes("buffet") || lowercaseMsg.includes("ăn sáng") || lowercaseMsg.includes("bể bơi") || lowercaseMsg.includes("đỗ xe")) {
    return {
      reply: "Dạ, em chào anh/chị. Khách sạn có miễn phí buffet bữa sáng phục vụ từ 6:30 - 9:30. Bể bơi vô cực trên tầng thượng mở cửa đón khách đến 22:00 hàng ngày. Ngoài ra, khách sạn cũng cung cấp chỗ đỗ xe ô tô hoàn toàn miễn phí ạ.",
      triggerForm: false,
    };
  }

  if (lowercaseMsg.includes("hủy") || lowercaseMsg.includes("trả lại tiền")) {
    return {
      reply: "Dạ, em chào anh/chị. Theo chính sách của khách sạn, anh/chị sẽ được hoàn tiền 100% nếu thực hiện hủy phòng trước 48 giờ so với thời điểm nhận phòng (check-in) ạ.",
      triggerForm: false,
    };
  }

  // Default response
  return {
    reply: "Dạ, em chào anh/chị. Em là trợ lý ảo của Fis. Em có thể hỗ trợ giải đáp các thông tin về giá phòng, giờ check-in/out, tiện ích ăn sáng/bể bơi, thông tin wifi hoặc chính sách hủy phòng của khách sạn ạ. Anh/chị cần em hỗ trợ gì ạ?",
    triggerForm: false,
  };
}

export async function POST(request: Request) {
  try {
    const { message, history = [] } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Fallback to rule-based logic if no API key is provided
      console.warn("GEMINI_API_KEY is not set. Falling back to local rule-based chatbot.");
      const response = ruleBasedReply(message);
      return NextResponse.json(response);
    }

    // Call official Google Gemini API using native fetch
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    // Format chat history for Gemini API
    const formattedContents = [
      ...history.map((h: any) => ({
        role: h.role === "user" ? "user" : "model",
        parts: [{ text: h.text }]
      })),
      {
        role: "user",
        parts: [{ text: message }]
      }
    ];

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: formattedContents,
        systemInstruction: {
          parts: [{ text: SYSTEM_PROMPT }]
        },
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Gemini API Error:", res.status, errorText);
      throw new Error("Failed to communicate with Gemini API");
    }

    const data = await res.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    
    // Parse response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(rawText.trim());
    } catch (parseErr) {
      console.error("Failed to parse Gemini response as JSON:", rawText);
      // Fallback in case JSON parsing fails
      parsedResponse = {
        reply: rawText,
        triggerForm: false
      };
    }

    return NextResponse.json(parsedResponse);
  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
