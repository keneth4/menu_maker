import { describe, expect, it } from "vitest";
import type { MenuProject } from "../../lib/types";
import { buildPreviewFontVarStyle, resolveProjectRoleFontConfig } from "./fontWorkflow";

const makeProject = (): MenuProject => ({
  meta: {
    slug: "demo",
    name: "Demo",
    restaurantName: { es: "Cafe", en: "Cafe" },
    title: { es: "Menu", en: "Menu" },
    identityMode: "text",
    logoSrc: "",
    fontFamily: "Fraunces",
    fontSource: "",
    fontRoles: {},
    template: "focus-rows",
    locales: ["es", "en"],
    defaultLocale: "es",
    currency: "USD",
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

describe("fontWorkflow identity split roles", () => {
  it("falls back restaurant/title role fonts to identity role", () => {
    const project = makeProject();
    project.meta.fontRoles = {
      identity: { family: "Cinzel" }
    };

    expect(resolveProjectRoleFontConfig(project, "restaurant").family).toBe("Cinzel");
    expect(resolveProjectRoleFontConfig(project, "title").family).toBe("Cinzel");
  });

  it("allows explicit restaurant/title role overrides", () => {
    const project = makeProject();
    project.meta.fontRoles = {
      identity: { family: "Cinzel" },
      restaurant: { family: "Playfair Display" },
      title: { family: "Cormorant Garamond" }
    };

    expect(resolveProjectRoleFontConfig(project, "restaurant").family).toBe("Playfair Display");
    expect(resolveProjectRoleFontConfig(project, "title").family).toBe("Cormorant Garamond");
  });

  it("emits dedicated CSS vars for restaurant/title fonts", () => {
    const project = makeProject();
    project.meta.fontRoles = {
      restaurant: { family: "Playfair Display" },
      title: { family: "Cormorant Garamond" }
    };

    const cssVars = buildPreviewFontVarStyle(project);
    expect(cssVars).toContain("--menu-font-restaurant:");
    expect(cssVars).toContain("--menu-font-title:");
    expect(cssVars).toContain('"Playfair Display"');
    expect(cssVars).toContain('"Cormorant Garamond"');
  });
});
