import { supabaseServer } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import type { User, SafeUser } from "@/types/hotel";

export async function getUserByEmail(email: string): Promise<User | null> {
  const { data, error } = await supabaseServer
    .from("users")
    .select("*")
    .eq("email", email.toLowerCase())
    .single();
  if (error) {
    if (error.message?.includes("fetch failed") || error.details?.includes("ENOTFOUND")) {
      throw new Error(`Database connection failed: ${error.message}`);
    }
    return null;
  }
  return data as User;
}

export async function getAllUsers(): Promise<SafeUser[]> {
  const { data, error } = await supabaseServer
    .from("users")
    .select("id, email, full_name, phone, role, is_active, created_at, updated_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as SafeUser[];
}

export async function updateUser(
  id: string,
  updates: Partial<Pick<User, "full_name" | "phone" | "role" | "is_active">>
) {
  const { data, error } = await supabaseServer
    .from("users")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id, email, full_name, phone, role, is_active, created_at, updated_at")
    .single();
  if (error) throw error;
  return data as SafeUser;
}

export async function createUser(user: {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  role?: string;
}) {
  const passwordHash = await bcrypt.hash(user.password, 12);
  const { data, error } = await supabaseServer
    .from("users")
    .insert({
      email: user.email.toLowerCase(),
      password_hash: passwordHash,
      full_name: user.full_name,
      phone: user.phone,
      role: user.role || "CUSTOMER",
    })
    .select("id, email, full_name, phone, role, is_active, created_at, updated_at")
    .single();
  if (error) throw error;
  return data as SafeUser;
}

export async function getStaffList() {
  const { data, error } = await supabaseServer
    .from("staffs")
    .select("*, user:users(id, email, full_name, phone, role, is_active)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}
