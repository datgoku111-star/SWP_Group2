import { NextResponse } from "next/server";
import { getAllServices, getServices } from "@/lib/db/services";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || undefined;
    const all = searchParams.get("all") === "true";

    let services;
    if (all) {
      services = await getAllServices();
    } else {
      services = await getServices(category);
    }

    return NextResponse.json(services);
  } catch (error) {
    console.error("GET services error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
