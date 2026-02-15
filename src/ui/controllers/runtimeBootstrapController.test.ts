import { describe, expect, it, vi } from "vitest";
import { createRuntimeBootstrapController } from "./runtimeBootstrapController";

describe("createRuntimeBootstrapController", () => {
  it("mounts bootstrap sequence and initializes empty project", async () => {
    const setState = vi.fn();
    const initCarouselIndices = vi.fn();
    const project = {
      meta: {
        slug: "nuevo-proyecto",
        defaultLocale: "es"
      }
    } as any;

    const controller = createRuntimeBootstrapController({
      appLifecycleMount: vi.fn(),
      appLifecycleDestroy: vi.fn(),
      pingBridge: async () => true,
      updateAssetMode: vi.fn(),
      getAssetMode: () => "none",
      refreshBridgeEntries: vi.fn(async () => undefined),
      loadProjects: vi.fn(async () => []),
      createEmptyProject: () => project,
      cloneProject: (value) => ({ ...value }),
      initCarouselIndices,
      setState,
      destroyCallbacks: []
    });

    await controller.mount();

    expect(setState).toHaveBeenCalledWith({ bridgeAvailable: true });
    expect(
      setState.mock.calls.some(
        ([call]) => call.project?.meta?.slug === "nuevo-proyecto" && call.locale === "es"
      )
    ).toBe(true);
    expect(initCarouselIndices).toHaveBeenCalledWith(project);
  });

  it("runs destroy callbacks before lifecycle destroy", () => {
    const order: string[] = [];
    const controller = createRuntimeBootstrapController({
      appLifecycleMount: vi.fn(),
      appLifecycleDestroy: () => order.push("lifecycle"),
      pingBridge: async () => false,
      updateAssetMode: vi.fn(),
      getAssetMode: () => "none",
      refreshBridgeEntries: vi.fn(async () => undefined),
      loadProjects: vi.fn(async () => []),
      createEmptyProject: () => ({ meta: { slug: "x", defaultLocale: "es" } } as any),
      cloneProject: (value) => value,
      initCarouselIndices: vi.fn(),
      setState: vi.fn(),
      destroyCallbacks: [
        () => order.push("a"),
        () => order.push("b")
      ]
    });

    controller.destroy();

    expect(order).toEqual(["a", "b", "lifecycle"]);
  });
});
