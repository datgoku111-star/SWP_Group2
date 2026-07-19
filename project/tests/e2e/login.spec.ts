import { test, expect } from "@playwright/test";

test.describe("Login Flow E2E Tests", () => {
  test("should load the login page and show error for invalid credentials", async ({ page }) => {
    // Navigate to login page
    await page.goto("/login");
    
    // Wait for Next.js hydration / JS bundles to load
    await page.waitForLoadState("networkidle");

    // Check that form inputs are visible
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();

    // Fill in invalid credentials
    await emailInput.fill("invalid-user@example.com");
    await passwordInput.fill("wrongpassword");

    // Click submit button
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // Verify that an error message container is displayed
    const errorContainer = page.locator(".bg-red-100, .bg-red-950\\/35");
    await expect(errorContainer).toBeVisible({ timeout: 10000 });

    // Verify that some error text is printed
    const errorText = await errorContainer.textContent();
    expect(errorText).toBeTruthy();
  });

  test("should navigate to register page when creating account", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    // Look for link pointing to /signup (first one, to avoid duplicate locators)
    const signupLink = page.locator('a[href="/signup"]').first();
    await expect(signupLink).toBeVisible();
    await signupLink.click();

    // Verify it navigates to /signup
    await expect(page).toHaveURL(/\/signup/);
  });
});
