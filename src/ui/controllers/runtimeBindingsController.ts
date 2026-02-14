import type { MenuCategory, MenuItem, MenuProject } from "../../lib/types";
import type { ProjectSummary } from "../../lib/loadProjects";
import type { UiKey } from "../config/uiCopy";
import type { TemplateOption } from "../../core/templates/templateOptions";
import type { AssetEntryKind, AssetMovePlan } from "../../infrastructure/bridge/pathing";
import type { ProjectWorkflowController } from "./projectWorkflowController";
import { createProjectWorkflowController } from "./projectWorkflowController";
import type { EditorDraftController } from "./editorDraftController";
import { createEditorDraftController } from "./editorDraftController";
import type {
  AssetWorkspaceController,
  AssetWorkspaceEntry,
  AssetWorkspaceFolderOption,
  AssetWorkspaceTreeRow
} from "./assetWorkspaceController";
import { createAssetWorkspaceController } from "./assetWorkspaceController";
import type { WorkflowStatusController } from "./workflowStatusController";
import { createWorkflowStatusController } from "./workflowStatusController";
import type {
  InteractiveDetailAsset,
  InteractiveMediaController
} from "./interactiveMediaController";
import type { ModalController } from "./modalController";
import { createModalController } from "./modalController";
import type { PreviewStartupController } from "./previewStartupController";
import { createPreviewStartupController } from "./previewStartupController";
import type { BridgeAssetClient } from "../../infrastructure/bridge/client";

type CommonAllergen = {
  id: string;
  label: Record<string, string>;
};

export type RuntimeBindingsState = {
  project: MenuProject | null;
  draft: MenuProject | null;
  projects: ProjectSummary[];
  activeSlug: string;
  locale: string;
  loadError: string;
  uiLang: "es" | "en";
  editLang: string;
  editPanel: "identity" | "background" | "section" | "dish";
  wizardLang: string;
  wizardCategoryId: string;
  wizardItemId: string;
  wizardStep: number;
  wizardDemoPreview: boolean;
  wizardShowcaseProject: MenuProject | null;
  wizardCategory: MenuCategory | null;
  wizardItem: MenuItem | null;
  lastSaveName: string;
  needsAssets: boolean;
  openError: string;
  exportError: string;
  exportStatus: string;
  workflowMode: "save" | "export" | "upload" | null;
  workflowStep: string;
  workflowProgress: number;
  assetTaskVisible: boolean;
  assetTaskStep: string;
  assetTaskProgress: number;
  assetMode: "filesystem" | "bridge" | "none";
  editorTab: "info" | "assets" | "edit" | "wizard";
  editorOpen: boolean;
  showLanding: boolean;
  activeProject: MenuProject | null;
  selectedCategoryId: string;
  selectedItemId: string;
  rootHandle: FileSystemDirectoryHandle | null;
  bridgeAvailable: boolean;
  bridgeProjectSlug: string;
  fsEntries: AssetWorkspaceEntry[];
  rootFiles: string[];
  fsError: string;
  uploadTargetPath: string;
  uploadFolderOptions: AssetWorkspaceFolderOption[];
  expandedPaths: Record<string, boolean>;
  treeRows: AssetWorkspaceTreeRow[];
  selectedAssetIds: string[];
  assetProjectReadOnly: boolean;
  activeItem: { category: string; itemId: string } | null;
  previewStartupLoading: boolean;
  previewStartupProgress: number;
  previewStartupBlockingSources: Set<string>;
};

export type RuntimeBindingsPatch = Partial<RuntimeBindingsState>;

