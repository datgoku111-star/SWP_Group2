import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/auth/login/route";
import { getUserByEmail } from "@/lib/db/users";
import { createAuthCookie } from "@/lib/auth-server";
import bcrypt from "bcryptjs";

// Mock dependencies
vi.mock("@/lib/db/users", () => ({
  getUserByEmail: vi.fn(),
}));

vi.mock("@/lib/auth-server", () => ({
  createAuthCookie: vi.fn(),
}));

describe("Login API Route Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 400 if email or password is missing", async () => {
    const req = new Request("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "test@example.com" }), // Missing password
    });

    const response = await POST(req);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error).toBe("Email and password are required");
  });

  it("should return 401 if user is not found", async () => {
    vi.mocked(getUserByEmail).mockResolvedValue(null);

    const req = new Request("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "notfound@example.com", password: "somepassword" }),
    });

    const response = await POST(req);
    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body.error).toBe("Invalid email or password");
  });

  it("should return 401 if password does not match", async () => {
    const fakePasswordHash = await bcrypt.hash("correct-password", 12);
    vi.mocked(getUserByEmail).mockResolvedValue({
      id: "user-123",
      email: "test@example.com",
      password_hash: fakePasswordHash,
      full_name: "Test User",
      role: "CUSTOMER",
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as any);

    const req = new Request("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "test@example.com", password: "wrong-password" }),
    });

    const response = await POST(req);
    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body.error).toBe("Invalid email or password");
  });

  it("should return 403 if user account is disabled", async () => {
    const password = "correct-password";
    const fakePasswordHash = await bcrypt.hash(password, 12);
    vi.mocked(getUserByEmail).mockResolvedValue({
      id: "user-123",
      email: "test@example.com",
      password_hash: fakePasswordHash,
      full_name: "Test User",
      role: "CUSTOMER",
      is_active: false, // Disabled
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as any);

    const req = new Request("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "test@example.com", password }),
    });

    const response = await POST(req);
    expect(response.status).toBe(403);

    const body = await response.json();
    expect(body.error).toBe("Account is disabled");
  });

  it("should return 200 and set auth cookie if login is successful", async () => {
    const password = "correct-password";
    const fakePasswordHash = await bcrypt.hash(password, 12);
    const mockUser = {
      id: "user-123",
      email: "test@example.com",
      password_hash: fakePasswordHash,
      full_name: "Test User",
      role: "CUSTOMER",
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    vi.mocked(getUserByEmail).mockResolvedValue(mockUser as any);

    const req = new Request("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "test@example.com", password }),
    });

    const response = await POST(req);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.message).toBe("Login successful");
    expect(body.user.email).toBe("test@example.com");
    expect(body.user.password_hash).toBeUndefined(); // Safe user, password hash removed

    expect(createAuthCookie).toHaveBeenCalled();
  });
});
