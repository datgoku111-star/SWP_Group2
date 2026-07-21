import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getUserByEmail } from "@/lib/db/users";
import { signToken } from "@/lib/auth";
import { createAuthCookie } from "@/lib/auth-server";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await getUserByEmail(email);

    // Use dummy hash to prevent timing attacks if user not found
    const dummyHash = "$2a$12$LJ3MFgFJJgSx1YhSKS1SXOzFvOQHkUMQcJqnhuS2q5fZpbpVMwKi6";
    const hashToCompare = user ? user.password_hash : dummyHash;

    const isValid = await bcrypt.compare(password, hashToCompare);

    if (!user || !isValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (!user.is_active) {
      return NextResponse.json(
        { error: "Account is disabled" },
        { status: 403 }
      );
    }

    // Create JWT
    const token = await signToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.full_name,
    });

    // Set HTTP-only cookie
    await createAuthCookie(token);

    // Return user info (without password hash)
    const { password_hash, ...safeUser } = user;

    return NextResponse.json({
      message: "Login successful",
      user: safeUser,
    });
  } catch (error: any) {
    console.error("Login error:", error);
    const errMsg = error?.message || "";
    if (errMsg.includes("ENOTFOUND") || errMsg.includes("fetch failed") || errMsg.includes("fetch")) {
      return NextResponse.json(
        { error: "Không thể kết nối đến cơ sở dữ liệu Supabase. Dự án Supabase có thể đã bị tạm dừng (Paused do không hoạt động) hoặc bị cấu hình sai URL trong .env.local. Vui lòng đăng nhập Supabase Dashboard để kích hoạt lại dự án." },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
