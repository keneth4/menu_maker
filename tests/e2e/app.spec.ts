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
  const [chooser] = await Promise.all([
    page.waitForEvent("filechooser"),
    page.getByRole("button", { name: /abrir proyecto|open project/i }).click()
  ]);
  await chooser.setFiles(fixturePath);
};

const openEditor = async (page: Page) => {
  await page.getByRole("button", { name: /abrir editor|open editor/i }).click();
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

test("landing shows Menu Maker header", async ({ page }) => {
  await disableBridgeMode(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /menu maker/i })).toBeVisible();
});

test("create project starts with editor closed and opens on toggle", async ({ page }) => {
  await disableBridgeMode(page);
  await page.goto("/");
  await page.getByRole("button", { name: /crear proyecto|create project/i }).click();
  await expect(page.locator(".editor-panel")).not.toHaveClass(/open/);
  await openEditor(page);
  await expect(page.getByText(/centro de control del proyecto|project control center/i)).toBeVisible();
});

test("open project from JSON file", async ({ page }, testInfo) => {
  const project = makeProjectFixture("JSON Smoke Project", "json-smoke-project");
  const fixturePath = await writeJsonFixture(testInfo, project);
  await disableBridgeMode(page);
  await page.goto("/");
  await openProjectFromLanding(page, fixturePath);
  await openEditor(page);
  await expect(getProjectNameInput(page)).toHaveValue("JSON Smoke Project");
});

test("open project from ZIP file", async ({ page }, testInfo) => {
  const project = makeProjectFixture("ZIP Smoke Project", "zip-smoke-project");
  const fixturePath = await writeZipFixture(testInfo, project);
  await disableBridgeMode(page);
  await page.goto("/");
  await openProjectFromLanding(page, fixturePath);
  await openEditor(page);
  await expect(getProjectNameInput(page)).toHaveValue("ZIP Smoke Project");
});

test("template smoke fixture path renders jukebox strategy shell", async ({ page }) => {
  const fixturePath = resolveTemplateSmokeFixturePath("jukebox");
  await disableBridgeMode(page);
  await page.goto("/");
  await openProjectFromLanding(page, fixturePath);
  await expect(page.locator(".menu-preview.template-jukebox")).toBeVisible();
  await expect(page.locator(".section-nav")).toBeVisible();
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

  await expect(page.locator(".editor-panel")).not.toHaveClass(/open/);
  await openEditor(page);
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
