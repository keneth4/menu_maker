import { describe, expect, it } from "vitest";
import type { MenuProject } from "../../lib/types";
import { normalizeAssetPath } from "../../infrastructure/bridge/pathing";
import { buildExportSiteWorkflow } from "./exportSiteWorkflow";

const makeProject = (): MenuProject => ({
  meta: {
    slug: "demo",
    name: "Demo",
    template: "focus-rows",
    locales: ["es", "en"],
    defaultLocale: "es",
    currency: "USD",
    currencyPosition: "left",
    backgroundCarouselSeconds: 9,
    backgroundDisplayMode: "carousel"
  },
  backgrounds: [
    {
      id: "bg-1",
      label: "Bg",
      src: "/projects/demo/assets/originals/backgrounds/bg.jpg",
      type: "image"
    }
  ],
  categories: [
    {
      id: "cat-1",
      name: { es: "Bebidas", en: "Drinks" },
      items: [
        {
          id: "dish-1",
          name: { es: "Cafe", en: "Coffee" },
          price: { amount: 10, currency: "USD" },
          media: {
            hero360: "/projects/demo/assets/originals/items/dish.jpg"
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

describe("buildExportSiteWorkflow", () => {
  it("builds export shell, diagnostics, and rewrites media sources", async () => {
    const project = makeProject();
    const bytesBySource = new Map<string, Uint8Array>([
      [normalizeAssetPath("/projects/demo/assets/originals/backgrounds/bg.jpg"), new Uint8Array([1, 2, 3])],
      [normalizeAssetPath("/projects/demo/assets/originals/items/dish.jpg"), new Uint8Array([4, 5, 6, 7])]
    ]);

    const result = await buildExportSiteWorkflow({
      slug: "demo",
      project,
      normalizePath: normalizeAssetPath,
      readAssetBytes: async (_slug, sourcePath) => bytesBySource.get(normalizeAssetPath(sourcePath)) ?? null,
      getMimeType: (value) => {
        const lower = value.toLowerCase();
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".json")) return "application/json";
        if (lower.endsWith(".js")) return "application/javascript";
        if (lower.endsWith(".css")) return "text/css";
        if (lower.endsWith(".html")) return "text/html";
        if (lower.endsWith(".ico")) return "image/x-icon";
        return "application/octet-stream";
      },
      isResponsiveImageMime: () => false,
      createResponsiveImageVariants: async () => null,
      buildExportStyles: () => "/* styles */",
      buildRuntimeScript: () => "console.log('runtime');",
      getCarouselImageSource: (item) => item.media.hero360 || "",
      faviconIco: new Uint8Array([9, 9, 9])
    });

    const names = new Set(result.entries.map((entry) => entry.name));
    expect(names.has("menu.json")).toBe(true);
    expect(names.has("styles.css")).toBe(true);
    expect(names.has("app.js")).toBe(true);
    expect(names.has("index.html")).toBe(true);
    expect(names.has("asset-manifest.json")).toBe(true);
    expect(names.has("export-report.json")).toBe(true);

    expect(result.missingSourcePaths).toEqual([]);
    expect(result.project.categories[0].items[0].media.hero360).toMatch(/^assets\//);
  });
});
