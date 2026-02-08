import type { AllergenEntry } from "../../lib/types";
import { getLocalizedValue } from "./localization";

export const getAllergenLabel = (
  entry: AllergenEntry,
  lang: string,
  defaultLocale = "en"
) =>
  getLocalizedValue(entry.label, lang, defaultLocale) ||
  getLocalizedValue(entry.label, defaultLocale, "en");

export const getAllergenValues = (
  entries: AllergenEntry[] | undefined,
  lang: string,
  defaultLocale = "en"
) =>
  (entries ?? [])
    .map((entry) => getAllergenLabel(entry, lang, defaultLocale))
    .filter((value) => value.trim().length > 0);

export const normalizeAllergenEntries = (
  rawAllergens: unknown,
  locales: string[],
  defaultLocale = "en"
): AllergenEntry[] => {
  if (!Array.isArray(rawAllergens)) return [];
  return rawAllergens
    .map((entry) => {
      if (typeof entry === "string") {
        const clean = entry.trim();
        if (!clean) return null;
        return {
          label: locales.reduce<Record<string, string>>((acc, lang) => {
            acc[lang] = clean;
            return acc;
          }, {})
        };
      }
      if (entry && typeof entry === "object" && "label" in entry) {
        const asEntry = entry as AllergenEntry;
        return {
          id: asEntry.id,
          label: locales.reduce<Record<string, string>>((acc, lang) => {
            acc[lang] = getLocalizedValue(asEntry.label, lang, defaultLocale);
            return acc;
          }, {})
        };
      }
      return null;
    })
    .filter((entry): entry is AllergenEntry => Boolean(entry));
};
