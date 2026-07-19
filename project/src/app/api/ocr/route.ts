import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";


export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !["ADMIN", "RECEPTIONIST"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const formData = await request.formData();
    const image = formData.get("image") as File;

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // MIME type check
    if (!image.type.startsWith("image/")) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    // Size check (max 5MB)
    if (image.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
    }

    // Chuyển đổi File ảnh sang Base64
    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString("base64");
    const mimeType = image.type;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not defined. Falling back to mock data.");
      // Trả về dữ liệu mock dự phòng nếu chưa cấu hình API Key
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return NextResponse.json({
        full_name: "NGUYEN VAN MOCK (GEMINI FALLBACK MOCK)",
        id_card_number: "001099012345",
        id_card_type: "CCCD",
        nationality: "Vietnam",
        address: "123 Mock Street, Hanoi",
        confidence: 0.95
      });
    }

    // Gọi trực tiếp REST API của Gemini 1.5 Flash (không cần cài thêm SDK)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: "Bạn là một hệ thống AI OCR chuyên nghiệp cho khách sạn. Hãy trích xuất các thông tin sau từ hình ảnh Giấy căn cước công dân (CCCD) Việt Nam hoặc Hộ chiếu (Passport) được cung cấp. Trả về kết quả dưới dạng JSON có cấu trúc chính xác như sau, không định dạng markdown (không bọc trong thẻ ```json), chỉ trả về chuỗi JSON thuần túy:\n" +
                    "{\n" +
                    '  "full_name": "HỌ VÀ TÊN chữ in hoa có dấu (ví dụ: NGUYỄN VĂN A)",\n' +
                    '  "id_card_number": "Số căn cước công dân (12 chữ số) hoặc số hộ chiếu",\n' +
                    '  "id_card_type": "CCCD" hoặc "PASSPORT",\n' +
                    '  "nationality": "Quốc tịch (ví dụ: Việt Nam)",\n' +
                    '  "address": "Địa chỉ nơi thường trú hoặc quê quán ghi trên CCCD (ví dụ: Dịch Vọng, Cầu Giấy, Hà Nội)",\n' +
                    '  "confidence": 0.98\n' +
                    "}"
                },
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: base64Image
                  }
                }
              ]
            }
          ],
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error status:", response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!resultText) {
      throw new Error("Invalid response content from Gemini OCR");
    }

    const parsedResult = JSON.parse(resultText.trim());
    return NextResponse.json(parsedResult);

  } catch (error) {
    console.error("OCR API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
