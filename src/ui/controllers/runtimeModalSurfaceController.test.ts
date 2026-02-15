import { describe, expect, it, vi } from "vitest";
import type { MenuItem } from "../../lib/types";
import { createRuntimeModalSurfaceController } from "./runtimeModalSurfaceController";

const buildDish = (): MenuItem =>
  ({
    id: "dish-1",
    name: { es: "Dish" },
    description: { es: "" },
    longDescription: { es: "" },
    priceVisible: true,
    price: { amount: 10, currency: "USD" },
    allergens: [],
    vegan: false,
    media: {
      hero360: "",
      originalHero360: "",
      rotationDirection: "ccw",
      scrollAnimationMode: "hero360",
      scrollAnimationSrc: ""
    },
    typography: {}
  }) as MenuItem;

describe("createRuntimeModalSurfaceController", () => {
  it("delegates modal actions and syncs interactive media setup by signature", () => {
    const dish = buildDish();
    const modalController = {
      prefetchDishDetail: vi.fn(),
      openDish: vi.fn(),
      closeDish: vi.fn(),
      resolveActiveDish: vi.fn(() => dish)
    };
    const setupInteractiveMedia = vi.fn(async () => undefined);
    const getInteractiveDetailAsset = vi.fn(() => ({
      source: "/interactive/sample.webp",
      mime: "image/webp" as const
    }));
    const controller = createRuntimeModalSurfaceController({
      getModalController: () => modalController as never,
      getInteractiveDetailAsset,
      setupInteractiveMedia,
      supportsInteractiveMedia: () => true
    });

    controller.prefetchDishDetail("c1", "i1", true);
    controller.openDish("c1", "i1");
    controller.closeDish();

    expect(modalController.prefetchDishDetail).toHaveBeenCalledWith("c1", "i1", true);
    expect(modalController.openDish).toHaveBeenCalledWith("c1", "i1");
    expect(modalController.closeDish).toHaveBeenCalledTimes(1);

    controller.syncInteractiveMedia({
      activeItem: { category: "c1", itemId: "i1" },
      modalMediaHost: {} as HTMLDivElement,
      modalMediaImage: {} as HTMLImageElement
    });
    controller.syncInteractiveMedia({
      activeItem: { category: "c1", itemId: "i1" },
      modalMediaHost: {} as HTMLDivElement,
      modalMediaImage: {} as HTMLImageElement
    });
    controller.syncInteractiveMedia({
      activeItem: { category: "c1", itemId: "i2" },
      modalMediaHost: {} as HTMLDivElement,
      modalMediaImage: {} as HTMLImageElement
    });

    expect(setupInteractiveMedia).toHaveBeenCalledTimes(2);

    const surface = controller.resolveSurface({
      activeItem: { category: "c1", itemId: "i1" },
      hasActiveProject: true
    });
    expect(surface.dish).toBe(dish);
    expect(surface.interactiveAsset?.source).toBe("/interactive/sample.webp");
    expect(surface.interactiveEnabled).toBe(true);
  });
});
