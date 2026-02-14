import { describe, expect, it, vi } from "vitest";
import type { MenuProject } from "../../lib/types";
import { createRuntimePreviewAdapterController } from "./runtimePreviewAdapterController";

const buildProject = (): MenuProject => ({
    meta: {
      name: "Demo",
      slug: "demo",
      locales: ["es", "en"],
      defaultLocale: "es",
      currency: "USD",
      currencyPosition: "left",
      backgroundDisplayMode: "carousel",
      template: "focus-rows"
    },
    backgrounds: [],
    categories: [
      {
        id: "c1",
        name: { es: "Cat" },
        items: [
          {
            id: "i1",
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
          }
        ]
      }
    ]
  } as MenuProject);

describe("createRuntimePreviewAdapterController", () => {
  it("delegates preview and carousel handlers and initializes carousel indices", async () => {
    let carouselActive: Record<string, number> = {};
    const project = buildProject();
    const controller = createRuntimePreviewAdapterController({
      tick: async () => undefined,
      queryMenuScroll: () => null,
      getActiveTemplateCapabilities: () => ({
        sectionSnapAxis: "vertical",
        sectionSnapDelayMs: 120,
        carousel: { primaryAxis: "horizontal" }
      }),
      getActiveProject: () => project,
      getCarouselActive: () => carouselActive,
      setCarouselActive: (next) => {
        carouselActive = next;
      },
      wrapCarouselIndex: (index, count) => ((index % count) + count) % count,
      carouselController: {
        clear: vi.fn(),
        shift: vi.fn(),
        handleWheel: vi.fn(),
        handleTouchStart: vi.fn(),
        handleTouchMove: vi.fn(),
        handleTouchEnd: vi.fn()
      },
      previewController: {
        syncFocus: vi.fn(),
        snapVertical: vi.fn(),
        snapHorizontal: vi.fn(),
        handleMenuScroll: vi.fn(),
        destroy: vi.fn()
      },
      previewNavigationController: {
        applySectionFocus: vi.fn(),
        syncSectionBackgroundByIndex: vi.fn(),
        shiftSection: vi.fn(),
        getActiveSectionCategoryId: vi.fn(() => "c1"),
        handleDesktopPreviewKeydown: vi.fn()
      }
    });

    controller.initCarouselIndices(project);
    await controller.syncCarousels();
    expect(carouselActive).toEqual({ c1: 0 });
  });
});
