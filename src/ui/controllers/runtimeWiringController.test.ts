import { describe, expect, it, vi } from "vitest";
import type { RuntimeBindings, RuntimeBindingsDeps } from "./runtimeBindingsController";
import type { RuntimeBootstrapDeps } from "./runtimeBootstrapController";
import { createRuntimeWiring } from "./runtimeWiringController";

describe("createRuntimeWiring", () => {
  it("composes bindings with bootstrap using workspace-derived callbacks", () => {
    const updateAssetMode = vi.fn();
    const refreshBridgeEntries = vi.fn(async () => undefined);

    const runtimeBindings = {
      workflowStatusController: { destroy: vi.fn() },
      previewStartupController: { destroy: vi.fn(), syncProject: vi.fn() },
      editorDraftController: {},
      projectWorkflowController: {},
      assetWorkspaceController: {
        updateAssetMode,
        refreshBridgeEntries
      },
      modalController: { closeDish: vi.fn() }
    } as unknown as RuntimeBindings;

    const createBindings = vi.fn(() => runtimeBindings);
    const bootstrapController = {
      mount: vi.fn(async () => undefined),
      destroy: vi.fn()
    };
    let capturedBootstrapDeps: RuntimeBootstrapDeps | null = null;
    const createBootstrap = vi.fn((deps: RuntimeBootstrapDeps) => {
      capturedBootstrapDeps = deps;
      return bootstrapController;
    });

    const destroyCallbacks = [vi.fn()];
    const buildDestroyCallbacks = vi.fn(() => destroyCallbacks);

    const bootstrapBase = {
      appLifecycleMount: vi.fn(),
      appLifecycleDestroy: vi.fn(),
      pingBridge: vi.fn(async () => true),
      getAssetMode: vi.fn(() => "none" as const),
      loadProjects: vi.fn(async () => []),
      createEmptyProject: vi.fn(() => null as never),
      cloneProject: vi.fn((value) => value),
      initCarouselIndices: vi.fn(),
      setState: vi.fn()
    } as Omit<
      RuntimeBootstrapDeps,
      "updateAssetMode" | "refreshBridgeEntries" | "destroyCallbacks"
    >;

    const wiring = createRuntimeWiring(
      {
        bindings: {} as RuntimeBindingsDeps,
        bootstrap: bootstrapBase,
        buildDestroyCallbacks
      },
      {
        createBindings,
        createBootstrap
      }
    );

    expect(createBindings).toHaveBeenCalled();
    expect(buildDestroyCallbacks).toHaveBeenCalledWith(runtimeBindings);
    expect(createBootstrap).toHaveBeenCalled();
    expect(capturedBootstrapDeps?.updateAssetMode).toBe(updateAssetMode);
    expect(capturedBootstrapDeps?.refreshBridgeEntries).toBe(refreshBridgeEntries);
    expect(capturedBootstrapDeps?.destroyCallbacks).toBe(destroyCallbacks);
    expect(wiring.runtimeBindings).toBe(runtimeBindings);
    expect(wiring.runtimeBootstrapController).toBe(bootstrapController);
    expect(wiring.modalController).toBe(runtimeBindings.modalController);
    expect(wiring.updateAssetMode).toBe(updateAssetMode);
    expect(wiring.refreshBridgeEntries).toBe(refreshBridgeEntries);
  });
});
