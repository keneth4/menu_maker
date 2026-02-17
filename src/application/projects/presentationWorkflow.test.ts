import { describe, expect, it } from "vitest";
import {
  formatProjectPrice,
  getInstructionCopyLocalized,
  getMenuTermLocalized,
  normalizeAssetSource,
  textOfLocalized
} from "./presentationWorkflow";

describe("presentationWorkflow", () => {
  it("resolves localized text with default and fallback", () => {
    expect(textOfLocalized({ es: "Hola", en: "Hello" }, "en", "es")).toBe("Hello");
    expect(textOfLocalized({ es: "Hola" }, "fr", "es")).toBe("Hola");
    expect(textOfLocalized(undefined, "en", "es", "fallback")).toBe("fallback");
  });

  it("reads localized menu terms and instruction copy", () => {
    const terms = {
      en: { allergens: "Allergens", vegan: "Vegan" },
      es: { allergens: "Alergenos", vegan: "Vegano" }
    };
    const copy = {
      en: { loadingLabel: "Loading" },
      es: { loadingLabel: "Cargando" }
    };

    expect(getMenuTermLocalized(terms, "allergens", "es-MX")).toBe("Alergenos");
    expect(getMenuTermLocalized(terms, "vegan", "fr")).toBe("Vegan");
    expect(getInstructionCopyLocalized(copy, "loadingLabel", "es-419")).toBe("Cargando");
    expect(getInstructionCopyLocalized(copy, "loadingLabel", "fr")).toBe("Loading");
  });

  it("normalizes asset source and formats project price", () => {
    expect(normalizeAssetSource("projects/demo/file.png")).toBe("/projects/demo/file.png");
    expect(normalizeAssetSource("/projects/demo/file.png")).toBe("/projects/demo/file.png");
    expect(normalizeAssetSource("   ")).toBe("");
    expect(formatProjectPrice(35, "USD", "left")).toContain("35");
  });
});
