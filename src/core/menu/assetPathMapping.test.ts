import type { MenuProject } from "../../lib/types";
import { mapProjectAssetPaths } from "./assetPathMapping";

const fixture = (): MenuProject => ({
  meta: {
    slug: "demo",
    name: "Demo",
    template: "focus-rows",
    locales: ["en"],
    defaultLocale: "en",
    currency: "USD",
    fontSource: "/projects/old/assets/fonts/main.woff2",
    fontRoles: {
      identity: { family: "Identity", source: "assets/fonts/identity.woff2" },
      section: { family: "Section" },
      item: { family: "Item", source: "/projects/old/assets/fonts/item.woff2" }
    },
    logoSrc: "assets/branding/logo.webp"
  },
  backgrounds: [
    {
      id: "bg-1",
      label: "BG",
      src: "/projects/old/assets/backgrounds/bg.gif",
      originalSrc: "assets/originals/backgrounds/bg.gif",
      derived: {
        profileId: "v1",
        medium: { webp: "assets/derived/backgrounds/bg-md.webp" },
        large: { webp: "/projects/old/assets/derived/backgrounds/bg-lg.webp" }
      },
      type: "image"
    }
  ],
  categories: [
    {
      id: "cat-1",
      name: { en: "Cat" },
      items: [
        {
          id: "item-1",
          name: { en: "Dish" },
          price: { amount: 1, currency: "USD" },
          media: {
            hero360: "/projects/old/assets/dishes/dish.gif",
            originalHero360: "assets/originals/dishes/dish.gif",
            scrollAnimationSrc: "/projects/old/assets/dishes/dish-alt.webp",
            gallery: ["/projects/old/assets/dishes/dish-side.webp", "assets/dishes/other.webp"],
            responsive: {
              small: "assets/dishes/dish-sm.webp",
              medium: "/projects/old/assets/dishes/dish-md.webp",
              large: "assets/dishes/dish-lg.webp"
            },
            derived: {
              profileId: "v1",
              medium: {
                webp: "/projects/old/assets/derived/dishes/dish-md.webp",
                gif: "assets/derived/dishes/dish-md.gif"
              },
              large: {
                webp: "/projects/old/assets/derived/dishes/dish-lg.webp"
              }
            }
          },
          typography: {
            item: {
              family: "Dish Font",
              source: "assets/fonts/dish.woff2"
            }
          }
        }
      ]
    }
  ],
  sound: {
    enabled: false,
    theme: "bar-amber",
    volume: 0.5,
    map: {}
  }
});

describe("mapProjectAssetPaths", () => {
  it("maps all media path fields including responsive, gallery and derived variants", () => {
    const project = fixture();
    const mapped = mapProjectAssetPaths(project, (value) =>
      value
        .replace("/projects/old/assets/", "/projects/new/assets/")
        .replace(/^assets\//, "/projects/new/assets/")
    );

    expect(mapped.meta.fontSource).toBe("/projects/new/assets/fonts/main.woff2");
    expect(mapped.meta.fontRoles).toEqual({
      identity: { family: "Identity", source: "/projects/new/assets/fonts/identity.woff2" },
      section: { family: "Section" },
      item: { family: "Item", source: "/projects/new/assets/fonts/item.woff2" }
    });
    expect(mapped.meta.logoSrc).toBe("/projects/new/assets/branding/logo.webp");
    expect(mapped.backgrounds[0].src).toBe("/projects/new/assets/backgrounds/bg.gif");
    expect(mapped.backgrounds[0].originalSrc).toBe("/projects/new/assets/originals/backgrounds/bg.gif");
    expect(mapped.backgrounds[0].derived?.medium).toEqual({
      webp: "/projects/new/assets/derived/backgrounds/bg-md.webp"
    });
    expect(mapped.backgrounds[0].derived?.large).toEqual({
      webp: "/projects/new/assets/derived/backgrounds/bg-lg.webp"
    });

    const media = mapped.categories[0].items[0].media;
    expect(media.hero360).toBe("/projects/new/assets/dishes/dish.gif");
    expect(media.originalHero360).toBe("/projects/new/assets/originals/dishes/dish.gif");
    expect(media.scrollAnimationSrc).toBe("/projects/new/assets/dishes/dish-alt.webp");
    expect(media.gallery).toEqual([
      "/projects/new/assets/dishes/dish-side.webp",
      "/projects/new/assets/dishes/other.webp"
    ]);
    expect(media.responsive).toEqual({
      small: "/projects/new/assets/dishes/dish-sm.webp",
      medium: "/projects/new/assets/dishes/dish-md.webp",
      large: "/projects/new/assets/dishes/dish-lg.webp"
    });
    expect(media.derived).toEqual({
      profileId: "v1",
      medium: {
        webp: "/projects/new/assets/derived/dishes/dish-md.webp",
        gif: "/projects/new/assets/derived/dishes/dish-md.gif"
      },
      large: {
        webp: "/projects/new/assets/derived/dishes/dish-lg.webp"
      }
    });
    expect(mapped.categories[0].items[0].typography).toEqual({
      item: {
        family: "Dish Font",
        source: "/projects/new/assets/fonts/dish.woff2"
      }
    });
  });
});
