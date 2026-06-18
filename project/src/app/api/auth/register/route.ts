import { NextResponse } from "next/server";
import { createUser, getUserByEmail } from "@/lib/db/users";
import { signToken } from "@/lib/auth";
import { createAuthCookie } from "@/lib/auth-server";

export async function POST(request: Request) {
  try {
    const { email, password, full_name, phone } = await request.json();

    if (!email || !password || !full_name) {
      return NextResponse.json(
        { error: "Email, password, and full name are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Create user (defaults to CUSTOMER role)
    const user = await createUser({
      email,
      password,
      full_name,
      phone,
      role: "CUSTOMER"
    });

    // Create JWT
    const token = await signToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.full_name,
    });

    // Set HTTP-only cookie
    await createAuthCookie(token);

    return NextResponse.json({
      message: "Registration successful",
      user,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
