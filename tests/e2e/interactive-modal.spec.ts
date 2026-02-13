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

const supportsInteractiveGifDecoding = async (page: Page) => {
  return await page.evaluate(async () => {
    const Decoder = (window as Window & { ImageDecoder?: new (init: unknown) => any }).ImageDecoder;
    if (!Decoder || typeof createImageBitmap !== "function") return false;
    try {
      const response = await fetch("/projects/sample-cafebrunch-menu/assets/dishes/sample360food.gif");
      if (!response.ok) return false;
      const data = await response.arrayBuffer();
      const decoder = new Decoder({ data, type: "image/gif" });
      await decoder.tracks.ready;
      const frameCount = Number(decoder.tracks?.selectedTrack?.frameCount ?? 0);
      if (frameCount < 2) {
        decoder.close?.();
        return false;
      }
      const decoded = await decoder.decode({ frameIndex: 0, completeFramesOnly: true });
      const frame = decoded?.image;
      if (!frame) {
        decoder.close?.();
        return false;
      }
      try {
        await createImageBitmap(frame);
      } finally {
        frame.close?.();
      }
      decoder.close?.();
      return true;
    } catch {
      return false;
    }
  });
};

test("interactive modal enables drag-to-rotate canvas for sample project", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  await disableBridgeMode(page);
  await page.goto("/");
  await openProjectFromLanding(page, sampleMenuPath);

  const supportsInteractiveGif = await supportsInteractiveGifDecoding(page);
  test.skip(!supportsInteractiveGif, "Interactive GIF decoding is unavailable in this runtime.");

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
