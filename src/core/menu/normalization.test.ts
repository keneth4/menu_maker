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
    expect(normalized.meta.identityMode).toBe("text");
    expect(normalized.meta.logoSrc).toBe("");
    expect(normalized.meta.fontFamily).toBe("Fraunces");
    expect(normalized.meta.fontSource).toBe("");
    expect(normalized.meta.currencyPosition).toBe("left");
    expect(normalized.meta.backgroundCarouselSeconds).toBe(9);
    expect(normalized.meta.template).toBe("focus-rows");
    expect(normalized.categories[0].items[0].media.originalHero360).toBe(
      "/projects/sample-cafebrunch-menu/assets/dishes/sample360food.gif"
    );
    expect(normalized.categories[0].items[0].media.rotationDirection).toBe("ccw");

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

  it("normalizes identity and rotation settings from invalid values", () => {
    const project = buildProjectFixture();
    (project.meta as { identityMode?: string }).identityMode = "brand-image";
    (project.meta as { logoSrc?: string }).logoSrc = "   /projects/demo/assets/logo.webp   ";
    (project.categories[0].items[0].media as { rotationDirection?: string }).rotationDirection =
      "reverse";
    const normalized = normalizeProject(project);
    expect(normalized.meta.identityMode).toBe("text");
    expect(normalized.meta.logoSrc).toBe("/projects/demo/assets/logo.webp");
    expect(normalized.categories[0].items[0].media.rotationDirection).toBe("ccw");
  });

  it("normalizes background carousel timing into a safe seconds range", () => {
    const project = buildProjectFixture();
    (project.meta as { backgroundCarouselSeconds?: unknown }).backgroundCarouselSeconds = 90.7;
    const normalizedHigh = normalizeProject(project);
    expect(normalizedHigh.meta.backgroundCarouselSeconds).toBe(60);

    (project.meta as { backgroundCarouselSeconds?: unknown }).backgroundCarouselSeconds = 0;
    const normalizedLow = normalizeProject(project);
    expect(normalizedLow.meta.backgroundCarouselSeconds).toBe(2);
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
