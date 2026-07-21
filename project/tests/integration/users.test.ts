import { describe, it, expect, vi, beforeEach } from "vitest";
import { getUserByEmail, createUser } from "@/lib/db/users";
import { supabaseServer } from "@/lib/supabase";

// Mock supabaseServer
vi.mock("@/lib/supabase", () => {
  const mockSingle = vi.fn();
  
  const builder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: mockSingle,
  };

  return {
    supabaseServer: {
      from: vi.fn(() => builder),
    },
  };
});

describe("Users DB Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getUserByEmail", () => {
    it("should return user details on successful fetch", async () => {
      const mockUser = { id: "123", email: "test@example.com", full_name: "Test User" };
      
      const builder = supabaseServer.from("users");
      (builder.single as any).mockResolvedValue({ data: mockUser, error: null });

      const result = await getUserByEmail("test@example.com");
      expect(result).toEqual(mockUser);
      expect(supabaseServer.from).toHaveBeenCalledWith("users");
      expect(builder.select).toHaveBeenCalledWith("*");
      expect(builder.eq).toHaveBeenCalledWith("email", "test@example.com");
    });

    it("should return null if user is not found or error occurs", async () => {
      const builder = supabaseServer.from("users");
      (builder.single as any).mockResolvedValue({ data: null, error: { message: "Not found" } });

      const result = await getUserByEmail("notfound@example.com");
      expect(result).toBeNull();
    });
  });

  describe("createUser", () => {
    it("should hash password and insert user into the database", async () => {
      const newUserInput = {
        email: "new@example.com",
        password: "securepassword",
        full_name: "New User",
      };
      
      const mockCreatedUser = {
        id: "456",
        email: "new@example.com",
        full_name: "New User",
        role: "CUSTOMER",
      };

      const builder = supabaseServer.from("users");
      (builder.single as any).mockResolvedValue({ data: mockCreatedUser, error: null });

      const result = await createUser(newUserInput);
      expect(result).toEqual(mockCreatedUser);
      expect(builder.insert).toHaveBeenCalled();
    });
  });
});
