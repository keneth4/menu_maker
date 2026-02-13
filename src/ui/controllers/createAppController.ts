import { get } from "svelte/store";
import { createEmptyProject as createEmptyProjectWorkflow, cloneProject as cloneProjectWorkflow } from "../../application/projects/session";
import { getTemplateCapabilities, getTemplateStrategy, resolveTemplateId } from "../../core/templates/registry";
import type { MenuProject } from "../../lib/types";
import type { AppActions } from "../contracts/actions";
import type {
  AssetState,
  ModalState,
  PreviewState,
  ProjectState,
  ShellState,
  WorkflowState
} from "../contracts/state";
import { createAssetStore } from "../stores/assetStore";
import { createModalStore } from "../stores/modalStore";
import { createPreviewStore } from "../stores/previewStore";
import { createProjectStore } from "../stores/projectStore";
import { createShellStore } from "../stores/shellStore";
import { createWorkflowStore } from "../stores/workflowStore";
import { createAppLifecycleController } from "./appLifecycleController";

const DEFAULT_BACKGROUND_CAROUSEL_SECONDS = 9;

type ControllerDeps = {
  shellState?: Partial<ShellState>;
  projectState?: Partial<ProjectState>;
  assetState?: Partial<AssetState>;
  previewState?: Partial<PreviewState>;
  workflowState?: Partial<WorkflowState>;
  modalState?: Partial<ModalState>;
};

export type AppController = {
  state: {
    shell: ReturnType<typeof createShellStore>;
    project: ReturnType<typeof createProjectStore>;
    asset: ReturnType<typeof createAssetStore>;
    preview: ReturnType<typeof createPreviewStore>;
    workflow: ReturnType<typeof createWorkflowStore>;
    modal: ReturnType<typeof createModalStore>;
  };
  actions: AppActions;
  mount: () => void;
  destroy: () => void;
};

const createNewProject = (uiLang: "es" | "en"): MenuProject => {
  const project = createEmptyProjectWorkflow(DEFAULT_BACKGROUND_CAROUSEL_SECONDS);
  project.meta.name = uiLang === "en" ? "New project" : "Nuevo proyecto";
  project.meta.slug = "new-project";
  project.meta.defaultLocale = uiLang;
  if (!project.meta.locales.includes(uiLang)) {
    project.meta.locales = [uiLang, ...project.meta.locales];
  }
  return project;
};

const deriveProjectStatePatch = (project: MenuProject): Partial<ProjectState> => {
  const activeTemplateId = resolveTemplateId(project.meta.template);
  return {
    project,
    draft: cloneProjectWorkflow(project),
    activeProject: project,
    activeSlug: project.meta.slug || "nuevo-proyecto",
    locale: project.meta.defaultLocale || "es",
    editLang: project.meta.defaultLocale || "es",
    wizardLang: project.meta.defaultLocale || "es",
    wizardStep: 0,
    wizardCategoryId: "",
    wizardItemId: "",
    wizardCategory: null,
    wizardItem: null,
    wizardDemoPreview: false,
    wizardNeedsRootBackground: false,
    wizardShowcaseProject: null,
    wizardStatus: {
      structure: false,
      identity: false,
      categories: false,
      dishes: false,
      preview: false
    },
    wizardProgress: 0,
    templateSyncSignature: "",
    fontChoice: "Fraunces",
    selectedCategoryId: project.categories[0]?.id ?? "",
    selectedItemId: project.categories[0]?.items?.[0]?.id ?? "",
    selectedCategory: project.categories[0] ?? null,
    selectedItem: project.categories[0]?.items?.[0] ?? null,
    activeTemplateId,
    activeTemplateCapabilities: getTemplateCapabilities(activeTemplateId),
    activeTemplateStrategy: getTemplateStrategy(activeTemplateId)
  };
};

