import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const sampleGifPath = path.resolve("public/projects/sample-cafebrunch-menu/assets/dishes/sample360food.gif");

const disableBridgeMode = async (page: Page) => {
  await page.route("**/api/assets/ping", (route) => route.abort());
};

const openProjectFromLanding = async (page: Page, fixturePath: string) => {
  await page.getByRole("button", { name: /abrir proyecto|open project/i }).click();
  await page.locator('input[type="file"]').setInputFiles(fixturePath);
};

const writeInteractiveFixture = async (testInfo: TestInfo) => {
  const gifBase64 = (await readFile(sampleGifPath)).toString("base64");
  const hero360 = `data:image/gif;base64,${gifBase64}`;
  const fixture = {
    meta: {
      slug: "interactive-modal-fixture",
      name: "Interactive Modal Fixture",
      restaurantName: { es: "Demo", en: "Demo" },
      title: { es: "Demo", en: "Demo" },
      identityMode: "text",
      logoSrc: "",
      fontFamily: "Fraunces",
      fontSource: "",
      template: "focus-rows",
      locales: ["es", "en"],
      defaultLocale: "en",
      currency: "USD",
      currencyPosition: "left"
    },
    backgrounds: [],
    categories: [
      {
        id: "cat-1",
        name: { es: "Dishes", en: "Dishes" },
        items: [
          {
            id: "dish-1",
            name: { es: "Interactive", en: "Interactive" },
            description: { es: "GIF", en: "GIF" },
            longDescription: { es: "", en: "" },
            priceVisible: true,
            price: { amount: 10, currency: "USD" },
            allergens: [],
            vegan: false,
            media: { hero360, rotationDirection: "cw" },
            typography: {}
          }
        ]
      }
    ],
    sound: {
      enabled: false,
      theme: "bar-amber",
      volume: 0.6,
      map: {}
    }
  };
  const fixturePath = testInfo.outputPath("interactive-modal-fixture.json");
  await writeFile(fixturePath, JSON.stringify(fixture, null, 2), "utf8");
  return { fixturePath, hero360 };
};

const closeEditorIfOpen = async (page: Page) => {
  const closeButton = page.getByRole("button", { name: /cerrar editor|close editor/i }).first();
  if (await closeButton.isVisible().catch(() => false)) {
    await closeButton.click();
  }
};

const supportsInteractiveGifDecoding = async (page: Page, source: string) => {
  return await page.evaluate(async (src) => {
    const Decoder = (window as Window & { ImageDecoder?: new (init: unknown) => any }).ImageDecoder;
    if (!Decoder || typeof createImageBitmap !== "function") return false;
    try {
      const response = await fetch(src);
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
  }, source);
};

test("interactive modal enables drag-to-rotate canvas for sample project", async ({ page }, testInfo) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  const { fixturePath, hero360 } = await writeInteractiveFixture(testInfo);
  await disableBridgeMode(page);
  await page.goto("/");
  await openProjectFromLanding(page, fixturePath);

  const supportsInteractiveGif = await supportsInteractiveGifDecoding(page, hero360);
  test.skip(!supportsInteractiveGif, "Interactive GIF decoding is unavailable in this runtime.");

  await closeEditorIfOpen(page);

  const interactiveDishCard = page.locator("button.carousel-card").first();
  await expect(interactiveDishCard).toBeVisible();
  await interactiveDishCard.click();

  const modal = page.locator(".dish-modal");
  await expect(modal).toBeVisible();

  const interactiveCanvas = page.locator(".dish-modal__media-canvas");
  await expect(interactiveCanvas).toHaveCount(1, { timeout: 10_000 });
  await expect(page.locator(".dish-modal__media.is-interactive")).toHaveCount(1);
  expect(pageErrors).toEqual([]);
});
