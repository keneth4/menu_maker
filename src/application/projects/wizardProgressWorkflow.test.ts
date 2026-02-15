import { describe, expect, it } from "vitest";
import type { MenuProject } from "../../lib/types";
import {
  buildTemplateSyncSignature,
  buildWizardProgressState,
  isTemplateDemoAssetPath
} from "./wizardProgressWorkflow";

const TEMPLATE_PREFIXES = [
  "/projects/sample-cafebrunch-menu/assets/",
  "/projects/demo/assets/"
] as const;

const makeProject = (): MenuProject => ({
  meta: {
    slug: "demo",
    name: "Demo",
    restaurantName: { es: "Demo", en: "Demo" },
    title: { es: "Titulo", en: "Title" },
    identityMode: "text",
    logoSrc: "",
    fontFamily: "Fraunces",
    fontSource: "",
    fontRoles: {},
    template: "focus-rows",
    locales: ["es", "en"],
    defaultLocale: "es",
    currency: "MXN",
    currencyPosition: "left",
    backgroundCarouselSeconds: 9,
    backgroundDisplayMode: "carousel"
  },
  backgrounds: [{ id: "bg-1", label: "BG 1", src: "/custom-bg.jpg", type: "image" }],
  categories: [
    {
      id: "cat-1",
      name: { es: "Entradas", en: "Starters" },
      backgroundId: "bg-1",
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
            hero360: "",
            rotationDirection: "ccw",
            scrollAnimationMode: "hero360",
            scrollAnimationSrc: ""
          },
          typography: {}
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

describe("wizardProgressWorkflow", () => {
  it("returns empty status when project draft is missing", () => {
    const result = buildWizardProgressState({
      draft: null,
      rootFiles: [],
      assetMode: "none",
      editorTab: "wizard",
      sectionBackgroundMappingValid: true,
      templateDemoPrefixes: TEMPLATE_PREFIXES,
      wizardStepCount: 5
    });
    expect(result.wizardProgress).toBe(0);
    expect(result.wizardNeedsRootBackground).toBe(false);
    expect(result.wizardStatus.preview).toBe(false);
  });

  it("marks wizard as blocked when only demo background is present in wizard tab", () => {
    const project = makeProject();
    project.backgrounds[0].src = "/projects/demo/assets/originals/backgrounds/demo.jpg";
    const result = buildWizardProgressState({
      draft: project,
      rootFiles: [],
      assetMode: "filesystem",
      editorTab: "wizard",
      sectionBackgroundMappingValid: true,
      templateDemoPrefixes: TEMPLATE_PREFIXES,
      wizardStepCount: 5
    });
    expect(result.wizardNeedsRootBackground).toBe(true);
    expect(result.wizardStatus.identity).toBe(false);
  });

  it("computes completed wizard progress and stable template signature", () => {
    const project = makeProject();
    const result = buildWizardProgressState({
      draft: project,
      rootFiles: ["/custom-bg.jpg"],
      assetMode: "filesystem",
      editorTab: "edit",
      sectionBackgroundMappingValid: true,
      templateDemoPrefixes: TEMPLATE_PREFIXES,
      wizardStepCount: 5
    });
    expect(result.wizardStatus.preview).toBe(true);
    expect(result.wizardProgress).toBe(1);
    expect(buildTemplateSyncSignature(project)).toContain("focus-rows::cat-1:1");
    expect(isTemplateDemoAssetPath("/projects/demo/assets/x.webp", TEMPLATE_PREFIXES)).toBe(true);
  });
});
