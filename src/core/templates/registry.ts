import type { MenuItem } from "../../lib/types";
import {
  FOCUS_ROWS_TOUCH_DELTA_SCALE,
  FOCUS_ROWS_TOUCH_INTENT_THRESHOLD,
  FOCUS_ROWS_WHEEL_SETTLE_MS,
  FOCUS_ROWS_WHEEL_STEP_THRESHOLD,
  getFocusRowCardStyle,
  getFocusRowRenderItems,
  normalizeFocusRowWheelDelta
} from "./strategies/focusRows";
import {
  JUKEBOX_TOUCH_DELTA_SCALE,
  JUKEBOX_TOUCH_INTENT_THRESHOLD,
  JUKEBOX_WHEEL_SETTLE_MS,
  JUKEBOX_WHEEL_STEP_THRESHOLD,
  getJukeboxCardStyle,
  getJukeboxRenderItems,
  normalizeJukeboxWheelDelta
} from "./strategies/jukebox";
import { getCircularOffset } from "./strategies/shared";

export const TEMPLATE_IDS = ["focus-rows", "jukebox"] as const;

export type TemplateId = (typeof TEMPLATE_IDS)[number];

export type TemplateInstructionHintKey = "focusRowsHint" | "jukeboxHint";

export type TemplateRenderItem = {
  item: MenuItem;
  sourceIndex: number;
  key: string;
};

export type TemplateCapabilities = {
  id: TemplateId;
  label: Record<string, string>;
  categories: Record<string, string[]>;
  sectionSnapAxis: "vertical" | "horizontal";
  sectionSnapDelayMs: number;
  showFocusRowsHint: boolean;
  showSectionNav: boolean;
  showDesktopCarouselNav: boolean;
  instructionHintKey: TemplateInstructionHintKey;
  smokeFixturePath: string;
  carousel: {
    primaryAxis: "horizontal" | "vertical";
    wheelStepThreshold: number;
    wheelSettleMs: number;
    touchIntentThreshold: number;
    touchDeltaScale: number;
    nearDistanceThreshold: number;
  };
};

export type TemplateStrategy = {
  id: TemplateId;
  getRenderItems: (items: MenuItem[]) => TemplateRenderItem[];
  getCardStyle: (activeIndex: number, sourceIndex: number, count: number) => string;
  getCardStateClass: (
    activeIndex: number,
    sourceIndex: number,
    count: number
  ) => "active" | "near" | "far" | "is-hidden";
  normalizeWheelDelta: (event: WheelEvent) => number;
};

type TemplateRegistryEntry = {
  capabilities: TemplateCapabilities;
  strategy: TemplateStrategy;
};

const getCardStateClass = (
  activeIndex: number,
  sourceIndex: number,
  count: number,
  nearDistanceThreshold: number
) => {
  const distance = Math.abs(getCircularOffset(activeIndex, sourceIndex, count));
  const hideThreshold = Math.max(1.6, count / 2 - 0.25);
  if (distance >= hideThreshold) return "is-hidden";
  if (distance < 0.5) return "active";
  if (distance < nearDistanceThreshold) return "near";
  return "far";
};

const templateRegistry: Record<TemplateId, TemplateRegistryEntry> = {
  "focus-rows": {
    capabilities: {
      id: "focus-rows",
      label: { es: "Filas En Foco", en: "In Focus Rows" },
      categories: { es: ["Cafe", "Brunch"], en: ["Cafe", "Brunch"] },
      sectionSnapAxis: "vertical",
      sectionSnapDelayMs: 180,
      showFocusRowsHint: true,
      showSectionNav: false,
      showDesktopCarouselNav: true,
      instructionHintKey: "focusRowsHint",
      smokeFixturePath: "/projects/sample-cafebrunch-menu/menu.json",
      carousel: {
        primaryAxis: "horizontal",
        wheelStepThreshold: FOCUS_ROWS_WHEEL_STEP_THRESHOLD,
        wheelSettleMs: FOCUS_ROWS_WHEEL_SETTLE_MS,
        touchIntentThreshold: FOCUS_ROWS_TOUCH_INTENT_THRESHOLD,
        touchDeltaScale: FOCUS_ROWS_TOUCH_DELTA_SCALE,
        nearDistanceThreshold: 1.5
      }
    },
    strategy: {
      id: "focus-rows",
      getRenderItems: getFocusRowRenderItems,
      getCardStyle: getFocusRowCardStyle,
      getCardStateClass: (activeIndex, sourceIndex, count) =>
        getCardStateClass(activeIndex, sourceIndex, count, 1.5),
      normalizeWheelDelta: normalizeFocusRowWheelDelta
    }
  },
  jukebox: {
    capabilities: {
      id: "jukebox",
      label: { es: "Jukebox", en: "Jukebox" },
      categories: { es: ["Cafe", "Brunch"], en: ["Cafe", "Brunch"] },
      sectionSnapAxis: "horizontal",
      sectionSnapDelayMs: 170,
      showFocusRowsHint: false,
      showSectionNav: true,
      showDesktopCarouselNav: false,
      instructionHintKey: "jukeboxHint",
      smokeFixturePath: "/projects/sample-jukebox-smoke/menu.json",
      carousel: {
        primaryAxis: "vertical",
        wheelStepThreshold: JUKEBOX_WHEEL_STEP_THRESHOLD,
        wheelSettleMs: JUKEBOX_WHEEL_SETTLE_MS,
        touchIntentThreshold: JUKEBOX_TOUCH_INTENT_THRESHOLD,
        touchDeltaScale: JUKEBOX_TOUCH_DELTA_SCALE,
        nearDistanceThreshold: 1.25
      }
    },
    strategy: {
      id: "jukebox",
      getRenderItems: getJukeboxRenderItems,
      getCardStyle: getJukeboxCardStyle,
      getCardStateClass: (activeIndex, sourceIndex, count) =>
        getCardStateClass(activeIndex, sourceIndex, count, 1.25),
      normalizeWheelDelta: normalizeJukeboxWheelDelta
    }
  }
};

const DEFAULT_TEMPLATE_ID: TemplateId = "focus-rows";

const TEMPLATE_ID_ALIASES: Record<string, TemplateId> = {
  "focus-rows": "focus-rows",
  focusrows: "focus-rows",
  "focus-row": "focus-rows",
  "in-focus-rows": "focus-rows",
  "in-focus-row": "focus-rows",
  "bar-pub": "focus-rows",
  "cafe-brunch": "focus-rows",
  "street-food": "focus-rows",
  jukebox: "jukebox",
  "juke-box": "jukebox"
};

const normalizeTemplateToken = (value: string) =>
  value.trim().toLowerCase().replace(/[_\s]+/g, "-");

export const resolveTemplateId = (value?: string): TemplateId => {
  if (!value) return DEFAULT_TEMPLATE_ID;
  const normalized = normalizeTemplateToken(value);
  const resolved = TEMPLATE_ID_ALIASES[normalized] ?? normalized;
  if ((TEMPLATE_IDS as readonly string[]).includes(resolved)) {
    return resolved as TemplateId;
  }
  return DEFAULT_TEMPLATE_ID;
};

export const getTemplateCapabilities = (value?: string): TemplateCapabilities => {
  const id = resolveTemplateId(value);
  return templateRegistry[id].capabilities;
};

export const getTemplateStrategy = (value?: string): TemplateStrategy => {
  const id = resolveTemplateId(value);
  return templateRegistry[id].strategy;
};

export const templateCapabilityList = TEMPLATE_IDS.map(
  (id) => templateRegistry[id].capabilities
);
