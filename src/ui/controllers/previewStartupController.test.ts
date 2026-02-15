import { describe, expect, it, vi } from "vitest";
import type { MenuProject } from "../../lib/types";
import { createPreviewStartupController } from "./previewStartupController";

const mockProject = {} as unknown as MenuProject;

describe("createPreviewStartupController", () => {
  it("loads blocking assets, emits progress, and schedules deferred preload", async () => {
    const onStateChange = vi.fn();
    const preloadDeferred = vi.fn();
    const preloadBlocking = vi.fn(
      async (
        sources: string[],
        onProgress: ((source: string, loaded: number, total: number) => void) | null
      ) => {
        sources.forEach((source, index) => onProgress?.(source, index + 1, sources.length));
      }
    );
    const controller = createPreviewStartupController({
      getCarouselImageSource: () => "",
      onStateChange,
      isBrowser: () => true,
      collectPlan: () => ({
        blocking: ["bg.webp", "dish.webp"],
        deferred: ["extra.webp"],
        all: ["bg.webp", "dish.webp", "extra.webp"]
      }),
      buildWeightMap: () => ({
        "bg.webp": 80,
        "dish.webp": 20,
        "extra.webp": 10
      }),
      readWeight: (source, sourceWeights) => sourceWeights[source] ?? 1,
      preloadBlocking,
      preloadDeferred
    });

    controller.syncProject(mockProject);
    await Promise.resolve();
    await Promise.resolve();

    await vi.waitFor(() => {
      expect(preloadBlocking).toHaveBeenCalledTimes(1);
      expect(preloadDeferred).toHaveBeenCalledWith(["extra.webp"]);
    });
    expect(onStateChange).toHaveBeenCalled();
    const states = onStateChange.mock.calls.map((call) => call[0] as { progress: number; loading: boolean });
    expect(states.some((state) => state.loading && state.progress === 0)).toBe(true);
    expect(states.some((state) => state.loading && state.progress > 0 && state.progress < 100)).toBe(true);
    const finalState = states[states.length - 1];
    expect(finalState?.loading).toBe(false);
    expect(finalState?.progress).toBe(100);
  });

  it("deduplicates same signature and resets when project is removed", async () => {
    const onStateChange = vi.fn();
    const preloadBlocking = vi.fn(async () => undefined);
    const controller = createPreviewStartupController({
      getCarouselImageSource: () => "",
      onStateChange,
      isBrowser: () => true,
      collectPlan: () => ({
        blocking: ["a.webp"],
        deferred: [],
        all: ["a.webp"]
      }),
      buildWeightMap: () => ({ "a.webp": 100 }),
      readWeight: (source, sourceWeights) => sourceWeights[source] ?? 1,
      preloadBlocking,
      preloadDeferred: () => undefined
    });

    controller.syncProject(mockProject);
    await Promise.resolve();
    await Promise.resolve();
    controller.syncProject(mockProject);
    await Promise.resolve();
    expect(preloadBlocking).toHaveBeenCalledTimes(1);

    controller.syncProject(null);
    expect(onStateChange).toHaveBeenCalled();
    const finalState = onStateChange.mock.calls[onStateChange.mock.calls.length - 1]?.[0] as {
      loading: boolean;
      progress: number;
    };
    expect(finalState.loading).toBe(false);
    expect(finalState.progress).toBe(100);
  });
});
