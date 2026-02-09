import type { AllergenEntry } from "../../lib/types";
import { getAllergenValues } from "./allergens";
import { getLocalizedValue } from "./localization";

describe("getLocalizedValue", () => {
  it("prefers normalized locale and then fallback chain", () => {
    expect(getLocalizedValue({ en: "Hello", es: "Hola" }, "es-MX", "en")).toBe("Hola");
    expect(getLocalizedValue({ fr: "Bonjour", de: "" }, "ja", "it")).toBe("Bonjour");
  });

  it("returns empty string when labels are missing", () => {
    expect(getLocalizedValue(undefined, "es", "en")).toBe("");
  });
});

describe("getAllergenValues", () => {
  it("returns localized allergen labels with fallback", () => {
    const allergens: AllergenEntry[] = [
      {
        id: "nuts",
        label: {
          es: "Nueces",
          en: "Nuts"
        }
      },
      {
        label: {
          en: "Milk"
        }
      }
    ];

    expect(getAllergenValues(allergens, "es", "en")).toEqual(["Nueces", "Milk"]);
  });
});
