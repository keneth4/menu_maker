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

    const horizontalEventA = createWheelEvent(170, 8);
    const horizontalEventB = createWheelEvent(160, 8);
    controller.handleCarouselWheel("c1", horizontalEventA);
    controller.handleCarouselWheel("c1", horizontalEventB);

    expect(horizontalEventA.preventDefault).toHaveBeenCalledTimes(1);
    expect(horizontalEventB.preventDefault).toHaveBeenCalledTimes(1);
    expect(shiftSection).toHaveBeenCalledTimes(1);
    expect(shiftSection).toHaveBeenLastCalledWith(1);
    expect(handleWheel).not.toHaveBeenCalled();
  });

  it("routes mixed near-threshold deltas to horizontal section scrolling", () => {
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

    const ambiguousEventA = {
      deltaX: 154,
      deltaY: 148,
      preventDefault: vi.fn()
    } as unknown as WheelEvent;
    const ambiguousEventB = {
      deltaX: 152,
      deltaY: 146,
      preventDefault: vi.fn()
    } as unknown as WheelEvent;
    controller.handleCarouselWheel("c1", ambiguousEventA);
    controller.handleCarouselWheel("c1", ambiguousEventB);

    expect(ambiguousEventA.preventDefault).toHaveBeenCalledTimes(1);
    expect(ambiguousEventB.preventDefault).toHaveBeenCalledTimes(1);
    expect(shiftSection).toHaveBeenCalledTimes(1);
    expect(shiftSection).toHaveBeenLastCalledWith(1);
    expect(handleWheel).not.toHaveBeenCalled();
  });

  it("treats shift+wheel as horizontal section intent in desktop jukebox mode", () => {
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

    const shiftWheelEventA = {
      deltaX: 0,
      deltaY: 170,
      shiftKey: true,
      preventDefault: vi.fn()
    } as unknown as WheelEvent;
    const shiftWheelEventB = {
      deltaX: 0,
      deltaY: 160,
      shiftKey: true,
      preventDefault: vi.fn()
    } as unknown as WheelEvent;
    controller.handleCarouselWheel("c1", shiftWheelEventA);
    controller.handleCarouselWheel("c1", shiftWheelEventB);

    expect(shiftWheelEventA.preventDefault).toHaveBeenCalledTimes(1);
    expect(shiftWheelEventB.preventDefault).toHaveBeenCalledTimes(1);
    expect(shiftSection).toHaveBeenCalledTimes(1);
    expect(shiftSection).toHaveBeenLastCalledWith(1);
    expect(handleWheel).not.toHaveBeenCalled();
  });

  it("routes desktop jukebox menu wheel outside cards to active section carousel", () => {
    const shiftSection = vi.fn();
    const handleWheel = vi.fn();
    const menuScroll = document.createElement("div");
    const outsideTarget = document.createElement("div");
    menuScroll.appendChild(outsideTarget);

    const controller = createRuntimePreviewAdapterController({
      tick: async () => undefined,
      queryMenuScroll: () => menuScroll,
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

    const horizontalEventA = {
      target: outsideTarget,
      deltaX: 170,
      deltaY: 30,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn()
    } as unknown as WheelEvent;
    const horizontalEventB = {
      target: outsideTarget,
      deltaX: 160,
      deltaY: 28,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn()
    } as unknown as WheelEvent;
    controller.handleMenuWheel(horizontalEventA);
    controller.handleMenuWheel(horizontalEventB);
    expect(horizontalEventA.preventDefault).toHaveBeenCalledTimes(1);
    expect(horizontalEventA.stopPropagation).toHaveBeenCalledTimes(1);
    expect(horizontalEventB.preventDefault).toHaveBeenCalledTimes(1);
    expect(horizontalEventB.stopPropagation).toHaveBeenCalledTimes(1);
    expect(shiftSection).toHaveBeenCalledTimes(1);
    expect(shiftSection).toHaveBeenLastCalledWith(1);
    expect(handleWheel).not.toHaveBeenCalled();

    const verticalEvent = {
      target: outsideTarget,
      deltaX: 4,
      deltaY: 220,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn()
    } as unknown as WheelEvent;
    controller.handleMenuWheel(verticalEvent);
    expect(handleWheel).toHaveBeenCalledTimes(1);
    expect(handleWheel).toHaveBeenCalledWith("c1", verticalEvent);
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

    expect(verticalEvent.preventDefault).not.toHaveBeenCalled();
    expect(shiftSection).not.toHaveBeenCalled();
    expect(handleWheel).toHaveBeenCalledTimes(1);
    expect(handleWheel).toHaveBeenCalledWith("c1", verticalEvent);
  });
});
