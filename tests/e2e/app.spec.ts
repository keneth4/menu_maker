import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getTemplateCapabilities } from "../../src/core/templates/registry";
import { createZipBlob, readZip } from "../../src/lib/zip";

type ProjectFixture = {
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
      priceVisible?: boolean;
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

const makeProjectFixture = (name: string, slug: string): ProjectFixture => ({
  meta: {
    slug,
    name,
    restaurantName: { es: "Smoke Restaurant", en: "Smoke Restaurant" },
    title: { es: "Smoke Menu", en: "Smoke Menu" },
    fontFamily: "Fraunces",
    fontSource: "",
    template: "focus-rows",
    locales: ["es", "en"],
    defaultLocale: "es",
    currency: "MXN",
    currencyPosition: "left"
  },
  backgrounds: [],
  categories: [],
  sound: {
    enabled: false,
    theme: "bar-amber",
    volume: 0.6,
    map: {}
  }
});

const makeTemplateSwitchFixture = (slug: string): ProjectFixture => ({
  meta: {
    slug,
    name: "Template Switch Jukebox Fixture",
    restaurantName: { es: "Demo", en: "Demo" },
    title: { es: "Demo Menu", en: "Demo Menu" },
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
          id: "item-1",
          name: { es: "A1", en: "A1" },
          description: { es: "Desc", en: "Desc" },
          longDescription: { es: "", en: "" },
          priceVisible: true,
          price: { amount: 12, currency: "USD" },
          allergens: [],
          vegan: false,
          media: { hero360: "" }
        },
        {
          id: "item-2",
          name: { es: "A2", en: "A2" },
          description: { es: "Desc", en: "Desc" },
          longDescription: { es: "", en: "" },
          priceVisible: true,
          price: { amount: 13, currency: "USD" },
          allergens: [],
          vegan: false,
          media: { hero360: "" }
        }
      ]
    },
    {
      id: "cat-2",
      name: { es: "Dos", en: "Two" },
      items: [
        {
          id: "item-3",
          name: { es: "B1", en: "B1" },
          description: { es: "Desc", en: "Desc" },
          longDescription: { es: "", en: "" },
          priceVisible: true,
          price: { amount: 14, currency: "USD" },
          allergens: [],
          vegan: false,
          media: { hero360: "" }
        },
        {
          id: "item-4",
          name: { es: "B2", en: "B2" },
          description: { es: "Desc", en: "Desc" },
          longDescription: { es: "", en: "" },
          priceVisible: true,
          price: { amount: 15, currency: "USD" },
          allergens: [],
          vegan: false,
          media: { hero360: "" }
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

const makeWizardBackgroundFixture = (slug: string, backgroundSrc: string): ProjectFixture => {
  const base = makeProjectFixture("Wizard Background Fixture", slug);
  return {
    ...base,
    meta: {
      ...base.meta,
      template: "focus-rows"
    },
    backgrounds: [
      {
        id: "bg-1",
        label: "BG 1",
        src: backgroundSrc,
        type: "image"
      }
    ]
  };
};

const writeJsonFixture = async (testInfo: TestInfo, project: ProjectFixture) => {
  const fixturePath = testInfo.outputPath(`${project.meta.slug}.json`);
  await writeFile(fixturePath, JSON.stringify(project, null, 2), "utf8");
  return fixturePath;
};

const writeZipFixture = async (testInfo: TestInfo, project: ProjectFixture) => {
  const menuBytes = new TextEncoder().encode(JSON.stringify(project, null, 2));
  const zipBlob = createZipBlob([{ name: `${project.meta.slug}/menu.json`, data: menuBytes }]);
  const fixturePath = testInfo.outputPath(`${project.meta.slug}.zip`);
  await writeFile(fixturePath, new Uint8Array(await zipBlob.arrayBuffer()));
  return fixturePath;
};

const disableBridgeMode = async (page: Page) => {
  await page.route("**/api/assets/ping", (route) => route.abort());
};

const openProjectFromLanding = async (page: Page, fixturePath: string) => {
  await page.getByRole("button", { name: /abrir proyecto|open project/i }).click();
  await page.locator('input[type="file"]').setInputFiles(fixturePath);
};

const openEditor = async (page: Page) => {
  const isOpen = await page
    .locator(".editor-panel")
    .evaluate((element) => element.classList.contains("open"));
  if (!isOpen) {
    await page.getByRole("button", { name: /abrir editor|open editor/i }).click();
  }
};

const supportsInteractiveDecodeForSource = async (page: Page, source: string) => {
  return await page.evaluate(async (src) => {
    const Decoder = (window as Window & { ImageDecoder?: new (init: unknown) => any }).ImageDecoder;
    if (!Decoder || typeof createImageBitmap !== "function") return false;
    try {
      const response = await fetch(src);
      if (!response.ok) return false;
      const data = await response.arrayBuffer();
      const decoder = new Decoder({ data, type: "image/gif" });
      await decoder.tracks.ready;
      const frameCount = Number(decoder.tracks?.selectedTrack?.frameCount ?? 0);
      if (frameCount < 2) {
        decoder.close?.();
        return false;
      }
      const decoded = await decoder.decode({ frameIndex: 0, completeFramesOnly: true });
      const frame = decoded?.image;
      if (!frame) {
        decoder.close?.();
        return false;
      }
      try {
        await createImageBitmap(frame);
      } finally {
        frame.close?.();
      }
      decoder.close?.();
      return true;
    } catch {
      return false;
    }
  }, source);
};

const getProjectNameInput = (page: Page) =>
  page
    .locator("label.editor-field", { hasText: /nombre del proyecto|project name/i })
    .locator("input");

const resolveTemplateSmokeFixturePath = (templateId: string) =>
  path.resolve(
    "public",
    getTemplateCapabilities(templateId).smokeFixturePath.replace(/^\/+/, "")
  );

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

const wheelOnLocatorCenter = async (page: Page, selector: string, deltaX: number, deltaY: number) => {
  const locator = page.locator(selector).first();
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.wheel(deltaX, deltaY);
};

test("landing shows Menu Maker header", async ({ page }) => {
  await disableBridgeMode(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /menu maker/i })).toBeVisible();
});

test("create project starts with editor open", async ({ page }) => {
  await disableBridgeMode(page);
  await page.goto("/");
  await page.getByRole("button", { name: /crear proyecto|create project/i }).click();
  await expect(page.locator(".editor-panel")).toHaveClass(/open/);
  await expect(page.getByText(/centro de control del proyecto|project control center/i)).toBeVisible();
});

test("open project from JSON file", async ({ page }, testInfo) => {
  const project = makeProjectFixture("JSON Smoke Project", "json-smoke-project");
  const fixturePath = await writeJsonFixture(testInfo, project);
  await disableBridgeMode(page);
  await page.goto("/");
  await openProjectFromLanding(page, fixturePath);
  await expect(page.locator(".editor-panel")).toHaveClass(/open/);
  await expect(getProjectNameInput(page)).toHaveValue("JSON Smoke Project");
});

test("open project from ZIP file", async ({ page }, testInfo) => {
  const project = makeProjectFixture("ZIP Smoke Project", "zip-smoke-project");
  const fixturePath = await writeZipFixture(testInfo, project);
  await disableBridgeMode(page);
  await page.goto("/");
  await openProjectFromLanding(page, fixturePath);
  await expect(page.locator(".editor-panel")).toHaveClass(/open/);
  await expect(getProjectNameInput(page)).toHaveValue("ZIP Smoke Project");
});

test("wizard flow starts with editor open", async ({ page }) => {
  await disableBridgeMode(page);
  await page.goto("/");
  await page.getByRole("button", { name: /iniciar wizard|run wizard/i }).click();
  await expect(page.locator(".editor-panel")).toHaveClass(/open/);
});

test("wizard step 0 preview shows template demo backgrounds", async ({ page }) => {
  await disableBridgeMode(page);
  await page.goto("/");
  await page.getByRole("button", { name: /iniciar wizard|run wizard/i }).click();

  const firstBackground = page.locator(".menu-background").first();
  await expect(firstBackground).toBeVisible();
  await expect(firstBackground).toHaveAttribute(
    "data-bg-src",
    /\/projects\/sample-cafebrunch-menu\/assets\/backgrounds\//
  );
  await expect(firstBackground).toHaveClass(/active/);
  const renderedStyle = await firstBackground.evaluate(
    (element) => window.getComputedStyle(element).backgroundImage
  );
  expect(renderedStyle).not.toBe("none");
});

test("template smoke fixture path renders jukebox strategy shell", async ({ page }) => {
  const fixturePath = resolveTemplateSmokeFixturePath("jukebox");
  await page.setViewportSize({ width: 1440, height: 900 });
  await disableBridgeMode(page);
  await page.goto("/");
  await openProjectFromLanding(page, fixturePath);
  await expect(page.locator(".menu-preview.template-jukebox")).toBeVisible();
  await expect(page.locator(".section-nav")).toBeVisible();
});

test("jukebox sample locale selector updates preview copy", async ({ page }) => {
  const fixturePath = resolveTemplateSmokeFixturePath("jukebox");
  await disableBridgeMode(page);
  await page.goto("/");
  await openProjectFromLanding(page, fixturePath);

  await expect(page.locator(".menu-title")).toHaveText(/menu de prueba/i);
  await expect(page.locator(".menu-section__title").first()).toHaveText(/cafe/i);

  await page.locator(".menu-select").selectOption("en");

  await expect(page.locator(".menu-title")).toHaveText(/smoke menu/i);
  await expect(page.locator(".menu-section__title").first()).toHaveText(/coffee/i);
});

test("jukebox section nav buttons move focused section on desktop", async ({ page }) => {
  const fixturePath = resolveTemplateSmokeFixturePath("jukebox");
  await page.setViewportSize({ width: 1440, height: 900 });
  await disableBridgeMode(page);
  await page.goto("/");
  await openProjectFromLanding(page, fixturePath);
  await page.locator(".editor-close").first().click();

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

  await expect(page.locator(".section-nav")).toBeVisible();
  expect(await getClosestHorizontalSectionIndex()).toBe(0);

  const clickNavUntilIndex = async (selector: ".section-nav__btn.next" | ".section-nav__btn.prev", target: number) => {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      await page.locator(selector).click();
      try {
        await expect
          .poll(async () => await getClosestHorizontalSectionIndex(), { timeout: 1800 })
          .toBe(target);
        return;
      } catch (error) {
        if (attempt >= 1) throw error;
      }
    }
  };

  await clickNavUntilIndex(".section-nav__btn.next", 1);
  await clickNavUntilIndex(".section-nav__btn.prev", 0);
});

test("project-tab template switch to jukebox applies section/item controls without wizard roundtrip", async ({
  page
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const fixturePath = await writeJsonFixture(
    testInfo,
    makeTemplateSwitchFixture("template-switch-jukebox")
  );
  await disableBridgeMode(page);
  await page.goto("/");
  await openProjectFromLanding(page, fixturePath);

  const templateSelect = page
    .locator("label.editor-field", { hasText: /plantilla|template/i })
    .locator("select");
  await templateSelect.selectOption("jukebox");
  await expect(page.locator(".menu-preview.template-jukebox")).toBeVisible();

  await page.locator(".editor-close").first().click();
  await expect(page.locator(".section-nav")).toBeVisible();
  expect(await getClosestHorizontalSectionIndex(page)).toBe(0);

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
  const firstCarousel = page.locator(".menu-section .menu-carousel").first();
  await firstCarousel.dispatchEvent("wheel", { deltaX: 4, deltaY: 240 });
  await firstCarousel.dispatchEvent("wheel", { deltaX: 5, deltaY: 220 });
  await page.waitForTimeout(360);
  const afterVertical = await readActiveTitle();
  expect(afterVertical).not.toBe(beforeVertical);

  const beforeHorizontalSection = await getClosestHorizontalSectionIndex(page);
  await wheelOnLocatorCenter(page, ".menu-section .carousel-card.active", 2400, 18);
  await wheelOnLocatorCenter(page, ".menu-section .carousel-card.active", 1800, 12);
  await expect
    .poll(async () => await getClosestHorizontalSectionIndex(page), { timeout: 2600 })
    .not.toBe(beforeHorizontalSection);

  await page.keyboard.press("ArrowLeft");
  await expect
    .poll(async () => await getClosestHorizontalSectionIndex(page), { timeout: 1200 })
    .toBe(0);

  await page.keyboard.press("ArrowRight");
  await expect
    .poll(async () => await getClosestHorizontalSectionIndex(page), { timeout: 1200 })
    .toBe(1);

  await page.locator(".section-nav__btn.prev").click();
  await expect
    .poll(async () => await getClosestHorizontalSectionIndex(page), { timeout: 1200 })
    .toBe(0);
  await page.locator(".section-nav__btn.next").click();
  await expect
    .poll(async () => await getClosestHorizontalSectionIndex(page), { timeout: 1200 })
    .toBe(1);
});

test("jukebox behavior stays correct before and after wizard roundtrip on switched projects", async ({
  page
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const fixturePath = await writeJsonFixture(
    testInfo,
    makeTemplateSwitchFixture("template-switch-jukebox-wizard-roundtrip")
  );
  await disableBridgeMode(page);
  await page.goto("/");
  await openProjectFromLanding(page, fixturePath);

  const templateSelect = page
    .locator("label.editor-field", { hasText: /plantilla|template/i })
    .locator("select");
  await templateSelect.selectOption("jukebox");
  await page.locator(".editor-close").first().click();

  const initialSection = await getClosestHorizontalSectionIndex(page);
  const outboundDeltaX = initialSection <= 0 ? 2400 : -2400;
  await wheelOnLocatorCenter(page, ".menu-section .carousel-card.active", outboundDeltaX, 18);
  await wheelOnLocatorCenter(page, ".menu-section .carousel-card.active", outboundDeltaX * 0.75, 12);
  await expect
    .poll(async () => await getClosestHorizontalSectionIndex(page), { timeout: 2600 })
    .not.toBe(initialSection);
  const shiftedSection = await getClosestHorizontalSectionIndex(page);

  await openEditor(page);
  await page.locator(".editor-tabs").getByRole("button", { name: /wizard/i }).click();
  await page
    .locator(".editor-tabs")
    .getByRole("button", { name: /info|project|proyecto/i })
    .click();
  await page.locator(".editor-close").first().click();

  await expect(page.locator(".section-nav")).toBeVisible();
  const returnSelector =
    shiftedSection > initialSection ? ".section-nav__btn.prev" : ".section-nav__btn.next";
  await page.locator(returnSelector).click();
  await expect
    .poll(async () => await getClosestHorizontalSectionIndex(page), { timeout: 1200 })
    .toBe(initialSection);
});

test("project-tab jukebox section-nav is desktop-only", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1400, height: 900 });
  const fixturePath = await writeJsonFixture(
    testInfo,
    makeTemplateSwitchFixture("template-switch-jukebox-nav-visibility")
  );
  await disableBridgeMode(page);
  await page.goto("/");
  await openProjectFromLanding(page, fixturePath);

  const templateSelect = page
    .locator("label.editor-field", { hasText: /plantilla|template/i })
    .locator("select");
  await templateSelect.selectOption("jukebox");

  await expect(page.locator(".section-nav")).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(220);
  await expect(page.locator(".section-nav")).toHaveCount(0);
});

