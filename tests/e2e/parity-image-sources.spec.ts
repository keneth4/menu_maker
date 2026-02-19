import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import os from "node:os";
import path from "node:path";
import { readZip } from "../../src/lib/zip";

type ParityFixture = {
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
      media: {
        hero360: string;
        originalHero360?: string;
        scrollAnimationMode?: "hero360" | "alternate";
        scrollAnimationSrc?: string;
        responsive?: { small?: string; medium?: string; large?: string };
        derived?: {
          medium?: string | { webp?: string; gif?: string };
          large?: string | { webp?: string; gif?: string };
        };
      };
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

const writeJsonFixture = async (testInfo: TestInfo, project: ParityFixture) => {
  const fixturePath = testInfo.outputPath(`${project.meta.slug}.json`);
  await writeFile(fixturePath, JSON.stringify(project, null, 2), "utf8");
  return fixturePath;
};

const createParityFixture = (): ParityFixture => ({
  meta: {
    slug: "parity-image-sources",
    name: "Parity Image Sources",
    restaurantName: { es: "Parity", en: "Parity" },
    title: { es: "Parity Menu", en: "Parity Menu" },
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
          id: "dish-1",
          name: { es: "Platillo", en: "Dish" },
          description: { es: "Desc", en: "Desc" },
          longDescription: { es: "Long", en: "Long" },
          price: { amount: 10, currency: "USD" },
          allergens: [],
          vegan: false,
          media: {
            hero360: "/projects/parity-image-sources/assets/dishes/dish-original.gif",
            originalHero360: "/projects/parity-image-sources/assets/dishes/dish-original.gif",
            scrollAnimationMode: "alternate",
            scrollAnimationSrc: "/projects/parity-image-sources/assets/dishes/dish-wiggle.gif",
            responsive: {
              small: "/projects/parity-image-sources/assets/dishes/dish-sm.webp",
              medium: "/projects/parity-image-sources/assets/dishes/dish-md.webp",
              large: "/projects/parity-image-sources/assets/dishes/dish-lg.webp"
            },
            derived: {
              medium: {
                webp: "/projects/parity-image-sources/assets/dishes/dish-md-der.webp",
                gif: "/projects/parity-image-sources/assets/dishes/dish-md-der.gif"
              },
              large: {
                webp: "/projects/parity-image-sources/assets/dishes/dish-lg-der.webp"
              }
            }
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

const writeZipToTempDir = async (zipBytes: Buffer) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "menu-export-parity-"));
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

const readPreviewSources = async (page: Page) => {
  const firstCard = page.locator("button.carousel-card").first();
  await expect(firstCard).toBeVisible();

  const firstCardImage = firstCard.locator("img");
  const rawCarouselSrc = (await firstCardImage.getAttribute("src")) ?? "";
  const isPlaceholder =
    rawCarouselSrc.startsWith("data:image/svg+xml") ||
    rawCarouselSrc.startsWith("data:image/gif;base64,R0lGODlhAQABA");
  const carouselSrc = isPlaceholder
    ? ((await firstCardImage.getAttribute("data-media-src")) ?? rawCarouselSrc)
    : rawCarouselSrc;
  await firstCard.click();
  const modal = page.locator(".dish-modal");
  await expect(modal).toBeVisible();
  const detailSrc = await modal.locator(".dish-modal__media img").first().getAttribute("src");
  await modal.locator(".dish-modal__close").click();
  await expect(modal).not.toBeVisible();

  return { carouselSrc: carouselSrc ?? "", detailSrc: detailSrc ?? "" };
};

test("preview and exported runtime resolve the same carousel/detail source policy", async ({
  page
}, testInfo) => {
  const fixturePath = await writeJsonFixture(testInfo, createParityFixture());
  await disableBridgeMode(page);
  await page.goto("/");
  await openProjectFromLanding(page, fixturePath);
  await closeEditorIfOpen(page);

  const previewSources = await readPreviewSources(page);
  expect(previewSources.carouselSrc).toContain("dish-wiggle.gif");
  expect(previewSources.detailSrc).toContain("dish-original.gif");

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
    const exportedSources = await readPreviewSources(page);
    expect(exportedSources.carouselSrc).toContain("dish-wiggle.gif");
    expect(exportedSources.detailSrc).toContain("dish-original.gif");
  } finally {
    await server.close();
    await rm(tempDir, { recursive: true, force: true });
  }
});
