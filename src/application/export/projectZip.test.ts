import type { MenuProject } from "../../lib/types";
import {
  buildProjectAssetPairs,
  buildProjectZipEntries,
  collectProjectAssetPaths,
  rewriteProjectForSaveZip
} from "./projectZip";

const normalize = (value: string) => value.trim().replace(/^\/+/, "");

const createProject = (): MenuProject => ({
  meta: {
    slug: "demo-menu",
    name: "Demo",
    template: "focus-rows",
    locales: ["es", "en"],
    defaultLocale: "es",
    currency: "USD",
    fontSource: "/projects/demo-menu/assets/fonts/menu.woff2"
  },
  backgrounds: [
    {
      id: "bg-1",
      label: "Background",
      src: "/projects/demo-menu/assets/backgrounds/main.jpg",
      type: "image"
    }
  ],
  categories: [
    {
      id: "cat-1",
      name: { es: "Entradas", en: "Starters" },
      items: [
        {
          id: "item-1",
          name: { es: "Tostada", en: "Toast" },
          price: { amount: 10, currency: "USD" },
          media: {
            hero360: "/projects/demo-menu/assets/items/tostada.webp",
            responsive: {
              small: "assets/items/tostada-sm.webp",
              medium: "assets/items/tostada-md.webp",
              large: "assets/items/tostada-lg.webp"
            }
          }
        }
      ]
    }
  ],
  sound: {
    enabled: false,
    theme: "default",
    volume: 0.8,
    map: {}
  }
});

describe("project zip helpers", () => {
  it("collects normalized non-http asset paths", () => {
    const project = createProject();
    project.backgrounds.push({
      id: "bg-2",
      label: "External",
      src: "https://cdn.example.com/background.jpg",
      type: "image"
    });

    expect(collectProjectAssetPaths(project, normalize)).toEqual([
      "projects/demo-menu/assets/fonts/menu.woff2",
      "projects/demo-menu/assets/backgrounds/main.jpg",
      "projects/demo-menu/assets/items/tostada.webp"
    ]);
  });

  it("builds slug-scoped asset pairs", () => {
    const pairs = buildProjectAssetPairs(
      "demo-menu",
      [
        "projects/demo-menu/assets/fonts/menu.woff2",
        "projects/demo-menu/assets/items/tostada.webp",
        "assets/backgrounds/main.jpg"
      ],
      normalize
    );

    expect(pairs).toEqual([
      {
        sourcePath: "projects/demo-menu/assets/fonts/menu.woff2",
        relativePath: "fonts/menu.woff2",
        zipPath: "demo-menu/assets/fonts/menu.woff2"
      },
      {
        sourcePath: "projects/demo-menu/assets/items/tostada.webp",
        relativePath: "items/tostada.webp",
        zipPath: "demo-menu/assets/items/tostada.webp"
      },
      {
        sourcePath: "assets/backgrounds/main.jpg",
        relativePath: "backgrounds/main.jpg",
        zipPath: "demo-menu/assets/backgrounds/main.jpg"
      }
    ]);
  });

  it("rewrites project asset references for save zip format", () => {
    const project = createProject();
    const pairs = buildProjectAssetPairs(
      "demo-menu",
      collectProjectAssetPaths(project, normalize),
      normalize
    );
    const rewritten = rewriteProjectForSaveZip(project, pairs, normalize);

    expect(rewritten.meta.fontSource).toBe("assets/fonts/menu.woff2");
    expect(rewritten.backgrounds[0].src).toBe("assets/backgrounds/main.jpg");
    expect(rewritten.categories[0].items[0].media.hero360).toBe("assets/items/tostada.webp");
    expect(rewritten.categories[0].items[0].media).not.toHaveProperty("responsive");
  });

  it("builds menu and asset entries, skipping missing assets", async () => {
    const project = createProject();
    const missing: string[] = [];
    const entries = await buildProjectZipEntries({
      project,
      slug: "demo-menu",
      normalizePath: normalize,
      readAssetBytes: async (_slug, sourcePath) => {
        if (sourcePath.includes("backgrounds")) return null;
        return new TextEncoder().encode(sourcePath);
      },
      onMissingAsset: (sourcePath) => missing.push(sourcePath)
    });

    expect(entries[0]?.name).toBe("demo-menu/menu.json");
    const menuJson = new TextDecoder().decode(entries[0]!.data);
    const parsed = JSON.parse(menuJson) as MenuProject;
    expect(parsed.meta.fontSource).toBe("assets/fonts/menu.woff2");

    const names = entries.map((entry) => entry.name);
    expect(names).toContain("demo-menu/assets/fonts/menu.woff2");
    expect(names).toContain("demo-menu/assets/items/tostada.webp");
    expect(names).not.toContain("demo-menu/assets/backgrounds/main.jpg");
    expect(missing).toEqual([]);
  });
});