test("save project and export static site create zip downloads", async ({ page }) => {
  await disableBridgeMode(page);
  await page.goto("/");
  await page.getByRole("button", { name: /crear proyecto|create project/i }).click();
  await openEditor(page);

  const saveDownloadPromise = page.waitForEvent("download");
  page.once("dialog", (dialog) => dialog.accept("phase0-save.zip"));
  await page.getByRole("button", { name: /guardar proyecto|save project/i }).click();
  const saveDownload = await saveDownloadPromise;
  expect(saveDownload.suggestedFilename()).toBe("phase0-save.zip");

  const exportDownloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /exportar sitio|export site/i }).click();
  const exportDownload = await exportDownloadPromise;
  expect(exportDownload.suggestedFilename()).toMatch(/-export\.zip$/i);

  const exportPath = await exportDownload.path();
  expect(exportPath).toBeTruthy();
  const exportZip = await readFile(exportPath!);
  const exportBuffer = exportZip.buffer.slice(
    exportZip.byteOffset,
    exportZip.byteOffset + exportZip.byteLength
  );
  const exportEntries = readZip(exportBuffer);
  const names = exportEntries.map((entry) => entry.name);
  expect(names).toContain("asset-manifest.json");
  expect(names).toContain("export-report.json");
  const reportEntry = exportEntries.find((entry) => entry.name === "export-report.json");
  expect(reportEntry).toBeDefined();
  const report = JSON.parse(new TextDecoder().decode(reportEntry!.data)) as {
    budgets: { checks: Array<{ status: string }> };
  };
  expect(report.budgets.checks.filter((check) => check.status === "fail")).toEqual([]);
});

