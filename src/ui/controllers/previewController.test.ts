import { describe, expect, it, vi } from "vitest";
import { createPreviewController } from "./previewController";

const defineOffset = (element: HTMLElement, key: "offsetLeft" | "offsetWidth", value: number) => {
  Object.defineProperty(element, key, {
    configurable: true,
    get: () => value
  });
};

const defineContainerMetrics = (
  container: HTMLElement,
  options: { scrollWidth: number; clientWidth: number; scrollHeight?: number; clientHeight?: number }
) => {
  let scrollLeft = 0;
  Object.defineProperty(container, "scrollWidth", {
    configurable: true,
    get: () => options.scrollWidth
  });
  Object.defineProperty(container, "clientWidth", {
    configurable: true,
    get: () => options.clientWidth
  });
  Object.defineProperty(container, "scrollHeight", {
    configurable: true,
    get: () => options.scrollHeight ?? 1000
  });
  Object.defineProperty(container, "clientHeight", {
    configurable: true,
    get: () => options.clientHeight ?? 400
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
    },
    getScrollLeft: () => scrollLeft
  };
};

describe("previewController horizontal scroll", () => {
  it("syncs focused section and snaps horizontally after settle", () => {
    vi.useFakeTimers();
    const controller = createPreviewController();
    const container = document.createElement("div");
    const metrics = defineContainerMetrics(container, { scrollWidth: 1400, clientWidth: 400 });
    const scrollTo = vi.fn((options: { left?: number }) => {
      if (typeof options.left === "number") {
        metrics.setScrollLeft(options.left);
      }
    });
    (container as unknown as { scrollTo: typeof scrollTo }).scrollTo = scrollTo;

    const sectionA = document.createElement("section");
    sectionA.className = "menu-section";
    defineOffset(sectionA, "offsetLeft", 0);
    defineOffset(sectionA, "offsetWidth", 360);
    const sectionB = document.createElement("section");
    sectionB.className = "menu-section";
    defineOffset(sectionB, "offsetLeft", 420);
    defineOffset(sectionB, "offsetWidth", 360);
    container.append(sectionA, sectionB);

    metrics.setScrollLeft(260);
    const syncBackground = vi.fn();
    controller.handleMenuScroll({
      container,
      axis: "horizontal",
      snapDelayMs: 120,
      syncBackground
    });

    expect(syncBackground).toHaveBeenCalledWith(1);
    expect(scrollTo).not.toHaveBeenCalled();

    vi.advanceTimersByTime(130);
    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(syncBackground).toHaveBeenLastCalledWith(1);
    expect(metrics.getScrollLeft()).toBe(400);

    controller.destroy();
    vi.useRealTimers();
  });

  it("resets horizontal settle timeout on successive scroll updates", () => {
    vi.useFakeTimers();
    const controller = createPreviewController();
    const container = document.createElement("div");
    const metrics = defineContainerMetrics(container, { scrollWidth: 1400, clientWidth: 400 });
    const scrollTo = vi.fn((options: { left?: number }) => {
      if (typeof options.left === "number") {
        metrics.setScrollLeft(options.left);
      }
    });
    (container as unknown as { scrollTo: typeof scrollTo }).scrollTo = scrollTo;

    const sectionA = document.createElement("section");
    sectionA.className = "menu-section";
    defineOffset(sectionA, "offsetLeft", 0);
    defineOffset(sectionA, "offsetWidth", 360);
    const sectionB = document.createElement("section");
    sectionB.className = "menu-section";
    defineOffset(sectionB, "offsetLeft", 420);
    defineOffset(sectionB, "offsetWidth", 360);
    container.append(sectionA, sectionB);

    const syncBackground = vi.fn();
    metrics.setScrollLeft(190);
    controller.handleMenuScroll({
      container,
      axis: "horizontal",
      snapDelayMs: 140,
      syncBackground
    });
    metrics.setScrollLeft(230);
    controller.handleMenuScroll({
      container,
      axis: "horizontal",
      snapDelayMs: 140,
      syncBackground
    });

    vi.advanceTimersByTime(100);
    expect(scrollTo).not.toHaveBeenCalled();
    vi.advanceTimersByTime(60);
    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(syncBackground).toHaveBeenLastCalledWith(1);

    controller.destroy();
    vi.useRealTimers();
  });
});
