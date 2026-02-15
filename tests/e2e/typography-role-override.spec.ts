import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { writeFile } from "node:fs/promises";

type TypographyFixture = {
  meta: {
    slug: string;
    name: string;
    restaurantName: Record<string, string>;
    title: Record<string, string>;
    fontFamily: string;
    fontSource: string;
    fontRoles?: {
      identity?: { family?: string; source?: string };
      section?: { family?: string; source?: string };
      item?: { family?: string; source?: string };
    };
    template: string;
    locales: string[];
    defaultLocale: string;
    currency: string;
    currencyPosition: "left" | "right";
  };
  backgrounds: Array<{ id: string; label: string; src: string; type: "image" }>;
  categories: Array<{
    id: string;
    name: Record<string, string>;
    items: Array<{
      id: string;
      name: Record<string, string>;
      description: Record<string, string>;
      longDescription: Record<string, string>;
      price: { amount: number; currency: string };
      allergens: Array<{ label: Record<string, string> }>;
      vegan: boolean;
      media: { hero360: string };
      typography?: { item?: { family?: string; source?: string } };
    }>;
  }>;
  sound: {
    enabled: boolean;
    theme: string;
    volume: number;
    map: Record<string, string>;
  };
};

const disableBridgeMode = async (page: Page) => {
  await page.route("**/api/assets/ping", (route) => route.abort());
};

const openProjectFromLanding = async (page: Page, fixturePath: string) => {
  await page.getByRole("button", { name: /abrir proyecto|open project/i }).click();
  await page.locator('input[type="file"]').setInputFiles(fixturePath);
};

const closeEditorIfOpen = async (page: Page) => {
  const closeButton = page.getByRole("button", { name: /cerrar editor|close editor/i }).first();
  if (await closeButton.isVisible().catch(() => false)) {
    await closeButton.click();
  }
};

const writeJsonFixture = async (testInfo: TestInfo, project: TypographyFixture) => {
  const fixturePath = testInfo.outputPath(`${project.meta.slug}.json`);
  await writeFile(fixturePath, JSON.stringify(project, null, 2), "utf8");
  return fixturePath;
};

const createFixture = (): TypographyFixture => ({
  meta: {
    slug: "typography-roles-override",
    name: "Typography Roles Override",
    restaurantName: { es: "Typography", en: "Typography" },
    title: { es: "Typography Menu", en: "Typography Menu" },
    fontFamily: "Fraunces",
    fontSource: "",
    fontRoles: {
      identity: { family: "Poppins" },
      section: { family: "Cinzel" },
      item: { family: "Cormorant Garamond" }
    },
    template: "focus-rows",
    locales: ["es", "en"],
    defaultLocale: "es",
    currency: "USD",
    currencyPosition: "left"
  },
  backgrounds: [],
  categories: [
    {
      id: "cat-1",
      name: { es: "Postres", en: "Desserts" },
      items: [
        {
          id: "item-1",
          name: { es: "Pie", en: "Pie" },
          description: { es: "Desc", en: "Desc" },
          longDescription: { es: "", en: "" },
          price: { amount: 12, currency: "USD" },
          allergens: [],
          vegan: false,
          media: {
            hero360: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="
          },
          typography: {
            item: { family: "Playfair Display" }
          }
        }
      ]
    }
  ],
  sound: {
    enabled: false,
    theme: "bar-amber",
    volume: 0.5,
    map: {}
  }
});

test("typography roles and per-item override are applied in preview and detail", async ({
  page
}, testInfo) => {
  const fixturePath = await writeJsonFixture(testInfo, createFixture());
  await disableBridgeMode(page);
  await page.goto("/");
  await openProjectFromLanding(page, fixturePath);
  await closeEditorIfOpen(page);

  await expect(page.locator(".menu-title")).toBeVisible();
  await expect(page.locator(".menu-section__title").first()).toBeVisible();
  await expect(page.locator(".carousel-card").first()).toBeVisible();

  const previewTypography = await page.evaluate(() => {
    const title = window.getComputedStyle(document.querySelector(".menu-title")!).fontFamily;
    const section = window.getComputedStyle(document.querySelector(".menu-section__title")!).fontFamily;
    const card = document.querySelector(".carousel-card") as HTMLElement;
    const cardVar = window.getComputedStyle(card).getPropertyValue("--item-font").trim();
    return { title, section, cardVar };
  });

  expect(previewTypography.title).toContain("Poppins");
  expect(previewTypography.section).toContain("Cinzel");
  expect(previewTypography.cardVar).toContain("Playfair Display");

  await page.locator(".carousel-card").first().click();
  await expect(page.locator(".dish-modal")).toBeVisible();
  const modalFontVar = await page.evaluate(
    () =>
      window
        .getComputedStyle(document.querySelector(".dish-modal__card")!)
        .getPropertyValue("--item-font")
        .trim()
  );
  expect(modalFontVar).toContain("Playfair Display");
});
