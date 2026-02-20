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
  syncUiLanguage: () => void;
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
  let workflowStepMeta:
    | { kind: "none" }
    | { kind: "key"; stepKey: UiKey }
    | { kind: "asset"; mode: WorkflowMode; current: number; total: number } = {
    kind: "none"
  };
  let assetTaskStepKey: UiKey | null = null;

  const resolveWorkflowStepLabel = (state: WorkflowStatusState) => {
    if (workflowStepMeta.kind === "key") {
      return deps.translate(workflowStepMeta.stepKey);
    }
    if (workflowStepMeta.kind === "asset") {
      return buildWorkflowAssetStepLabel(
        workflowStepMeta.mode,
        workflowStepMeta.current,
        workflowStepMeta.total,
        state.uiLang
      );
    }
    return "";
  };

  const resolveAssetTaskStepLabel = () =>
    assetTaskStepKey ? deps.translate(assetTaskStepKey) : "";

  const syncUiLanguage = () => {
    const state = deps.getState();
    const patch: WorkflowStatusStatePatch = {};
    if (state.workflowStep) {
      const translatedWorkflowStep = resolveWorkflowStepLabel(state);
      if (translatedWorkflowStep && translatedWorkflowStep !== state.workflowStep) {
        patch.workflowStep = translatedWorkflowStep;
      }
    }
    if (state.assetTaskStep) {
      const translatedAssetTaskStep = resolveAssetTaskStepLabel();
      if (translatedAssetTaskStep && translatedAssetTaskStep !== state.assetTaskStep) {
        patch.assetTaskStep = translatedAssetTaskStep;
      }
    }
    if (Object.keys(patch).length > 0) {
      deps.setState(patch);
    }
  };

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
        if (!next.step) {
          workflowStepMeta = { kind: "none" };
        }
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
        if (!next.step) {
          assetTaskStepKey = null;
        }
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
    workflowStepMeta = { kind: "key", stepKey };
    workflowProgressController.start(mode, deps.translate(stepKey), percent);
  };

  const updateWorkflow = (stepKey: UiKey, percent: number) => {
    workflowStepMeta = { kind: "key", stepKey };
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
    workflowStepMeta = { kind: "key", stepKey };
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
    workflowStepMeta = {
      kind: "asset",
      mode,
      current: boundedCurrent,
      total: safeTotal
    };
    deps.setState({
      workflowProgress: Math.max(state.workflowProgress, progress),
      workflowStep: buildWorkflowAssetStepLabel(mode, boundedCurrent, safeTotal, state.uiLang)
    });
  };

  const finishWorkflow = (stepKey: UiKey) => {
    workflowStepMeta = { kind: "key", stepKey };
    workflowProgressController.finish(deps.translate(stepKey));
  };

  const failWorkflow = () => {
    workflowStepMeta = { kind: "none" };
    workflowProgressController.fail();
  };

  const clearAssetTaskPulse = () => {
    assetTaskProgressController.clearPulse();
  };

  const clearAssetTaskReset = () => {
    assetTaskProgressController.clearReset();
  };

  const startAssetTask = (stepKey: UiKey, percent = 4) => {
    assetTaskStepKey = stepKey;
    assetTaskProgressController.start("upload", deps.translate(stepKey), percent);
  };

  const updateAssetTask = (stepKey: UiKey, percent: number) => {
    assetTaskStepKey = stepKey;
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
    assetTaskStepKey = stepKey;
    const state = deps.getState();
    updateAssetTask(stepKey, state.assetTaskProgress);
    assetTaskProgressController.pulse(targetPercent, deps.translate(stepKey), options);
  };

  const finishAssetTask = (stepKey: UiKey) => {
    assetTaskStepKey = stepKey;
    assetTaskProgressController.finish(deps.translate(stepKey));
  };

  const failAssetTask = () => {
    assetTaskStepKey = null;
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
    syncUiLanguage,
    destroy
  };
};
