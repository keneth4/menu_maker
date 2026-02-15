import { describe, expect, it, vi } from "vitest";
import { createRuntimeShellController } from "./runtimeShellController";

describe("createRuntimeShellController", () => {
  it("handles editor and preview mode toggles", async () => {
    const state = {
      editorOpen: true,
      deviceMode: "mobile" as const,
      previewMode: "device" as const,
      editorTab: "info" as const,
      wizardStep: 0,
      wizardSteps: ["a", "b", "c"],
      wizardStatus: {
        structure: true,
        identity: true,
        categories: true,
        dishes: true,
        preview: true
      },
      wizardDemoPreview: false,
      wizardShowcaseProject: null as unknown
    };
    const lock = vi.fn(async () => undefined);
    const sync = vi.fn(async () => undefined);
    const unlock = vi.fn();

    Object.defineProperty(globalThis, "screen", {
      configurable: true,
      value: {
        orientation: {
          unlock
        }
      }
    });

    const controller = createRuntimeShellController({
      getState: () => state,
      setState: (next) => Object.assign(state, next),
      syncCarousels: sync,
      tryLockLandscape: lock,
      isTargetWithinEditorPanel: () => false
    });

    controller.toggleEditor();
    expect(state.editorOpen).toBe(false);

    controller.togglePreviewMode();
    expect(state.previewMode).toBe("full");
    expect(lock).toHaveBeenCalledTimes(1);
    expect(sync).toHaveBeenCalledTimes(1);

    controller.togglePreviewMode();
    expect(state.previewMode).toBe("device");
    expect(state.editorOpen).toBe(false);
    expect(unlock).toHaveBeenCalledTimes(1);
  });

  it("handles wizard step and outside pointer behavior", () => {
    const state = {
      editorOpen: true,
      deviceMode: "desktop" as const,
      previewMode: "device" as const,
      editorTab: "info" as const,
      wizardStep: 0,
      wizardSteps: ["a", "b", "c"],
      wizardStatus: {
        structure: true,
        identity: false,
        categories: false,
        dishes: false,
        preview: false
      },
      wizardDemoPreview: false,
      wizardShowcaseProject: {}
    };

    const controller = createRuntimeShellController({
      getState: () => state,
      setState: (next) => Object.assign(state, next),
      syncCarousels: async () => undefined,
      tryLockLandscape: async () => undefined,
      isTargetWithinEditorPanel: () => false
    });

    controller.setEditorTab("wizard");
    expect(state.editorTab).toBe("wizard");
    expect(state.wizardDemoPreview).toBe(true);

    controller.goNextStep();
    expect(state.wizardStep).toBe(1);

    controller.goNextStep();
    expect(state.wizardStep).toBe(1);

    controller.goPrevStep();
    expect(state.wizardStep).toBe(0);

    controller.handleDesktopOutsidePointer({ target: document.body } as PointerEvent);
    expect(state.editorOpen).toBe(false);
  });
});
