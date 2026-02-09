import type { MenuItem } from "../lib/types";
import {
  buildResponsiveSrcSetForMenuItem,
  getCarouselImageSourceForMenuItem,
  getDetailImageSourceForMenuItem
} from "./imageSources";

const createMenuItem = (): MenuItem => ({
  id: "dish-1",
  name: { es: "Dish", en: "Dish" },
  price: { amount: 12, currency: "USD" },
  media: {
    hero360: "original.gif",
    responsive: {
      small: "legacy-sm.webp",
      medium: "legacy-md.webp",
      large: "legacy-lg.webp"
    }
  }
});

const withDerivedMedia = (item: MenuItem, derived: unknown): MenuItem =>
  ({
    ...item,
    media: {
      ...item.media,
      derived
    }
  }) as MenuItem;

describe("image source policy", () => {
  it("builds srcset with derived sources and legacy fallback in stable order", () => {
    const item = withDerivedMedia(createMenuItem(), {
      medium: { gif: "derived-md.gif", webp: "derived-md.webp" },
      large: "derived-lg.webp"
    });

    expect(buildResponsiveSrcSetForMenuItem(item)).toBe(
      "legacy-sm.webp 480w, derived-md.webp 960w, derived-lg.webp 1440w"
    );
  });

  it("dedupes repeated sources in srcset", () => {
    const item = withDerivedMedia(createMenuItem(), {
      medium: "shared.webp",
      large: "shared.webp"
    });

    expect(buildResponsiveSrcSetForMenuItem(item)).toBe("legacy-sm.webp 480w, shared.webp 960w");
  });

  it("prefers medium for carousel and large for detail", () => {
    const item = withDerivedMedia(createMenuItem(), {
      medium: "derived-md.webp",
      large: "derived-lg.webp"
    });

    expect(getCarouselImageSourceForMenuItem(item)).toBe("derived-md.webp");
    expect(getDetailImageSourceForMenuItem(item)).toBe("derived-lg.webp");
  });

  it("supports overriding derived format preference", () => {
    const item = withDerivedMedia(createMenuItem(), {
      medium: { gif: "derived-md.gif", webp: "derived-md.webp" }
    });

    expect(getCarouselImageSourceForMenuItem(item)).toBe("derived-md.webp");
    expect(
      getCarouselImageSourceForMenuItem(item, {
        preferredDerivedFormats: ["gif", "webp"]
      })
    ).toBe("derived-md.gif");
  });

  it("falls back to responsive and original when derived is missing", () => {
    const fromResponsive = createMenuItem();
    expect(getCarouselImageSourceForMenuItem(fromResponsive)).toBe("legacy-md.webp");
    expect(getDetailImageSourceForMenuItem(fromResponsive)).toBe("legacy-lg.webp");

    const fromOriginal: MenuItem = {
      ...fromResponsive,
      media: {
        hero360: "only-original.gif"
      }
    };
    expect(buildResponsiveSrcSetForMenuItem(fromOriginal)).toBeUndefined();
    expect(getCarouselImageSourceForMenuItem(fromOriginal)).toBe("only-original.gif");
    expect(getDetailImageSourceForMenuItem(fromOriginal)).toBe("only-original.gif");
  });
});