test("desktop editor opens as centered card and closes on backdrop click", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await disableBridgeMode(page);
  await page.goto("/");
  await page.getByRole("button", { name: /crear proyecto|create project/i }).click();

  await expect(page.locator(".editor-panel")).toHaveClass(/open/);
  await expect(page.locator(".editor-panel.open.desktop-card")).toBeVisible();
  await expect(page.locator(".editor-backdrop")).toBeVisible();

  await page.locator(".editor-backdrop").click();
  await expect(page.locator(".editor-panel")).not.toHaveClass(/open/);
});

test("desktop editor card width is around 50vw and constrained to viewport", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await disableBridgeMode(page);
  await page.goto("/");
  await page.getByRole("button", { name: /crear proyecto|create project/i }).click();
  await openEditor(page);

  const metrics = await page.evaluate(() => {
    const editor = document.querySelector(".editor-panel") as HTMLElement | null;
    if (!editor) return null;
    const rect = editor.getBoundingClientRect();
    return {
      width: rect.width,
      left: rect.left,
      right: rect.right,
      viewportWidth: window.innerWidth
    };
  });

  expect(metrics).not.toBeNull();
  expect(metrics!.width).toBeGreaterThan(700);
  expect(metrics!.width).toBeLessThan(740);
  expect(metrics!.left).toBeGreaterThanOrEqual(0);
  expect(metrics!.right).toBeLessThanOrEqual(metrics!.viewportWidth);
});

