import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";
import { writeFile } from "node:fs/promises";

const disableBridgeMode = async (page: Page) => {
  await page.route("**/api/assets/ping", (route) => route.abort());
};

const openProjectFromLanding = async (page: Page, fixturePath: string) => {
  await page.getByRole("button", { name: /abrir|open/i }).click();
  await page
    .locator('input[type="file"][accept*=".json"], input[type="file"][accept*=".zip"]')
    .first()
    .setInputFiles(fixturePath);
};

const writeJukeboxFixture = async (
  testInfo: TestInfo,
  sensitivity: { item: number; section: number } = { item: 5, section: 5 }
) => {
  const fixture = {
    meta: {
      slug: "jukebox-scroll-parity",
      name: "Jukebox Scroll Parity",
      restaurantName: { es: "Parity", en: "Parity" },
      title: { es: "Parity", en: "Parity" },
      identityMode: "text",
      logoSrc: "",
      fontFamily: "Fraunces",
      fontSource: "",
      fontRoles: {},
      template: "jukebox",
      locales: ["es", "en"],
      defaultLocale: "es",
      currency: "MXN",
      currencyPosition: "left",
      backgroundCarouselSeconds: 9,
      backgroundDisplayMode: "section",
      scrollSensitivity: sensitivity
    },
    backgrounds: [
      {
        id: "bg-a",
        label: "A",
        src:
          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Crect width='16' height='16' fill='%230f172a'/%3E%3C/svg%3E",
        type: "image"
      },
      {
        id: "bg-b",
        label: "B",
        src:
          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Crect width='16' height='16' fill='%230ea5e9'/%3E%3C/svg%3E",
        type: "image"
      }
    ],
    categories: [
      {
        id: "cat-a",
        name: { es: "Uno", en: "One" },
        backgroundId: "bg-a",
        items: [
          {
            id: "dish-a1",
            name: { es: "A1", en: "A1" },
            description: { es: "Desc", en: "Desc" },
            longDescription: { es: "", en: "" },
            priceVisible: true,
            price: { amount: 12, currency: "MXN" },
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
          },
          {
            id: "dish-a2",
            name: { es: "A2", en: "A2" },
            description: { es: "Desc", en: "Desc" },
            longDescription: { es: "", en: "" },
            priceVisible: true,
            price: { amount: 13, currency: "MXN" },
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
      },
      {
        id: "cat-b",
        name: { es: "Dos", en: "Two" },
        backgroundId: "bg-b",
        items: [
          {
            id: "dish-b1",
            name: { es: "B1", en: "B1" },
            description: { es: "Desc", en: "Desc" },
            longDescription: { es: "", en: "" },
            priceVisible: true,
            price: { amount: 14, currency: "MXN" },
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
          },
          {
            id: "dish-b2",
            name: { es: "B2", en: "B2" },
            description: { es: "Desc", en: "Desc" },
            longDescription: { es: "", en: "" },
            priceVisible: true,
            price: { amount: 15, currency: "MXN" },
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

  const fixturePath = testInfo.outputPath("jukebox-scroll-parity.json");
  await writeFile(fixturePath, JSON.stringify(fixture, null, 2), "utf8");
  return fixturePath;
};

const getClosestHorizontalSectionIndex = async (page: Page) =>
  await page.evaluate(() => {
    const container = document.querySelector<HTMLElement>(".menu-scroll");
    if (!container) return -1;
    const sections = Array.from(container.querySelectorAll<HTMLElement>(".menu-section"));
    if (!sections.length) return -1;
    const centerX = container.scrollLeft + container.clientWidth / 2;
    let closest = 0;
    let minDistance = Number.POSITIVE_INFINITY;
    sections.forEach((section, index) => {
      const sectionCenter = section.offsetLeft + section.offsetWidth / 2;
      const distance = Math.abs(sectionCenter - centerX);
      if (distance < minDistance) {
        minDistance = distance;
        closest = index;
      }
    });
    return closest;
  });

const wheelOnLocatorPoint = async (
  page: Page,
  locator: Locator,
  deltaX: number,
  deltaY: number,
  xRatio = 0.5,
  yRatio = 0.5
) => {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;
  await page.mouse.move(box.x + box.width * xRatio, box.y + box.height * yRatio);
  await page.mouse.wheel(deltaX, deltaY);
};

test("jukebox wheel routing keeps vertical for cards and horizontal for sections", async ({
  page
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const fixturePath = await writeJukeboxFixture(testInfo);
  await disableBridgeMode(page);
  await page.goto("/");
  await openProjectFromLanding(page, fixturePath);

  await page.locator(".editor-close").first().click();
  const firstCarousel = page.locator(".menu-section .menu-carousel").first();
  await expect(firstCarousel).toBeVisible();
  const activeCard = page.locator(".menu-section").first().locator(".carousel-card.active").first();
  const activeCardImage = activeCard.locator(".carousel-media img").first();
  const sectionNav = page.locator(".section-nav").first();
  const outsideWheelTarget = sectionNav;
  await expect(sectionNav).toBeVisible();
  await expect(outsideWheelTarget).toBeVisible();

  const readActiveTitle = async () =>
    (await page
      .locator(".menu-section")
      .first()
      .locator(".carousel-card.active .carousel-title")
      .first()
      .innerText())
      .trim();

  const beforeVertical = await readActiveTitle();
  await wheelOnLocatorPoint(page, activeCardImage, 6, 260);
  await wheelOnLocatorPoint(page, activeCardImage, 5, 240);
  await expect
    .poll(async () => await readActiveTitle(), { timeout: 1400 })
    .not.toBe(beforeVertical);
  expect(await getClosestHorizontalSectionIndex(page)).toBe(0);

  await wheelOnLocatorPoint(page, activeCardImage, -2200, 14);
  await wheelOnLocatorPoint(page, activeCardImage, -2000, 10);
  await expect
    .poll(async () => await getClosestHorizontalSectionIndex(page), { timeout: 1200 })
    .toBe(0);

  const beforeImageHorizontal = await getClosestHorizontalSectionIndex(page);
  await wheelOnLocatorPoint(page, activeCardImage, 2400, 18);
  await wheelOnLocatorPoint(page, activeCardImage, 1800, 12);
  await expect
    .poll(async () => await getClosestHorizontalSectionIndex(page), { timeout: 2600 })
    .not.toBe(beforeImageHorizontal);
  const afterImageHorizontal = await getClosestHorizontalSectionIndex(page);

  const beforeOutsideHorizontalScroll = await page
    .locator(".menu-scroll")
    .evaluate((element) => element.scrollLeft);
  const outsideDirection = afterImageHorizontal > beforeImageHorizontal ? -1 : 1;
  await wheelOnLocatorPoint(page, outsideWheelTarget, outsideDirection * 80, 18);
  await wheelOnLocatorPoint(page, outsideWheelTarget, outsideDirection * 86, 12);
  await expect
    .poll(
      async () =>
        await page.locator(".menu-scroll").evaluate((element) => element.scrollLeft),
      { timeout: 2600 }
    )
    .not.toBe(beforeOutsideHorizontalScroll);

  await wheelOnLocatorPoint(page, activeCardImage, 2200, 14);
  await wheelOnLocatorPoint(page, activeCardImage, 2100, 10);
  await expect
    .poll(async () => await getClosestHorizontalSectionIndex(page), { timeout: 1200 })
    .toBe(1);
});

test("section sensitivity level changes horizontal section threshold in project panel", async ({
  page
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const fixturePath = await writeJukeboxFixture(testInfo, { item: 5, section: 1 });
  await disableBridgeMode(page);
  await page.goto("/");
  await openProjectFromLanding(page, fixturePath);

  await page.locator(".editor-close").first().click();
  const activeCardImage = page
    .locator(".menu-section")
    .first()
    .locator(".carousel-card.active .carousel-media img")
    .first();
  await expect(activeCardImage).toBeVisible();
  expect(await getClosestHorizontalSectionIndex(page)).toBe(0);

  await wheelOnLocatorPoint(page, activeCardImage, 110, 8);
  await wheelOnLocatorPoint(page, activeCardImage, 102, 7);
  await expect
    .poll(async () => await getClosestHorizontalSectionIndex(page), { timeout: 1200 })
    .toBe(0);

  await page.getByRole("button", { name: /abrir editor|open editor/i }).click();
  await expect(page.locator(".editor-panel")).toHaveClass(/open/);
  const sectionSensitivitySlider = page.locator(".editor-panel input[type='range']").nth(1);
  await sectionSensitivitySlider.evaluate((input) => {
    (input as HTMLInputElement).value = "10";
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.locator(".editor-close").first().click();

  await wheelOnLocatorPoint(page, activeCardImage, 110, 8);
  await wheelOnLocatorPoint(page, activeCardImage, 102, 7);
  await expect
    .poll(async () => await getClosestHorizontalSectionIndex(page), { timeout: 2200 })
    .toBe(1);
});
