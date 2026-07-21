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

// Generate valid UUIDs to avoid DB UUID syntax casting errors (code 22P02)
const MOCK_CUSTOMER_ID = "c0a80101-1234-5678-1234-567812345678";
const MOCK_RECEPTIONIST_ID = "r0a80101-1234-5678-1234-567812345678";
const MOCK_ADMIN_ID = "a0a80101-1234-5678-1234-567812345678";

/** Helper to inject cookies and localStorage Supabase session to prevent auth redirections */
async function injectSession(
  page: any,
  context: any,
  role: string,
  userId: string,
  email: string,
  name: string
) {
  const { signToken } = await import("../../src/lib/auth");
  const token = await signToken({
    sub: userId,
    email,
    role,
    name,
  });

  // Navigate to a static page first to establish origin context
  await page.goto("http://localhost:3000/about");

  // Set the server-side HTTP-only auth token cookie
  await context.addCookies([
    {
      name: "auth_token",
      value: token,
      domain: "localhost",
      path: "/",
    },
  ]);

  // Inject Supabase v2 localStorage token structure directly at the root
  await page.evaluate(
    ({ uId, uEmail, uRole, uName, uToken }) => {
      const session = {
        access_token: uToken,
        token_type: "bearer",
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        refresh_token: "mock-refresh-token",
        user: {
          id: uId,
          aud: "authenticated",
          role: "authenticated",
          email: uEmail,
          email_confirmed_at: new Date().toISOString(),
          phone: "",
          confirmed_at: new Date().toISOString(),
          last_sign_in_at: new Date().toISOString(),
          app_metadata: {
            provider: "email",
            providers: ["email"],
          },
          user_metadata: {
            role: uRole,
            full_name: uName,
          },
          identities: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      };
      localStorage.setItem("sb-rufagrsdrbnjjomhfzei-auth-token", JSON.stringify(session));
    },
    { uId: userId, uEmail: email, uRole: role, uName: name, uToken: token }
  );
}

test.describe("Hotel Operations E2E Tests", () => {
  // Test 1: Khách hàng đặt phòng trống thành công
  test("Test 1: Khách hàng đặt phòng trống thành công", async ({ page, context }) => {
    await injectSession(page, context, "CUSTOMER", MOCK_CUSTOMER_ID, "customer@example.com", "Customer User");

    // Mock profiles API
    await page.route("**/api/auth/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        json: {
          user: {
            id: MOCK_CUSTOMER_ID,
            email: "customer@example.com",
            role: "CUSTOMER",
            full_name: "Customer User",
            is_active: true,
          },
        },
      });
    });

    await page.route("**/api/auth/session", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        json: {
          message: "Session synced successfully",
          user: {
            id: MOCK_CUSTOMER_ID,
            email: "customer@example.com",
            role: "CUSTOMER",
            full_name: "Customer User",
            is_active: true,
          },
        },
      });
    });

    // Mock room availability check
    await page.route("**/api/rooms?checkIn=*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        json: [
          {
            id: "room-123",
            room_number: "101",
            room_type: {
              id: "type-123",
              name: "Standard",
              base_price: 1500000,
            },
          },
        ],
      });
    });

    // Mock room lock API
    await page.route("**/api/rooms/lock", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        json: {
          message: "Room locked successfully",
          lockedRoom: {
            id: "room-123",
            room_number: "101",
          },
        },
      });
    });

    // Mock booking creation API
    await page.route("**/api/bookings", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        json: {
          id: "booking-123",
          room_id: "room-123",
          check_in_date: "2026-08-10",
          check_out_date: "2026-08-12",
          num_guests: 1,
          total_amount: 1500000,
          status: "PENDING",
        },
      });
    });

    // Mock PayOS checkout link creation API
    await page.route("**/api/payment/create-embedded-link", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        json: {
          qrCode: "mock-qrcode-payload-string",
          amount: 1500000,
          description: "Payment for booking-123",
          checkoutUrl: "http://localhost:3000/pay-done",
          bookingId: "booking-123",
        },
      });
    });

    // Navigate to checkout page
    await page.goto("http://localhost:3000/checkout?roomId=room-123&price=1500000&checkIn=2026-08-10&checkOut=2026-08-12");
    await page.waitForLoadState("networkidle");

    // Click Confirm and Pay button
    const confirmBtn = page.locator("button:has-text('Confirm'), button:has-text('Xác nhận')").first();
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    // Verify the Scan VietQR modal opens
    const modalTitle = page.locator("h3:has-text('VietQR'), h3:has-text('Quét mã')");
    await expect(modalTitle).toBeVisible();
  });

  // Test 2: Chọn ngày checkin check out không hợp lệ
  test("Test 2: Chọn ngày checkin check out không hợp lệ", async ({ page, context }) => {
    await injectSession(page, context, "RECEPTIONIST", MOCK_RECEPTIONIST_ID, "receptionist@example.com", "Receptionist User");

    // Mock profiles API
    await page.route("**/api/auth/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        json: {
          user: {
            id: MOCK_RECEPTIONIST_ID,
            email: "receptionist@example.com",
            role: "RECEPTIONIST",
            full_name: "Receptionist User",
            is_active: true,
          },
        },
      });
    });

    await page.route("**/api/auth/session", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        json: {
          message: "Session synced successfully",
          user: {
            id: MOCK_RECEPTIONIST_ID,
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

    // Navigate to receptionist console
    await page.goto("http://localhost:3000/dashboard/receptionist");
    await page.waitForLoadState("networkidle");

    // Populate invalid date range: check-in after check-out
    const checkInInput = page.locator("input[type='date']").first();
    const checkOutInput = page.locator("input[type='date']").nth(1);

    await checkInInput.fill("2026-08-15");
    await checkOutInput.fill("2026-08-14");

    // Click check availability button
    const searchBtn = page.locator("button:has-text('Check Availability'), button:has-text('Truy vấn')").first();
    await searchBtn.click();

    // Verify error notification is displayed
    const errorAlert = page.locator("text=Check-out date must be strictly after Check-in date.");
    await expect(errorAlert).toBeVisible();
  });

  // Test 3 (a): Hệ thống từ chối check in với vai trò khác
  test("Test 3 (a): Hệ thống từ chối check in với vai trò khác", async ({ page, context }) => {
    await injectSession(page, context, "CUSTOMER", MOCK_CUSTOMER_ID, "customer@example.com", "Customer User");

    // Mock profiles API
    await page.route("**/api/auth/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        json: {
          user: {
            id: MOCK_CUSTOMER_ID,
            email: "customer@example.com",
            role: "CUSTOMER",
            full_name: "Customer User",
            is_active: true,
          },
        },
      });
    });

    await page.route("**/api/auth/session", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        json: {
          message: "Session synced successfully",
          user: {
            id: MOCK_CUSTOMER_ID,
            email: "customer@example.com",
            role: "CUSTOMER",
            full_name: "Customer User",
            is_active: true,
          },
        },
      });
    });

    // Navigate to check-in screen (which is receptionist/admin only)
    await page.goto("http://localhost:3000/checkin");
    await page.waitForLoadState("networkidle");

    // Expect to be redirected back to the general dashboard
    await expect(page).toHaveURL(/.*\/dashboard.*/);
  });

  // Test 3 (b): Check in sau đó sử dụng các dịch vụ
  test("Test 3 (b): Check in sau đó sử dụng các dịch vụ", async ({ page, context }) => {
    await injectSession(page, context, "RECEPTIONIST", MOCK_RECEPTIONIST_ID, "receptionist@example.com", "Receptionist User");

    // Mock profiles API
    await page.route("**/api/auth/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        json: {
          user: {
            id: MOCK_RECEPTIONIST_ID,
            email: "receptionist@example.com",
            role: "RECEPTIONIST",
            full_name: "Receptionist User",
            is_active: true,
          },
        },
      });
    });

    await page.route("**/api/auth/session", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        json: {
          message: "Session synced successfully",
          user: {
            id: MOCK_RECEPTIONIST_ID,
            email: "receptionist@example.com",
            role: "RECEPTIONIST",
            full_name: "Receptionist User",
            is_active: true,
          },
        },
      });
    });

    // Mock active bookings to select from
    await page.route("**/api/bookings", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        json: [
          {
            id: "booking-123",
            status: "CHECKED_IN",
            room_id: "room-123",
            user_id: MOCK_CUSTOMER_ID,
            room: {
              room_number: "101",
              room_type: {
                name: "Standard",
              },
            },
          },
        ],
      });
    });

    // Mock services catalogue
    await page.route("**/api/services", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        json: [
          {
            id: "service-1",
            name: "Room Service Lunch Combo",
            price: 150000,
            category: "Food",
            is_active: true,
          },
        ],
      });
    });

    // Navigate to services page
    await page.goto("http://localhost:3000/services");
    await page.waitForLoadState("networkidle");

    // Add service item to cart (click plus button)
    const addBtn = page.locator("button:has(.lucide-plus)").first();
    await addBtn.click();

    // Locate the cart button using precise XPath relative to the services section heading
    const cartOpenBtn = page.locator("//h2[contains(text(), 'Dịch vụ') or contains(text(), 'Services')]/../../button").first();
    
    // Wait for the cart item badge to update to "1" before clicking
    await expect(cartOpenBtn).toHaveText("1");
    
    // Programmatically trigger native DOM click to bypass sticky header overlap issue
    await cartOpenBtn.evaluate((el) => (el as HTMLElement).click());

    // Wait for the shopping cart drawer to open and render the room selector
    const selectRoom = page.locator("select");
    await expect(selectRoom).toBeVisible();

    // Select room delivery matching active booking by option value (booking-123) rather than translated label
    await selectRoom.selectOption("booking-123");

    // Click place order button programmatically to ensure it fires cleanly
    const orderBtn = page.locator("button:has-text('Đặt hàng'), button:has-text('Place Order'), button.w-full.h-12").first();
    await orderBtn.evaluate((el) => (el as HTMLElement).click());

    // Verify it redirects to the service checkout screen
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/.*checkout\?type=service.*/);
  });

  // Test 4: Cập nhật trạng thái phòng
  test("Test 4: Cập nhật trạng thái phòng", async ({ page, context }) => {
    await injectSession(page, context, "ADMIN", MOCK_ADMIN_ID, "admin@example.com", "Admin User");

    // Mock profiles API
    await page.route("**/api/auth/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        json: {
          user: {
            id: MOCK_ADMIN_ID,
            email: "admin@example.com",
            role: "ADMIN",
            full_name: "Admin User",
            is_active: true,
          },
        },
      });
    });

    await page.route("**/api/auth/session", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        json: {
          message: "Session synced successfully",
          user: {
            id: MOCK_ADMIN_ID,
            email: "admin@example.com",
            role: "ADMIN",
            full_name: "Admin User",
            is_active: true,
          },
        },
      });
    });

    // Mock rooms list
    await page.route("**/api/rooms?all=true", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        json: [
          {
            id: "room-101",
            room_number: "101",
            floor: 1,
            status: "AVAILABLE",
            room_type: {
              id: "type-123",
              name: "Standard",
            },
          },
        ],
      });
    });

    // Mock update status patch API
    let patchCalled = false;
    await page.route("**/api/rooms/room-101/status", async (route) => {
      patchCalled = true;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        json: {
          message: "Status updated successfully",
        },
      });
    });

    // Navigate to housekeeping emergency status grid
    await page.goto("http://localhost:3000/housekeeping");
    await page.waitForLoadState("networkidle");

    // Select the dropdown under room 101 and change status to DIRTY
    const statusSelect = page.locator("select").first();
    await statusSelect.selectOption("DIRTY");

    // Assert optimistic status update triggers the PATCH request and changes select value
    await expect(statusSelect).toHaveValue("DIRTY");
    expect(patchCalled).toBe(true);
  });
});