test("mobile editor opens as full-screen sheet and closes with close button", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await disableBridgeMode(page);
  await page.goto("/");
  await page.getByRole("button", { name: /crear proyecto|create project/i }).click();
  await openEditor(page);

  await expect(page.locator(".editor-panel.open.mobile-sheet")).toBeVisible();
  const metrics = await page.evaluate(() => {
    const editor = document.querySelector(".editor-panel") as HTMLElement | null;
    if (!editor) return null;
    const rect = editor.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight
    };
  });
  expect(metrics).not.toBeNull();
  expect(Math.abs(metrics!.width - metrics!.viewportWidth)).toBeLessThanOrEqual(2);
  expect(Math.abs(metrics!.height - metrics!.viewportHeight)).toBeLessThanOrEqual(2);

  await page.getByRole("button", { name: /cerrar editor|close editor/i }).click();
  await expect(page.locator(".editor-panel")).not.toHaveClass(/open/);
});

test("wizard identity step shows restaurant and menu title fields in text mode", async ({ page }) => {
  await disableBridgeMode(page);
  await page.goto("/");
  await page.getByRole("button", { name: /crear proyecto|create project/i }).click();
  await openEditor(page);

  await page.locator(".editor-tabs").getByRole("button", { name: /wizard/i }).click();
  await page.locator(".wizard-step").nth(1).click();
  await page
    .getByRole("radio", { name: /modo texto|text mode|texto|text/i })
    .check();

  await expect(
    page.getByRole("textbox", {
      name: /^nombre del restaurante$|^restaurant name$/i
    })
  ).toBeVisible();
  await expect(
    page.getByRole("textbox", {
      name: /^título del menú$|^menu title$/i
    })
  ).toBeVisible();
});

