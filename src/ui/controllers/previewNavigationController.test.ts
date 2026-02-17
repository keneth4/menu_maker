import { describe, expect, it, vi } from "vitest";
import type { MenuProject } from "../../lib/types";
import { createPreviewNavigationController } from "./previewNavigationController";

const createProject = (): MenuProject =>
  ({
    categories: [
      { id: "cat-1", items: [] },
      { id: "cat-2", items: [] }
    ]
  }) as unknown as MenuProject;

const defineOffset = (element: HTMLElement, key: "offsetLeft" | "offsetWidth", value: number) => {
  Object.defineProperty(element, key, {
    configurable: true,
    get: () => value
  });
};

const defineHorizontalMetrics = (
  container: HTMLElement,
  options: { clientWidth: number; scrollLeft: number }
) => {
  let scrollLeft = options.scrollLeft;
  Object.defineProperty(container, "clientWidth", {
    configurable: true,
    get: () => options.clientWidth
  });
  Object.defineProperty(container, "scrollLeft", {
    configurable: true,
    get: () => scrollLeft,
    set: (value: number) => {
      scrollLeft = value;
    }
  });
  return {
    setScrollLeft: (value: number) => {
      scrollLeft = value;
    }
  };
};

describe("createPreviewNavigationController", () => {
  it("syncs section background index when in section mode", () => {
    let activeBackgroundIndex = 0;
    const controller = createPreviewNavigationController({
      getProject: () => createProject(),
      getTemplateCapabilities: () => ({ sectionSnapAxis: "vertical" }),
      getDeviceMode: () => "desktop",
      getActiveItem: () => null,
      getSectionBackgroundIndexByCategory: () => ({ "cat-1": 3, "cat-2": 4 }),
      getActiveBackgroundIndex: () => activeBackgroundIndex,
      setActiveBackgroundIndex: (index) => {
        activeBackgroundIndex = index;
      },
      isSectionBackgroundMode: () => true,
      closeDish: () => undefined,
      shiftCarousel: () => undefined
    });

    controller.syncSectionBackgroundByIndex(1);
    expect(activeBackgroundIndex).toBe(4);
  });

  it("handles keyboard escape close and carousel arrows in horizontal mode", () => {
    let activeItem: { category: string; itemId: string } | null = {
      category: "cat-1",
      itemId: "item-1"
    };
    const closeDish = vi.fn(() => {
      activeItem = null;
    });
    const shiftCarousel = vi.fn();
    const controller = createPreviewNavigationController({
      getProject: () => createProject(),
      getTemplateCapabilities: () => ({ sectionSnapAxis: "horizontal" }),
      getDeviceMode: () => "desktop",
      getActiveItem: () => activeItem,
      getSectionBackgroundIndexByCategory: () => ({}),
      getActiveBackgroundIndex: () => 0,
      setActiveBackgroundIndex: () => undefined,
      isSectionBackgroundMode: () => false,
      closeDish,
      shiftCarousel,
      queryMenuScrollContainer: () => null
    });

    const escapeEvent = new KeyboardEvent("keydown", { key: "Escape" });
    const escapePreventDefault = vi.spyOn(escapeEvent, "preventDefault");
    controller.handleDesktopPreviewKeydown(escapeEvent);
    expect(closeDish).toHaveBeenCalledTimes(1);
    expect(escapePreventDefault).toHaveBeenCalledTimes(1);

    const arrowUp = new KeyboardEvent("keydown", { key: "ArrowUp" });
    const arrowPreventDefault = vi.spyOn(arrowUp, "preventDefault");
    controller.handleDesktopPreviewKeydown(arrowUp);
    expect(shiftCarousel).toHaveBeenCalledWith("cat-1", -1);
    expect(arrowPreventDefault).toHaveBeenCalledTimes(1);
  });

  it("keeps horizontal section index stable near midpoint using hysteresis", () => {
    const container = document.createElement("div");
    const metrics = defineHorizontalMetrics(container, { clientWidth: 400, scrollLeft: 160 });
    const sectionA = document.createElement("section");
    sectionA.className = "menu-section";
    defineOffset(sectionA, "offsetLeft", 0);
    defineOffset(sectionA, "offsetWidth", 360);
    const sectionB = document.createElement("section");
    sectionB.className = "menu-section";
    defineOffset(sectionB, "offsetLeft", 420);
    defineOffset(sectionB, "offsetWidth", 360);
    container.append(sectionA, sectionB);

    const controller = createPreviewNavigationController({
      getProject: () => createProject(),
      getTemplateCapabilities: () => ({ sectionSnapAxis: "horizontal" }),
      getDeviceMode: () => "desktop",
      getActiveItem: () => null,
      getSectionBackgroundIndexByCategory: () => ({ "cat-1": 0, "cat-2": 1 }),
      getActiveBackgroundIndex: () => 0,
      setActiveBackgroundIndex: () => undefined,
      isSectionBackgroundMode: () => true,
      closeDish: () => undefined,
      shiftCarousel: () => undefined,
      queryMenuScrollContainer: () => container
    });

    expect(controller.resolveHorizontalSectionIndex(container)).toBe(0);
    metrics.setScrollLeft(198);
    expect(controller.resolveHorizontalSectionIndex(container)).toBe(0);
    metrics.setScrollLeft(260);
    expect(controller.resolveHorizontalSectionIndex(container)).toBe(1);
  });

  it("clamps horizontal section shifting at boundaries instead of wrapping", () => {
    const container = document.createElement("div");
    defineHorizontalMetrics(container, { clientWidth: 400, scrollLeft: 0 });
    const sectionA = document.createElement("section");
    sectionA.className = "menu-section";
    defineOffset(sectionA, "offsetLeft", 0);
    defineOffset(sectionA, "offsetWidth", 360);
    const sectionB = document.createElement("section");
    sectionB.className = "menu-section";
    defineOffset(sectionB, "offsetLeft", 420);
    defineOffset(sectionB, "offsetWidth", 360);
    container.append(sectionA, sectionB);
    const scrollTo = vi.fn();
    (container as unknown as { scrollTo: typeof scrollTo }).scrollTo = scrollTo;

    const controller = createPreviewNavigationController({
      getProject: () => createProject(),
      getTemplateCapabilities: () => ({ sectionSnapAxis: "horizontal" }),
      getDeviceMode: () => "desktop",
      getActiveItem: () => null,
      getSectionBackgroundIndexByCategory: () => ({ "cat-1": 0, "cat-2": 1 }),
      getActiveBackgroundIndex: () => 0,
      setActiveBackgroundIndex: () => undefined,
      isSectionBackgroundMode: () => true,
      closeDish: () => undefined,
      shiftCarousel: () => undefined,
      queryMenuScrollContainer: () => container
    });

    controller.shiftSection(-1);
    expect(scrollTo).not.toHaveBeenCalled();
  });
});
