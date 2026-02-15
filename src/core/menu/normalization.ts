import type { MenuProject } from "../../lib/types";
import { normalizeAllergenEntries } from "./allergens";
import { resolveTemplateId } from "../templates/registry";

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

const normalizeBackgroundCarouselSeconds = (value: unknown) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 9;
  return Math.min(60, Math.max(2, Math.round(parsed)));
};

const normalizeBackgroundDisplayMode = (value: unknown): "carousel" | "section" =>
  value === "section" ? "section" : "carousel";

const normalizeFontConfig = (value: unknown) => {
  if (!value || typeof value !== "object") return undefined;
  const source = value as Record<string, unknown>;
  const family = normalizeOptionalText(source.family);
  const fontSource = normalizeOptionalText(source.source);
  if (family === undefined && fontSource === undefined) {
    return undefined;
  }
  return {
    ...(family !== undefined ? { family } : {}),
    ...(fontSource !== undefined ? { source: fontSource } : {})
  };
};

const normalizeFontRoles = (value: unknown) => {
  if (!value || typeof value !== "object") return undefined;
  const source = value as Record<string, unknown>;
  const identity = normalizeFontConfig(source.identity);
  const section = normalizeFontConfig(source.section);
  const item = normalizeFontConfig(source.item);
  if (!identity && !section && !item) return undefined;
  return {
    ...(identity ? { identity } : {}),
    ...(section ? { section } : {}),
    ...(item ? { item } : {})
  };
};

const normalizeScrollAnimationMode = (value: unknown): "hero360" | "alternate" =>
  value === "alternate" ? "alternate" : "hero360";

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
  value.meta.backgroundCarouselSeconds = normalizeBackgroundCarouselSeconds(
    value.meta.backgroundCarouselSeconds
  );
  value.meta.backgroundDisplayMode = normalizeBackgroundDisplayMode(
    value.meta.backgroundDisplayMode
  );
  value.meta.fontRoles = normalizeFontRoles(value.meta.fontRoles);

  const defaultLocale = value.meta.defaultLocale ?? "en";
  const normalizedBackgrounds = (value.backgrounds ?? []).map((asset) => {
    const src = normalizeOptionalText(asset.src) ?? "";
    const originalSrc = normalizeOptionalText(asset.originalSrc) ?? src;
    return {
      ...asset,
      src,
      originalSrc,
      derived: normalizeDerivedMap(asset.derived)
    };
  });
  value.backgrounds = normalizedBackgrounds;
  const backgroundIdSet = new Set(
    normalizedBackgrounds.map((background) => background.id).filter(Boolean)
  );
  const sectionBackgroundIdSet = new Set(
    normalizedBackgrounds
      .filter((background) => background.id && background.src.trim().length > 0)
      .map((background) => background.id)
  );
  const fallbackBackgroundId =
    normalizedBackgrounds.find((background) => background.id && background.src.trim().length > 0)?.id ??
    normalizedBackgrounds.find((background) => background.id)?.id;
  const sectionMode = value.meta.backgroundDisplayMode === "section";
  const usedSectionBackgroundIds = new Set<string>();
  value.categories = (value.categories ?? []).map((category) => {
    const normalizedBackgroundId = normalizeOptionalText(
      (category as { backgroundId?: unknown }).backgroundId
    );
    let backgroundId = "";
    if (sectionMode) {
      if (
        normalizedBackgroundId &&
        sectionBackgroundIdSet.has(normalizedBackgroundId) &&
        !usedSectionBackgroundIds.has(normalizedBackgroundId)
      ) {
        backgroundId = normalizedBackgroundId;
        usedSectionBackgroundIds.add(normalizedBackgroundId);
      }
    } else {
      backgroundId =
        normalizedBackgroundId && backgroundIdSet.has(normalizedBackgroundId)
          ? normalizedBackgroundId
          : (fallbackBackgroundId ?? "");
    }
    return {
      ...category,
      backgroundId,
      items: (category.items ?? []).map((item) => {
        const normalizedItemFont = normalizeFontConfig(
          (item as { typography?: { item?: unknown } }).typography?.item
        );
        return {
          ...item,
          priceVisible: item.priceVisible !== false,
          media: {
            ...(item.media ?? {}),
            hero360: normalizeOptionalText(item.media?.hero360) ?? "",
            originalHero360:
              normalizeOptionalText(item.media?.originalHero360) ??
              normalizeOptionalText(item.media?.hero360) ??
              "",
            rotationDirection: normalizeRotationDirection(item.media?.rotationDirection),
            scrollAnimationMode: normalizeScrollAnimationMode(item.media?.scrollAnimationMode),
            scrollAnimationSrc: normalizeOptionalText(item.media?.scrollAnimationSrc) ?? "",
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
          ...(normalizedItemFont ? { typography: { item: normalizedItemFont } } : {}),
          allergens: normalizeAllergenEntries(
            (item as { allergens?: unknown }).allergens,
            locales,
            defaultLocale
          )
        };
      })
    };
  });

  value.meta.template = resolveTemplateId(
    LEGACY_TEMPLATE_MAP[value.meta.template] ?? value.meta.template
  );
  return value;
};
