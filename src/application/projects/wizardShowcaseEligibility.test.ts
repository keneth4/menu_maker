import { describe, expect, it } from "vitest";
import type { MenuProject } from "../../lib/types";
import { isWizardShowcaseEligible } from "./wizardShowcaseEligibility";

const buildProject = (): MenuProject =>
  ({
    meta: {
      slug: "demo",
      name: "Demo",
      locales: ["es", "en"],
      defaultLocale: "es",
      currency: "USD",
      currencyPosition: "left",
      template: "focus-rows"
    },
    backgrounds: [],
    categories: [],
    sound: {
      enabled: false,
      theme: "bar-amber",
      volume: 0.6,
      map: {}
    }
  }) as MenuProject;

describe("isWizardShowcaseEligible", () => {
  it("returns true for blank projects with no items and no background source", () => {
    expect(isWizardShowcaseEligible(buildProject())).toBe(true);
  });

  it("returns false when any category contains items", () => {
    const project = buildProject();
    project.categories = [
      {
        id: "cat-1",
        name: { es: "Uno", en: "One" },
        items: [
          {
            id: "item-1",
            name: { es: "Dish", en: "Dish" },
            description: { es: "", en: "" },
            longDescription: { es: "", en: "" },
            priceVisible: true,
            price: { amount: 10, currency: "USD" },
            allergens: [],
            vegan: false,
            media: {
              hero360: "",
              originalHero360: "",
              rotationDirection: "ccw",
              scrollAnimationMode: "hero360",
              scrollAnimationSrc: ""
            },
            typography: {}
          }
        ]
      }
    ];
    expect(isWizardShowcaseEligible(project)).toBe(false);
  });

  it("returns false when any background has a source", () => {
    const project = buildProject();
    project.backgrounds = [
      {
        id: "bg-1",
        label: "Main",
        src: "/projects/demo/assets/backgrounds/main.webp",
        type: "image"
      }
    ];
    expect(isWizardShowcaseEligible(project)).toBe(false);
  });
});
