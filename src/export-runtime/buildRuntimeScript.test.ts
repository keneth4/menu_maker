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
});
