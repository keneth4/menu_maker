import {
  createProgressController,
  type ProgressMode
} from "../../application/workflow/progress";
import type { UiKey } from "../config/uiCopy";

type WorkflowMode = Exclude<ProgressMode, null>;

type ProgressTimerRefs = {
  pulseTimer: ReturnType<typeof setInterval> | null;
  resetTimer: ReturnType<typeof setTimeout> | null;
};

export type WorkflowStatusState = {
  workflowMode: WorkflowMode | null;
  workflowStep: string;
  workflowProgress: number;
  assetTaskVisible: boolean;
  assetTaskStep: string;
  assetTaskProgress: number;
  uiLang: "es" | "en";
};

type WorkflowStatusStatePatch = Partial<
  Pick<
    WorkflowStatusState,
    | "workflowMode"
    | "workflowStep"
    | "workflowProgress"
    | "assetTaskVisible"
    | "assetTaskStep"
    | "assetTaskProgress"
  >
>;

type WorkflowStatusControllerDeps = {
  translate: (key: UiKey) => string;
  getState: () => WorkflowStatusState;
  setState: (next: WorkflowStatusStatePatch) => void;
  workflowRefs: ProgressTimerRefs;
  assetTaskRefs: ProgressTimerRefs;
};

export type WorkflowStatusController = {
  clearWorkflowPulse: () => void;
  clearWorkflowReset: () => void;
  startWorkflow: (mode: WorkflowMode, stepKey: UiKey, percent?: number) => void;
  updateWorkflow: (stepKey: UiKey, percent: number) => void;
  pulseWorkflow: (
    targetPercent: number,
    stepKey: UiKey,
    options?: { cadenceMs?: number; tickIncrement?: number }
  ) => void;
  updateWorkflowAssetStep: (
    mode: WorkflowMode,
    current: number,
    total: number,
    startPercent: number,
    endPercent: number
  ) => void;
  finishWorkflow: (stepKey: UiKey) => void;
  failWorkflow: () => void;
  clearAssetTaskPulse: () => void;
  clearAssetTaskReset: () => void;
  startAssetTask: (stepKey: UiKey, percent?: number) => void;
  updateAssetTask: (stepKey: UiKey, percent: number) => void;
  pulseAssetTask: (
    targetPercent: number,
    stepKey: UiKey,
    options?: { cadenceMs?: number; tickIncrement?: number }
  ) => void;
  finishAssetTask: (stepKey: UiKey) => void;
  failAssetTask: () => void;
  destroy: () => void;
};

export const buildWorkflowAssetStepLabel = (
  mode: WorkflowMode,
  current: number,
  total: number,
  uiLang: "es" | "en"
) => {
  if (uiLang === "es") {
    if (mode === "save") return `Empaquetando assets (${current}/${total})`;
    if (mode === "upload") return `Subiendo assets (${current}/${total})`;
    return `Procesando assets (${current}/${total})`;
  }
  if (mode === "save") return `Packaging assets (${current}/${total})`;
  if (mode === "upload") return `Uploading assets (${current}/${total})`;
  return `Processing assets (${current}/${total})`;
};