test("wizard identity step does not warn when project already has a non-demo background", async ({
  page
}, testInfo) => {
  const fixturePath = await writeJsonFixture(
    testInfo,
    makeWizardBackgroundFixture(
      "wizard-existing-own-background",
      "/projects/my-real-menu/assets/originals/backgrounds/cover.jpg"
    )
  );
  await disableBridgeMode(page);
  await page.goto("/");
  await openProjectFromLanding(page, fixturePath);

  await page.locator(".editor-tabs").getByRole("button", { name: /wizard/i }).click();
  await page.locator(".wizard-step").nth(1).click();
  await expect(page.locator(".wizard-warning")).toHaveCount(0);
});

test("wizard identity step keeps warning state when only wizard demo/empty backgrounds are present", async ({
  page
}) => {
  await disableBridgeMode(page);
  await page.goto("/");
  await page.getByRole("button", { name: /crear proyecto|create project/i }).click();
  await openEditor(page);

  await page.locator(".editor-tabs").getByRole("button", { name: /wizard/i }).click();
  await page.locator(".wizard-card").first().click();
  await page.locator(".wizard-step").nth(1).click();
  await expect(page.locator(".wizard-warning")).toContainText(
    /sube y selecciona al menos un fondo propio|upload and select at least one of your own backgrounds|agrega al menos un fondo con src|add at least one background with src/i
  );
});

