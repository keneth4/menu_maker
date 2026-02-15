import { describe, expect, it } from "vitest";
import type { MenuItem } from "../../lib/types";
import { createInteractiveMediaController } from "./interactiveMediaController";

const buildItem = (
  media: Partial<MenuItem["media"]>
): MenuItem => ({
  id: "dish-1",
  name: { es: "Dish", en: "Dish" },
  description: { es: "", en: "" },
  longDescription: { es: "", en: "" },
  priceVisible: true,
  price: { amount: 10, currency: "MXN" },
  allergens: [],
  vegan: false,
  media: {
    hero360: "",
    originalHero360: "",
    rotationDirection: "ccw",
    scrollAnimationMode: "hero360",
    scrollAnimationSrc: "",
    ...media
  },
  typography: {}
});

describe("interactiveMediaController getInteractiveDetailAsset", () => {
  it("prefers originalHero360 over hero360 when both are interactive", () => {
    const controller = createInteractiveMediaController();
    const item = buildItem({
      hero360: "/projects/demo/assets/derived/items/dish-md.webp",
      originalHero360: "/projects/demo/assets/originals/items/dish-original.gif"
    });

    const asset = controller.getInteractiveDetailAsset(item);

    expect(asset).toEqual({
      source: "/projects/demo/assets/originals/items/dish-original.gif",
      mime: "image/gif"
    });
  });

  it("falls back to hero360 when originalHero360 is absent", () => {
    const controller = createInteractiveMediaController();
    const item = buildItem({
      hero360: "/projects/demo/assets/originals/items/dish.webp",
      originalHero360: ""
    });

    const asset = controller.getInteractiveDetailAsset(item);

    expect(asset).toEqual({
      source: "/projects/demo/assets/originals/items/dish.webp",
      mime: "image/webp"
    });
  });
});

