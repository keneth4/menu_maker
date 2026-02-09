import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { writeFile } from "node:fs/promises";

type PerformanceFixture = {
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
        rotationDirection: "cw" | "ccw";
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

const makePerformanceFixture = (): PerformanceFixture => ({
  meta: {
    // Keep slug aligned with sample assets so imported asset paths resolve correctly in non-bridge mode.
    slug: "sample-cafebrunch-menu",
    name: "Performance Smoke",
    restaurantName: { es: "Performance", en: "Performance" },
    title: { es: "Menú", en: "Menu" },
    fontFamily: "Fraunces",
    fontSource: "",
    template: "focus-rows",
    locales: ["es", "en"],
    defaultLocale: "es",
    currency: "MXN",
    currencyPosition: "left"
  },
  backgrounds: [
    {
      id: "bg-1",
      label: "Background",
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
            hero360: "assets/dishes/all-berry-donut.gif",
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

const writeJsonFixture = async (testInfo: TestInfo, fixture: PerformanceFixture) => {
  const fixturePath = testInfo.outputPath("performance-smoke.json");
  await writeFile(fixturePath, JSON.stringify(fixture, null, 2), "utf8");
  return fixturePath;
};

const sampleFrameStability = async (page: Page, durationMs: number) =>
  await page.evaluate(async (duration) => {
    const deltas: number[] = [];
    const started = performance.now();
    await new Promise<void>((resolve) => {
      let last = performance.now();
      const end = last + duration;
      const tick = (now: number) => {
        deltas.push(now - last);
        last = now;
        if (now >= end) {
          resolve();
          return;
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    const hiccups = deltas.filter((delta) => delta > 50).length;
    const severeHiccups = deltas.filter((delta) => delta > 100).length;
    const maxDelta = deltas.length ? Math.max(...deltas) : 0;
    return {
      durationMs: performance.now() - started,
      frames: deltas.length,
      hiccups,
      severeHiccups,
      maxDelta
    };
  }, durationMs);

test("performance smoke keeps startup and modal interaction responsive", async ({ page }, testInfo) => {
  test.setTimeout(180000);
  const fixture = makePerformanceFixture();
  const fixturePath = await writeJsonFixture(testInfo, fixture);

  await disableBridgeMode(page);
  await page.goto("/");
  await openProjectFromLanding(page, fixturePath);
  await expect(page.locator(".menu-preview")).toBeVisible();

  const navTiming = await page.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (!nav) return null;
    return {
      domContentLoadedMs: nav.domContentLoadedEventEnd - nav.startTime,
      loadMs: nav.loadEventEnd - nav.startTime
    };
  });

  if (navTiming) {
    expect(navTiming.domContentLoadedMs).toBeLessThan(8000);
    expect(navTiming.loadMs).toBeLessThan(12000);
  }

  const previewStats = await sampleFrameStability(page, 2500);
  expect(previewStats.frames).toBeGreaterThan(20);
  expect(previewStats.hiccups).toBeLessThan(35);
  expect(previewStats.severeHiccups).toBeLessThan(10);
  expect(previewStats.maxDelta).toBeLessThan(240);

  await page.getByRole("button", { name: /cerrar editor|close editor/i }).first().click();
  const activeCard = page.locator(".menu-preview .carousel-card.active").first();
  await expect(activeCard).toBeVisible({ timeout: 60000 });
  await activeCard.click();
  await expect(page.locator(".dish-modal")).toBeVisible();

  const canvas = page.locator(".dish-modal__media-canvas").first();
  if (await canvas.count()) {
    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.5);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.5, { steps: 14 });
      await page.mouse.up();
    }
  }

  const modalStats = await sampleFrameStability(page, 2500);
  expect(modalStats.frames).toBeGreaterThan(20);
  expect(modalStats.hiccups).toBeLessThan(45);
  expect(modalStats.severeHiccups).toBeLessThan(14);
  expect(modalStats.maxDelta).toBeLessThan(280);
});