test("editor header no longer shows the top toggle-view button", async ({ page }) => {
  await disableBridgeMode(page);
  await page.goto("/");
  await page.getByRole("button", { name: /crear proyecto|create project/i }).click();
  await openEditor(page);

  await expect(page.locator(".editor-actions .icon-btn")).toHaveCount(0);
});

test("preview stays full width when desktop editor card opens", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await disableBridgeMode(page);
  await page.goto("/");
  await page.getByRole("button", { name: /crear proyecto|create project/i }).click();

  const before = await page.evaluate(() => {
    const preview = document.querySelector(".menu-preview") as HTMLElement | null;
    const panel = document.querySelector(".preview-panel") as HTMLElement | null;
    if (!preview || !panel) return null;
    return {
      previewWidth: preview.getBoundingClientRect().width,
      panelWidth: panel.getBoundingClientRect().width
    };
  });
  expect(before).not.toBeNull();

  await openEditor(page);
  const after = await page.evaluate(() => {
    const preview = document.querySelector(".menu-preview") as HTMLElement | null;
    const panel = document.querySelector(".preview-panel") as HTMLElement | null;
    if (!preview || !panel) return null;
    return {
      previewWidth: preview.getBoundingClientRect().width,
      panelWidth: panel.getBoundingClientRect().width
    };
  });
  expect(after).not.toBeNull();
  expect(Math.abs(after!.previewWidth - after!.panelWidth)).toBeLessThanOrEqual(2);
  expect(Math.abs(after!.previewWidth - before!.previewWidth)).toBeLessThanOrEqual(2);
});

