/**
 * auth-server.ts — Server-only auth helpers (Node.js runtime)
 * Imports from next/headers so MUST NOT be used in middleware or client components.
 */
import { cookies } from "next/headers";
import { COOKIE_NAME, COOKIE_MAX_AGE, verifyToken } from "@/lib/auth";
import type { JwtPayload } from "@/lib/auth";

/** Set auth JWT as an HttpOnly cookie */
export async function createAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

/** Clear the auth cookie */
export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
  });
}

/** Get current user from cookies (for use in server components/API routes) */
export async function getCurrentUser(): Promise<JwtPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}
