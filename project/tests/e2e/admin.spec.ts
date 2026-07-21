import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

// Load JWT_SECRET from .env.local to match Next.js server verification secret
try {
  const envPath = path.resolve(__dirname, "../../.env.local");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    const match = envContent.match(/^JWT_SECRET\s*=\s*(.+)$/m);
    if (match && match[1]) {
      process.env.JWT_SECRET = match[1].trim();
    }
  }
} catch (e) {
  console.error("Failed to load JWT_SECRET from .env.local in E2E test", e);
}

test.describe("Admin Flow E2E Tests", () => {
  test("should load the admin dashboard and render key stats when authenticated as ADMIN", async ({ page, context }) => {
    // Dynamically import signToken so it evaluates AFTER process.env.JWT_SECRET is set
    const { signToken } = await import("../../src/lib/auth");

    // Generate signed JWT token for Admin
    const token = await signToken({
      sub: "admin-123",
      email: "admin@example.com",
      role: "ADMIN",
      name: "Admin User",
    });

    // Navigate to public page first to set active origin in the browser
    await page.goto("http://localhost:3000/login");

    // Inject token cookie
    await context.addCookies([
      {
        name: "auth_token",
        value: token,
        domain: "localhost",
        path: "/",
      },
    ]);

    // Mock client-side session authentication API
    await page.route("**/api/auth/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        json: {
          user: {
            id: "admin-123",
            email: "admin@example.com",
            role: "ADMIN",
            full_name: "Admin User",
            is_active: true,
          },
        },
      });
    });

    // Mock Next.js Supabase session sync API to prevent cookie deletion
    await page.route("**/api/auth/session", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        json: {
          message: "Session synced successfully",
          user: {
            id: "admin-123",
            email: "admin@example.com",
            role: "ADMIN",
            full_name: "Admin User",
            is_active: true,
          },
        },
      });
    });

    // Mock dashboard API response
    await page.route("**/api/admin/dashboard-stats", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        json: {
          stats: { totalUsers: 1337, totalRevenue: 987654321, activeBookings: 42 },
          monthlySignups: [],
          monthlyRevenue: [],
          roleDistribution: [],
          preferredRooms: [],
        },
      });
    });

    // Navigate to admin dashboard using localhost
    await page.goto("http://localhost:3000/admin/dashboard");
    await page.waitForLoadState("networkidle");

    // Assert main header text is visible
    const mainHeader = page.locator("h1");
    await expect(mainHeader).toContainText("Báo cáo khách hàng");

    // Assert stats card for total users is visible and contains correct value
    const totalUsersVal = page.locator("text=1337");
    await expect(totalUsersVal).toBeVisible();

    // Assert stats card for total revenue is visible
    const totalRevenueVal = page.locator("text=987.654.321");
    await expect(totalRevenueVal).toBeVisible();
  });
});