test("item show price toggle hides price in carousel and detail modal", async ({ page }, testInfo) => {
  const transparentGif =
    "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
  const project: ProjectFixture = {
    ...makeProjectFixture("Price Toggle", "price-toggle"),
    backgrounds: [
      {
        id: "bg-1",
        label: "Main",
        src:
          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Crect width='16' height='16' fill='%230ea5e9'/%3E%3C/svg%3E",
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
            priceVisible: false,
            price: { amount: 25, currency: "MXN" },
            allergens: [],
            vegan: false,
            media: { hero360: transparentGif }
          }
        ]
      }
    ]
  };
  const fixturePath = await writeJsonFixture(testInfo, project);
  await disableBridgeMode(page);
  await page.goto("/");
  await openProjectFromLanding(page, fixturePath);

  await expect(page.locator(".carousel-card")).toBeVisible();
  await expect(page.locator(".carousel-price")).toHaveCount(0);
  await page.getByRole("button", { name: /cerrar editor|close editor/i }).click();
  await expect(page.locator(".editor-panel")).not.toHaveClass(/open/);

  await page.locator(".carousel-card").first().click();
  await expect(page.locator(".dish-modal")).toBeVisible();
  await expect(page.locator(".dish-modal__price")).toHaveCount(0);
});

test("show price checkbox row uses inline layout in edit and wizard item forms", async ({
  page
}, testInfo) => {
  const transparentGif =
    "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
  const project: ProjectFixture = {
    ...makeProjectFixture("Show Price Layout", "show-price-layout"),
    backgrounds: [
      {
        id: "bg-1",
        label: "Main",
        src:
          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Crect width='16' height='16' fill='%230ea5e9'/%3E%3C/svg%3E",
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
            priceVisible: true,
            price: { amount: 25, currency: "MXN" },
            allergens: [],
            vegan: false,
            media: { hero360: transparentGif }
          }
        ]
      }
    ]
  };
  const fixturePath = await writeJsonFixture(testInfo, project);
  await disableBridgeMode(page);
  await page.goto("/");
  await openProjectFromLanding(page, fixturePath);

  const tabs = page.locator(".editor-tabs");
  await tabs.getByRole("button", { name: /edición|editar|edit/i }).click();
  await page.getByRole("button", { name: /items|platillos|dishes/i }).click();
  const editShowPriceRow = page.locator(
    ".edit-item__content label.editor-field.editor-inline",
    { hasText: /mostrar precio|show price/i }
  );
  await expect(editShowPriceRow).toHaveCount(1);
  await expect(editShowPriceRow.locator('input[type="checkbox"]')).toHaveCount(1);

  await tabs.getByRole("button", { name: /wizard/i }).click();
  await page.locator(".wizard-step").nth(3).click();
  const wizardShowPriceRow = page.locator(".wizard-body label.editor-field.editor-inline", {
    hasText: /mostrar precio|show price/i
  });
  await expect(wizardShowPriceRow).toHaveCount(1);
  await expect(wizardShowPriceRow.locator('input[type="checkbox"]')).toHaveCount(1);
});

