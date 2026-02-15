import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { writeFile } from "node:fs/promises";
import { createZipBlob } from "../../src/lib/zip";

const disableBridgeMode = async (page: Page) => {
  await page.route("**/api/assets/ping", (route) => route.abort());
};

const openProjectFromLanding = async (page: Page, fixturePath: string) => {
  await page.getByRole("button", { name: /abrir proyecto|open project/i }).click();
  await page.locator('input[type="file"]').setInputFiles(fixturePath);
};

const writeZipFixture = async (testInfo: TestInfo) => {
  const slug = "detail-source-parity";
  const originalSvg = "<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><rect width='64' height='64' fill='#10b981'/></svg>";
  const mediumSvg = "<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><rect width='64' height='64' fill='#f59e0b'/></svg>";
  const originalBytes = new TextEncoder().encode(originalSvg);
  const mediumBytes = new TextEncoder().encode(mediumSvg);
  const project = {
    meta: {
      slug,
      name: "Detail Source Parity",
      restaurantName: { es: "Parity", en: "Parity" },
      title: { es: "Parity Menu", en: "Parity Menu" },
      identityMode: "text",
      logoSrc: "",
      fontFamily: "Fraunces",
      fontSource: "",
      fontRoles: {},
      template: "focus-rows",
      locales: ["es", "en"],
      defaultLocale: "es",
      currency: "MXN",
      currencyPosition: "left",
      backgroundCarouselSeconds: 9,
      backgroundDisplayMode: "carousel"
    },
    backgrounds: [
      {
        id: "bg-1",
        label: "Main",
        src:
          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Crect width='16' height='16' fill='%230f172a'/%3E%3C/svg%3E",
        type: "image"
      }
    ],
    categories: [
      {
        id: "cat-1",
        name: { es: "Seccion", en: "Section" },
        items: [
          {
            id: "dish-1",
            name: { es: "Dish 1", en: "Dish 1" },
            description: { es: "Desc", en: "Desc" },
            longDescription: { es: "", en: "" },
            priceVisible: true,
            price: { amount: 20, currency: "MXN" },
            allergens: [],
            vegan: false,
            media: {
              hero360: `/projects/${slug}/assets/derived/items/dish-1-md.svg`,
              originalHero360: `/projects/${slug}/assets/items/dish-1-original.svg`,
              derived: {
                medium: `/projects/${slug}/assets/derived/items/dish-1-md.svg`
              },
              rotationDirection: "ccw",
              scrollAnimationMode: "hero360",
              scrollAnimationSrc: ""
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

  const menuBytes = new TextEncoder().encode(JSON.stringify(project, null, 2));
  const zipBlob = createZipBlob([
    { name: `${slug}/menu.json`, data: menuBytes },
    { name: `${slug}/assets/derived/items/dish-1-md.svg`, data: mediumBytes },
    { name: `${slug}/assets/items/dish-1-original.svg`, data: originalBytes }
  ]);
  const fixturePath = testInfo.outputPath(`${slug}.zip`);
  await writeFile(fixturePath, new Uint8Array(await zipBlob.arrayBuffer()));

  return {
    fixturePath,
    expectedOriginalDataUrl: `data:image/svg;base64,${Buffer.from(originalBytes).toString("base64")}`
  };
};

test("detail modal uses original image source when available", async ({ page }, testInfo) => {
  const { fixturePath, expectedOriginalDataUrl } = await writeZipFixture(testInfo);
  await disableBridgeMode(page);
  await page.goto("/");
  await openProjectFromLanding(page, fixturePath);

  await expect(page.locator(".menu-startup-loader")).not.toHaveClass(/active/);
  await page.getByRole("button", { name: /cerrar editor|close editor/i }).click();
  await page.locator(".carousel-card").first().click();

  const modalImage = page.locator(".dish-modal img");
  await expect(modalImage).toHaveAttribute("src", expectedOriginalDataUrl);
});