export type RuntimeBindingsDeps = {
  t: () => (key: UiKey) => string;
  fontOptions: Array<{ value: string; label: string }>;
  templateOptions: TemplateOption[];
  commonAllergenCatalog: CommonAllergen[];
  bridgeClient: BridgeAssetClient;
  userManagedRoots: readonly string[];
  workflowRefs: {
    pulseTimer: ReturnType<typeof setInterval> | null;
    resetTimer: ReturnType<typeof setTimeout> | null;
  };
  assetTaskRefs: {
    pulseTimer: ReturnType<typeof setInterval> | null;
    resetTimer: ReturnType<typeof setTimeout> | null;
  };
  getState: () => RuntimeBindingsState;
  setState: (patch: RuntimeBindingsPatch) => void;
  touchDraft: () => void;
  cloneProject: (value: MenuProject) => MenuProject;
  createEmptyProject: () => MenuProject;
  initCarouselIndices: (value: MenuProject) => void;
  resetTemplateDemoCache: () => void;
  syncWizardShowcaseVisibility: () => void;
  buildWizardShowcaseProject: (templateId: string) => Promise<MenuProject | null>;
  getLocalizedValue: (
    value: Record<string, string> | undefined,
    locale: string,
    fallback: string
  ) => string;
  normalizeBackgroundCarouselSeconds: (value: unknown) => number;
  normalizeSectionBackgroundId: (value?: string) => string;
  getSectionModeBackgroundEntries: (project: MenuProject) => { id: string; label: string }[];
  autoAssignSectionBackgroundsByOrder: (project: MenuProject) => void;
  getNextUnusedSectionBackgroundId: (project: MenuProject, currentCategoryId?: string) => string;
  ensureDescription: (item: MenuItem) => Record<string, string>;
  ensureLongDescription: (item: MenuItem) => Record<string, string>;
  ensureAllergens: (item: MenuItem) => Array<{ id?: string; label: Record<string, string> }>;
  resolveTemplateId: (templateId: string) => string;
  normalizePath: (value: string) => string;
  readAssetBytes: (slug: string, sourcePath: string) => Promise<Uint8Array | null>;
  buildExportStyles: () => string;
  buildRuntimeScript: (project: MenuProject) => string;
  getCarouselImageSource: (item: MenuItem) => string;
  mapLegacyAssetRelativeToManaged: (value: string) => string;
  isManagedAssetRelativePath: (value: string) => boolean;
  slugifyName: (value: string) => string;
  normalizeZipName: (value: string) => string;
  getSuggestedZipName: () => string;
  getProjectSlug: () => string;
  refreshBridgeEntries: () => Promise<void>;
  ensureAssetProjectWritable: () => boolean;
  isProtectedAssetProjectSlug: (slug: string) => boolean;
  isLockedManagedAssetRoot: (value: string) => boolean;
  joinAssetFolderPath: (base: string, child: string) => string;
  planEntryMove: (kind: AssetEntryKind, name: string, targetPath: string) => AssetMovePlan;
  planEntryRename: (currentPath: string, newName: string) => string;
  getDirectoryHandleByPath: (
    rootHandle: FileSystemDirectoryHandle,
    path: string,
    create?: boolean
  ) => Promise<FileSystemDirectoryHandle>;
  listFilesystemEntries: (
    rootHandle: FileSystemDirectoryHandle
  ) => Promise<
    {
      id: string;
      name: string;
      path: string;
      kind: "file" | "directory";
      handle: FileSystemHandle;
      parent: FileSystemDirectoryHandle;
    }[]
  >;
  copyFileHandleTo: (
    source: FileSystemFileHandle,
    destination: FileSystemDirectoryHandle,
    name: string
  ) => Promise<void>;
  copyDirectoryHandleTo: (
    source: FileSystemDirectoryHandle,
    destination: FileSystemDirectoryHandle,
    name: string
  ) => Promise<void>;
  writeFileToDirectory: (
    file: File,
    destination: FileSystemDirectoryHandle,
    name: string
  ) => Promise<void>;
  showDirectoryPicker: (() => Promise<FileSystemDirectoryHandle>) | undefined;
  prompt: (message: string, defaultValue?: string) => string | null;
  openProjectDialog: () => void;
  promptAssetUpload: () => Promise<void>;
  getDetailImageSource: (item: MenuItem) => string;
  getInteractiveDetailAsset: (item: MenuItem | null) => InteractiveDetailAsset | null;
  supportsInteractiveMedia: () => boolean;
  prefetchInteractiveBytes: (source: string) => Promise<ArrayBuffer | null>;
  setRotateDirection: (direction: 1 | -1) => void;
  setupInteractiveMedia: (asset: InteractiveDetailAsset | null) => Promise<void>;
  teardownInteractiveMedia: () => void;
  getDishRotateDirection: (item: MenuItem | null) => 1 | -1;
  schedulePostOpen: (task: () => void) => void;
};

export type RuntimeBindings = {
  workflowStatusController: WorkflowStatusController;
  previewStartupController: PreviewStartupController;
  editorDraftController: EditorDraftController;
  projectWorkflowController: ProjectWorkflowController;
  assetWorkspaceController: AssetWorkspaceController;
  modalController: ModalController;
};

