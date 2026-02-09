import type { MenuItem } from "../lib/types";

type ResponsiveVariant = "small" | "medium" | "large";

type ImageSourcePolicyOptions = {
  preferredDerivedFormats?: string[];
};

const DEFAULT_DERIVED_FORMAT_PREFERENCE = ["webp", "gif"] as const;
const SRCSET_VARIANT_ORDER: ResponsiveVariant[] = ["small", "medium", "large"];
const CAROUSEL_VARIANT_PRIORITY: ResponsiveVariant[] = ["medium", "large", "small"];
const DETAIL_VARIANT_PRIORITY: ResponsiveVariant[] = ["large", "medium", "small"];

export const RESPONSIVE_IMAGE_WIDTHS: Record<ResponsiveVariant, number> = {
  small: 480,
  medium: 960,
  large: 1440
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const normalizeSource = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const normalizeFormatPreference = (value?: string[]) => {
  const seen = new Set<string>();
  const next: string[] = [];
  (value ?? DEFAULT_DERIVED_FORMAT_PREFERENCE).forEach((entry) => {
    const normalized = entry.trim().toLowerCase();
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    next.push(normalized);
  });
  if (next.length === 0) {
    return [...DEFAULT_DERIVED_FORMAT_PREFERENCE];
  }
  return next;
};

const getDerivedRoot = (item: MenuItem) => {
  const media = item.media as MenuItem["media"] & { derived?: unknown };
  if (!isRecord(media.derived)) return null;
  return media.derived;
};

const getDerivedVariantValue = (item: MenuItem, variant: ResponsiveVariant): unknown =>
  getDerivedRoot(item)?.[variant];

const selectDerivedVariantSource = (
  value: unknown,
  preferredFormats: string[]
): string | null => {
  const direct = normalizeSource(value);
  if (direct) return direct;
  if (!isRecord(value)) return null;

  const entries = Object.entries(value);
  for (const format of preferredFormats) {
    const match = entries.find(([key]) => key.trim().toLowerCase() === format);
    if (!match) continue;
    const source = normalizeSource(match[1]);
    if (source) return source;
  }

  for (const [, candidate] of entries) {
    const source = normalizeSource(candidate);
    if (source) return source;
  }
  return null;
};

const getDerivedVariantSource = (
  item: MenuItem,
  variant: ResponsiveVariant,
  preferredFormats: string[]
) => selectDerivedVariantSource(getDerivedVariantValue(item, variant), preferredFormats);

const getLegacyResponsiveSource = (item: MenuItem, variant: ResponsiveVariant) =>
  normalizeSource(item.media.responsive?.[variant]);

const getHeroSource = (item: MenuItem) => normalizeSource(item.media.hero360);

const pickImageSourceByVariantOrder = (
  item: MenuItem,
  variantOrder: ResponsiveVariant[],
  preferredFormats: string[]
) => {
  for (const variant of variantOrder) {
    const source =
      getDerivedVariantSource(item, variant, preferredFormats) ||
      getLegacyResponsiveSource(item, variant);
    if (source) return source;
  }
  return getHeroSource(item) ?? "";
};

export const buildResponsiveSrcSetForMenuItem = (
  item: MenuItem,
  options: ImageSourcePolicyOptions = {}
) => {
  const preferredFormats = normalizeFormatPreference(options.preferredDerivedFormats);
  const entries = SRCSET_VARIANT_ORDER.map((variant) => ({
    src:
      getDerivedVariantSource(item, variant, preferredFormats) ||
      getLegacyResponsiveSource(item, variant),
    width: RESPONSIVE_IMAGE_WIDTHS[variant]
  })).filter((entry): entry is { src: string; width: number } => Boolean(entry.src));
  if (entries.length === 0) return undefined;

  const uniqueBySource = new Map<string, number>();
  entries.forEach((entry) => {
    if (!uniqueBySource.has(entry.src)) {
      uniqueBySource.set(entry.src, entry.width);
    }
  });

  return Array.from(uniqueBySource.entries())
    .map(([src, width]) => `${src} ${width}w`)
    .join(", ");
};

export const getCarouselImageSourceForMenuItem = (
  item: MenuItem,
  options: ImageSourcePolicyOptions = {}
) => {
  const preferredFormats = normalizeFormatPreference(options.preferredDerivedFormats);
  return pickImageSourceByVariantOrder(item, CAROUSEL_VARIANT_PRIORITY, preferredFormats);
};

export const getDetailImageSourceForMenuItem = (
  item: MenuItem,
  options: ImageSourcePolicyOptions = {}
) => {
  const preferredFormats = normalizeFormatPreference(options.preferredDerivedFormats);
  return pickImageSourceByVariantOrder(item, DETAIL_VARIANT_PRIORITY, preferredFormats);
};

export const buildExportRuntimeImageSourceHelpers = (
  options: ImageSourcePolicyOptions = {}
) => {
  const preferredFormats = normalizeFormatPreference(options.preferredDerivedFormats);
  return [
    `const IMAGE_DERIVED_FORMAT_PREFERENCE = ${JSON.stringify(preferredFormats)};`,
    `const RESPONSIVE_IMAGE_WIDTHS = ${JSON.stringify(RESPONSIVE_IMAGE_WIDTHS)};`,
    `const CAROUSEL_VARIANT_PRIORITY = ${JSON.stringify(CAROUSEL_VARIANT_PRIORITY)};`,
    `const DETAIL_VARIANT_PRIORITY = ${JSON.stringify(DETAIL_VARIANT_PRIORITY)};`,
    `const SRCSET_VARIANT_ORDER = ${JSON.stringify(SRCSET_VARIANT_ORDER)};`,
    `const normalizeImageSource = (value) => {`,
    `  if (typeof value !== "string") return null;`,
    `  const trimmed = value.trim();`,
    `  return trimmed.length > 0 ? trimmed : null;`,
    `};`,
    `const readDerivedRoot = (item) => {`,
    `  const derived = item?.media?.derived;`,
    `  return derived && typeof derived === "object" ? derived : null;`,
    `};`,
    `const readDerivedVariantSource = (item, variant) => {`,
    `  const root = readDerivedRoot(item);`,
    `  const value = root ? root[variant] : null;`,
    `  const direct = normalizeImageSource(value);`,
    `  if (direct) return direct;`,
    `  if (!value || typeof value !== "object") return null;`,
    `  const entries = Object.entries(value);`,
    `  for (const format of IMAGE_DERIVED_FORMAT_PREFERENCE) {`,
    `    const match = entries.find(([key]) => String(key).trim().toLowerCase() === format);`,
    `    if (!match) continue;`,
    `    const source = normalizeImageSource(match[1]);`,
    `    if (source) return source;`,
    `  }`,
    `  for (const [, candidate] of entries) {`,
    `    const source = normalizeImageSource(candidate);`,
    `    if (source) return source;`,
    `  }`,
    `  return null;`,
    `};`,
    `const readLegacyResponsiveSource = (item, variant) =>`,
    `  normalizeImageSource(item?.media?.responsive?.[variant]);`,
    `const pickPrioritySource = (item, priority) => {`,
    `  for (const variant of priority) {`,
    `    const source = readDerivedVariantSource(item, variant) || readLegacyResponsiveSource(item, variant);`,
    `    if (source) return source;`,
    `  }`,
    `  return normalizeImageSource(item?.media?.hero360) || "";`,
    `};`,
    `const buildSrcSet = (item) => {`,
    `  const entries = SRCSET_VARIANT_ORDER.map((variant) => ({`,
    `    src: readDerivedVariantSource(item, variant) || readLegacyResponsiveSource(item, variant),`,
    `    width: RESPONSIVE_IMAGE_WIDTHS[variant]`,
    `  })).filter((entry) => Boolean(entry.src));`,
    `  if (entries.length === 0) return "";`,
    `  const unique = new Map();`,
    `  entries.forEach((entry) => {`,
    `    if (!unique.has(entry.src)) unique.set(entry.src, entry.width);`,
    `  });`,
    `  return Array.from(unique.entries()).map(([src, width]) => src + " " + width + "w").join(", ");`,
    `};`,
    `const getCarouselImageSrc = (item) => pickPrioritySource(item, CAROUSEL_VARIANT_PRIORITY);`,
    `const getDetailImageSrc = (item) => pickPrioritySource(item, DETAIL_VARIANT_PRIORITY);`
  ].join("\n");
};
