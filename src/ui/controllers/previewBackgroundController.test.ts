import { describe, expect, it, vi } from "vitest";
import type { MenuProject } from "../../lib/types";
import { createPreviewBackgroundController } from "./previewBackgroundController";

const makeProject = (
  mode: "carousel" | "section" = "carousel",
  seconds = 9
): MenuProject => ({
  meta: {
    slug: "demo",
    name: "Demo",
    restaurantName: { es: "", en: "" },
    title: { es: "", en: "" },
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
    backgroundCarouselSeconds: seconds,
    backgroundDisplayMode: mode
  },
  backgrounds: [],
  categories: [
    { id: "cat-1", name: { es: "A", en: "A" }, backgroundId: "bg-1", items: [] }
  ],
  sound: { enabled: false, theme: "bar-amber", volume: 0.6, map: {} }
});

describe("previewBackgroundController", () => {
  it("clears rotation and normalizes active index for section mode", () => {
    let activeBackgroundIndex = 0;
    const clear = vi.fn();
    const sync = vi.fn();
    const controller = createPreviewBackgroundController({
      defaultCarouselSeconds: 9,
      minCarouselSeconds: 2,
      maxCarouselSeconds: 60,
      rotationController: { clear, sync },
      getActiveProject: () => makeProject("section"),
      getPreviewBackgrounds: () => [],
      getActiveBackgroundIndex: () => activeBackgroundIndex,
      setActiveBackgroundIndex: (index) => {
        activeBackgroundIndex = index;
      },
      getSectionBackgroundIndexByCategory: () => ({}),
      getActiveSectionCategoryId: () => null,
      getLoadedBackgroundIndexes: () => [],
      setLoadedBackgroundIndexes: () => {}
    });

    controller.syncRotation();

    expect(clear).toHaveBeenCalledTimes(1);
    expect(sync).not.toHaveBeenCalled();
    expect(activeBackgroundIndex).toBe(-1);
  });

  it("syncs timed rotation for carousel mode with multiple backgrounds", () => {
    let activeBackgroundIndex = 4;
    const clear = vi.fn();
    const sync = vi.fn((_count: number, _interval: number, onTick: () => void) => onTick());
    const controller = createPreviewBackgroundController({
      defaultCarouselSeconds: 9,
      minCarouselSeconds: 2,
      maxCarouselSeconds: 60,
      rotationController: { clear, sync },
      getActiveProject: () => makeProject("carousel", 12),
      getPreviewBackgrounds: () => [{ id: "bg-1", src: "" }, { id: "bg-2", src: "" }],
      getActiveBackgroundIndex: () => activeBackgroundIndex,
      setActiveBackgroundIndex: (index) => {
        activeBackgroundIndex = index;
      },
      getSectionBackgroundIndexByCategory: () => ({ cat: 0 }),
      getActiveSectionCategoryId: () => "cat",
      getLoadedBackgroundIndexes: () => [],
      setLoadedBackgroundIndexes: () => {}
    });

    controller.syncRotation();

    expect(sync).toHaveBeenCalledTimes(1);
    expect(activeBackgroundIndex).toBe(1);
    expect(controller.getBackgroundRotationIntervalMs(makeProject("carousel", 12))).toBe(12000);
  });

  it("syncs section-mode index and loaded background indexes", () => {
    let activeBackgroundIndex = 0;
    let loadedBackgroundIndexes = [0, 3];
    const controller = createPreviewBackgroundController({
      defaultCarouselSeconds: 9,
      minCarouselSeconds: 2,
      maxCarouselSeconds: 60,
      rotationController: { clear: () => {}, sync: () => {} },
      getActiveProject: () => makeProject("section"),
      getPreviewBackgrounds: () => [
        { id: "bg-1", src: "" },
        { id: "bg-2", src: "" },
        { id: "bg-3", src: "" }
      ],
      getActiveBackgroundIndex: () => activeBackgroundIndex,
      setActiveBackgroundIndex: (index) => {
        activeBackgroundIndex = index;
      },
      getSectionBackgroundIndexByCategory: () => ({ "cat-1": 2 }),
      getActiveSectionCategoryId: () => "cat-1",
      getLoadedBackgroundIndexes: () => loadedBackgroundIndexes,
      setLoadedBackgroundIndexes: (indexes) => {
        loadedBackgroundIndexes = indexes;
      }
    });

    controller.syncSectionModeActiveIndex();
    controller.syncLoadedBackgroundIndexes();

    expect(activeBackgroundIndex).toBe(2);
    expect(loadedBackgroundIndexes).toEqual([2, 0]);
  });

  it("ensures first background is loaded immediately after project sync", () => {
    let activeBackgroundIndex = -1;
    let loadedBackgroundIndexes: number[] = [];
    const sync = vi.fn();
    const controller = createPreviewBackgroundController({
      defaultCarouselSeconds: 9,
      minCarouselSeconds: 2,
      maxCarouselSeconds: 60,
      rotationController: { clear: vi.fn(), sync },
      getActiveProject: () => makeProject("carousel"),
      getPreviewBackgrounds: () => [
        { id: "bg-1", src: "" },
        { id: "bg-2", src: "" }
      ],
      getActiveBackgroundIndex: () => activeBackgroundIndex,
      setActiveBackgroundIndex: (index) => {
        activeBackgroundIndex = index;
      },
      getSectionBackgroundIndexByCategory: () => ({}),
      getActiveSectionCategoryId: () => null,
      getLoadedBackgroundIndexes: () => loadedBackgroundIndexes,
      setLoadedBackgroundIndexes: (indexes) => {
        loadedBackgroundIndexes = indexes;
      }
    });

    controller.syncForProjectChange();

    expect(activeBackgroundIndex).toBe(0);
    expect(loadedBackgroundIndexes).toEqual([0, 1]);
    expect(sync).toHaveBeenCalledTimes(1);
  });

  it("does not fallback to first background when section mapping is invalid", () => {
    let activeBackgroundIndex = -1;
    let loadedBackgroundIndexes: number[] = [];
    const controller = createPreviewBackgroundController({
      defaultCarouselSeconds: 9,
      minCarouselSeconds: 2,
      maxCarouselSeconds: 60,
      rotationController: { clear: vi.fn(), sync: vi.fn() },
      getActiveProject: () => makeProject("section"),
      getPreviewBackgrounds: () => [
        { id: "bg-1", src: "" },
        { id: "bg-2", src: "" }
      ],
      getActiveBackgroundIndex: () => activeBackgroundIndex,
      setActiveBackgroundIndex: (index) => {
        activeBackgroundIndex = index;
      },
      getSectionBackgroundIndexByCategory: () => ({ "cat-1": -1 }),
      getActiveSectionCategoryId: () => "cat-1",
      getLoadedBackgroundIndexes: () => loadedBackgroundIndexes,
      setLoadedBackgroundIndexes: (indexes) => {
        loadedBackgroundIndexes = indexes;
      }
    });

    controller.syncForProjectChange();

    expect(activeBackgroundIndex).toBe(-1);
    expect(loadedBackgroundIndexes).toEqual([]);
  });
});
