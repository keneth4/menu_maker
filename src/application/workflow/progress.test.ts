import { describe, expect, it, vi } from "vitest";
import { createProgressController, type ProgressState } from "./progress";

describe("createProgressController", () => {
  it("clamps working progress and resets after finish delay", () => {
    vi.useFakeTimers();
    const refs = {
      pulseTimer: null as ReturnType<typeof setInterval> | null,
      resetTimer: null as ReturnType<typeof setTimeout> | null
    };
    let state: ProgressState = {
      mode: null,
      step: "",
      progress: 0,
      visible: false
    };
    const controller = createProgressController(
      refs,
      () => state,
      (next) => {
        state = { ...state, ...next };
      },
      {
        minStartPercent: 1,
        maxWorkingPercent: 99,
        finishResetDelayMs: 1400
      }
    );

    controller.start("save", "start", -5);
    expect(state.progress).toBe(1);
    expect(state.mode).toBe("save");
    expect(state.visible).toBe(true);

    controller.update("mid", 160);
    expect(state.progress).toBe(99);
    expect(state.step).toBe("mid");

    controller.finish("done");
    expect(state.progress).toBe(100);
    expect(state.step).toBe("done");
    expect(state.mode).toBe("save");

    vi.advanceTimersByTime(1399);
    expect(state.mode).toBe("save");
    vi.advanceTimersByTime(1);
    expect(state.mode).toBeNull();
    expect(state.visible).toBe(false);
    expect(state.progress).toBe(0);

    controller.destroy();
    vi.useRealTimers();
  });
});
