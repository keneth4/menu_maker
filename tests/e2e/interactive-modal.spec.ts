import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

const sampleMenuPath = path.resolve("public/projects/sample-cafebrunch-menu/menu.json");

const disableBridgeMode = async (page: Page) => {
  await page.route("**/api/assets/ping", (route) => route.abort());
};

const openProjectFromLanding = async (page: Page, fixturePath: string) => {
  const [chooser] = await Promise.all([
    page.waitForEvent("filechooser"),
    page.getByRole("button", { name: /abrir proyecto|open project/i }).click()
  ]);
  await chooser.setFiles(fixturePath);
};

const closeEditorIfOpen = async (page: Page) => {
  const closeButton = page.getByRole("button", { name: /cerrar editor|close editor/i }).first();
  if (await closeButton.isVisible().catch(() => false)) {
    await closeButton.click();
  }
};

test("interactive modal enables drag-to-rotate canvas for sample project", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  await disableBridgeMode(page);
  await page.goto("/");
  await openProjectFromLanding(page, sampleMenuPath);

  await closeEditorIfOpen(page);

  const firstDishCard = page.locator("button.carousel-card").first();
  await expect(firstDishCard).toBeVisible();
  await firstDishCard.dispatchEvent("click");

  const modal = page.locator(".dish-modal");
  await expect(modal).toBeVisible();

  const interactiveCanvas = page.locator(".dish-modal__media-canvas");
  await expect(interactiveCanvas).toHaveCount(1, { timeout: 10_000 });
  await expect(page.locator(".dish-modal__media.is-interactive")).toHaveCount(1);
  expect(pageErrors).toEqual([]);
});
