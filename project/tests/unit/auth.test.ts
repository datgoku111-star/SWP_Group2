import { describe, it, expect, vi } from "vitest";
import { signToken, verifyToken, getTokenFromRequest, JwtPayload } from "@/lib/auth";
import type { NextRequest } from "next/server";

describe("Auth Helpers Unit Tests", () => {
  const testPayload: JwtPayload = {
    sub: "user-123",
    email: "test@example.com",
    role: "CUSTOMER",
    name: "Test User",
  };

  describe("signToken and verifyToken", () => {
    it("should successfully sign and verify a JWT token", async () => {
      const token = await signToken(testPayload);
      expect(token).toBeTypeOf("string");

      const decoded = await verifyToken(token);
      expect(decoded).not.toBeNull();
      expect(decoded?.sub).toBe(testPayload.sub);
      expect(decoded?.email).toBe(testPayload.email);
      expect(decoded?.role).toBe(testPayload.role);
      expect(decoded?.name).toBe(testPayload.name);
    });

    it("should return null for an invalid token", async () => {
      const decoded = await verifyToken("invalid.token.here");
      expect(decoded).toBeNull();
    });
  });

  describe("getTokenFromRequest", () => {
    it("should extract token from cookies first", () => {
      const mockRequest = {
        cookies: {
          get: vi.fn((name) => {
            if (name === "auth_token") {
              return { value: "cookie-jwt-token" };
            }
            return undefined;
          }),
        },
        headers: {
          get: vi.fn(),
        },
      } as unknown as NextRequest;

      const token = getTokenFromRequest(mockRequest);
      expect(token).toBe("cookie-jwt-token");
      expect(mockRequest.cookies.get).toHaveBeenCalledWith("auth_token");
    });

    it("should fall back to Authorization Bearer header if cookie is missing", () => {
      const mockRequest = {
        cookies: {
          get: vi.fn().mockReturnValue(undefined),
        },
        headers: {
          get: vi.fn((name) => {
            if (name.toLowerCase() === "authorization") {
              return "Bearer header-jwt-token";
            }
            return null;
          }),
        },
      } as unknown as NextRequest;

      const token = getTokenFromRequest(mockRequest);
      expect(token).toBe("header-jwt-token");
      expect(mockRequest.headers.get).toHaveBeenCalledWith("authorization");
    });

    it("should return null if token is not found in cookies or headers", () => {
      const mockRequest = {
        cookies: {
          get: vi.fn().mockReturnValue(undefined),
        },
        headers: {
          get: vi.fn().mockReturnValue(null),
        },
      } as unknown as NextRequest;

      const token = getTokenFromRequest(mockRequest);
      expect(token).toBeNull();
    });
  });
});
