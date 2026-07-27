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
      .select("id, email, full_name, phone, role, is_active, created_at, updated_at, loyalty_points")
      .eq("id", payload.sub)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Fetch auth user metadata
    let metadata = {};
    try {
      const { data: { user: authUser } } = await supabaseServer.auth.admin.getUserById(payload.sub);
      if (authUser?.user_metadata) {
        metadata = authUser.user_metadata;
      }
    } catch (e) {
      console.warn("Failed to fetch auth user metadata:", e);
    }

    return NextResponse.json({
      user: {
        ...user,
        gender: (metadata as any).gender || "",
        username: (metadata as any).username || "",
        date_of_birth: (metadata as any).date_of_birth || "",
        address: (metadata as any).address || "",
        about_you: (metadata as any).about_you || "",
      }
    });
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
    
    // 1. Update public.users
    const allowedUpdates = {
      full_name: updates.full_name,
      phone: updates.phone,
    };

    const { data: dbUser, error: dbError } = await supabaseServer
      .from("users")
      .update({ ...allowedUpdates, updated_at: new Date().toISOString() })
      .eq("id", payload.sub)
      .select("id, email, full_name, phone, role, is_active, created_at, updated_at, loyalty_points")
      .single();

    if (dbError) {
      throw dbError;
    }

    // 2. Update auth.users metadata
    let metadata = {};
    try {
      const { data: { user: authUser }, error: authError } = await supabaseServer.auth.admin.updateUserById(
        payload.sub,
        {
          user_metadata: {
            full_name: updates.full_name,
            phone: updates.phone,
            gender: updates.gender,
            username: updates.username,
            date_of_birth: updates.date_of_birth,
            address: updates.address,
            about_you: updates.about_you,
          }
        }
      );
      if (authUser?.user_metadata) {
        metadata = authUser.user_metadata;
      }
    } catch (e) {
      console.warn("Failed to update auth user metadata:", e);
    }

    return NextResponse.json({
      user: {
        ...dbUser,
        gender: (metadata as any).gender || updates.gender || "",
        username: (metadata as any).username || updates.username || "",
        date_of_birth: (metadata as any).date_of_birth || updates.date_of_birth || "",
        address: (metadata as any).address || updates.address || "",
        about_you: (metadata as any).about_you || updates.about_you || "",
      }
    });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
