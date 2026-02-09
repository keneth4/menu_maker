import { expect, test, type TestInfo } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";
import { createZipBlob, readZip } from "../../src/lib/zip";
import type { MenuProject } from "../../src/lib/types";

const TINY_TRANSPARENT_GIF = Uint8Array.from(
  Buffer.from("R0lGODlhAQABAPAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==", "base64")
);

const makeFixtureProject = (slug: string): MenuProject => ({
  meta: {
    slug,
    name: "FFmpeg Fixture",
    restaurantName: { es: "FFmpeg Kitchen", en: "FFmpeg Kitchen" },
    title: { es: "Menú", en: "Menu" },
    fontFamily: "Fraunces",
    fontSource: "",
    template: "focus-rows",
    locales: ["es", "en"],
    defaultLocale: "es",
    currency: "MXN",
    currencyPosition: "left",
    identityMode: "text",
    logoSrc: ""
  },
  backgrounds: [
    {
      id: "bg-1",
      label: "main",
      src: "assets/backgrounds/backery-outside.gif",
      type: "image"
    }
  ],
  categories: [
    {
      id: "cat-1",
      name: { es: "Postres", en: "Desserts" },
      items: [
        {
          id: "dish-1",
          name: { es: "Muestra", en: "Sample" },
          description: { es: "Demo", en: "Demo" },
          longDescription: { es: "Demo", en: "Demo" },
          price: { amount: 99, currency: "MXN" },
          allergens: [],
          vegan: false,
          media: {
            hero360: "assets/dishes/backery-outside.gif",
            rotationDirection: "cw"
          }
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
});

const writeBridgeFixtureZip = async (testInfo: TestInfo, slug: string) => {
  const project = makeFixtureProject(slug);
  const menuBytes = new TextEncoder().encode(JSON.stringify(project, null, 2));
  const zipBlob = createZipBlob([
    { name: `${slug}/menu.json`, data: menuBytes },
    { name: `${slug}/assets/backgrounds/backery-outside.gif`, data: TINY_TRANSPARENT_GIF },
    { name: `${slug}/assets/dishes/backery-outside.gif`, data: TINY_TRANSPARENT_GIF }
  ]);
  const fixturePath = testInfo.outputPath(`${slug}.zip`);
  await writeFile(fixturePath, new Uint8Array(await zipBlob.arrayBuffer()));
  return fixturePath;
};

test("bridge export generates derived assets and keeps originals out of static export", async ({
  page,
  request
}, testInfo) => {
  test.setTimeout(240000);

  const probe = await request.post("/api/assets/prepare-derived?project=ffmpeg-probe", {
    data: {
      project: {
        meta: {
          name: "probe",
          locale: "es",
          currency: "MXN",
          currencyPosition: "left"
        },
        backgrounds: [],
        categories: []
      }
    }
  });
  test.skip(
    probe.status() === 503,
    "ffmpeg not available in this environment, skipping ffmpeg integration check"
  );
  expect(probe.ok()).toBeTruthy();

  const slug = `ffmpeg-export-${Date.now()}`;
  const fixturePath = await writeBridgeFixtureZip(testInfo, slug);

  await page.goto("/");
  const [chooser] = await Promise.all([
    page.waitForEvent("filechooser"),
    page.getByRole("button", { name: /abrir proyecto|open project/i }).click()
  ]);
  await chooser.setFiles(fixturePath);
  const projectNameInput = page
    .locator("label.editor-field", { hasText: /nombre del proyecto|project name/i })
    .locator("input");
  await expect(projectNameInput).toHaveValue("FFmpeg Fixture", { timeout: 120000 });

  const exportDownloadPromise = page.waitForEvent("download", { timeout: 180000 });
  await page.getByRole("button", { name: /exportar sitio|export site/i }).click();
  const exportDownload = await exportDownloadPromise;
  expect(exportDownload.suggestedFilename()).toMatch(/-export\.zip$/i);
  const exportPath = await exportDownload.path();
  expect(exportPath).toBeTruthy();

  const zipBytes = await readFile(exportPath!);
  const zipBuffer = zipBytes.buffer.slice(zipBytes.byteOffset, zipBytes.byteOffset + zipBytes.byteLength);
  const entries = readZip(zipBuffer);
  const names = entries.map((entry) => entry.name);
  expect(names).toContain("asset-manifest.json");

  expect(names.some((name) => name.startsWith("assets/derived/backgrounds/"))).toBeTruthy();
  expect(names.some((name) => name.startsWith("assets/derived/items/"))).toBeTruthy();
  expect(names.some((name) => name.startsWith("assets/originals/"))).toBeFalsy();
  expect(names.some((name) => name.startsWith("assets/backgrounds/"))).toBeFalsy();
  expect(names.some((name) => name.startsWith("assets/dishes/"))).toBeFalsy();

  const menuEntry = entries.find((entry) => entry.name === "menu.json");
  expect(menuEntry).toBeDefined();
  const menu = JSON.parse(new TextDecoder().decode(menuEntry!.data)) as MenuProject;

  expect(menu.backgrounds[0].src).toMatch(/^assets\/derived\/backgrounds\/.+-lg\.webp$/i);
  expect(menu.backgrounds[0].originalSrc).toBeUndefined();
  expect(menu.categories[0].items[0].media.hero360).toMatch(/^assets\/derived\/items\/.+-lg\.webp$/i);
  expect(menu.categories[0].items[0].media.originalHero360).toBeUndefined();
});
