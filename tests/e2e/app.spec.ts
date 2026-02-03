import { test, expect } from "@playwright/test";

test("landing shows header", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(/Menús interactivos/i)).toBeVisible();
});
