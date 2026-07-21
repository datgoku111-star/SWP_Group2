import { test, expect } from "@playwright/test";

test.describe("Home Page E2E Tests", () => {
  test("should navigate to the home page and render key headings", async ({ page }) => {
    // Go to homepage (defaults to baseURL in playwright.config.ts)
    await page.goto("/");

    // Verify the main heading text is visible
    const heading = page.locator("text=Các hạng phòng nghỉ nổi bật");
    await expect(heading).toBeVisible({ timeout: 5000 });
  });
});
