import { formatMenuPrice } from "./pricing";
import { normalizeProject } from "./normalization";
import type { MenuProject } from "../../lib/types";

const buildProjectFixture = (): MenuProject =>
  ({
    meta: {
      slug: "fixture",
      name: "Fixture",
      template: "bar-pub",
      locales: [],
      defaultLocale: "es",
      currency: "MXN"
    },
    backgrounds: [],
    categories: [
      {
        id: "cat-1",
        name: { es: "Postres" },
        items: [
          {
            id: "dish-1",
            name: { es: "Pastel" },
            price: { amount: 35, currency: "MXN" },
            media: { hero360: "/projects/sample-cafebrunch-menu/assets/dishes/sample360food.gif" },
            allergens: [
              "Gluten",
              {
                id: "dairy",
                label: { en: "Dairy" }
              }
            ]
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
  }) as MenuProject;

describe("normalizeProject", () => {
  it("applies default metadata and normalizes legacy template/allergens", () => {
    const normalized = normalizeProject(buildProjectFixture());

    expect(normalized.meta.locales).toEqual(["es", "en"]);
    expect(normalized.meta.title).toEqual({ es: "", en: "" });
    expect(normalized.meta.restaurantName).toEqual({ es: "", en: "" });
    expect(normalized.meta.fontFamily).toBe("Fraunces");
    expect(normalized.meta.fontSource).toBe("");
    expect(normalized.meta.currencyPosition).toBe("left");
    expect(normalized.meta.template).toBe("focus-rows");

    const allergens = normalized.categories[0].items[0].allergens ?? [];
    expect(allergens).toHaveLength(2);
    expect(allergens[0]).toEqual({
      label: { es: "Gluten", en: "Gluten" }
    });
    expect(allergens[1]).toEqual({
      id: "dairy",
      label: { es: "Dairy", en: "Dairy" }
    });
  });

  it("defaults to focus-rows when template is missing", () => {
    const project = buildProjectFixture();
    project.meta.template = "";
    const normalized = normalizeProject(project);
    expect(normalized.meta.template).toBe("focus-rows");
  });
});

describe("formatMenuPrice", () => {
  it("formats with mapped symbol and position", () => {
    expect(formatMenuPrice(35, "MXN", "left")).toBe("$35");
    expect(formatMenuPrice(35, "EUR", "right")).toBe("35€");
  });

  it("falls back to currency code when symbol is unknown", () => {
    expect(formatMenuPrice(20, "BRL", "left")).toBe("BRL20");
  });
});
