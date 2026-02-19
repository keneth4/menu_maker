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
    backgrounds: [
      {
        id: "bg-1",
        label: "Main",
        src: "/projects/sample-cafebrunch-menu/assets/backgrounds/coffe-drops.gif",
        type: "image"
      }
    ],
    categories: [
      {
        id: "cat-1",
        name: { es: "Postres" },
        backgroundId: "bg-missing",
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
    expect(normalized.meta.backgroundCarouselSeconds).toBe(10);
    expect(normalized.meta.backgroundDisplayMode).toBe("carousel");
    expect(normalized.meta.scrollSensitivity).toEqual({ item: 5, section: 5 });
    expect(normalized.meta.template).toBe("focus-rows");
    expect(normalized.categories[0].backgroundId).toBe("bg-1");
    expect(normalized.categories[0].items[0].media.originalHero360).toBe(
      "/projects/sample-cafebrunch-menu/assets/dishes/sample360food.gif"
    );
    expect(normalized.categories[0].items[0].media.rotationDirection).toBe("cw");
    expect(normalized.categories[0].items[0].media.scrollAnimationMode).toBe("hero360");
    expect(normalized.categories[0].items[0].media.scrollAnimationSrc).toBe("");
    expect(normalized.categories[0].items[0].priceVisible).toBe(true);

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

  it("canonicalizes template ids from non-canonical variants", () => {
    const project = buildProjectFixture();
    project.meta.template = " Juke_Box ";
    const normalized = normalizeProject(project);
    expect(normalized.meta.template).toBe("jukebox");
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
    expect(normalized.categories[0].items[0].media.rotationDirection).toBe("cw");
  });

  it("normalizes section background mode, animation mode, and font configs", () => {
    const project = buildProjectFixture();
    (project.meta as { backgroundDisplayMode?: string }).backgroundDisplayMode = "per-section";
    project.meta.fontRoles = {
      identity: { family: "  Display  ", source: "  assets/fonts/display.woff2  " },
      section: { family: "  " },
      item: { source: "  " }
    };
    (project.categories[0].items[0].media as { scrollAnimationMode?: string }).scrollAnimationMode =
      "wiggle";
    project.categories[0].items[0].media.scrollAnimationSrc = "  assets/items/wiggle.gif  ";
    project.categories[0].items[0].typography = {
      item: { family: "  Item Sans  ", source: "  assets/fonts/item.woff2  " }
    };

    const normalized = normalizeProject(project);

    expect(normalized.meta.backgroundDisplayMode).toBe("carousel");
    expect(normalized.meta.fontRoles).toEqual({
      identity: { family: "Display", source: "assets/fonts/display.woff2" },
      section: { family: "" },
      item: { source: "" }
    });
    expect(normalized.categories[0].items[0].media.scrollAnimationMode).toBe("hero360");
    expect(normalized.categories[0].items[0].media.scrollAnimationSrc).toBe(
      "assets/items/wiggle.gif"
    );
    expect(normalized.categories[0].items[0].typography).toEqual({
      item: { family: "Item Sans", source: "assets/fonts/item.woff2" }
    });
  });

  it("enforces strict section background one-to-one mapping without fallback", () => {
    const project = buildProjectFixture();
    project.meta.backgroundDisplayMode = "section";
    project.backgrounds = [
      { id: "bg-1", label: "One", src: "assets/backgrounds/one.jpg", type: "image" },
      { id: "bg-2", label: "Two", src: "assets/backgrounds/two.jpg", type: "image" }
    ];
    project.categories = [
      {
        ...project.categories[0],
        id: "cat-1",
        backgroundId: "bg-1"
      },
      {
        ...project.categories[0],
        id: "cat-2",
        backgroundId: "bg-1"
      },
      {
        ...project.categories[0],
        id: "cat-3",
        backgroundId: "bg-missing"
      }
    ];

    const normalized = normalizeProject(project);
    expect(normalized.categories.map((category) => category.backgroundId)).toEqual([
      "bg-1",
      "",
      ""
    ]);
  });

  it("normalizes background carousel timing into a safe seconds range", () => {
    const project = buildProjectFixture();
    (project.meta as { backgroundCarouselSeconds?: unknown }).backgroundCarouselSeconds = undefined;
    const normalizedDefault = normalizeProject(project);
    expect(normalizedDefault.meta.backgroundCarouselSeconds).toBe(10);

    (project.meta as { backgroundCarouselSeconds?: unknown }).backgroundCarouselSeconds = 90.7;
    const normalizedHigh = normalizeProject(project);
    expect(normalizedHigh.meta.backgroundCarouselSeconds).toBe(60);

    (project.meta as { backgroundCarouselSeconds?: unknown }).backgroundCarouselSeconds = 0;
    const normalizedLow = normalizeProject(project);
    expect(normalizedLow.meta.backgroundCarouselSeconds).toBe(2);
  });

  it("normalizes scroll sensitivity levels into a safe range", () => {
    const project = buildProjectFixture();
    (project.meta as { scrollSensitivity?: unknown }).scrollSensitivity = {
      item: 14,
      section: 0
    };
    const normalized = normalizeProject(project);
    expect(normalized.meta.scrollSensitivity).toEqual({
      item: 10,
      section: 1
    });
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
