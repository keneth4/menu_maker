import { describe, expect, it, vi } from "vitest";
import { createCarouselController } from "./carouselController";

const wrapIndex = (index: number, count: number) => {
  if (count <= 0) return 0;
  return ((index % count) + count) % count;
};

describe("createCarouselController", () => {
  it("applies wheel delta and snaps to nearest item", () => {
    vi.useFakeTimers();
    let active: Record<string, number> = { featured: 0 };
    const preventDefault = vi.fn();
    const controller = createCarouselController({
      getActive: () => active,
      setActive: (next) => {
        active = next;
      },
      getItemCount: () => 4,
      getConfig: () => ({
        primaryAxis: "horizontal",
        wheelStepThreshold: 20,
        wheelSettleMs: 80,
        touchIntentThreshold: 8,
        touchDeltaScale: 0.5
      }),
      normalizeWheelDelta: () => 10,
      wrapIndex
    });

    controller.handleWheel(
      "featured",
      {
        deltaX: 12,
        deltaY: 0,
        preventDefault
      } as unknown as WheelEvent
    );

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(active.featured).toBeCloseTo(0.5);

    vi.advanceTimersByTime(80);
    expect(active.featured).toBe(1);

    controller.clear();
    vi.useRealTimers();
  });

  it("handles touch drag on primary axis and ignores secondary intent", () => {
    let active: Record<string, number> = { featured: 0 };
    const primaryMovePreventDefault = vi.fn();
    const secondaryMovePreventDefault = vi.fn();
    const controller = createCarouselController({
      getActive: () => active,
      setActive: (next) => {
        active = next;
      },
      getItemCount: () => 3,
      getConfig: () => ({
        primaryAxis: "horizontal",
        wheelStepThreshold: 20,
        wheelSettleMs: 80,
        touchIntentThreshold: 6,
        touchDeltaScale: 0.5
      }),
      normalizeWheelDelta: () => 0,
      wrapIndex
    });

    controller.handleTouchStart(
      "featured",
      {
        changedTouches: [{ identifier: 7, clientX: 10, clientY: 10 }]
      } as unknown as TouchEvent
    );

    controller.handleTouchMove(
      "featured",
      {
        touches: [{ identifier: 7, clientX: 32, clientY: 12 }],
        preventDefault: primaryMovePreventDefault
      } as unknown as TouchEvent
    );
    expect(primaryMovePreventDefault).toHaveBeenCalledTimes(1);
    expect(active.featured).not.toBe(0);

    const afterPrimary = active.featured;
    controller.handleTouchStart(
      "featured",
      {
        changedTouches: [{ identifier: 9, clientX: 20, clientY: 20 }]
      } as unknown as TouchEvent
    );
    controller.handleTouchMove(
      "featured",
      {
        touches: [{ identifier: 9, clientX: 22, clientY: 40 }],
        preventDefault: secondaryMovePreventDefault
      } as unknown as TouchEvent
    );
    expect(secondaryMovePreventDefault).not.toHaveBeenCalled();
    expect(active.featured).toBe(afterPrimary);
  });
});
