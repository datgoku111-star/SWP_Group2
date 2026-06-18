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

    // TODO: Actually integrate with Google Cloud Vision API or AWS Textract here
    // For now, we return a mock successful OCR result after a 2-second delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    return NextResponse.json({
      full_name: "NGUYEN VAN MOCK",
      id_card_number: "001099012345",
      id_card_type: "CCCD",
      nationality: "Vietnam",
      address: "123 Mock Street, Hanoi",
      confidence: 0.95
    });

  } catch (error) {
    console.error("OCR API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
