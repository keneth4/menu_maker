import { describe, expect, it } from "vitest";
import type { MenuProject } from "../lib/types";
import { buildRuntimeScript } from "./buildRuntimeScript";

const makeProject = (): MenuProject => ({
  meta: {
    slug: "demo",
    name: "Demo",
    restaurantName: { es: "Demo", en: "Demo" },
    title: { es: "Titulo", en: "Title" },
    identityMode: "text",
    logoSrc: "",
    fontFamily: "Fraunces",
    fontSource: "",
    fontRoles: {},
    template: "focus-rows",
    locales: ["es", "en"],
    defaultLocale: "es",
    currency: "MXN",
    currencyPosition: "left",
    backgroundCarouselSeconds: 9,
    backgroundDisplayMode: "carousel"
  },
  backgrounds: [],
  categories: [],
  sound: {
    enabled: false,
    theme: "bar-amber",
    volume: 0.6,
    map: {}
  }
});

describe("buildRuntimeScript", () => {
  it("builds deterministic runtime script with expected core sections", () => {
    const project = makeProject();
    const options = {
      defaultBackgroundCarouselSeconds: 9,
      minBackgroundCarouselSeconds: 2,
      maxBackgroundCarouselSeconds: 60,
      instructionCopy: {
        es: { loadingLabel: "Cargando" },
        en: { loadingLabel: "Loading" }
      }
    };

    const first = buildRuntimeScript(project, options);
    const second = buildRuntimeScript(project, options);

    expect(first).toBe(second);
    expect(first).toContain("const DATA =");
    expect(first).toContain("const currencySymbols");
    expect(first).toContain("const normalizeBackgroundCarouselSeconds");
    expect(first).toContain("const buildSrcSet =");
    expect(first).toContain("const instructionCopy =");
    expect(first).toContain("const render = () => {");
    expect(first).toContain("window.addEventListener(\"keydown\"");
  });

  it("injects option bounds into runtime output", () => {
    const project = makeProject();
    const script = buildRuntimeScript(project, {
      defaultBackgroundCarouselSeconds: 11,
      minBackgroundCarouselSeconds: 4,
      maxBackgroundCarouselSeconds: 44,
      instructionCopy: { es: {}, en: {} }
    });

    expect(script).toContain("if (!Number.isFinite(parsed)) return 11;");
    expect(script).toContain("return Math.min(44, Math.max(4, Math.round(parsed)));");
  });

  it("injects sensitivity-adjusted thresholds and touch scales", () => {
    const project = makeProject();
    project.meta.scrollSensitivity = {
      item: 10,
      section: 10
    };
    const script = buildRuntimeScript(project, {
      defaultBackgroundCarouselSeconds: 9,
      minBackgroundCarouselSeconds: 2,
      maxBackgroundCarouselSeconds: 60,
      instructionCopy: { es: {}, en: {} }
    });

    expect(script).toContain("const FOCUS_ROWS_WHEEL_STEP_THRESHOLD = 47;");
    expect(script).toContain("const FOCUS_ROWS_TOUCH_DELTA_SCALE = 5.72;");
    expect(script).toContain("const JUKEBOX_WHEEL_STEP_THRESHOLD = 47;");
    expect(script).toContain("const JUKEBOX_HORIZONTAL_SECTION_THRESHOLD_PX = 54;");
    expect(script).toContain("const JUKEBOX_TOUCH_DELTA_SCALE = 5.46;");
  });

  it("eagerly hydrates section backgrounds in runtime output", () => {
    const project = makeProject();
    project.meta.backgroundDisplayMode = "section";
    const script = buildRuntimeScript(project, {
      defaultBackgroundCarouselSeconds: 9,
      minBackgroundCarouselSeconds: 2,
      maxBackgroundCarouselSeconds: 60,
      instructionCopy: { es: {}, en: {} }
    });

    expect(script).toContain('if (backgroundDisplayMode === "section") {');
    expect(script).toContain("const sectionBackgroundPreloadSources = new Set();");
    expect(script).toContain("backgrounds.forEach((background, index) => {");
    expect(script).toContain("warmIndexes.add(index);");
    expect(script).toContain("const preload = new Image();");
    expect(script).toContain("sectionBackgroundPreloadImages.push(preload);");
    expect(script).toContain("if (!warmIndexes.has(index)) return;");
  });

  it("syncs section background immediately during horizontal section scroll", () => {
    const project = makeProject();
    project.meta.template = "jukebox";
    project.meta.backgroundDisplayMode = "section";
    const script = buildRuntimeScript(project, {
      defaultBackgroundCarouselSeconds: 9,
      minBackgroundCarouselSeconds: 2,
      maxBackgroundCarouselSeconds: 60,
      instructionCopy: { es: {}, en: {} }
    });

    expect(script).toContain("const HORIZONTAL_INDEX_HYSTERESIS_PX = 24;");
    expect(script).toContain("stableHorizontalSectionIndex");
    expect(script).toContain("const closestIndex = getClosestHorizontalSectionIndex(scroll);");
    expect(script).toContain("syncBackgroundForSectionIndex(closestIndex);");
  });
});
