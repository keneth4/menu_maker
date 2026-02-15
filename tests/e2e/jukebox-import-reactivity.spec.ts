import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";
import { writeFile } from "node:fs/promises";
import { createZipBlob } from "../../src/lib/zip";

const disableBridgeMode = async (page: Page) => {
  await page.route("**/api/assets/ping", (route) => route.abort());
};

const openProjectFromLanding = async (page: Page, fixturePath: string) => {
  await page.getByRole("button", { name: /abrir proyecto|open project/i }).click();
  await page.locator('input[type="file"]').setInputFiles(fixturePath);
};

const TINY_GIF =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

const buildJukeboxProject = (slug: string) => ({
  meta: {
    slug,
    name: "Jukebox Reactivity Parity",
    restaurantName: { es: "Parity", en: "Parity" },
    title: { es: "Menu", en: "Menu" },
    identityMode: "text",
    logoSrc: "",
    fontFamily: "Fraunces",
    fontSource: "",
    fontRoles: {},
    template: "jukebox",
    locales: ["es", "en"],
    defaultLocale: "es",
    currency: "USD",
    currencyPosition: "left",
    backgroundCarouselSeconds: 9,
    backgroundDisplayMode: "section"
  },
  backgrounds: [
    {
      id: "bg-a",
      label: "A",
      src:
        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Crect width='24' height='24' fill='%231f2937'/%3E%3C/svg%3E",
      type: "image"
    },
    {
      id: "bg-b",
      label: "B",
      src:
        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Crect width='24' height='24' fill='%230ea5e9'/%3E%3C/svg%3E",
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
          price: { amount: 12, currency: "USD" },
          allergens: [],
          vegan: false,
          media: {
            hero360: TINY_GIF,
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
          price: { amount: 13, currency: "USD" },
          allergens: [],
          vegan: false,
          media: {
            hero360: TINY_GIF,
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
          price: { amount: 14, currency: "USD" },
          allergens: [],
          vegan: false,
          media: {
            hero360: TINY_GIF,
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
          price: { amount: 15, currency: "USD" },
          allergens: [],
          vegan: false,
          media: {
            hero360: TINY_GIF,
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
});

const writeJsonFixture = async (testInfo: TestInfo) => {
  const slug = "jukebox-reactivity-json";
  const fixturePath = testInfo.outputPath(`${slug}.json`);
  await writeFile(fixturePath, JSON.stringify(buildJukeboxProject(slug), null, 2), "utf8");
  return fixturePath;
};

const writeZipFixture = async (testInfo: TestInfo) => {
  const slug = "jukebox-reactivity-zip";
  const menuBytes = new TextEncoder().encode(JSON.stringify(buildJukeboxProject(slug), null, 2));
  const zipBlob = createZipBlob([{ name: `${slug}/menu.json`, data: menuBytes }]);
  const fixturePath = testInfo.outputPath(`${slug}.zip`);
  await writeFile(fixturePath, new Uint8Array(await zipBlob.arrayBuffer()));
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

const assertJukeboxScrollReactivity = async (page: Page) => {
  await page.locator(".editor-close").first().click();
  const firstCarousel = page.locator(".menu-section .menu-carousel").first();
  await expect(firstCarousel).toBeVisible();
  const activeCard = page.locator(".menu-section").first().locator(".carousel-card.active").first();

  const readActiveTitle = async () =>
    (
      await page
        .locator(".menu-section")
        .first()
        .locator(".carousel-card.active .carousel-title")
        .first()
        .innerText()
    ).trim();

  const beforeVertical = await readActiveTitle();
  await firstCarousel.dispatchEvent("wheel", { deltaX: 8, deltaY: 220 });
  await firstCarousel.dispatchEvent("wheel", { deltaX: 6, deltaY: 220 });
  await page.waitForTimeout(320);
  const afterVertical = await readActiveTitle();
  expect(afterVertical).not.toBe(beforeVertical);
  expect(await getClosestHorizontalSectionIndex(page)).toBe(0);

  await wheelOnLocatorCenter(page, activeCard, 280, 12);
  await wheelOnLocatorCenter(page, activeCard, 260, 10);
  await page.waitForTimeout(380);
  expect(await getClosestHorizontalSectionIndex(page)).toBe(1);
  await page.waitForTimeout(320);
  expect(await getClosestHorizontalSectionIndex(page)).toBe(1);
};

test("json imported jukebox keeps section and item scroll responsiveness", async ({
  page
}, testInfo) => {
  const fixturePath = await writeJsonFixture(testInfo);
  await disableBridgeMode(page);
  await page.goto("/");
  await openProjectFromLanding(page, fixturePath);
  await expect(page.locator(".menu-preview.template-jukebox")).toBeVisible();
  await assertJukeboxScrollReactivity(page);
});

test("zip imported jukebox keeps section and item scroll responsiveness", async ({
  page
}, testInfo) => {
  const fixturePath = await writeZipFixture(testInfo);
  await disableBridgeMode(page);
  await page.goto("/");
  await openProjectFromLanding(page, fixturePath);
  await expect(page.locator(".menu-preview.template-jukebox")).toBeVisible();
  await assertJukeboxScrollReactivity(page);
});
