import { SignJWT, jwtVerify } from "jose";
import { NextRequest } from "next/server";
import type { UserRole } from "@/types/hotel";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-change-in-production"
);

export const COOKIE_NAME = "auth_token";
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export interface JwtPayload {
  sub: string; // user id
  email: string;
  role: UserRole;
  name: string;
}

/** Create a signed JWT token */
export async function signToken(payload: JwtPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

/** Verify and decode a JWT token */
export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}

/** Extract JWT token from a request (cookie or Authorization header) */
export function getTokenFromRequest(request: NextRequest): string | null {
  // Try cookie first
  const cookieToken = request.cookies.get(COOKIE_NAME)?.value;
  if (cookieToken) return cookieToken;

  // Fallback to Authorization header
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  return null;
}
