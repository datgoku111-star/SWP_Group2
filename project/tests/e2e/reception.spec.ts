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

test.describe("Reception Flow E2E Tests", () => {
  test("should load the receptionist console when authenticated as RECEPTIONIST", async ({ page, context }) => {
    // Dynamically import signToken so it evaluates AFTER process.env.JWT_SECRET is set
    const { signToken } = await import("../../src/lib/auth");

    // Generate signed JWT token for Receptionist
    const token = await signToken({
      sub: "receptionist-123",
      email: "receptionist@example.com",
      role: "RECEPTIONIST",
      name: "Receptionist User",
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
            id: "receptionist-123",
            email: "receptionist@example.com",
            role: "RECEPTIONIST",
            full_name: "Receptionist User",
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
            id: "receptionist-123",
            email: "receptionist@example.com",
            role: "RECEPTIONIST",
            full_name: "Receptionist User",
            is_active: true,
          },
        },
      });
    });

    // Mock receptionist stats API
    await page.route("**/api/receptionist/dashboard", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        json: {
          stats: { todayCheckIns: 5, todayCheckOuts: 3, occupancyRate: 75 },
          arrivals: [],
          departures: [],
          roomsSummary: { AVAILABLE: 10, IN_USE: 5, DIRTY: 2, MAINTENANCE: 1, total: 18 },
        },
      });
    });

    // Mock rooms list API
    await page.route("**/api/rooms?all=true", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        json: [],
      });
    });

    // Navigate to receptionist console using localhost
    await page.goto("http://localhost:3000/dashboard/receptionist");
    await page.waitForLoadState("networkidle");

    // Assert main title is visible
    const mainHeader = page.locator("h1");
    await expect(mainHeader).toContainText("Receptionist Console");

    // Assert action buttons are visible
    const refreshBtn = page.locator("text=Refresh Live Data").first();
    await expect(refreshBtn).toBeVisible();

    const deskLink = page.locator("text=Check-In / Check-Out Desk").first();
    await expect(deskLink).toBeVisible();
  });
});
