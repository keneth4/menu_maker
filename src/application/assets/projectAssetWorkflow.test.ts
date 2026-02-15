import { describe, expect, it } from "vitest";
import {
  buildAssetOptionSourcePaths,
  buildFontAssetOptions,
  buildProjectAssetEntries
} from "./projectAssetWorkflow";
import type { MenuProject } from "../../lib/types";

const makeProject = (): MenuProject => ({
  meta: {
    slug: "demo",
    name: "Demo",
    restaurantName: { es: "", en: "" },
    title: { es: "", en: "" },
    identityMode: "text",
    logoSrc: "",
    fontFamily: "Fraunces",
    fontSource: "/projects/demo/assets/originals/fonts/interface.woff2",
    fontRoles: {
      item: { source: "/projects/demo/assets/originals/fonts/item.woff2" }
    },
    template: "focus-rows",
    locales: ["es", "en"],
    defaultLocale: "es",
    currency: "MXN",
    currencyPosition: "left",
    backgroundCarouselSeconds: 9,
    backgroundDisplayMode: "carousel"
  },
  backgrounds: [
    { id: "bg-1", label: "BG", src: "/projects/demo/assets/originals/backgrounds/bg.jpg", type: "image" }
  ],
  categories: [
    {
      id: "cat-1",
      name: { es: "Entradas", en: "Starters" },
      backgroundId: "",
      items: [
        {
          id: "dish-1",
          name: { es: "Taco", en: "Taco" },
          description: { es: "", en: "" },
          longDescription: { es: "", en: "" },
          priceVisible: true,
          price: { amount: 20, currency: "MXN" },
          allergens: [],
          vegan: false,
          media: {
            hero360: "/projects/demo/assets/originals/items/hero.jpg",
            rotationDirection: "ccw",
            scrollAnimationMode: "alternate",
            scrollAnimationSrc: "/projects/demo/assets/originals/items/alt.jpg"
          },
          typography: {
            item: { source: "/projects/demo/assets/originals/fonts/dish.woff2" }
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

describe("projectAssetWorkflow", () => {
  it("builds grouped project asset entries including fonts and media", () => {
    const entries = buildProjectAssetEntries(
      makeProject(),
      "es",
      (entry, lang, fallback) => entry?.[lang] ?? entry?.[fallback] ?? ""
    );
    expect(entries.some((entry) => entry.group === "Fondos")).toBe(true);
    expect(entries.some((entry) => entry.group === "Items")).toBe(true);
    expect(entries.some((entry) => entry.group === "Fonts")).toBe(true);
  });

  it("builds asset option paths with root override and managed-path filtering", () => {
    const entries = buildProjectAssetEntries(
      makeProject(),
      "es",
      (entry, lang, fallback) => entry?.[lang] ?? entry?.[fallback] ?? ""
    );
    const fromProject = buildAssetOptionSourcePaths({
      rootFiles: [],
      editorTab: "edit",
      wizardDemoPreview: false,
      projectAssets: entries,
      isManagedAssetSourcePath: (value) => value.startsWith("/projects/")
    });
    const fromRoot = buildAssetOptionSourcePaths({
      rootFiles: ["/projects/demo/assets/originals/items/from-root.jpg", "/tmp/ignored.jpg"],
      editorTab: "edit",
      wizardDemoPreview: false,
      projectAssets: entries,
      isManagedAssetSourcePath: (value) => value.startsWith("/projects/")
    });
    expect(fromProject.length).toBeGreaterThan(0);
    expect(fromRoot).toEqual(["/projects/demo/assets/originals/items/from-root.jpg"]);
  });

  it("filters font asset options by managed-font prefix", () => {
    const options = [
      { value: "/projects/demo/assets/originals/fonts/a.woff2", label: "a" },
      { value: "/projects/demo/assets/originals/items/a.jpg", label: "b" }
    ];
    const fonts = buildFontAssetOptions(
      options,
      (value) => value.replace("/projects/demo/assets/", ""),
      (value) => value
    );
    expect(fonts).toEqual([{ value: "/projects/demo/assets/originals/fonts/a.woff2", label: "a" }]);
  });
});
