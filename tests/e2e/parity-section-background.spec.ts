import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import os from "node:os";
import path from "node:path";
import { readZip } from "../../src/lib/zip";

type SectionBackgroundFixture = {
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
    backgroundDisplayMode: "carousel" | "section";
  };
  backgrounds: Array<{ id: string; label: string; src: string; type: "image" }>;
  categories: Array<{
    id: string;
    name: Record<string, string>;
    backgroundId: string;
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
  await page.getByRole("button", { name: /abrir proyecto|open project/i }).click();
  await page.locator('input[type="file"]').setInputFiles(fixturePath);
};

const closeEditorIfOpen = async (page: Page) => {
  const closeButton = page.getByRole("button", { name: /cerrar editor|close editor/i }).first();
  if (await closeButton.isVisible().catch(() => false)) {
    await closeButton.click();
  }
};

const openEditorIfClosed = async (page: Page) => {
  const isOpen = await page
    .locator(".editor-panel")
    .evaluate((element) => element.classList.contains("open"));
  if (!isOpen) {
    await page.getByRole("button", { name: /abrir editor|open editor/i }).click();
  }
};

const writeJsonFixture = async (testInfo: TestInfo, project: SectionBackgroundFixture) => {
  const fixturePath = testInfo.outputPath(`${project.meta.slug}.json`);
  await writeFile(fixturePath, JSON.stringify(project, null, 2), "utf8");
  return fixturePath;
};

const writeZipToTempDir = async (zipBytes: Buffer) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "menu-export-section-bg-"));
  const entries = readZip(
    zipBytes.buffer.slice(zipBytes.byteOffset, zipBytes.byteOffset + zipBytes.byteLength)
  );
  await Promise.all(
    entries.map(async (entry) => {
      const target = path.join(root, entry.name);
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, entry.data);
    })
  );
  return root;
};

const contentTypeForPath = (value: string) => {
  const ext = path.extname(value).toLowerCase();
  if (ext === ".html") return "text/html; charset=utf-8";
  if (ext === ".js") return "application/javascript; charset=utf-8";
  if (ext === ".css") return "text/css; charset=utf-8";
  if (ext === ".json") return "application/json; charset=utf-8";
  if (ext === ".ico") return "image/x-icon";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  return "application/octet-stream";
};

