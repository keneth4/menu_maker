import { readFileSync } from "node:fs";
import path from "node:path";
import type { MenuProject } from "../../lib/types";
import {
  applyWizardDemoRotationDirections,
  WIZARD_DEMO_ROTATION_BY_ASSET
} from "./wizardDemoRotation";

type DemoRotationEntry = {
  hero360?: string;
  rotationDirection?: "cw" | "ccw";
};

type DemoCategory = {
  items?: Array<{ media?: DemoRotationEntry }>;
};

type DemoProject = {
  categories?: DemoCategory[];
};

const demoMenuPath = path.resolve(
  process.cwd(),
  "public/projects/sample-cafebrunch-menu/menu.json"
);

const basename = (value: string) => value.split("/").filter(Boolean).pop() ?? value;
const expectedByFile = new Map<string, "cw" | "ccw">(WIZARD_DEMO_ROTATION_BY_ASSET);

describe("wizard demo rotation directions", () => {
  it("keeps explicit per-dish rotationDirection values in sample-cafebrunch menu", () => {
    const raw = readFileSync(demoMenuPath, "utf8");
    const project = JSON.parse(raw) as DemoProject;

    const entries = (project.categories ?? []).flatMap((category) =>
      (category.items ?? []).map((item) => ({
        file: basename(item.media?.hero360 ?? ""),
        rotationDirection: item.media?.rotationDirection
      }))
    );

    expect(entries).toHaveLength(expectedByFile.size);

    const missingDirection = entries.filter((entry) => !entry.rotationDirection);
    expect(missingDirection).toEqual([]);

    entries.forEach((entry) => {
      expect(entry.rotationDirection).toBe(expectedByFile.get(entry.file));
    });
  });

  it("applies rotation fallback map for stale demo metadata", () => {
    const stale = {
      meta: {
        slug: "sample-cafebrunch-menu",
        name: "Sample",
        template: "focus-rows",
        locales: ["en"],
        defaultLocale: "en",
        currency: "MXN"
      },
      backgrounds: [],
      categories: [
        {
          id: "section-1",
          name: { en: "Sample" },
          items: [
            {
              id: "dish-1",
              name: { en: "Dish 1" },
              price: { amount: 10, currency: "MXN" },
              media: {
                hero360: "/projects/sample-cafebrunch-menu/assets/dishes/sample360food.gif",
                rotationDirection: "ccw"
              }
            },
            {
              id: "dish-2",
              name: { en: "Dish 2" },
              price: { amount: 11, currency: "MXN" },
              media: {
                hero360: "/projects/sample-cafebrunch-menu/assets/dishes/ice-cream-sandwich.webp",
                rotationDirection: "cw"
              }
            },
            {
              id: "dish-3",
              name: { en: "Dish 3" },
              price: { amount: 12, currency: "MXN" },
              media: {
                hero360: "/projects/sample-cafebrunch-menu/assets/dishes/unknown.gif",
                rotationDirection: "ccw"
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
    } as MenuProject;

    const patched = applyWizardDemoRotationDirections(stale);
    const items = patched.categories[0].items;
    expect(items[0].media.rotationDirection).toBe("cw");
    expect(items[1].media.rotationDirection).toBe("ccw");
    expect(items[2].media.rotationDirection).toBe("ccw");
  });
});
