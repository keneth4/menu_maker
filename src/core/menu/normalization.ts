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

const normalizeOptionalText = (value: unknown) => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : "";
};

const normalizeDerivedVariant = (value: unknown) => {
  const direct = normalizeOptionalText(value);
  if (direct !== undefined) return direct;
  if (!value || typeof value !== "object") return undefined;
  const entries = Object.entries(value as Record<string, unknown>)
    .map(([format, src]) => [format, normalizeOptionalText(src)] as const)
    .filter((entry): entry is readonly [string, string] => entry[1] !== undefined);
  if (entries.length === 0) return undefined;
  return entries.reduce<Record<string, string>>((acc, [format, src]) => {
    acc[format] = src;
    return acc;
  }, {});
};

const normalizeDerivedMap = (value: unknown) => {
  if (!value || typeof value !== "object") return undefined;
  const source = value as Record<string, unknown>;
  const small = normalizeDerivedVariant(source.small);
  const medium = normalizeDerivedVariant(source.medium);
  const large = normalizeDerivedVariant(source.large);
  const profileId = normalizeOptionalText(source.profileId);
  if (
    small === undefined &&
    medium === undefined &&
    large === undefined &&
    profileId === undefined
  ) {
    return undefined;
  }
  return {
    profileId: profileId ?? "",
    ...(small !== undefined ? { small } : {}),
    ...(medium !== undefined ? { medium } : {}),
    ...(large !== undefined ? { large } : {})
  };
};

const normalizeRotationDirection = (value: unknown): "cw" | "ccw" =>
  value === "cw" ? "cw" : "ccw";

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
  value.meta.identityMode = value.meta.identityMode === "logo" ? "logo" : "text";
  if (value.meta.logoSrc === undefined) {
    value.meta.logoSrc = "";
  } else {
    value.meta.logoSrc = normalizeOptionalText(value.meta.logoSrc) ?? "";
  }
  if (!value.meta.currencyPosition) {
    value.meta.currencyPosition = "left";
  }

  const defaultLocale = value.meta.defaultLocale ?? "en";
  value.backgrounds = (value.backgrounds ?? []).map((asset) => {
    const src = normalizeOptionalText(asset.src) ?? "";
    const originalSrc = normalizeOptionalText(asset.originalSrc) ?? src;
    return {
      ...asset,
      src,
      originalSrc,
      derived: normalizeDerivedMap(asset.derived)
    };
  });
  value.categories = (value.categories ?? []).map((category) => ({
    ...category,
    items: (category.items ?? []).map((item) => ({
      ...item,
      media: {
        ...(item.media ?? {}),
        hero360: normalizeOptionalText(item.media?.hero360) ?? "",
        originalHero360:
          normalizeOptionalText(item.media?.originalHero360) ??
          normalizeOptionalText(item.media?.hero360) ??
          "",
        rotationDirection: normalizeRotationDirection(item.media?.rotationDirection),
        gallery:
          item.media?.gallery
            ?.map((entry) => normalizeOptionalText(entry))
            .filter((entry): entry is string => entry !== undefined) ?? [],
        responsive: item.media?.responsive
          ? {
              ...(normalizeOptionalText(item.media.responsive.small) !== undefined
                ? { small: normalizeOptionalText(item.media.responsive.small) }
                : {}),
              ...(normalizeOptionalText(item.media.responsive.medium) !== undefined
                ? { medium: normalizeOptionalText(item.media.responsive.medium) }
                : {}),
              ...(normalizeOptionalText(item.media.responsive.large) !== undefined
                ? { large: normalizeOptionalText(item.media.responsive.large) }
                : {})
            }
          : undefined,
        derived: normalizeDerivedMap(item.media?.derived)
      },
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
