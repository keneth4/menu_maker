import { describe, expect, it, vi } from "vitest";
import {
  buildWorkflowAssetStepLabel,
  createWorkflowStatusController,
  type WorkflowStatusState
} from "./workflowStatusController";

const createHarness = (stateOverrides: Partial<WorkflowStatusState> = {}) => {
  let state: WorkflowStatusState = {
    workflowMode: null,
    workflowStep: "",
    workflowProgress: 0,
    assetTaskVisible: false,
    assetTaskStep: "",
    assetTaskProgress: 0,
    uiLang: "es",
    ...stateOverrides
  };
  const workflowRefs = {
    pulseTimer: null as ReturnType<typeof setInterval> | null,
    resetTimer: null as ReturnType<typeof setTimeout> | null
  };
  const assetTaskRefs = {
    pulseTimer: null as ReturnType<typeof setInterval> | null,
    resetTimer: null as ReturnType<typeof setTimeout> | null
  };
  const controller = createWorkflowStatusController({
    translate: (key) => `t:${key}`,
    getState: () => state,
    setState: (next) => {
      state = { ...state, ...next };
    },
    workflowRefs,
    assetTaskRefs
  });

  return {
    controller,
    getState: () => state
  };
};

describe("workflowStatusController", () => {
  it("builds localized workflow asset step labels", () => {
    expect(buildWorkflowAssetStepLabel("save", 1, 3, "es")).toBe(
      "Empaquetando assets (1/3)"
    );
    expect(buildWorkflowAssetStepLabel("upload", 2, 3, "en")).toBe(
      "Uploading assets (2/3)"
    );
    expect(buildWorkflowAssetStepLabel("export", 3, 3, "en")).toBe(
      "Processing assets (3/3)"
    );
  });

  it("updates workflow progress and label for asset-step progression", () => {
    const { controller, getState } = createHarness({
      workflowMode: "export",
      workflowStep: "initial",
      workflowProgress: 10
    });

    controller.updateWorkflowAssetStep("export", 3, 10, 46, 76);

    expect(getState().workflowProgress).toBeCloseTo(55, 5);
    expect(getState().workflowStep).toBe("Procesando assets (3/10)");
  });

  it("resets asset task state after finish delay", () => {
    vi.useFakeTimers();
    const { controller, getState } = createHarness();

    controller.startAssetTask("progressUploadStart", 4);
    expect(getState().assetTaskVisible).toBe(true);
    expect(getState().assetTaskProgress).toBe(4);
    expect(getState().assetTaskStep).toBe("t:progressUploadStart");

    controller.finishAssetTask("progressUploadDone");
    expect(getState().assetTaskProgress).toBe(100);
    expect(getState().assetTaskStep).toBe("t:progressUploadDone");

    vi.advanceTimersByTime(1200);
    expect(getState().assetTaskVisible).toBe(false);
    expect(getState().assetTaskStep).toBe("");
    expect(getState().assetTaskProgress).toBe(0);

    controller.destroy();
    vi.useRealTimers();
  });
});
