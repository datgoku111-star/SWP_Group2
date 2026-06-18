import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { signToken } from "@/lib/auth";
import { createAuthCookie, clearAuthCookie } from "@/lib/auth-server";

export async function POST(request: Request) {
  try {
    const { session } = await request.json();

    if (!session || !session.user) {
      // Clear cookie if no session exists
      await clearAuthCookie();
      return NextResponse.json({ message: "Session cleared" });
    }

    const sbUser = session.user;

    // 1. Check if user exists in public.users table
    const { data: existingUser, error: findError } = await supabaseServer
      .from("users")
      .select("*")
      .eq("id", sbUser.id)
      .maybeSingle();

    let dbUser = existingUser;

    if (!dbUser) {
      // Create user in public.users using the same UUID
      const { data: newUser, error: insertError } = await supabaseServer
        .from("users")
        .insert({
          id: sbUser.id,
          email: sbUser.email.toLowerCase(),
          full_name: sbUser.user_metadata?.full_name || sbUser.email.split("@")[0],
          phone: sbUser.user_metadata?.phone || "",
          role: sbUser.user_metadata?.role || "CUSTOMER",
          is_active: true,
          password_hash: "SUPABASE_AUTH",
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error syncing user to public.users:", insertError);
        return NextResponse.json(
          { error: "Failed to sync user database record" },
          { status: 500 }
        );
      }
      dbUser = newUser;
    }

    // 2. Generate signed JWT token
    const token = await signToken({
      sub: dbUser.id,
      email: dbUser.email,
      role: dbUser.role,
      name: dbUser.full_name,
    });

    // 3. Set the HTTP-only cookie
    await createAuthCookie(token);

    return NextResponse.json({
      message: "Session synced successfully",
      user: dbUser,
    });
  } catch (error) {
    console.error("Session sync error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