export const createWorkflowStatusController = (
  deps: WorkflowStatusControllerDeps
): WorkflowStatusController => {
  const workflowProgressController = createProgressController(
    deps.workflowRefs,
    () => {
      const state = deps.getState();
      return {
        mode: state.workflowMode,
        step: state.workflowStep,
        progress: state.workflowProgress,
        visible: state.workflowMode !== null
      };
    },
    (next) => {
      const patch: WorkflowStatusStatePatch = {};
      if (next.mode !== undefined) {
        patch.workflowMode = next.mode;
      }
      if (next.step !== undefined) {
        patch.workflowStep = next.step;
      }
      if (next.progress !== undefined) {
        patch.workflowProgress = next.progress;
      }
      deps.setState(patch);
    },
    {
      minStartPercent: 1,
      maxWorkingPercent: 99,
      finishResetDelayMs: 1400
    }
  );

  const assetTaskProgressController = createProgressController(
    deps.assetTaskRefs,
    () => {
      const state = deps.getState();
      return {
        mode: state.assetTaskVisible ? "upload" : null,
        step: state.assetTaskStep,
        progress: state.assetTaskProgress,
        visible: state.assetTaskVisible
      };
    },
    (next) => {
      const patch: WorkflowStatusStatePatch = {};
      if (next.visible !== undefined) {
        patch.assetTaskVisible = next.visible;
      } else if (next.mode !== undefined) {
        patch.assetTaskVisible = next.mode !== null;
      }
      if (next.step !== undefined) {
        patch.assetTaskStep = next.step;
      }
      if (next.progress !== undefined) {
        patch.assetTaskProgress = next.progress;
      }
      deps.setState(patch);
    },
    {
      minStartPercent: 1,
      maxWorkingPercent: 99,
      finishResetDelayMs: 1200
    }
  );

  const clearWorkflowPulse = () => {
    workflowProgressController.clearPulse();
  };

  const clearWorkflowReset = () => {
    workflowProgressController.clearReset();
  };

  const startWorkflow = (mode: WorkflowMode, stepKey: UiKey, percent = 3) => {
    workflowProgressController.start(mode, deps.translate(stepKey), percent);
  };

  const updateWorkflow = (stepKey: UiKey, percent: number) => {
    const state = deps.getState();
    workflowProgressController.update(
      deps.translate(stepKey),
      Math.max(state.workflowProgress, percent)
    );
  };

  const pulseWorkflow = (
    targetPercent: number,
    stepKey: UiKey,
    options: { cadenceMs?: number; tickIncrement?: number } = {}
  ) => {
    const state = deps.getState();
    updateWorkflow(stepKey, state.workflowProgress);
    workflowProgressController.pulse(targetPercent, deps.translate(stepKey), options);
  };

  const updateWorkflowAssetStep = (
    mode: WorkflowMode,
    current: number,
    total: number,
    startPercent: number,
    endPercent: number
  ) => {
    const state = deps.getState();
    const safeTotal = Math.max(1, total);
    const boundedCurrent = Math.max(0, Math.min(current, safeTotal));
    const progress =
      startPercent + ((endPercent - startPercent) * boundedCurrent) / safeTotal;
    deps.setState({
      workflowProgress: Math.max(state.workflowProgress, progress),
      workflowStep: buildWorkflowAssetStepLabel(mode, boundedCurrent, safeTotal, state.uiLang)
    });
  };

  const finishWorkflow = (stepKey: UiKey) => {
    workflowProgressController.finish(deps.translate(stepKey));
  };

  const failWorkflow = () => {
    workflowProgressController.fail();
  };

  const clearAssetTaskPulse = () => {
    assetTaskProgressController.clearPulse();
  };

  const clearAssetTaskReset = () => {
    assetTaskProgressController.clearReset();
  };

  const startAssetTask = (stepKey: UiKey, percent = 4) => {
    assetTaskProgressController.start("upload", deps.translate(stepKey), percent);
  };

  const updateAssetTask = (stepKey: UiKey, percent: number) => {
    const state = deps.getState();
    assetTaskProgressController.update(
      deps.translate(stepKey),
      Math.max(state.assetTaskProgress, percent)
    );
  };

  const pulseAssetTask = (
    targetPercent: number,
    stepKey: UiKey,
    options: { cadenceMs?: number; tickIncrement?: number } = {}
  ) => {
    const state = deps.getState();
    updateAssetTask(stepKey, state.assetTaskProgress);
    assetTaskProgressController.pulse(targetPercent, deps.translate(stepKey), options);
  };

  const finishAssetTask = (stepKey: UiKey) => {
    assetTaskProgressController.finish(deps.translate(stepKey));
  };

  const failAssetTask = () => {
    assetTaskProgressController.fail();
  };

  const destroy = () => {
    workflowProgressController.destroy();
    assetTaskProgressController.destroy();
  };

  return {
    clearWorkflowPulse,
    clearWorkflowReset,
    startWorkflow,
    updateWorkflow,
    pulseWorkflow,
    updateWorkflowAssetStep,
    finishWorkflow,
    failWorkflow,
    clearAssetTaskPulse,
    clearAssetTaskReset,
    startAssetTask,
    updateAssetTask,
    pulseAssetTask,
    finishAssetTask,
    failAssetTask,
    destroy
  };
};
