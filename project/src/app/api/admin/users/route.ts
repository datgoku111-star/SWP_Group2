import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import bcrypt from "bcryptjs";

// GET: Fetch all users
export async function GET() {
  try {
    const { data: users, error } = await supabaseServer
      .from("users")
      .select("id, email, full_name, phone, role, is_active, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error("GET admin users error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch users" }, { status: 500 });
  }
}

// POST: Create a new user (with password hashing)
export async function POST(request: Request) {
  try {
    const { email, password, full_name, phone, role, is_active } = await request.json();

    if (!email || !password || !full_name) {
      return NextResponse.json({ error: "Thiếu thông tin bắt buộc (email, mật khẩu, tên)." }, { status: 400 });
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 12);

    const { data: newUser, error } = await supabaseServer
      .from("users")
      .insert({
        email: email.toLowerCase(),
        password_hash: passwordHash,
        full_name,
        phone: phone || "",
        role: role || "CUSTOMER",
        is_active: is_active ?? true
      })
      .select("id, email, full_name, phone, role, is_active, created_at")
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Email này đã được đăng ký sử dụng." }, { status: 400 });
      }
      throw error;
    }

    return NextResponse.json({ message: "Tạo người dùng thành công", user: newUser });
  } catch (error: any) {
    console.error("POST admin users error:", error);
    return NextResponse.json({ error: error.message || "Failed to create user" }, { status: 500 });
  }
}

// PUT: Update an existing user
export async function PUT(request: Request) {
  try {
    const { id, email, password, full_name, phone, role, is_active } = await request.json();

    if (!id || !email || !full_name) {
      return NextResponse.json({ error: "Thiếu thông tin chỉnh sửa." }, { status: 400 });
    }

    const updates: any = {
      email: email.toLowerCase(),
      full_name,
      phone: phone || "",
      role: role || "CUSTOMER",
      is_active: is_active ?? true,
      updated_at: new Date().toISOString()
    };

    // If password is provided, hash and update it
    if (password && password.trim() !== "") {
      updates.password_hash = await bcrypt.hash(password, 12);
    }

    const { data: updatedUser, error } = await supabaseServer
      .from("users")
      .update(updates)
      .eq("id", id)
      .select("id, email, full_name, phone, role, is_active, created_at")
      .single();

    if (error) throw error;

    return NextResponse.json({ message: "Cập nhật người dùng thành công", user: updatedUser });
  } catch (error: any) {
    console.error("PUT admin users error:", error);
    return NextResponse.json({ error: error.message || "Failed to update user" }, { status: 500 });
  }
}

// DELETE: Delete a user
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Thiếu ID người dùng cần xóa." }, { status: 400 });
    }

    const { error } = await supabaseServer
      .from("users")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ message: "Xóa người dùng thành công" });
  } catch (error: any) {
    console.error("DELETE admin users error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete user" }, { status: 500 });
  }
}
