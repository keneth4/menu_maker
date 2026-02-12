import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";
import { readZip } from "../../src/lib/zip";

type FontConfig = { family?: string; source?: string };

type ExportFontFixture = {
  meta: {
    slug: string;
    name: string;
    restaurantName: Record<string, string>;
    title: Record<string, string>;
    fontFamily: string;
    fontSource: string;
    fontRoles?: {
      identity?: FontConfig;
      section?: FontConfig;
      item?: FontConfig;
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
      typography?: { item?: FontConfig };
    }>;
  }>;
  sound: {
    enabled: boolean;
    theme: string;
    volume: number;
    map: Record<string, string>;
  };
};

const FONT_IDENTITY =
  "/projects/keneth-s-gaussian-splattings-collection/assets/originals/fonts/SuperBrigadeGradient-V4qA6.otf";
const FONT_SECTION =
  "/projects/keneth-s-gaussian-splattings-collection/assets/originals/fonts/QuickingRegular-gw5KY.otf";
const FONT_ITEM =
  "/projects/keneth-s-gaussian-splattings-collection/assets/originals/fonts/MolganRegular-YqWj2.otf";

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

const writeJsonFixture = async (testInfo: TestInfo, project: ExportFontFixture) => {
  const fixturePath = testInfo.outputPath(`${project.meta.slug}.json`);
  await writeFile(fixturePath, JSON.stringify(project, null, 2), "utf8");
  return fixturePath;
};

const createFixture = (): ExportFontFixture => ({
  meta: {
    slug: "export-font-rewrite",
    name: "Export Font Rewrite",
    restaurantName: { es: "Fontes", en: "Fontes" },
    title: { es: "Fontes", en: "Fontes" },
    fontFamily: "Fraunces",
    fontSource: "",
    fontRoles: {
      identity: { source: FONT_IDENTITY },
      section: { source: FONT_SECTION },
      item: { source: FONT_SECTION }
    },
    template: "focus-rows",
    locales: ["es", "en"],
    defaultLocale: "es",
    currency: "USD",
    currencyPosition: "left"
  },
  backgrounds: [
    {
      id: "bg-1",
      label: "Main",
      src: "/projects/keneth-s-gaussian-splattings-collection/assets/originals/backgrounds/backgroundMannheim.gif",
      type: "image"
    }
  ],
  categories: [
    {
      id: "cat-1",
      name: { es: "Sección", en: "Section" },
      items: [
        {
          id: "item-1",
          name: { es: "Item 1", en: "Item 1" },
          description: { es: "Desc", en: "Desc" },
          longDescription: { es: "", en: "" },
          price: { amount: 12, currency: "USD" },
          allergens: [],
          vegan: false,
          media: {
            hero360:
              "/projects/keneth-s-gaussian-splattings-collection/assets/originals/items/360Flowers.gif"
          },
          typography: {
            item: { source: FONT_ITEM }
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

test("export rewrites role and per-item font sources to exported assets", async ({
  page
}, testInfo) => {
  const fixturePath = await writeJsonFixture(testInfo, createFixture());
  await disableBridgeMode(page);
  await page.goto("/");
  await openProjectFromLanding(page, fixturePath);

  const downloadPromise = page.waitForEvent("download", { timeout: 120000 });
  await page.getByRole("button", { name: /exportar sitio|export site/i }).click();
  const download = await downloadPromise;
  const exportPath = await download.path();
  expect(exportPath).toBeTruthy();

  const zipBytes = await readFile(exportPath!);
  const zipBuffer = zipBytes.buffer.slice(
    zipBytes.byteOffset,
    zipBytes.byteOffset + zipBytes.byteLength
  );
  const entries = readZip(zipBuffer);
  const menuEntry = entries.find((entry) => entry.name === "menu.json");
  expect(menuEntry).toBeDefined();

  const menu = JSON.parse(new TextDecoder().decode(menuEntry!.data)) as ExportFontFixture;
  const rewrittenSources = [
    menu.meta.fontRoles?.identity?.source,
    menu.meta.fontRoles?.section?.source,
    menu.meta.fontRoles?.item?.source,
    menu.categories[0]?.items[0]?.typography?.item?.source
  ].filter((source): source is string => Boolean(source));

  expect(rewrittenSources.length).toBe(4);
  rewrittenSources.forEach((source) => {
    expect(source).toMatch(/^assets\//);
    expect(source).not.toContain("/projects/");
  });

  const entryNames = new Set(entries.map((entry) => entry.name));
  Array.from(new Set(rewrittenSources)).forEach((source) => {
    expect(entryNames.has(source)).toBeTruthy();
  });
});
