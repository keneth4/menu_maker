import { expect, test, type TestInfo } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";
import { createZipBlob, readZip } from "../../src/lib/zip";
import type { MenuProject } from "../../src/lib/types";

const TINY_TRANSPARENT_PNG = Uint8Array.from(
  Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO5z8N8AAAAASUVORK5CYII=", "base64")
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
      src: "assets/backgrounds/backery-outside.png",
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
            hero360: "assets/dishes/backery-outside.png",
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
    { name: `${slug}/assets/backgrounds/backery-outside.png`, data: TINY_TRANSPARENT_PNG },
    { name: `${slug}/assets/dishes/backery-outside.png`, data: TINY_TRANSPARENT_PNG }
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
  expect(names.some((name) => name.startsWith("assets/originals/backgrounds/"))).toBeFalsy();
  expect(names.some((name) => name.startsWith("assets/originals/items/"))).toBeTruthy();
  expect(names.some((name) => name.startsWith("assets/backgrounds/"))).toBeFalsy();
  expect(names.some((name) => name.startsWith("assets/dishes/"))).toBeFalsy();

  const menuEntry = entries.find((entry) => entry.name === "menu.json");
  expect(menuEntry).toBeDefined();
  const menu = JSON.parse(new TextDecoder().decode(menuEntry!.data)) as MenuProject;

  expect(menu.backgrounds[0].src).toMatch(
    /^assets\/derived\/backgrounds\/.+-md\.(webp|gif|png|jpg|jpeg|webm|mp4)$/i
  );
  expect(menu.backgrounds[0].originalSrc).toBeUndefined();
  expect(menu.backgrounds[0].derived?.profileId).not.toBe("ffmpeg-v2-copy-fallback");
  expect(menu.categories[0].items[0].media.hero360).toMatch(
    /^assets\/derived\/items\/.+-md\.(webp|gif|png|jpg|jpeg|webm|mp4)$/i
  );
  expect(menu.categories[0].items[0].media.originalHero360).toMatch(
    /^assets\/originals\/items\/.+\.[a-z0-9]+$/i
  );
  expect(menu.categories[0].items[0].media.derived?.profileId).not.toBe("ffmpeg-v2-copy-fallback");

  const mediumVariant = menu.categories[0].items[0].media.derived?.medium;
  const largeVariant = menu.categories[0].items[0].media.derived?.large;
  const asObject = (value: unknown) =>
    typeof value === "string" ? { direct: value } : (value as Record<string, string> | undefined) ?? {};
  const mediumSources = Object.values(asObject(mediumVariant));
  const largeSources = Object.values(asObject(largeVariant));
  expect(mediumSources.some((value) => /^assets\/derived\/items\/.+-md\./i.test(value))).toBeTruthy();
  expect(largeSources.some((value) => /^assets\/derived\/items\/.+-md\./i.test(value))).toBeTruthy();
});

test("bridge save zip keeps originals and derived assets", async ({ page, request }, testInfo) => {
  test.setTimeout(240000);

  const probe = await request.post("/api/assets/prepare-derived?project=ffmpeg-probe-save", {
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

  const slug = `ffmpeg-save-${Date.now()}`;
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

  const saveDownloadPromise = page.waitForEvent("download", { timeout: 180000 });
  page.once("dialog", (dialog) => dialog.accept(`${slug}-save.zip`));
  await page.getByRole("button", { name: /guardar proyecto|save project/i }).click();
  const saveDownload = await saveDownloadPromise;
  expect(saveDownload.suggestedFilename()).toMatch(/-save\.zip$/i);

  const savePath = await saveDownload.path();
  expect(savePath).toBeTruthy();
  const zipBytes = await readFile(savePath!);
  const zipBuffer = zipBytes.buffer.slice(zipBytes.byteOffset, zipBytes.byteOffset + zipBytes.byteLength);
  const entries = readZip(zipBuffer);
  const names = entries.map((entry) => entry.name);
  const zipRoot = names.find((name) => name.endsWith("/menu.json"))?.split("/")[0] ?? slug;

  expect(names.some((name) => name.startsWith(`${zipRoot}/assets/originals/`))).toBeTruthy();
  expect(names.some((name) => name.startsWith(`${zipRoot}/assets/derived/`))).toBeTruthy();

  const menuEntry = entries.find((entry) => entry.name === `${zipRoot}/menu.json`);
  expect(menuEntry).toBeDefined();
  const menu = JSON.parse(new TextDecoder().decode(menuEntry!.data)) as MenuProject;
  expect(menu.backgrounds[0].originalSrc).toMatch(/^assets\/originals\/backgrounds\/.+\.[a-z0-9]+$/i);
  expect(menu.backgrounds[0].derived?.profileId).not.toBe("ffmpeg-v2-copy-fallback");
  expect(menu.categories[0].items[0].media.originalHero360).toMatch(
    /^assets\/originals\/items\/.+\.[a-z0-9]+$/i
  );
  expect(menu.categories[0].items[0].media.derived?.profileId).not.toBe("ffmpeg-v2-copy-fallback");
});
