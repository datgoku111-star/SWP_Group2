import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth-server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get("title");

    let query = supabaseServer
      .from("feedbacks")
      .select("*, user:users(id, email, full_name, role)")
      .order("created_at", { ascending: false });

    if (title) {
      query = query.eq("listing_title", title);
    }

    const { data, error } = await query;

    if (error) {
      if (error.code === "42P01" || error.message.includes("does not exist")) {
        console.warn("feedbacks table does not exist yet. Please run the migration SQL.");
        return NextResponse.json([]);
      }
      throw error;
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("GET feedbacks error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    if (!data.comment || typeof data.rating === "undefined") {
      return NextResponse.json({ error: "Missing comment or rating" }, { status: 400 });
    }

    const { data: feedback, error } = await supabaseServer
      .from("feedbacks")
      .insert({
        user_id: user.sub,
        comment: data.comment,
        rating: Number(data.rating),
        listing_title: data.listing_title || null,
      })
      .select("*, user:users(id, email, full_name, role)")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(feedback, { status: 201 });
  } catch (error: any) {
    console.error("POST feedback error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