test("detail modal cue is interactive-only and follows visible/hidden lifecycle", async ({
  page
}, testInfo) => {
  const animatedGifBuffer = await readFile(
    path.resolve("public/projects/sample-cafebrunch-menu/assets/dishes/sample360food.gif")
  );
  const animatedGif = `data:image/gif;base64,${animatedGifBuffer.toString("base64")}`;
  const transparentPng =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO2LQxkAAAAASUVORK5CYII=";
  const project: ProjectFixture = {
    ...makeProjectFixture("Rotation Cue", "rotation-cue"),
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
        name: { es: "Sección", en: "Section" },
        items: [
          {
            id: "item-interactive",
            name: { es: "Item Interactivo", en: "Interactive Item" },
            description: { es: "Desc", en: "Desc" },
            longDescription: { es: "", en: "" },
            price: { amount: 25, currency: "MXN" },
            allergens: [],
            vegan: false,
            media: { hero360: animatedGif }
          },
          {
            id: "item-static",
            name: { es: "Item Estático", en: "Static Item" },
            description: { es: "Desc", en: "Desc" },
            longDescription: { es: "", en: "" },
            price: { amount: 20, currency: "MXN" },
            allergens: [],
            vegan: false,
            media: { hero360: transparentPng }
          }
        ]
      }
    ]
  };
  const fixturePath = await writeJsonFixture(testInfo, project);
  await disableBridgeMode(page);
  await page.goto("/");
  await openProjectFromLanding(page, fixturePath);

  const supportsInteractiveDecode = await supportsInteractiveDecodeForSource(page, animatedGif);
  test.skip(
    !supportsInteractiveDecode,
    "Interactive GIF decoding is unavailable in this runtime."
  );

  await expect(page.locator(".carousel-card")).toHaveCount(2);
  await page.getByRole("button", { name: /cerrar editor|close editor/i }).click();
  await expect(page.locator(".editor-panel")).not.toHaveClass(/open/);
  await page.locator(".carousel-card").first().click();
  await expect(page.locator(".dish-modal.open")).toBeVisible();
  const interactiveMediaHost = page.locator(".dish-modal__media");
  const cue = page.locator(".dish-modal__rotate-cue");
  await expect(cue).toHaveCount(1);
  await expect(page.locator(".dish-modal__rotate-cue-gesture")).toHaveCount(1);
  const cueMain = page.locator(".dish-modal__rotate-cue-gesture-main");
  await expect(
    page.locator('.dish-modal__rotate-cue-gesture-main[data-icon="gesture-swipe-horizontal"]')
  ).toHaveCount(1);
  await expect(page.locator(".dish-modal__media-note")).toHaveCount(0);
  await expect(page.locator(".dish-modal__rotate-cue-disc")).toHaveCount(0);
  await expect(page.locator(".dish-modal__rotate-cue-orbit")).toHaveCount(0);
  await expect(interactiveMediaHost).toHaveAttribute("data-cue-state", "visible");
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

  const interactiveCanvas = page.locator(".dish-modal__media-canvas");
  await expect(interactiveCanvas).toHaveCount(1);
  const box = await interactiveCanvas.first().boundingBox();
  expect(box).not.toBeNull();
  const y = box!.y + box!.height / 2;
  const startX = box!.x + box!.width * 0.45;
  await page.mouse.move(startX, y);
  await page.mouse.down();
  await expect(interactiveMediaHost).toHaveAttribute("data-cue-state", "hidden");
  await page.mouse.move(startX + 34, y, { steps: 6 });
  await expect(interactiveMediaHost).toHaveAttribute("data-cue-state", "hidden");
  await page.mouse.up();
  await expect(interactiveMediaHost).toHaveAttribute("data-cue-state", "hidden");
  await expect
    .poll(async () => await interactiveMediaHost.getAttribute("data-cue-state"), { timeout: 12_000 })
    .toBe("visible");
  await expect(cue).toHaveClass(/is-looping/);

  await page.locator(".dish-modal__close").click();
  await expect(page.locator(".dish-modal")).toHaveCount(0);

  await page.locator(".carousel-card").nth(1).click();
  await expect(page.locator(".dish-modal.open")).toBeVisible();
  await expect(page.locator(".dish-modal__rotate-cue")).toHaveCount(0);
  await expect(page.locator(".dish-modal__rotate-cue-gesture")).toHaveCount(0);
  await expect(page.locator(".dish-modal__media-note")).toHaveCount(0);
  await expect(page.locator(".dish-modal__rotate-cue-disc")).toHaveCount(0);
  await expect(page.locator(".dish-modal__rotate-cue-orbit")).toHaveCount(0);
  expect(await page.locator(".dish-modal__media").getAttribute("data-cue-state")).toBeNull();
});
