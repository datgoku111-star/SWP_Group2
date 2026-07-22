import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { orderCode: string } }
) {
  try {
    const { orderCode } = params;
    
    if (!orderCode) {
      return NextResponse.json({ error: "Missing orderCode" }, { status: 400 });
    }

    const clientId = process.env.PAYOS_CLIENT_ID;
    const apiKey = process.env.PAYOS_API_KEY;

    if (!clientId || !apiKey) {
      return NextResponse.json({ error: "PayOS credentials not configured" }, { status: 500 });
    }

    const res = await fetch(`https://api-merchant.payos.vn/v2/payment-requests/${orderCode}`, {
      method: "GET",
      headers: {
        "x-client-id": clientId,
        "x-api-key": apiKey
      }
    });

    const data = await res.json();
    
    if (data.code !== "00") {
      return NextResponse.json({ error: data.desc || "Failed to check payment status" }, { status: 400 });
    }

    return NextResponse.json({
      status: data.data.status,
      amountPaid: data.data.amountPaid
    });

  } catch (error) {
    console.error("PayOS status check error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
