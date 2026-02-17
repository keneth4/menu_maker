import type { MenuProject } from "../../lib/types";

export const DEFAULT_SCROLL_SENSITIVITY_LEVEL = 5;
export const MIN_SCROLL_SENSITIVITY_LEVEL = 1;
export const MAX_SCROLL_SENSITIVITY_LEVEL = 10;

export type ProjectScrollSensitivity = {
  item: number;
  section: number;
};

export const normalizeSensitivityLevel = (value: unknown) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_SCROLL_SENSITIVITY_LEVEL;
  return Math.min(
    MAX_SCROLL_SENSITIVITY_LEVEL,
    Math.max(MIN_SCROLL_SENSITIVITY_LEVEL, Math.round(parsed))
  );
};

export const normalizeProjectScrollSensitivity = (
  value: unknown
): ProjectScrollSensitivity => {
  const source = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return {
    item: normalizeSensitivityLevel(source.item),
    section: normalizeSensitivityLevel(source.section)
  };
};

export const getProjectScrollSensitivity = (
  project: MenuProject | null | undefined
): ProjectScrollSensitivity =>
  normalizeProjectScrollSensitivity(project?.meta?.scrollSensitivity);

export const getThresholdMultiplier = (level: number) =>
  (() => {
    const normalized = normalizeSensitivityLevel(level);
    if (normalized === DEFAULT_SCROLL_SENSITIVITY_LEVEL) return 1;
    if (normalized > DEFAULT_SCROLL_SENSITIVITY_LEVEL) {
      return Math.max(0.18, 1 - (normalized - DEFAULT_SCROLL_SENSITIVITY_LEVEL) * 0.205);
    }
    return 1 + (DEFAULT_SCROLL_SENSITIVITY_LEVEL - normalized) * 0.7;
  })();

export const getTouchScaleMultiplier = (level: number) =>
  (() => {
    const normalized = normalizeSensitivityLevel(level);
    if (normalized === DEFAULT_SCROLL_SENSITIVITY_LEVEL) return 1;
    if (normalized > DEFAULT_SCROLL_SENSITIVITY_LEVEL) {
      return 1 + (normalized - DEFAULT_SCROLL_SENSITIVITY_LEVEL) * 0.32;
    }
    return Math.max(0.2, 1 - (DEFAULT_SCROLL_SENSITIVITY_LEVEL - normalized) * 0.18);
  })();

export const resolveMaxStepPerInput = (level: number) =>
  normalizeSensitivityLevel(level) <= MIN_SCROLL_SENSITIVITY_LEVEL ? 1 : undefined;

export const resolveCarouselConfigWithSensitivity = <
  T extends { wheelStepThreshold: number; touchDeltaScale: number }
>(
  baseConfig: T,
  itemLevel: number
): T & { maxStepPerInput?: number } => ({
  ...baseConfig,
  wheelStepThreshold: Math.max(
    1,
    Math.round(baseConfig.wheelStepThreshold * getThresholdMultiplier(itemLevel))
  ),
  touchDeltaScale: Number(
    (baseConfig.touchDeltaScale * getTouchScaleMultiplier(itemLevel)).toFixed(4)
  ),
  ...(resolveMaxStepPerInput(itemLevel) ? { maxStepPerInput: resolveMaxStepPerInput(itemLevel) } : {})
});

export const resolveJukeboxSectionThresholdPx = (
  baseThresholdPx: number,
  sectionLevel: number
) => Math.max(1, Math.round(baseThresholdPx * getThresholdMultiplier(sectionLevel)));
