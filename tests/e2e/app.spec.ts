import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";
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

const getProjectNameInput = (page: Page) =>
  page
    .locator("label.editor-field", { hasText: /nombre del proyecto|project name/i })
    .locator("input");

test("landing shows Menu Maker header", async ({ page }) => {
  await disableBridgeMode(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /menu maker/i })).toBeVisible();
});

test("create project opens editor shell", async ({ page }) => {
  await disableBridgeMode(page);
  await page.goto("/");
  await page.getByRole("button", { name: /crear proyecto|create project/i }).click();
  await expect(page.getByText(/centro de control del proyecto|project control center/i)).toBeVisible();
});

test("open project from JSON file", async ({ page }, testInfo) => {
  const project = makeProjectFixture("JSON Smoke Project", "json-smoke-project");
  const fixturePath = await writeJsonFixture(testInfo, project);
  await disableBridgeMode(page);
  await page.goto("/");
  await openProjectFromLanding(page, fixturePath);
  await expect(getProjectNameInput(page)).toHaveValue("JSON Smoke Project");
});

test("open project from ZIP file", async ({ page }, testInfo) => {
  const project = makeProjectFixture("ZIP Smoke Project", "zip-smoke-project");
  const fixturePath = await writeZipFixture(testInfo, project);
  await disableBridgeMode(page);
  await page.goto("/");
  await openProjectFromLanding(page, fixturePath);
  await expect(getProjectNameInput(page)).toHaveValue("ZIP Smoke Project");
});

test("save project and export static site create zip downloads", async ({ page }) => {
  await disableBridgeMode(page);
  await page.goto("/");
  await page.getByRole("button", { name: /crear proyecto|create project/i }).click();

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
