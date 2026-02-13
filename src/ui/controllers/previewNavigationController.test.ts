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
});
