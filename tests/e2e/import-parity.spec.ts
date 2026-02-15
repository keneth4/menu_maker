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

const writeJsonFixture = async (testInfo: TestInfo) => {
  const slug = "json-import-parity";
  const jsonBackgroundSvg = new TextEncoder().encode(
    "<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'><rect width='48' height='48' fill='#1d4ed8'/></svg>"
  );
  const menuProject = {
    meta: {
      slug,
      name: "JSON Import Parity",
      restaurantName: { es: "Parity", en: "Parity" },
      title: { es: "Menu", en: "Menu" },
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
        src: `data:image/svg;base64,${Buffer.from(jsonBackgroundSvg).toString("base64")}`,
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
            name: { es: "Dish", en: "Dish" },
            description: { es: "Desc", en: "Desc" },
            longDescription: { es: "", en: "" },
            priceVisible: true,
            price: { amount: 10, currency: "MXN" },
            allergens: [],
            vegan: false,
            media: {
              hero360:
                "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==",
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

  const fixturePath = testInfo.outputPath(`${slug}.json`);
  await writeFile(fixturePath, JSON.stringify(menuProject, null, 2), "utf8");
  return fixturePath;
};

const writeZipFixture = async (testInfo: TestInfo) => {
  const slug = "zip-import-parity";
  const menuProject = {
    meta: {
      slug,
      name: "ZIP Import Parity",
      restaurantName: { es: "Parity", en: "Parity" },
      title: { es: "Menu", en: "Menu" },
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
        src: `/projects/${slug}/assets/backgrounds/bg-main.svg`,
        originalSrc: `/projects/${slug}/assets/backgrounds/bg-main.svg`,
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
            name: { es: "Dish", en: "Dish" },
            description: { es: "Desc", en: "Desc" },
            longDescription: { es: "Long", en: "Long" },
            priceVisible: true,
            price: { amount: 10, currency: "MXN" },
            allergens: [],
            vegan: false,
            media: {
              hero360: `/projects/${slug}/assets/dishes/item-main.svg`,
              originalHero360: `/projects/${slug}/assets/dishes/item-main.svg`,
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

  const backgroundSvg = new TextEncoder().encode(
    "<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><rect width='64' height='64' fill='#0284c7'/></svg>"
  );
  const itemSvg = new TextEncoder().encode(
    "<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><rect width='64' height='64' fill='#0f766e'/></svg>"
  );
  const menuBytes = new TextEncoder().encode(JSON.stringify(menuProject, null, 2));
  const zipBlob = createZipBlob([
    { name: `${slug}/menu.json`, data: menuBytes },
    { name: `${slug}/assets/backgrounds/bg-main.svg`, data: backgroundSvg },
    { name: `${slug}/assets/dishes/item-main.svg`, data: itemSvg }
  ]);
  const fixturePath = testInfo.outputPath(`${slug}.zip`);
  await writeFile(fixturePath, new Uint8Array(await zipBlob.arrayBuffer()));
  return fixturePath;
};

test("zip import in non-bridge mode hydrates backgrounds and shows imported assets in assets tab", async ({
  page
}, testInfo) => {
  const fixturePath = await writeZipFixture(testInfo);
  await disableBridgeMode(page);
  await page.goto("/");
  await openProjectFromLanding(page, fixturePath);

  const background = page.locator(".menu-background").first();
  await expect(background).toBeVisible();
  await expect(background).toHaveClass(/active/);
  await expect(background).toHaveAttribute("data-bg-src", /^data:image\/svg(?:\+xml)?;base64,/);
  const renderedStyle = await background.evaluate(
    (element) => window.getComputedStyle(element).backgroundImage
  );
  expect(renderedStyle).not.toBe("none");

  await page.locator(".editor-tabs").getByRole("button", { name: /assets|activos/i }).click();
  await page
    .locator(".asset-item", { hasText: "originals/backgrounds" })
    .locator(".asset-toggle")
    .click();
  await page
    .locator(".asset-item", { hasText: "originals/items" })
    .locator(".asset-toggle")
    .click();
  await expect(page.locator(".asset-item", { hasText: "bg-main.svg" })).toBeVisible();
  await expect(page.locator(".asset-item", { hasText: "item-main.svg" })).toBeVisible();
});

test("json import in non-bridge mode renders active background image", async ({ page }, testInfo) => {
  const fixturePath = await writeJsonFixture(testInfo);
  await disableBridgeMode(page);
  await page.goto("/");
  await openProjectFromLanding(page, fixturePath);

  const background = page.locator(".menu-background").first();
  await expect(background).toBeVisible();
  await expect(background).toHaveClass(/active/);
  const renderedStyle = await background.evaluate(
    (element) => window.getComputedStyle(element).backgroundImage
  );
  expect(renderedStyle).not.toBe("none");
});
