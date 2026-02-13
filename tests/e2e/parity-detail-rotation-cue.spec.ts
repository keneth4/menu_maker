import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import os from "node:os";
import path from "node:path";
import { readZip } from "../../src/lib/zip";

type RotationCueFixture = {
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
  const [chooser] = await Promise.all([
    page.waitForEvent("filechooser"),
    page.getByRole("button", { name: /abrir proyecto|open project/i }).click()
  ]);
  await chooser.setFiles(fixturePath);
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

const writeJsonFixture = async (testInfo: TestInfo, project: RotationCueFixture) => {
  const fixturePath = testInfo.outputPath(`${project.meta.slug}.json`);
  await writeFile(fixturePath, JSON.stringify(project, null, 2), "utf8");
  return fixturePath;
};

const writeZipToTempDir = async (zipBytes: Buffer) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "menu-export-rotation-cue-"));
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

const getCueState = async (page: Page) =>
  await page.locator(".dish-modal__media").getAttribute("data-cue-state");

const openFirstItemModal = async (page: Page) => {
  const firstCard = page.locator("button.carousel-card").first();
  await expect(firstCard).toBeVisible();
  await firstCard.click();
  await expect(page.locator(".dish-modal.open")).toBeVisible();
};

const dragDetailCanvasHorizontally = async (page: Page) => {
  const mediaHost = page.locator(".dish-modal__media");
  const canvas = page.locator(".dish-modal__media-canvas");
  await expect(canvas).toHaveCount(1);
  const box = await canvas.first().boundingBox();
  expect(box).not.toBeNull();
  const y = box!.y + box!.height / 2;
  const startX = box!.x + box!.width * 0.45;
  await page.mouse.move(startX, y);
  await page.mouse.down();
  await expect(mediaHost).toHaveAttribute("data-cue-state", "hidden");
  await page.mouse.move(startX + 34, y, { steps: 6 });
  await expect(mediaHost).toHaveAttribute("data-cue-state", "hidden");
  await page.mouse.up();
  await expect(mediaHost).toHaveAttribute("data-cue-state", "hidden");
};

const assertRotationCueLifecycle = async (page: Page) => {
  const cue = page.locator(".dish-modal__media .dish-modal__rotate-cue");
  await expect(cue).toHaveCount(1);
  await expect(page.locator(".dish-modal__media .dish-modal__rotate-cue-gesture")).toHaveCount(1);
  const cueMain = page.locator(".dish-modal__rotate-cue-gesture-main");
  await expect(
    page.locator('.dish-modal__rotate-cue-gesture-main[data-icon="gesture-swipe-horizontal"]')
  ).toHaveCount(1);
  await expect(page.locator(".dish-modal__media-note")).toHaveCount(0);
  await expect(page.locator(".dish-modal__rotate-cue-disc")).toHaveCount(0);
  await expect(page.locator(".dish-modal__rotate-cue-orbit")).toHaveCount(0);
  await expect(page.locator(".dish-modal__media")).toHaveAttribute("data-cue-state", "visible");
  await expect(cue).toHaveClass(/is-looping/);
  const cueBox = await cue.first().boundingBox();
  expect(cueBox).not.toBeNull();
  expect(cueBox!.width).toBeGreaterThan(160);
  await expect
    .poll(async () => await cueMain.evaluate((element) => getComputedStyle(element).animationDuration))
    .toContain("5s");
  await expect
    .poll(async () => await cueMain.evaluate((element) => getComputedStyle(element).filter))
    .toContain("drop-shadow");
  await expect
    .poll(
      async () => await cueMain.evaluate((element) => getComputedStyle(element).animationIterationCount)
    )
    .toBe("infinite");
  await dragDetailCanvasHorizontally(page);
  await expect
    .poll(async () => await getCueState(page), { timeout: 3800 })
    .toBe("visible");
  await expect(cue).toHaveClass(/is-looping/);
};

const createFixture = (animatedGif: string): RotationCueFixture => ({
  meta: {
    slug: "parity-detail-rotation-cue",
    name: "Detail Rotation Cue Parity",
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
  backgrounds: [
    {
      id: "bg-1",
      label: "Main",
      src:
        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Crect width='16' height='16' fill='%231f2937'/%3E%3C/svg%3E",
      type: "image"
    }
  ],
  categories: [
    {
      id: "cat-1",
      name: { es: "Uno", en: "One" },
      items: [
        {
          id: "item-a",
          name: { es: "Item A", en: "Item A" },
          description: { es: "Desc", en: "Desc" },
          longDescription: { es: "", en: "" },
          price: { amount: 12, currency: "USD" },
          allergens: [],
          vegan: false,
          media: {
            hero360: animatedGif
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

test("detail rotation cue stays in parity between preview and export", async ({ page }, testInfo) => {
  const supportsImageDecoder = await page.evaluate(() => "ImageDecoder" in window);
  test.skip(!supportsImageDecoder, "ImageDecoder is required for interactive media cue checks.");

  const animatedGifBuffer = await readFile(
    path.resolve("public/projects/cafebrunch-menu-1/assets/originals/items/ice-cream-sandwich-5545c1.gif")
  );
  const animatedGif = `data:image/gif;base64,${animatedGifBuffer.toString("base64")}`;
  const fixturePath = await writeJsonFixture(testInfo, createFixture(animatedGif));
  await disableBridgeMode(page);
  await page.goto("/");
  await openProjectFromLanding(page, fixturePath);
  await closeEditorIfOpen(page);

  await openFirstItemModal(page);
  await assertRotationCueLifecycle(page);
  await page.locator(".dish-modal__close").click();
  await expect(page.locator(".dish-modal")).toHaveCount(0);

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
    await openFirstItemModal(page);
    await assertRotationCueLifecycle(page);
  } finally {
    await server.close();
    await rm(tempDir, { recursive: true, force: true });
  }
});
