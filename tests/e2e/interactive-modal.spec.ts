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
            media: {
              hero360,
              originalHero360: hero360,
              rotationDirection: "cw"
            },
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

const delayImageDecoderDecode = async (page: Page, delayMs = 650) => {
  await page.addInitScript((delay) => {
    const decoderCtor = (window as Window & { ImageDecoder?: { prototype?: unknown } }).ImageDecoder;
    const prototype =
      typeof decoderCtor === "function"
        ? (decoderCtor as { prototype?: { decode?: (...args: unknown[]) => Promise<unknown> } })
            .prototype
        : null;
    if (!prototype || typeof prototype.decode !== "function") return;
    if (
      (prototype as { __interactiveSlowDecodeInstalled?: boolean }).__interactiveSlowDecodeInstalled
    ) {
      return;
    }
    const originalDecode = prototype.decode;
    Object.defineProperty(prototype, "__interactiveSlowDecodeInstalled", {
      value: true,
      configurable: true
    });
    prototype.decode = async function (...args: unknown[]) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      return await originalDecode.apply(this, args);
    };
  }, delayMs);
};

const forceNoImageDecoder = async (page: Page) => {
  await page.addInitScript(() => {
    const globalWindow = window as Window & { ImageDecoder?: unknown };
    try {
      Object.defineProperty(globalWindow, "ImageDecoder", {
        configurable: true,
        writable: true,
        value: undefined
      });
      return;
    } catch {
      // Fall back to delete when descriptor updates are blocked.
    }
    try {
      delete globalWindow.ImageDecoder;
    } catch {
      // Ignore if runtime prevents deleting this property.
    }
  });
};

const supportsInteractiveRuntime = async (page: Page) =>
  await page.evaluate(() => {
    const decoder = (window as Window & { ImageDecoder?: unknown }).ImageDecoder;
    return typeof decoder === "function" && typeof createImageBitmap === "function";
  });

test("interactive modal hides base gif while decoder is loading", async ({ page }, testInfo) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  const { fixturePath } = await writeInteractiveFixture(testInfo);
  await disableBridgeMode(page);
  await delayImageDecoderDecode(page);
  await page.goto("/");

  const supportsInteractive = await supportsInteractiveRuntime(page);
  test.skip(!supportsInteractive, "Interactive GIF decoding is unavailable in this runtime.");
  await openProjectFromLanding(page, fixturePath);

  await closeEditorIfOpen(page);

  const interactiveDishCard = page.locator("button.carousel-card").first();
  await expect(interactiveDishCard).toBeVisible();
  await interactiveDishCard.click();

  const modal = page.locator(".dish-modal");
  await expect(modal).toBeVisible();
  const mediaHost = page.locator(".dish-modal__media");
  const mediaImage = mediaHost.locator("img");
  await expect(mediaHost).toHaveClass(/is-loading-interactive/);
  await expect
    .poll(async () => await mediaImage.evaluate((element) => getComputedStyle(element).opacity))
    .toBe("0");

  const interactiveCanvas = page.locator(".dish-modal__media-canvas");
  await expect(interactiveCanvas).toHaveCount(1, { timeout: 10_000 });
  await expect(mediaHost).not.toHaveClass(/is-loading-interactive/);
  await expect(page.locator(".dish-modal__media.is-interactive")).toHaveCount(1);
  expect(pageErrors).toEqual([]);
});

test("interactive modal falls back to animated gif when ImageDecoder is unavailable", async ({
  page
}, testInfo) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  await forceNoImageDecoder(page);
  const { fixturePath } = await writeInteractiveFixture(testInfo);
  await disableBridgeMode(page);
  await page.goto("/");
  const supportsInteractive = await supportsInteractiveRuntime(page);
  test.skip(
    supportsInteractive,
    "Unable to disable ImageDecoder in this browser runtime; unsupported fallback is validated on Safari/WebKit."
  );
  await openProjectFromLanding(page, fixturePath);
  await closeEditorIfOpen(page);

  const interactiveDishCard = page.locator("button.carousel-card").first();
  await expect(interactiveDishCard).toBeVisible();
  await interactiveDishCard.click();

  const modal = page.locator(".dish-modal");
  await expect(modal).toBeVisible();
  const mediaHost = page.locator(".dish-modal__media");
  const mediaImage = mediaHost.locator("img");
  await expect(mediaImage).toBeVisible();
  await expect(mediaImage).not.toHaveClass(/is-hidden/);
  await expect(page.locator(".dish-modal__media .dish-modal__rotate-cue")).toHaveCount(0);
  await expect
    .poll(async () => await page.locator(".dish-modal__media-canvas").count(), { timeout: 1_500 })
    .toBe(0);
  await expect(mediaHost).not.toHaveClass(/is-loading-interactive/);
  expect(pageErrors).toEqual([]);
});
