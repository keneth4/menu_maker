import type { EditorTab, PreviewMode } from "../contracts/state";

type WizardStatus = {
  structure: boolean;
  identity: boolean;
  categories: boolean;
  dishes: boolean;
  preview: boolean;
};

type RuntimeShellState = {
  editorOpen: boolean;
  deviceMode: "mobile" | "desktop";
  previewMode: PreviewMode;
  editorTab: EditorTab;
  wizardStep: number;
  wizardSteps: string[];
  wizardStatus: WizardStatus;
  wizardDemoPreview: boolean;
  wizardShowcaseProject: unknown | null;
};

type RuntimeShellDeps = {
  getState: () => RuntimeShellState;
  setState: (next: Partial<RuntimeShellState>) => void;
  syncCarousels: () => Promise<void>;
  tryLockLandscape: () => Promise<void>;
  isTargetWithinEditorPanel: (target: EventTarget | null) => boolean;
};

export type RuntimeShellController = {
  toggleEditor: () => void;
  togglePreviewMode: () => void;
  handleDesktopOutsidePointer: (event: PointerEvent) => void;
  setEditorTab: (tab: EditorTab) => void;
  syncWizardShowcaseVisibility: () => void;
  isWizardStepValid: (index: number) => boolean;
  goToStep: (index: number) => void;
  goNextStep: () => void;
  goPrevStep: () => void;
};

export const createRuntimeShellController = (
  deps: RuntimeShellDeps
): RuntimeShellController => {
  const syncWizardShowcaseVisibility = () => {
    const state = deps.getState();
    const wizardDemoPreview =
      state.editorTab === "wizard" &&
      state.wizardStep === 0 &&
      Boolean(state.wizardShowcaseProject);
    if (wizardDemoPreview !== state.wizardDemoPreview) {
      deps.setState({ wizardDemoPreview });
    }
  };

  const setEditorTab = (tab: EditorTab) => {
    deps.setState({ editorTab: tab });
    syncWizardShowcaseVisibility();
  };

  const isWizardStepValid = (index: number) => {
    const status = deps.getState().wizardStatus;
    if (index === 0) return status.structure;
    if (index === 1) return status.identity;
    if (index === 2) return status.categories;
    if (index === 3) return status.dishes;
    return status.preview;
  };

  const goToStep = (index: number) => {
    deps.setState({ wizardStep: index });
    syncWizardShowcaseVisibility();
  };

  const goNextStep = () => {
    const state = deps.getState();
    if (state.wizardStep >= state.wizardSteps.length - 1) return;
    if (!isWizardStepValid(state.wizardStep)) return;
    deps.setState({ wizardStep: state.wizardStep + 1 });
    syncWizardShowcaseVisibility();
  };

  const goPrevStep = () => {
    const state = deps.getState();
    if (state.wizardStep <= 0) return;
    deps.setState({ wizardStep: state.wizardStep - 1 });
    syncWizardShowcaseVisibility();
  };

  const handleDesktopOutsidePointer = (event: PointerEvent) => {
    const state = deps.getState();
    if (!state.editorOpen || state.deviceMode !== "desktop") return;
    if (deps.isTargetWithinEditorPanel(event.target)) return;
    deps.setState({ editorOpen: false });
  };

  const toggleEditor = () => {
    const state = deps.getState();
    deps.setState({ editorOpen: !state.editorOpen });
  };

  const togglePreviewMode = () => {
    const state = deps.getState();
    const nextPreviewMode: PreviewMode =
      state.previewMode === "device"
        ? state.deviceMode === "mobile"
          ? "full"
          : "mobile"
        : "device";

    const patch: Partial<RuntimeShellState> = { previewMode: nextPreviewMode };
    if (nextPreviewMode === "device") {
      patch.editorOpen = false;
    }
    deps.setState(patch);

    if (state.deviceMode === "mobile" && nextPreviewMode === "full") {
      void deps.tryLockLandscape();
    }
    if (state.deviceMode === "mobile" && nextPreviewMode === "device") {
      screen.orientation?.unlock?.();
    }

    void deps.syncCarousels();
  };

  return {
    toggleEditor,
    togglePreviewMode,
    handleDesktopOutsidePointer,
    setEditorTab,
    syncWizardShowcaseVisibility,
    isWizardStepValid,
    goToStep,
    goNextStep,
    goPrevStep
  };
};
