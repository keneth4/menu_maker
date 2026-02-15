import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";
import { writeFile } from "node:fs/promises";

const disableBridgeMode = async (page: Page) => {
  await page.route("**/api/assets/ping", (route) => route.abort());
};

const openProjectFromLanding = async (page: Page, fixturePath: string) => {
  await page.getByRole("button", { name: /abrir proyecto|open project/i }).click();
  await page.locator('input[type="file"]').setInputFiles(fixturePath);
};

const writeJukeboxFixture = async (testInfo: TestInfo) => {
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
      backgroundDisplayMode: "section"
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

const wheelOnLocatorCenter = async (
  page: Page,
  locator: Locator,
  deltaX: number,
  deltaY: number
) => {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.wheel(deltaX, deltaY);
};

test("jukebox wheel routing keeps vertical for cards and horizontal for sections", async ({
  page
}, testInfo) => {
  const fixturePath = await writeJukeboxFixture(testInfo);
  await disableBridgeMode(page);
  await page.goto("/");
  await openProjectFromLanding(page, fixturePath);

  await page.getByRole("button", { name: /cerrar editor|close editor/i }).click();
  const firstCarousel = page.locator(".menu-section .menu-carousel").first();
  await expect(firstCarousel).toBeVisible();
  const activeCard = page.locator(".menu-section").first().locator(".carousel-card.active").first();

  const getClosestHorizontalSectionIndex = async () =>
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

  const readActiveTitle = async () =>
    (await page
      .locator(".menu-section")
      .first()
      .locator(".carousel-card.active .carousel-title")
      .first()
      .innerText())
      .trim();

  const beforeVertical = await readActiveTitle();
  await firstCarousel.dispatchEvent("wheel", { deltaX: 8, deltaY: 220 });
  await firstCarousel.dispatchEvent("wheel", { deltaX: 6, deltaY: 220 });
  await page.waitForTimeout(320);
  const afterVertical = await readActiveTitle();
  expect(afterVertical).not.toBe(beforeVertical);
  expect(await getClosestHorizontalSectionIndex()).toBe(0);

  const beforeHorizontalScroll = await page
    .locator(".menu-scroll")
    .evaluate((element) => element.scrollLeft);
  await wheelOnLocatorCenter(page, activeCard, 280, 12);
  await wheelOnLocatorCenter(page, activeCard, 260, 10);
  await page.waitForTimeout(380);
  const afterHorizontalScroll = await page
    .locator(".menu-scroll")
    .evaluate((element) => element.scrollLeft);
  const backgroundAfterHorizontal = await page
    .locator(".menu-background.active")
    .first()
    .getAttribute("data-bg-src");

  expect(afterHorizontalScroll).not.toBe(beforeHorizontalScroll);
  expect(await getClosestHorizontalSectionIndex()).toBe(1);

  await wheelOnLocatorCenter(page, firstCarousel, -60, 4);
  await wheelOnLocatorCenter(page, firstCarousel, 16, 2);
  await page.waitForTimeout(220);
  const afterJitterScroll = await page
    .locator(".menu-scroll")
    .evaluate((element) => element.scrollLeft);
  const backgroundAfterJitter = await page
    .locator(".menu-background.active")
    .first()
    .getAttribute("data-bg-src");

  expect(afterJitterScroll).toBeGreaterThanOrEqual(afterHorizontalScroll);
  expect(backgroundAfterJitter).toBe(backgroundAfterHorizontal);
  await page.waitForTimeout(260);
  expect(await getClosestHorizontalSectionIndex()).toBe(1);
});
