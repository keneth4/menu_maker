import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { writeFile } from "node:fs/promises";

type SourcePickerFixture = {
  meta: {
    slug: string;
    name: string;
    restaurantName: Record<string, string>;
    title: Record<string, string>;
    fontFamily: string;
    fontSource: string;
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
  await page.getByRole("button", { name: /abrir|open/i }).click();
  await page.locator('input[type="file"]').setInputFiles(fixturePath);
};

const openEditorIfClosed = async (page: Page) => {
  const isOpen = await page
    .locator(".editor-panel")
    .evaluate((element) => element.classList.contains("open"));
  if (!isOpen) {
    await page.getByRole("button", { name: /abrir editor|open editor/i }).click();
  }
};

const writeJsonFixture = async (testInfo: TestInfo, project: SourcePickerFixture) => {
  const fixturePath = testInfo.outputPath(`${project.meta.slug}.json`);
  await writeFile(fixturePath, JSON.stringify(project, null, 2), "utf8");
  return fixturePath;
};

const createFixture = (): SourcePickerFixture => ({
  meta: {
    slug: "source-picker-labels",
    name: "Source Picker Labels",
    restaurantName: { es: "Label Test", en: "Label Test" },
    title: { es: "Label Menu", en: "Label Menu" },
    fontFamily: "Fraunces",
    fontSource: "",
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
      name: { es: "Uno", en: "One" },
      items: [
        {
          id: "item-1",
          name: { es: "Uno", en: "One" },
          description: { es: "Desc", en: "Desc" },
          longDescription: { es: "", en: "" },
          price: { amount: 10, currency: "USD" },
          allergens: [],
          vegan: false,
          media: {
            hero360: "/projects/source-picker-labels/assets/originals/items/branding/logo.webp"
          }
        },
        {
          id: "item-2",
          name: { es: "Dos", en: "Two" },
          description: { es: "Desc", en: "Desc" },
          longDescription: { es: "", en: "" },
          price: { amount: 12, currency: "USD" },
          allergens: [],
          vegan: false,
          media: {
            hero360: "/projects/source-picker-labels/assets/originals/items/seasonal/logo.webp"
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

test("source pickers show filename labels while preserving full path values", async ({
  page
}, testInfo) => {
  const fixturePath = await writeJsonFixture(testInfo, createFixture());
  await disableBridgeMode(page);
  await page.goto("/");
  await openProjectFromLanding(page, fixturePath);
  await openEditorIfClosed(page);

  const tabs = page.locator(".editor-tabs");
  await tabs.getByRole("button", { name: /edición|editar|edit/i }).click();
  await page.getByRole("button", { name: /items|platillos|dishes/i }).click();

  const sourceOptions = await page
    .locator(".edit-item__source select")
    .first()
    .evaluate((select) =>
      Array.from(select.options)
        .map((option) => ({
          value: option.value,
          label: (option.textContent || "").trim()
        }))
        .filter((option) => option.value.length > 0)
    );

  expect(sourceOptions).toContainEqual({
    value: "/projects/source-picker-labels/assets/originals/items/branding/logo.webp",
    label: "logo.webp (items/branding)"
  });
  expect(sourceOptions).toContainEqual({
    value: "/projects/source-picker-labels/assets/originals/items/seasonal/logo.webp",
    label: "logo.webp (items/seasonal)"
  });

  const datalistEntry = await page
    .locator(
      '#asset-files option[value="/projects/source-picker-labels/assets/originals/items/branding/logo.webp"]'
    )
    .evaluate((option) => ({
      value: option.getAttribute("value"),
      label: option.getAttribute("label")
    }));

  expect(datalistEntry).toEqual({
    value: "/projects/source-picker-labels/assets/originals/items/branding/logo.webp",
    label: "logo.webp (items/branding)"
  });
});
