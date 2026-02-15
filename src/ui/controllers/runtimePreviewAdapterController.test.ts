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
      getDeviceMode: () => "desktop",
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
        resolveHorizontalSectionIndex: vi.fn(() => 0),
        shiftSection: vi.fn(),
        getActiveSectionCategoryId: vi.fn(() => "c1"),
        handleDesktopPreviewKeydown: vi.fn()
      }
    });

    controller.initCarouselIndices(project);
    await controller.syncCarousels();
    expect(carouselActive).toEqual({ c1: 0 });
  });

  it("routes horizontal wheel intent to section shifts in desktop jukebox mode", () => {
    const shiftSection = vi.fn();
    const handleWheel = vi.fn();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-14T00:00:00.000Z"));
    const controller = createRuntimePreviewAdapterController({
      tick: async () => undefined,
      queryMenuScroll: () => null,
      getActiveTemplateCapabilities: () => ({
        sectionSnapAxis: "horizontal",
        sectionSnapDelayMs: 120,
        carousel: { primaryAxis: "vertical" }
      }),
      getDeviceMode: () => "desktop",
      getActiveProject: () => buildProject(),
      getCarouselActive: () => ({}),
      setCarouselActive: () => undefined,
      wrapCarouselIndex: (index, count) => ((index % count) + count) % count,
      carouselController: {
        clear: vi.fn(),
        shift: vi.fn(),
        handleWheel,
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
        resolveHorizontalSectionIndex: vi.fn(() => 0),
        shiftSection,
        getActiveSectionCategoryId: vi.fn(() => "c1"),
        handleDesktopPreviewKeydown: vi.fn()
      }
    });

    const createWheelEvent = (deltaX: number, deltaY: number, preventDefault = vi.fn()) =>
      ({
        deltaX,
        deltaY,
        preventDefault
      } as unknown as WheelEvent);

    const horizontalEvent = createWheelEvent(240, 8);
    const repeatedHorizontalEvent = createWheelEvent(190, 6);
    const postCooldownHorizontalEvent = createWheelEvent(220, 4);
    controller.handleCarouselWheel("c1", horizontalEvent);
    controller.handleCarouselWheel("c1", repeatedHorizontalEvent);
    vi.advanceTimersByTime(260);
    controller.handleCarouselWheel("c1", postCooldownHorizontalEvent);

    controller.clearCarouselWheelState();
    expect(horizontalEvent.preventDefault).toHaveBeenCalledTimes(1);
    expect(repeatedHorizontalEvent.preventDefault).toHaveBeenCalledTimes(1);
    expect(postCooldownHorizontalEvent.preventDefault).toHaveBeenCalledTimes(1);
    expect(shiftSection).toHaveBeenNthCalledWith(1, 1);
    expect(shiftSection).toHaveBeenNthCalledWith(2, 1);
    expect(shiftSection).toHaveBeenCalledTimes(2);
    expect(handleWheel).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("delegates vertical wheel intent to carousel controller in desktop jukebox mode", () => {
    const shiftSection = vi.fn();
    const handleWheel = vi.fn();
    const controller = createRuntimePreviewAdapterController({
      tick: async () => undefined,
      queryMenuScroll: () => null,
      getActiveTemplateCapabilities: () => ({
        sectionSnapAxis: "horizontal",
        sectionSnapDelayMs: 120,
        carousel: { primaryAxis: "vertical" }
      }),
      getDeviceMode: () => "desktop",
      getActiveProject: () => buildProject(),
      getCarouselActive: () => ({}),
      setCarouselActive: () => undefined,
      wrapCarouselIndex: (index, count) => ((index % count) + count) % count,
      carouselController: {
        clear: vi.fn(),
        shift: vi.fn(),
        handleWheel,
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
        resolveHorizontalSectionIndex: vi.fn(() => 0),
        shiftSection,
        getActiveSectionCategoryId: vi.fn(() => "c1"),
        handleDesktopPreviewKeydown: vi.fn()
      }
    });

    const verticalEvent = {
      deltaX: 8,
      deltaY: 220,
      preventDefault: vi.fn()
    } as unknown as WheelEvent;
    controller.handleCarouselWheel("c1", verticalEvent);

    expect(verticalEvent.preventDefault).toHaveBeenCalledTimes(1);
    expect(shiftSection).not.toHaveBeenCalled();
    expect(handleWheel).toHaveBeenCalledTimes(1);
    expect(handleWheel).toHaveBeenCalledWith("c1", verticalEvent);
  });
});
