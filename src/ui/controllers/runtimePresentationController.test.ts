import { describe, expect, it } from "vitest";
import type { MenuItem, MenuProject } from "../../lib/types";
import { createRuntimePresentationController } from "./runtimePresentationController";

const buildProject = (): MenuProject => ({
    meta: {
      name: "Demo",
      slug: "demo",
      locales: ["es", "en"],
      defaultLocale: "es",
      currency: "EUR",
      currencyPosition: "right",
      backgroundDisplayMode: "carousel",
      template: "focus-rows"
    },
    backgrounds: [],
    categories: []
  } as MenuProject);

const buildItem = (): MenuItem => ({
    id: "dish",
    name: { es: "Plato" },
    description: { es: "" },
    longDescription: { es: "" },
    priceVisible: true,
    price: { amount: 10, currency: "EUR" },
    allergens: [{ id: "a1", label: { es: "Leche", en: "Milk" } }],
    vegan: false,
    media: {
      hero360: "",
      originalHero360: "",
      rotationDirection: "ccw",
      scrollAnimationMode: "hero360",
      scrollAnimationSrc: ""
    },
    typography: {}
  } as MenuItem);

describe("createRuntimePresentationController", () => {
  it("resolves localized text, instruction copy, and formatted price", () => {
    const project = buildProject();
    const controller = createRuntimePresentationController({
      getLocale: () => "es",
      getDefaultLocale: () => "es",
      getTemplateId: () => "focus-rows",
      getActiveProject: () => project,
      textOfLocalized: (value, locale, _fallbackLocale, fallback) => value?.[locale] ?? fallback,
      getMenuTermLocalized: (terms, term, lang) => terms[term]?.[lang] ?? "",
      getInstructionCopyLocalized: (copy, key, lang) => copy[key]?.[lang] ?? "",
      getTemplateInstructionKey: () => "scrollHint",
      getLocalizedAllergenValues: (allergens, lang) => allergens.map((entry) => entry.label[lang] ?? ""),
      formatProjectPrice: (amount, currency, position) =>
        position === "right" ? `${amount}${currency}` : `${currency}${amount}`,
      menuTerms: { allergens: { es: "Alérgenos" }, vegan: { es: "Vegano" } },
      instructionCopy: {
        loadingLabel: { es: "Cargando" },
        tapHint: { es: "Toca" },
        assetDisclaimer: { es: "Activos" },
        scrollHint: { es: "Desplaza" }
      }
    });

    expect(controller.textOf({ es: "Hola" })).toBe("Hola");
    expect(controller.getMenuTerm("allergens")).toBe("Alérgenos");
    expect(controller.getLoadingLabel()).toBe("Cargando");
    expect(controller.getTemplateScrollHint()).toBe("Desplaza");
    expect(controller.getAllergenValues(buildItem())).toEqual(["Leche"]);
    expect(controller.formatPrice(12)).toBe("12EUR");
  });
});