const runWorkflowPulse = (
  workflowStore: ReturnType<typeof createWorkflowStore>,
  mode: Exclude<WorkflowState["workflowMode"], null>,
  step: string
) => {
  workflowStore.set({
    workflowMode: mode,
    workflowStep: step,
    workflowProgress: 15,
    assetTaskVisible: false,
    assetTaskStep: "",
    assetTaskProgress: 0
  });
  workflowStore.update((value) => ({
    ...value,
    workflowProgress: 100,
    workflowStep: `${step} · done`
  }));
  workflowStore.update((value) => ({
    ...value,
    workflowMode: null,
    workflowStep: "",
    workflowProgress: 0
  }));
};

export const createAppController = (deps: ControllerDeps = {}): AppController => {
  const state = {
    shell: createShellStore(deps.shellState),
    project: createProjectStore(deps.projectState),
    asset: createAssetStore(deps.assetState),
    preview: createPreviewStore(deps.previewState),
    workflow: createWorkflowStore(deps.workflowState),
    modal: createModalStore(deps.modalState)
  };

  const lifecycle = createAppLifecycleController();

  const actions: AppActions = {
    shell: {
      setEditorTab: (tab) => {
        state.shell.update((value) => ({ ...value, editorTab: tab }));
      },
      toggleEditor: () => {
        state.shell.update((value) => ({ ...value, editorOpen: !value.editorOpen }));
      },
      togglePreviewMode: () => {
        const shell = get(state.shell);
        const nextPreviewMode =
          shell.previewMode === "device"
            ? shell.deviceMode === "mobile"
              ? "full"
              : "mobile"
            : "device";
        state.shell.update((value) => ({ ...value, previewMode: nextPreviewMode }));
      },
      startCreateProject: async () => {
        const uiLang = get(state.shell).uiLang;
        const project = createNewProject(uiLang);
        state.project.update((value) => ({ ...value, ...deriveProjectStatePatch(project) }));
        state.shell.update((value) => ({
          ...value,
          showLanding: false,
          editorOpen: true,
          editorTab: "info",
          languageMenuOpen: false,
          loadError: "",
          openError: "",
          exportError: "",
          exportStatus: ""
        }));
      },
      startOpenProject: () => {
        state.shell.update((value) => ({
          ...value,
          showLanding: false,
          editorOpen: true,
          editorTab: "info"
        }));
      },
      startWizard: async () => {
        const uiLang = get(state.shell).uiLang;
        const project = createNewProject(uiLang);
        state.project.update((value) => ({ ...value, ...deriveProjectStatePatch(project) }));
        state.shell.update((value) => ({
          ...value,
          showLanding: false,
          editorOpen: true,
          editorTab: "wizard",
          languageMenuOpen: false,
          loadError: "",
          openError: "",
          exportError: "",
          exportStatus: ""
        }));
      }
    },
    project: {
      createNewProject: async (options = {}) => {
        const uiLang = get(state.shell).uiLang;
        const project = createNewProject(uiLang);
        state.project.update((value) => ({ ...value, ...deriveProjectStatePatch(project) }));
        state.shell.update((value) => ({
          ...value,
          showLanding: false,
          editorOpen: true,
          editorTab: options.forWizard ? "wizard" : "info",
          languageMenuOpen: false,
          openError: "",
          exportError: "",
          exportStatus: ""
        }));
      },
      saveProject: async () => {
        runWorkflowPulse(state.workflow, "save", "save");
      },
      exportStaticSite: async () => {
        runWorkflowPulse(state.workflow, "export", "export");
      },
      handleProjectFile: async () => {
        state.shell.update((value) => ({
          ...value,
          openError: "Project import is handled by runtime workflow controllers."
        }));
      },
      touchDraft: () => {
        state.project.update((value) => {
          if (!value.draft) return value;
          return {
            ...value,
            draft: cloneProjectWorkflow(value.draft),
            activeProject: cloneProjectWorkflow(value.draft)
          };
        });
      }
    },
    asset: {
      pickRootFolder: async () => {
        state.asset.update((value) => ({ ...value, fsError: "" }));
      },
      refreshEntries: async () => {
        state.asset.update((value) => ({ ...value, fsError: "" }));
      },
      uploadAssets: async () => {
        state.workflow.update((value) => ({
          ...value,
          assetTaskVisible: true,
          assetTaskStep: "upload",
          assetTaskProgress: 100
        }));
      },
      createFolder: async () => {
        state.asset.update((value) => ({ ...value, fsError: "" }));
      },
      renameEntry: async () => {
        state.asset.update((value) => ({ ...value, fsError: "" }));
      },
      moveEntry: async () => {
        state.asset.update((value) => ({ ...value, fsError: "" }));
      },
      deleteEntry: async () => {
        state.asset.update((value) => ({ ...value, fsError: "" }));
      },
      bulkMove: async () => {
        state.asset.update((value) => ({ ...value, fsError: "" }));
      },
      bulkDelete: async () => {
        state.asset.update((value) => ({ ...value, selectedAssetIds: [] }));
      }
    },
    preview: {
      shiftSection: () => undefined,
      shiftCarousel: (categoryId, direction) => {
        state.preview.update((value) => {
          const current = value.carouselActive[categoryId] ?? 0;
          return {
            ...value,
            carouselActive: {
              ...value.carouselActive,
              [categoryId]: current + direction
            }
          };
        });
      },
      handleMenuScroll: () => undefined,
      handleCarouselWheel: () => undefined,
      handleCarouselTouchStart: () => undefined,
      handleCarouselTouchMove: () => undefined,
      handleCarouselTouchEnd: () => undefined,
      openDish: (categoryId, itemId) => {
        state.modal.update((value) => ({
          ...value,
          activeItem: { category: categoryId, itemId }
        }));
      },
      closeDish: () => {
        state.modal.update((value) => ({ ...value, activeItem: null }));
      },
      getItemFontStyle: () => ""
    },
    workflow: {
      startWorkflow: (mode, step, percent = 3) => {
        state.workflow.update((value) => ({
          ...value,
          workflowMode: mode,
          workflowStep: step,
          workflowProgress: percent
        }));
      },
      updateWorkflow: (step, percent) => {
        state.workflow.update((value) => ({
          ...value,
          workflowStep: step,
          workflowProgress: Math.max(value.workflowProgress, percent)
        }));
      },
      finishWorkflow: (step) => {
        state.workflow.update((value) => ({
          ...value,
          workflowStep: step,
          workflowProgress: 100,
          workflowMode: null
        }));
      },
      failWorkflow: () => {
        state.workflow.update((value) => ({
          ...value,
          workflowMode: null,
          workflowStep: "",
          workflowProgress: 0
        }));
      },
      startAssetTask: (step, percent = 4) => {
        state.workflow.update((value) => ({
          ...value,
          assetTaskVisible: true,
          assetTaskStep: step,
          assetTaskProgress: percent
        }));
      },
      updateAssetTask: (step, percent) => {
        state.workflow.update((value) => ({
          ...value,
          assetTaskStep: step,
          assetTaskProgress: Math.max(value.assetTaskProgress, percent)
        }));
      },
      finishAssetTask: (step) => {
        state.workflow.update((value) => ({
          ...value,
          assetTaskVisible: false,
          assetTaskStep: step,
          assetTaskProgress: 100
        }));
      },
      failAssetTask: () => {
        state.workflow.update((value) => ({
          ...value,
          assetTaskVisible: false,
          assetTaskStep: "",
          assetTaskProgress: 0
        }));
      }
    },
    modal: {
      openDish: (categoryId, itemId) => {
        state.modal.update((value) => ({
          ...value,
          activeItem: { category: categoryId, itemId }
        }));
      },
      closeDish: () => {
        state.modal.update((value) => ({ ...value, activeItem: null }));
      }
    }
  };

  const mount = () => {
    lifecycle.mount();
    const projectState = get(state.project);
    if (!projectState.project) {
      const uiLang = get(state.shell).uiLang;
      const project = createNewProject(uiLang);
      state.project.update((value) => ({ ...value, ...deriveProjectStatePatch(project) }));
    }
  };

  const destroy = () => {
    lifecycle.destroy();
  };

  return {
    state,
    actions,
    mount,
    destroy
  };
};
