import { describe, expect, it } from "vitest";
import { normalizeDraftSelectionState } from "./draftSelectionWorkflow";
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
    fontSource: "",
    fontRoles: {},
    template: "focus-rows",
    locales: ["es", "en"],
    defaultLocale: "es",
    currency: "MXN",
    currencyPosition: "",
    backgroundCarouselSeconds: 9,
    backgroundDisplayMode: "carousel"
  },
  backgrounds: [],
  categories: [
    {
      id: "cat-1",
      name: { es: "A", en: "A" },
      backgroundId: "",
      items: [
        {
          id: "dish-1",
          name: { es: "Dish 1", en: "Dish 1" },
          description: { es: "", en: "" },
          longDescription: { es: "", en: "" },
          priceVisible: true,
          price: { amount: 10, currency: "MXN" },
          allergens: [],
          vegan: false,
          media: {
            hero360: "",
            rotationDirection: "ccw",
            scrollAnimationMode: "hero360",
            scrollAnimationSrc: ""
          },
          typography: {}
        }
      ]
    },
    {
      id: "cat-2",
      name: { es: "B", en: "B" },
      backgroundId: "",
      items: []
    }
  ],
  sound: {
    enabled: false,
    theme: "bar-amber",
    volume: 0.6,
    map: {}
  }
});

describe("draftSelectionWorkflow", () => {
  it("normalizes selected and wizard ids to valid defaults", () => {
    const draft = makeProject();
    const result = normalizeDraftSelectionState({
      draft,
      selectedCategoryId: "missing",
      selectedItemId: "missing",
      wizardCategoryId: "",
      wizardItemId: "",
      editLang: "fr",
      wizardLang: "it",
      fontOptions: [{ value: "Fraunces" }]
    });

    expect(result.selectedCategoryId).toBe("cat-1");
    expect(result.selectedItemId).toBe("dish-1");
    expect(result.wizardCategoryId).toBe("cat-1");
    expect(result.wizardItemId).toBe("dish-1");
    expect(result.editLang).toBe("es");
    expect(result.wizardLang).toBe("es");
    expect(draft.meta.currencyPosition).toBe("left");
  });

  it("returns custom fontChoice when project font is not in options", () => {
    const draft = makeProject();
    draft.meta.fontFamily = "Unknown Font";
    const result = normalizeDraftSelectionState({
      draft,
      selectedCategoryId: "cat-1",
      selectedItemId: "dish-1",
      wizardCategoryId: "cat-1",
      wizardItemId: "dish-1",
      editLang: "es",
      wizardLang: "es",
      fontOptions: [{ value: "Fraunces" }]
    });

    expect(result.fontChoice).toBe("custom");
  });
});
