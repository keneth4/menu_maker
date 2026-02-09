import type { MenuProject } from "../../lib/types";
import { normalizeAllergenEntries } from "./allergens";

const LEGACY_TEMPLATE_MAP: Record<string, string> = {
  "bar-pub": "focus-rows",
  "cafe-brunch": "focus-rows",
  "street-food": "focus-rows"
};

const createLocalized = (locales: string[]) =>
  locales.reduce<Record<string, string>>((acc, lang) => {
    acc[lang] = "";
    return acc;
  }, {});

export const normalizeProject = (value: MenuProject): MenuProject => {
  const locales = value.meta.locales?.length ? value.meta.locales : ["es", "en"];
  value.meta.locales = locales;
  if (!value.meta.title) {
    value.meta.title = createLocalized(locales);
  }
  if (!value.meta.restaurantName) {
    value.meta.restaurantName = createLocalized(locales);
  }
  if (!value.meta.fontFamily) {
    value.meta.fontFamily = "Fraunces";
  }
  if (value.meta.fontSource === undefined) {
    value.meta.fontSource = "";
  }
  if (!value.meta.currencyPosition) {
    value.meta.currencyPosition = "left";
  }

  const defaultLocale = value.meta.defaultLocale ?? "en";
  value.categories = (value.categories ?? []).map((category) => ({
    ...category,
    items: (category.items ?? []).map((item) => ({
      ...item,
      allergens: normalizeAllergenEntries(
        (item as { allergens?: unknown }).allergens,
        locales,
        defaultLocale
      )
    }))
  }));

  value.meta.template = LEGACY_TEMPLATE_MAP[value.meta.template] ?? value.meta.template;
  if (!value.meta.template) {
    value.meta.template = "focus-rows";
  }
  return value;
};