const startStaticServer = async (rootDir: string) => {
  const server = createServer(async (req, res) => {
    try {
      const requestPath = (req.url || "/").split("?")[0];
      const normalized = decodeURIComponent(requestPath);
      const relative = normalized === "/" ? "index.html" : normalized.replace(/^\/+/, "");
      const target = path.join(rootDir, relative);
      const data = await readFile(target);
      res.writeHead(200, { "Content-Type": contentTypeForPath(target) });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Unable to resolve server address");
  }

  return {
    url: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise<void>((resolve, reject) => {
        (server as Server).close((error) => (error ? reject(error) : resolve()));
      })
  };
};

const ACTIVE_BG_SELECTOR = ".menu-background.active";

const getActiveBackgroundSource = async (page: Page) =>
  await page.locator(ACTIVE_BG_SELECTOR).first().getAttribute("data-bg-src");

const getActiveBackgroundCount = async (page: Page) => page.locator(ACTIVE_BG_SELECTOR).count();

const getBackgroundTransitionDuration = async (page: Page) =>
  await page.evaluate(() => {
    const layer = document.querySelector(".menu-background");
    if (!(layer instanceof HTMLElement)) return "";
    return window.getComputedStyle(layer).transitionDuration;
  });

const goToNextSection = async (page: Page) => {
  await page.locator(".section-nav__btn.next").click();
};

const createFixture = (): SectionBackgroundFixture => {
  const bgA =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Crect width='16' height='16' fill='%23ef4444'/%3E%3C/svg%3E";
  const bgB =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Crect width='16' height='16' fill='%230ea5e9'/%3E%3C/svg%3E";
  const itemGif =
    "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

  return {
    meta: {
      slug: "parity-section-background",
      name: "Section Background Parity",
      restaurantName: { es: "Parity", en: "Parity" },
      title: { es: "Parity Menu", en: "Parity Menu" },
      fontFamily: "Fraunces",
      fontSource: "",
      template: "jukebox",
      locales: ["es", "en"],
      defaultLocale: "es",
      currency: "USD",
      currencyPosition: "left",
      backgroundDisplayMode: "section"
    },
    backgrounds: [
      { id: "bg-a", label: "A", src: bgA, type: "image" },
      { id: "bg-b", label: "B", src: bgB, type: "image" }
    ],
    categories: [
      {
        id: "cat-a",
        name: { es: "Uno", en: "One" },
        backgroundId: "bg-a",
        items: [
          {
            id: "item-a",
            name: { es: "Item A", en: "Item A" },
            description: { es: "Desc A", en: "Desc A" },
            longDescription: { es: "", en: "" },
            price: { amount: 10, currency: "USD" },
            allergens: [],
            vegan: false,
            media: { hero360: itemGif }
          }
        ]
      },
      {
        id: "cat-b",
        name: { es: "Dos", en: "Two" },
        backgroundId: "bg-b",
        items: [
          {
            id: "item-b",
            name: { es: "Item B", en: "Item B" },
            description: { es: "Desc B", en: "Desc B" },
            longDescription: { es: "", en: "" },
            price: { amount: 12, currency: "USD" },
            allergens: [],
            vegan: false,
            media: { hero360: itemGif }
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
  };
};

test("section background mode stays in parity between preview and export", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const fixture = createFixture();
  const fixturePath = await writeJsonFixture(testInfo, fixture);
  await disableBridgeMode(page);
  await page.goto("/");
  await openProjectFromLanding(page, fixturePath);
  await closeEditorIfOpen(page);

  await expect(page.locator(".menu-preview.template-jukebox")).toBeVisible();
  await expect
    .poll(async () => await getBackgroundTransitionDuration(page))
    .toContain("0.1s");
  await expect(page.locator(ACTIVE_BG_SELECTOR)).toBeVisible();
  await expect(await getActiveBackgroundSource(page)).toBe(fixture.backgrounds[0].src);

  await goToNextSection(page);
  await expect
    .poll(async () => await getActiveBackgroundSource(page), { timeout: 1200 })
    .toBe(fixture.backgrounds[1].src);

  await openEditorIfClosed(page);
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: /exportar sitio|export site/i })
    .evaluate((element) => (element as HTMLButtonElement).click());
  const download = await downloadPromise;
  const exportPath = await download.path();
  expect(exportPath).toBeTruthy();

  const zipBytes = await readFile(exportPath!);
  const tempDir = await writeZipToTempDir(zipBytes);
  const server = await startStaticServer(tempDir);

  try {
    await page.goto(server.url);
    await expect(page.locator(".menu-preview.template-jukebox")).toBeVisible();
    await expect
      .poll(async () => await getBackgroundTransitionDuration(page))
      .toContain("0.1s");
    await expect(await getActiveBackgroundSource(page)).toBe(fixture.backgrounds[0].src);

    await goToNextSection(page);
    await expect
      .poll(async () => await getActiveBackgroundSource(page), { timeout: 1200 })
      .toBe(fixture.backgrounds[1].src);
  } finally {
    await server.close();
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("section background mode does not fallback when mapping is invalid", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const fixture = createFixture();
  fixture.categories[0].backgroundId = "bg-missing-a";
  fixture.categories[1].backgroundId = "bg-missing-b";
  const fixturePath = await writeJsonFixture(testInfo, fixture);
  await disableBridgeMode(page);
  await page.goto("/");
  await openProjectFromLanding(page, fixturePath);
  await closeEditorIfOpen(page);

  await expect(page.locator(".menu-preview.template-jukebox")).toBeVisible();
  await expect.poll(async () => await getActiveBackgroundCount(page)).toBe(0);

  await goToNextSection(page);
  await expect.poll(async () => await getActiveBackgroundCount(page)).toBe(0);

  await openEditorIfClosed(page);
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: /exportar sitio|export site/i })
    .evaluate((element) => (element as HTMLButtonElement).click());
  const download = await downloadPromise;
  const exportPath = await download.path();
  expect(exportPath).toBeTruthy();

  const zipBytes = await readFile(exportPath!);
  const tempDir = await writeZipToTempDir(zipBytes);
  const server = await startStaticServer(tempDir);

  try {
    await page.goto(server.url);
    await expect(page.locator(".menu-preview.template-jukebox")).toBeVisible();
    await expect.poll(async () => await getActiveBackgroundCount(page)).toBe(0);

    await goToNextSection(page);
    await expect.poll(async () => await getActiveBackgroundCount(page)).toBe(0);
  } finally {
    await server.close();
    await rm(tempDir, { recursive: true, force: true });
  }
});
