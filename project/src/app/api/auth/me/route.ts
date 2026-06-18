import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { supabaseServer } from "@/lib/supabase";

export async function GET() {
  try {
    const payload = await getCurrentUser();
    
    if (!payload) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Fetch full user details from DB to ensure it's up to date
    const { data: user, error } = await supabaseServer
      .from("users")
      .select("id, email, full_name, phone, role, is_active, created_at, updated_at")
      .eq("id", payload.sub)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Get current user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const payload = await getCurrentUser();
    
    if (!payload) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const updates = await request.json();
    
    // Only allow updating specific fields
    const allowedUpdates = {
      full_name: updates.full_name,
      phone: updates.phone,
    };

    const { data: user, error } = await supabaseServer
      .from("users")
      .update({ ...allowedUpdates, updated_at: new Date().toISOString() })
      .eq("id", payload.sub)
      .select("id, email, full_name, phone, role, is_active, created_at, updated_at")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
