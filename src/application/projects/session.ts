import type { MenuProject } from "../../lib/types";

export const cloneProject = (value: MenuProject): MenuProject => {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value)) as MenuProject;
};

export const createEmptyProject = (
  defaultBackgroundCarouselSeconds: number
): MenuProject => ({
  meta: {
    slug: "nuevo-proyecto",
    name: "Nuevo proyecto",
    restaurantName: { es: "", en: "" },
    title: { es: "", en: "" },
    identityMode: "text",
    logoSrc: "",
    fontFamily: "Fraunces",
    fontSource: "",
    fontRoles: {},
    template: "focus-rows",
    locales: [],
    defaultLocale: "es",
    currency: "MXN",
    currencyPosition: "left",
    backgroundCarouselSeconds: defaultBackgroundCarouselSeconds,
    backgroundDisplayMode: "carousel",
    scrollSensitivity: {
      item: 5,
      section: 5
    }
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
