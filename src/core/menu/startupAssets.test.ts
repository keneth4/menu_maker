import type { MenuProject } from "../../lib/types";
import { buildStartupAssetPlan, collectItemPrioritySources } from "./startupAssets";

const createProject = (): MenuProject => ({
  meta: {
    slug: "demo",
    name: "Demo",
    template: "focus-rows",
    locales: ["es", "en"],
    defaultLocale: "es",
    currency: "USD"
  },
  backgrounds: [],
  categories: [
    {
      id: "cat-a",
      name: { es: "A", en: "A" },
      items: [
        {
          id: "a-1",
          name: { es: "A1", en: "A1" },
          price: { amount: 1, currency: "USD" },
          media: { hero360: "a1.webp" }
        },
        {
          id: "a-2",
          name: { es: "A2", en: "A2" },
          price: { amount: 2, currency: "USD" },
          media: { hero360: "a2.webp" }
        }
      ]
    },
    {
      id: "cat-b",
      name: { es: "B", en: "B" },
      items: [
        {
          id: "b-1",
          name: { es: "B1", en: "B1" },
          price: { amount: 1, currency: "USD" },
          media: { hero360: "b1.webp" }
        }
      ]
    }
  ],
  sound: {
    enabled: false,
    theme: "default",
    volume: 0.5,
    map: {}
  }
});

describe("startup asset planning", () => {
  it("prioritizes item sources by category depth", () => {
    const data = createProject();
    const ordered = collectItemPrioritySources(data, (item) => item.media.hero360 || "");
    expect(ordered).toEqual(["a1.webp", "b1.webp", "a2.webp"]);
  });

  it("splits sources into blocking and deferred sets", () => {
    const plan = buildStartupAssetPlan({
      backgroundSources: ["bg1.webp", "bg2.webp"],
      itemSources: ["a1.webp", "a2.webp", "a3.webp"],
      blockingBackgroundLimit: 1,
      blockingItemLimit: 2
    });

    expect(plan.blocking).toEqual(["bg1.webp", "a1.webp", "a2.webp"]);
    expect(plan.deferred).toEqual(["bg2.webp", "a3.webp"]);
    expect(plan.all).toEqual(["bg1.webp", "bg2.webp", "a1.webp", "a2.webp", "a3.webp"]);
  });
});