export const createRuntimeBindings = (deps: RuntimeBindingsDeps): RuntimeBindings => {
  const workflowStatusController = createWorkflowStatusController({
    translate: (key) => deps.t()(key),
    workflowRefs: deps.workflowRefs,
    assetTaskRefs: deps.assetTaskRefs,
    getState: () => {
      const state = deps.getState();
      return {
        workflowMode: state.workflowMode,
        workflowStep: state.workflowStep,
        workflowProgress: state.workflowProgress,
        assetTaskVisible: state.assetTaskVisible,
        assetTaskStep: state.assetTaskStep,
        assetTaskProgress: state.assetTaskProgress,
        uiLang: state.uiLang
      };
    },
    setState: (next) => deps.setState(next)
  });

  const editorDraftController = createEditorDraftController({
    t: (key) => deps.t()(key as UiKey),
    fontOptions: deps.fontOptions,
    commonAllergenCatalog: deps.commonAllergenCatalog,
    getLocalizedValue: deps.getLocalizedValue,
    normalizeBackgroundCarouselSeconds: deps.normalizeBackgroundCarouselSeconds,
    normalizeSectionBackgroundId: deps.normalizeSectionBackgroundId,
    getSectionModeBackgroundEntries: deps.getSectionModeBackgroundEntries,
    autoAssignSectionBackgroundsByOrder: deps.autoAssignSectionBackgroundsByOrder,
    getNextUnusedSectionBackgroundId: deps.getNextUnusedSectionBackgroundId,
    ensureDescription: deps.ensureDescription,
    ensureLongDescription: deps.ensureLongDescription,
    ensureAllergens: deps.ensureAllergens,
    resolveTemplateId: deps.resolveTemplateId,
    buildWizardShowcaseProject: deps.buildWizardShowcaseProject,
    resetTemplateDemoCache: deps.resetTemplateDemoCache,
    syncWizardShowcaseVisibility: deps.syncWizardShowcaseVisibility,
    initCarouselIndices: deps.initCarouselIndices,
    touchDraft: deps.touchDraft,
    getState: () => {
      const state = deps.getState();
      return {
        draft: state.draft,
        activeProject: state.activeProject,
        editLang: state.editLang,
        selectedCategoryId: state.selectedCategoryId,
        selectedItemId: state.selectedItemId,
        wizardCategoryId: state.wizardCategoryId,
        wizardItemId: state.wizardItemId,
        wizardDemoPreview: state.wizardDemoPreview,
        wizardShowcaseProject: state.wizardShowcaseProject
      };
    },
    setState: (next) => deps.setState(next)
  });

  const projectWorkflowController = createProjectWorkflowController({
    t: (key) => deps.t()(key),
    bridgeClient: deps.bridgeClient,
    getProjectSlug: deps.getProjectSlug,
    refreshBridgeEntries: deps.refreshBridgeEntries,
    initCarouselIndices: deps.initCarouselIndices,
    cloneProject: deps.cloneProject,
    createEmptyProject: deps.createEmptyProject,
    applyTemplate: editorDraftController.applyTemplate,
    normalizePath: deps.normalizePath,
    readAssetBytes: deps.readAssetBytes,
    buildExportStyles: deps.buildExportStyles,
    buildRuntimeScript: deps.buildRuntimeScript,
    getCarouselImageSource: deps.getCarouselImageSource,
    mapLegacyAssetRelativeToManaged: deps.mapLegacyAssetRelativeToManaged,
    isManagedAssetRelativePath: deps.isManagedAssetRelativePath,
    slugifyName: deps.slugifyName,
    normalizeZipName: deps.normalizeZipName,
    getSuggestedZipName: deps.getSuggestedZipName,
    prompt: deps.prompt,
    startWorkflow: workflowStatusController.startWorkflow,
    updateWorkflow: workflowStatusController.updateWorkflow,
    pulseWorkflow: workflowStatusController.pulseWorkflow,
    clearWorkflowPulse: workflowStatusController.clearWorkflowPulse,
    updateWorkflowAssetStep: workflowStatusController.updateWorkflowAssetStep,
    finishWorkflow: workflowStatusController.finishWorkflow,
    failWorkflow: workflowStatusController.failWorkflow,
    onOpenProjectDialog: deps.openProjectDialog,
    onPromptAssetUpload: deps.promptAssetUpload,
    getState: () => {
      const state = deps.getState();
      return {
        project: state.project,
        draft: state.draft,
        projects: state.projects,
        activeSlug: state.activeSlug,
        locale: state.locale,
        uiLang: state.uiLang,
        editLang: state.editLang,
        editPanel: state.editPanel,
        wizardLang: state.wizardLang,
        wizardCategoryId: state.wizardCategoryId,
        wizardItemId: state.wizardItemId,
        wizardStep: state.wizardStep,
        wizardDemoPreview: state.wizardDemoPreview,
        wizardShowcaseProject: state.wizardShowcaseProject,
        lastSaveName: state.lastSaveName,
        needsAssets: state.needsAssets,
        openError: state.openError,
        exportError: state.exportError,
        exportStatus: state.exportStatus,
        workflowMode: state.workflowMode,
        assetMode: state.assetMode,
        editorTab: state.editorTab,
        editorOpen: state.editorOpen,
        showLanding: state.showLanding
      };
    },
    setState: (next) => deps.setState(next)
  });

  const assetWorkspaceController = createAssetWorkspaceController({
    t: (key) => deps.t()(key as UiKey),
    userManagedRoots: deps.userManagedRoots,
    bridgeClient: deps.bridgeClient,
    getProjectSlug: deps.getProjectSlug,
    mapLegacyAssetRelativeToManaged: deps.mapLegacyAssetRelativeToManaged,
    isManagedAssetRelativePath: deps.isManagedAssetRelativePath,
    isLockedManagedAssetRoot: deps.isLockedManagedAssetRoot,
    joinAssetFolderPath: deps.joinAssetFolderPath,
    planEntryMove: deps.planEntryMove,
    planEntryRename: deps.planEntryRename,
    getDirectoryHandleByPath: deps.getDirectoryHandleByPath,
    listFilesystemEntries: deps.listFilesystemEntries,
    copyFileHandleTo: deps.copyFileHandleTo,
    copyDirectoryHandleTo: deps.copyDirectoryHandleTo,
    writeFileToDirectory: deps.writeFileToDirectory,
    ensureAssetProjectWritable: deps.ensureAssetProjectWritable,
    getDraftProject: () => deps.getState().draft,
    cloneProject: deps.cloneProject,
    isProtectedAssetProjectSlug: deps.isProtectedAssetProjectSlug,
    queueBridgeDerivedPreparation: async (slug, project, options) => {
      await projectWorkflowController.queueBridgeDerivedPreparation(slug, project, options);
    },
    startAssetTask: workflowStatusController.startAssetTask,
    updateAssetTask: workflowStatusController.updateAssetTask,
    finishAssetTask: workflowStatusController.finishAssetTask,
    failAssetTask: workflowStatusController.failAssetTask,
    pulseAssetTask: workflowStatusController.pulseAssetTask,
    clearAssetTaskPulse: workflowStatusController.clearAssetTaskPulse,
    prompt: deps.prompt,
    showDirectoryPicker: deps.showDirectoryPicker,
    getState: () => {
      const state = deps.getState();
      return {
        rootHandle: state.rootHandle,
        bridgeAvailable: state.bridgeAvailable,
        assetMode: state.assetMode,
        bridgeProjectSlug: state.bridgeProjectSlug,
        fsEntries: state.fsEntries,
        rootFiles: state.rootFiles,
        fsError: state.fsError,
        uploadTargetPath: state.uploadTargetPath,
        uploadFolderOptions: state.uploadFolderOptions,
        expandedPaths: state.expandedPaths,
        treeRows: state.treeRows,
        selectedAssetIds: state.selectedAssetIds,
        assetProjectReadOnly: state.assetProjectReadOnly
      };
    },
    setState: (next) => deps.setState(next)
  });

  const previewStartupController = createPreviewStartupController({
    getCarouselImageSource: deps.getCarouselImageSource,
    onStateChange: (state) => {
      deps.setState({
        previewStartupLoading: state.loading,
        previewStartupProgress: state.progress,
        previewStartupBlockingSources: state.blockingSources
      });
    }
  });

  const modalController = createModalController({
    getProject: () => deps.getState().activeProject,
    getActiveItem: () => deps.getState().activeItem,
    setActiveItem: (value) => deps.setState({ activeItem: value }),
    getDetailImageSource: deps.getDetailImageSource,
    getInteractiveDetailAsset: deps.getInteractiveDetailAsset,
    supportsInteractiveMedia: deps.supportsInteractiveMedia,
    prefetchInteractiveBytes: deps.prefetchInteractiveBytes,
    setRotateDirection: deps.setRotateDirection,
    setupInteractiveMedia: deps.setupInteractiveMedia,
    teardownInteractiveMedia: deps.teardownInteractiveMedia,
    getDishRotateDirection: deps.getDishRotateDirection,
    schedulePostOpen: deps.schedulePostOpen
  });

  return {
    workflowStatusController,
    previewStartupController,
    editorDraftController,
    projectWorkflowController,
    assetWorkspaceController,
    modalController
  };
};
