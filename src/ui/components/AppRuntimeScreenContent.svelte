<svelte:head>
  <title>{t("appTitle")}</title>
  {#each builtInFontHrefs as href (href)}
    <link rel="stylesheet" href={href} />
  {/each}
</svelte:head>
<script lang="ts">
  import { createEmptyProject as createEmptyProjectWorkflow, cloneProject as cloneProjectWorkflow } from "../../application/projects/session";
  import { getSuggestedZipName as getSuggestedZipNameWorkflow, normalizeZipName as normalizeZipNameWorkflow, slugifyName as slugifyNameWorkflow } from "../../application/projects/saveWorkflow";
  import { normalizeDraftSelectionState as normalizeDraftSelectionStateWorkflow } from "../../application/projects/draftSelectionWorkflow";
  import { formatProjectPrice as formatProjectPriceWorkflow, getInstructionCopyLocalized as getInstructionCopyLocalizedWorkflow, getMenuTermLocalized as getMenuTermLocalizedWorkflow, normalizeAssetSource as normalizeAssetSourceWorkflow, textOfLocalized as textOfLocalizedWorkflow } from "../../application/projects/presentationWorkflow";
  import { ensureAllergens as ensureAllergensWorkflow, ensureDescription as ensureDescriptionWorkflow, ensureLongDescription as ensureLongDescriptionWorkflow } from "../../application/projects/draftMutations";
  import { buildTemplateSyncSignature as buildTemplateSyncSignatureWorkflow, buildWizardProgressState as buildWizardProgressStateWorkflow } from "../../application/projects/wizardProgressWorkflow";
  import { isWizardShowcaseEligible as isWizardShowcaseEligibleWorkflow } from "../../application/projects/wizardShowcaseEligibility";
  import { buildAssetOptionSourcePaths as buildAssetOptionSourcePathsWorkflow, buildFontAssetOptions as buildFontAssetOptionsWorkflow, buildProjectAssetEntries as buildProjectAssetEntriesWorkflow } from "../../application/assets/projectAssetWorkflow";
  import { buildExportStyles as buildExportStylesWorkflow } from "../../application/export/exportStylesWorkflow";
  import { buildAssetOptions as buildAssetOptionsWorkflow, isLockedManagedAssetRoot as isLockedManagedAssetRootWorkflow, isManagedAssetRelativePath as isManagedAssetRelativePathWorkflow, isManagedAssetSourcePath as isManagedAssetSourcePathWorkflow, joinAssetFolderPath as joinAssetFolderPathWorkflow, mapLegacyAssetRelativeToManaged as mapLegacyAssetRelativeToManagedWorkflow, normalizeAssetFolderPath as normalizeAssetFolderPathWorkflow, toAssetRelativeForUi as toAssetRelativeForUiWorkflow, USER_MANAGED_ASSET_ROOTS as USER_MANAGED_ASSET_ROOTS_WORKFLOW } from "../../application/assets/workspaceWorkflow";
  import { getProjectScrollSensitivity as getProjectScrollSensitivityWorkflow, resolveCarouselConfigWithSensitivity as resolveCarouselConfigWithSensitivityWorkflow, resolveJukeboxSectionThresholdPx as resolveJukeboxSectionThresholdPxWorkflow } from "../../application/preview/scrollSensitivityWorkflow";
  import { autoAssignSectionBackgroundsByOrder as autoAssignSectionBackgroundsByOrderWorkflow, buildSectionBackgroundIndexByCategory as buildSectionBackgroundIndexByCategoryWorkflow, buildSectionBackgroundState as buildSectionBackgroundStateWorkflow, getNextUnusedSectionBackgroundId as getNextUnusedSectionBackgroundIdWorkflow, getSectionModeBackgroundEntries as getSectionModeBackgroundEntriesWorkflow, normalizeSectionBackgroundId as normalizeSectionBackgroundIdWorkflow } from "../../application/preview/sectionBackgroundWorkflow";
  import { buildPreviewFontVarStyle as buildPreviewFontVarStyleWorkflow, buildProjectFontFaceCss as buildProjectFontFaceCssWorkflow, buildFontStack as buildFontStackWorkflow, collectProjectBuiltinFontHrefs as collectProjectBuiltinFontHrefsWorkflow, getItemFontStyle as getItemFontStyleWorkflow, getProjectInterfaceFontConfig as getProjectInterfaceFontConfigWorkflow } from "../../application/typography/fontWorkflow";
  import { onDestroy, onMount, tick } from "svelte";
  import { getAllergenValues as getLocalizedAllergenValues } from "../../core/menu/allergens";
  import { commonAllergenCatalog, menuTerms } from "../../core/menu/catalogs";
  import { getLocalizedValue } from "../../core/menu/localization";
  import { normalizeProject } from "../../core/menu/normalization";
  import { applyWizardDemoRotationDirections } from "../../core/menu/wizardDemoRotation";
  import { INTERACTIVE_GIF_MAX_FRAMES, INTERACTIVE_KEEP_ORIGINAL_PLACEMENT, wrapCarouselIndex } from "../../core/templates/previewInteraction";
  import { getTemplateCapabilities, getTemplateStrategy, resolveTemplateId, type TemplateCapabilities, type TemplateId, type TemplateStrategy } from "../../core/templates/registry";
  import { templateOptions } from "../../core/templates/templateOptions";
  import { buildResponsiveSrcSetForMenuItem, getCarouselImageSourceForMenuItem, getDetailImageSourceForMenuItem } from "../../export-runtime/imageSources";
  import { buildRuntimeScript } from "../../export-runtime/buildRuntimeScript";
  import { createBridgeAssetClient } from "../../infrastructure/bridge/client";
  import { normalizeAssetPath, planEntryMove, planEntryRename, resolveBridgeAssetLookup } from "../../infrastructure/bridge/pathing";
  import { copyDirectoryHandleTo, copyFileHandleTo, getDirectoryHandleByPath as getDirectoryHandleByFsPath, getFileHandleByPath as getFileHandleByFsPath, listFilesystemEntries, writeFileToDirectory } from "../../infrastructure/filesystem/client";
  import { loadProject } from "../../lib/loadProject";
  import { loadProjects, type ProjectSummary } from "../../lib/loadProjects";
  import type { MenuCategory, MenuItem, MenuProject } from "../../lib/types";
  import { instructionCopy as instructionCopyConfig, type InstructionKey } from "../config/instructionCopy";
  import { fontOptions } from "../config/staticOptions";
  import RuntimeWorkspace from "./RuntimeWorkspace.svelte";
  import RuntimeSurfaceHost from "./RuntimeSurfaceHost.svelte";
  import { uiCopy as uiCopyConfig, type UiKey } from "../config/uiCopy";
  import type { AppController } from "../controllers/createAppController";
  import { createAppLifecycleController } from "../controllers/appLifecycleController";
  import type { AssetWorkspaceEntry, AssetWorkspaceFolderOption, AssetWorkspaceTreeRow } from "../controllers/assetWorkspaceController";
  import { createBackgroundRotationController } from "../controllers/backgroundRotationController";
  import { createCarouselController } from "../controllers/carouselController";
  import { createFontStyleController } from "../controllers/fontStyleController";
  import { createInteractiveMediaController } from "../controllers/interactiveMediaController";
  import { createPreviewBackgroundController } from "../controllers/previewBackgroundController";
  import { createPreviewNavigationController } from "../controllers/previewNavigationController";
  import { createPreviewController } from "../controllers/previewController";
  import type { ModalController } from "../controllers/modalController";
  import { createRuntimeModalSurfaceController } from "../controllers/runtimeModalSurfaceController";
  import { ensureDraftMetaLocalizedField } from "../controllers/runtimeDraftMetaController";
  import { createRuntimePresentationController } from "../controllers/runtimePresentationController";
  import { createRuntimePreviewAdapterController } from "../controllers/runtimePreviewAdapterController";
  import { createRuntimeAssetReader } from "../controllers/runtimeAssetReaderController";
  import { isTargetWithinEditorPanel, tryLockLandscape } from "../controllers/runtimeShellDomController";
  import { createRuntimeStateAccessors, createRuntimeStateBridge } from "../controllers/runtimeStateBridgeController";
  import { createRuntimeWiring } from "../controllers/runtimeWiringController";
  import { createRuntimeShellController } from "../controllers/runtimeShellController";
  import { createWizardShowcaseController } from "../controllers/wizardShowcaseController";
  import appCssRaw from "../../app.css?raw";
  export let controller: AppController | null = null;
  $: controllerState = controller?.state;
  let controllerState: AppController["state"] | undefined;
  let project: MenuProject | null = null;
  let draft: MenuProject | null = null;
  let projects: ProjectSummary[] = [];
  let activeSlug = "nuevo-proyecto";
  let locale = "es";
  let loadError = "";
  let activeProject: MenuProject | null = null;
  let showLanding = true;
  let previewFontStack = "";
  let previewFontVars = "";
  let fontFaceCss = "";
  let builtInFontHrefs: string[] = [];
  let editorOpen = false;
  let previewMode: "device" | "mobile" | "full" = "device";
  let deviceMode: "mobile" | "desktop" = "desktop";
  let activeTemplateId: TemplateId = "focus-rows";
  let activeTemplateCapabilities: TemplateCapabilities = getTemplateCapabilities(activeTemplateId);
  let activeTemplateStrategy: TemplateStrategy = getTemplateStrategy(activeTemplateId);
  let editorTab: "info" | "assets" | "edit" | "wizard" = "info";
  let wizardStep = 0;
  let projectFileInput: HTMLInputElement | null = null;
  let assetUploadInput: HTMLInputElement | null = null;
  let openError = "";
  let needsAssets = false;
  let lastSaveName = "";
  let exportError = "";
  let exportStatus = "";
  let workflowMode: "save" | "export" | "upload" | null = null;
  let workflowStep = "";
  let workflowProgress = 0;
  const workflowProgressRefs = {
    pulseTimer: null as ReturnType<typeof setInterval> | null,
    resetTimer: null as ReturnType<typeof setTimeout> | null
  };
  let assetTaskVisible = false;
  let assetTaskStep = "";
  let assetTaskProgress = 0;
  const assetTaskProgressRefs = {
    pulseTimer: null as ReturnType<typeof setInterval> | null,
    resetTimer: null as ReturnType<typeof setTimeout> | null
  };
  let activeItem: { category: string; itemId: string } | null = null;
  let modalMediaHost: HTMLDivElement | null = null;
  let modalMediaImage: HTMLImageElement | null = null;
  const ROTATE_CUE_RESHOW_IDLE_MS = 3000;
  const ROTATE_CUE_LOOP_MS = 5000;
  const DEBUG_INTERACTIVE_CENTER =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("debugRotate");
  const interactiveMediaController = createInteractiveMediaController({
    debugInteractiveCenter: DEBUG_INTERACTIVE_CENTER,
    rotateCueReshowIdleMs: ROTATE_CUE_RESHOW_IDLE_MS,
    rotateCueLoopMs: ROTATE_CUE_LOOP_MS,
    keepOriginalPlacement: INTERACTIVE_KEEP_ORIGINAL_PLACEMENT,
    maxFrames: INTERACTIVE_GIF_MAX_FRAMES
  });
  let carouselActive: Record<string, number> = {};
  let uiLang: "es" | "en" = "es";
  let editLang = "es";
  let editPanel: "identity" | "background" | "section" | "dish" = "identity";
  let wizardLang = "es";
  let wizardCategoryId = "";
  let wizardItemId = "";
  let selectedCategoryId = "";
  let selectedItemId = "";
  let wizardStatus = {
    structure: false,
    identity: false,
    categories: false,
    dishes: false,
    preview: false
  };
  let wizardProgress = 0;
  let selectedCategory: MenuCategory | null = null;
  let selectedItem: MenuItem | null = null;
  let wizardCategory: MenuCategory | null = null;
  let wizardItem: MenuItem | null = null;
  let projectAssets: { id: string; label: string; src: string; group: string }[] = [];
  let selectedAssetIds: string[] = [];
  let rootHandle: FileSystemDirectoryHandle | null = null;
  let bridgeAvailable = false;
  let assetMode: "filesystem" | "bridge" | "none" = "none";
  let bridgeProjectSlug = "";
  let fsEntries: AssetWorkspaceEntry[] = [];
  let fsError = "";
  let rootFiles: string[] = [];
  let assetOptions: { value: string; label: string }[] = [];
  let fontAssetOptions: { value: string; label: string }[] = [];
  let rootLabel = "";
  let assetProjectReadOnly = false;
  let expandedPaths: Record<string, boolean> = {};
  let treeRows: AssetWorkspaceTreeRow[] = [];
  let uploadTargetPath = "";
  let uploadFolderOptions: AssetWorkspaceFolderOption[] = [];
  let fontChoice = "Fraunces";
  let previewBackgrounds: { id: string; src: string }[] = [];
  let loadedPreviewBackgroundIndexes: number[] = [];
  let activeBackgroundIndex = 0;
  let projectScrollSensitivity = { item: 5, section: 5 };
  let sectionBackgroundIndexByCategory: Record<string, number> = {};
  let sectionBackgroundOptionsByCategory: Record<string, { value: string; label: string }[]> = {};
  let sectionBackgroundNeedsCoverage = false;
  let sectionBackgroundHasDuplicates = false;
  let sectionBackgroundMappingValid = true;
  let normalizeBackgroundCarouselSeconds = (value: unknown) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return 9;
    return Math.min(60, Math.max(2, Math.round(parsed)));
  };
  let isSectionBackgroundMode = (value: MenuProject | null) =>
    value?.meta.backgroundDisplayMode === "section";
  const carouselController = createCarouselController({
    getActive: () => carouselActive,
    setActive: (next) => {
      carouselActive = next;
    },
    getItemCount: (categoryId) =>
      activeProject?.categories.find((item) => item.id === categoryId)?.items.length ?? 0,
    getConfig: () => resolveCarouselConfigWithSensitivityWorkflow(activeTemplateCapabilities.carousel, projectScrollSensitivity.item),
    normalizeWheelDelta: (event) => activeTemplateStrategy.normalizeWheelDelta(event),
    wrapIndex: wrapCarouselIndex
  });
  const previewNavigationController = createPreviewNavigationController({
    getProject: () => activeProject,
    getTemplateCapabilities: () => activeTemplateCapabilities,
    getDeviceMode: () => deviceMode,
    getActiveItem: () => activeItem,
    getSectionBackgroundIndexByCategory: () => sectionBackgroundIndexByCategory,
    getActiveBackgroundIndex: () => activeBackgroundIndex,
    setActiveBackgroundIndex: (index) => {
      activeBackgroundIndex = index;
    },
    isSectionBackgroundMode: (project) => isSectionBackgroundMode(project),
    closeDish: () => closeDish(),
    shiftCarousel: (categoryId, direction) => carouselController.shift(categoryId, direction)
  });
  const previewController = createPreviewController();
  const backgroundRotationController = createBackgroundRotationController();
  const runtimePreviewAdapterController = createRuntimePreviewAdapterController({
    tick,
    queryMenuScroll: () => document.querySelector<HTMLElement>(".menu-scroll"),
    getActiveTemplateCapabilities: () => activeTemplateCapabilities,
    getDeviceMode: () => deviceMode,
    getActiveProject: () => activeProject,
    getCarouselActive: () => carouselActive,
    setCarouselActive: (next) => {
      carouselActive = next;
    },
    wrapCarouselIndex,
    getJukeboxHorizontalSectionThresholdPx: () => resolveJukeboxSectionThresholdPxWorkflow(300, projectScrollSensitivity.section),
    carouselController,
    previewController,
    previewNavigationController
  });
  const appLifecycleController = createAppLifecycleController({
    onDesktopModeChange: (isDesktop) => {
      deviceMode = isDesktop ? "desktop" : "mobile";
      void runtimePreviewAdapterController.syncCarousels();
    },
    onViewportChange: () => {
      void runtimePreviewAdapterController.syncCarousels();
    },
    onKeydown: (event) => {
      previewNavigationController.handleDesktopPreviewKeydown(event);
    },
    viewportDebounceMs: 120
  });
  let previewStartupLoading = false;
  let previewStartupProgress = 100;
  let previewStartupBlockingSources = new Set<string>();
  let modalController: ModalController | null = null;
  let templateSyncSignature = "";
  let wizardDemoPreview = false;
  let wizardNeedsRootBackground = false;
  let wizardShowcaseProject: MenuProject | null = null;
  let runtimeWorkspaceShell: Record<string, unknown> = {};
  let runtimeWorkspaceEditor: Record<string, unknown> = {};
  let runtimeWorkspacePreview: Record<string, unknown> = {};
  let runtimeWorkspaceControllers: Record<string, unknown> = {};
  let runtimeWorkspaceActions: Record<string, unknown> = {};
  let runtimeSurfaceModel: Record<string, unknown> = {};
  let runtimeSurfaceActions: Record<string, unknown> = {};

  const TEMPLATE_DEMO_PROJECT_SLUG = "sample-cafebrunch-menu";
  const TEMPLATE_DEMO_ASSET_PREFIXES = [
    `/projects/${TEMPLATE_DEMO_PROJECT_SLUG}/assets/`,
    "/projects/demo/assets/"
  ] as const;
  const READ_ONLY_ASSET_PROJECTS = new Set<string>([TEMPLATE_DEMO_PROJECT_SLUG, "demo"]);
  const USER_MANAGED_ASSET_ROOTS = USER_MANAGED_ASSET_ROOTS_WORKFLOW;
  const DEFAULT_BACKGROUND_CAROUSEL_SECONDS = 9;
  const MIN_BACKGROUND_CAROUSEL_SECONDS = 2;
  const MAX_BACKGROUND_CAROUSEL_SECONDS = 60;
  const bridgeClient = createBridgeAssetClient(fetch);

  const normalizeAssetFolderPath = normalizeAssetFolderPathWorkflow;
  const joinAssetFolderPath = joinAssetFolderPathWorkflow;
  const mapLegacyAssetRelativeToManaged = mapLegacyAssetRelativeToManagedWorkflow;
  const isManagedAssetRelativePath = isManagedAssetRelativePathWorkflow;
  const isLockedManagedAssetRoot = isLockedManagedAssetRootWorkflow;
  const toAssetRelativeForUi = toAssetRelativeForUiWorkflow;
  const isManagedAssetSourcePath = isManagedAssetSourcePathWorkflow;
  const buildAssetOptions = buildAssetOptionsWorkflow;

  const normalizeSectionBackgroundId = normalizeSectionBackgroundIdWorkflow;
  const getSectionModeBackgroundEntries = (project: MenuProject) =>
    getSectionModeBackgroundEntriesWorkflow(project, t("backgroundLabel"));
  const buildSectionBackgroundState = (project: MenuProject) =>
    buildSectionBackgroundStateWorkflow(project, t("backgroundLabel"));
  const autoAssignSectionBackgroundsByOrder = (project: MenuProject) =>
    autoAssignSectionBackgroundsByOrderWorkflow(project, t("backgroundLabel"));
  const getNextUnusedSectionBackgroundId = (project: MenuProject, currentCategoryId = "") =>
    getNextUnusedSectionBackgroundIdWorkflow(project, currentCategoryId, t("backgroundLabel"));

  const fontStyleController = createFontStyleController({ dataAttribute: "menuFont" });
  const previewBackgroundController = createPreviewBackgroundController({
    defaultCarouselSeconds: DEFAULT_BACKGROUND_CAROUSEL_SECONDS,
    minCarouselSeconds: MIN_BACKGROUND_CAROUSEL_SECONDS,
    maxCarouselSeconds: MAX_BACKGROUND_CAROUSEL_SECONDS,
    rotationController: backgroundRotationController,
    getActiveProject: () => activeProject,
    getPreviewBackgrounds: () => previewBackgrounds,
    getActiveBackgroundIndex: () => activeBackgroundIndex,
    setActiveBackgroundIndex: (index) => {
      activeBackgroundIndex = index;
    },
    getSectionBackgroundIndexByCategory: () => sectionBackgroundIndexByCategory,
    getActiveSectionCategoryId: () =>
      previewNavigationController.getActiveSectionCategoryId(),
    getLoadedBackgroundIndexes: () => loadedPreviewBackgroundIndexes,
    setLoadedBackgroundIndexes: (indexes) => {
      loadedPreviewBackgroundIndexes = indexes;
    }
  });
  normalizeBackgroundCarouselSeconds = previewBackgroundController.normalizeBackgroundCarouselSeconds;
  isSectionBackgroundMode = previewBackgroundController.isSectionBackgroundMode;

  const uiCopy = uiCopyConfig;

  let t: (key: UiKey) => string = (key) => uiCopy.es[key];
  $: t = (key) => uiCopy[uiLang]?.[key] ?? key;

  $: if (draft) {
    const normalized = normalizeDraftSelectionStateWorkflow({
      draft,
      selectedCategoryId,
      selectedItemId,
      wizardCategoryId,
      wizardItemId,
      editLang,
      wizardLang,
      fontOptions
    });
    selectedCategoryId = normalized.selectedCategoryId;
    selectedItemId = normalized.selectedItemId;
    selectedCategory = normalized.selectedCategory;
    selectedItem = normalized.selectedItem;
    wizardCategoryId = normalized.wizardCategoryId;
    wizardItemId = normalized.wizardItemId;
    wizardCategory = normalized.wizardCategory;
    wizardItem = normalized.wizardItem;
    editLang = normalized.editLang;
    wizardLang = normalized.wizardLang;
    fontChoice = normalized.fontChoice;
  }

  $: if (draft) {
    projectAssets = buildProjectAssetEntriesWorkflow(
      draft,
      editLang,
      getLocalizedValue
    );
  }

  $: assetOptions = buildAssetOptions(
    buildAssetOptionSourcePathsWorkflow({
      rootFiles,
      editorTab,
      wizardDemoPreview,
      projectAssets,
      isManagedAssetSourcePath
    })
  );
  $: fontAssetOptions = buildFontAssetOptionsWorkflow(
    assetOptions,
    toAssetRelativeForUi,
    mapLegacyAssetRelativeToManaged
  );
  $: if (draft) {
    const sectionState = buildSectionBackgroundState(draft);
    sectionBackgroundOptionsByCategory = sectionState.optionsByCategory;
    sectionBackgroundNeedsCoverage =
      sectionState.hasInsufficientBackgrounds ||
      sectionState.hasMissingAssignments ||
      sectionState.hasInvalidAssignments;
    sectionBackgroundHasDuplicates = sectionState.hasDuplicateAssignments;
    sectionBackgroundMappingValid = sectionState.isComplete;
  } else {
    sectionBackgroundOptionsByCategory = {};
    sectionBackgroundNeedsCoverage = false;
    sectionBackgroundHasDuplicates = false;
    sectionBackgroundMappingValid = true;
  }
  $: rootLabel = rootHandle
    ? rootHandle.name
    : bridgeAvailable
      ? `Container · ${getProjectSlug()}`
      : t("rootNone");
  $: if (needsAssets && assetMode !== "none" && rootFiles.length > 0) {
    needsAssets = false;
  }
  $: if (assetMode === "bridge") {
    const slug = getProjectSlug();
    if (slug && slug !== bridgeProjectSlug) {
      void refreshBridgeEntries();
    }
  }

  $: effectivePreview =
    previewMode === "device" ? (deviceMode === "mobile" ? "mobile" : "full") : previewMode;
  $: editorVisible = editorOpen;
  $: showEditorToggle = !editorOpen;
  $: editorPresentation = deviceMode === "mobile" ? "mobile-sheet" : "desktop-card";
  $: isBlankMenu =
    !!activeProject &&
    !activeProject.meta.template &&
    activeProject.backgrounds.length === 0 &&
    activeProject.categories.length === 0;

  $: {
    const wizardState = buildWizardProgressStateWorkflow({
      draft,
      rootFiles,
      assetMode,
      editorTab,
      sectionBackgroundMappingValid,
      templateDemoPrefixes: TEMPLATE_DEMO_ASSET_PREFIXES,
      wizardStepCount: wizardSteps.length
    });
    wizardNeedsRootBackground = wizardState.wizardNeedsRootBackground;
    wizardStatus = wizardState.wizardStatus;
    wizardProgress = wizardState.wizardProgress;
    if (!draft) {
      templateSyncSignature = "";
    }
  }

  $: if (draft && wizardShowcaseProject && !isWizardShowcaseEligibleWorkflow(draft)) {
    wizardShowcaseProject = null;
    wizardDemoPreview = false;
  }

  $: if (draft) {
    const signature = buildTemplateSyncSignatureWorkflow(draft);
    if (signature !== templateSyncSignature) {
      templateSyncSignature = signature;
      runtimePreviewAdapterController.initCarouselIndices(draft);
    }
  }

  onMount(async () => {
    await runtimeBootstrapController.mount();
  });

  onDestroy(() => {
    runtimeBootstrapController.destroy();
  });

  $: interactiveMediaController.setMediaHost(modalMediaHost);
  $: interactiveMediaController.setMediaImage(modalMediaImage);

  $: {
    const showcaseActive =
      editorTab === "wizard" &&
      wizardStep === 0 &&
      wizardDemoPreview &&
      wizardShowcaseProject;
    activeProject = showcaseActive ? wizardShowcaseProject : (draft ?? project);
  }
  $: modalController?.syncProject(activeProject);
  $: {
    activeTemplateId = resolveTemplateId(activeProject?.meta.template);
    activeTemplateCapabilities = getTemplateCapabilities(activeTemplateId);
    activeTemplateStrategy = getTemplateStrategy(activeTemplateId);
    projectScrollSensitivity = getProjectScrollSensitivityWorkflow(activeProject);
  }
  $: assetProjectReadOnly = isProtectedAssetProjectSlug(
    draft?.meta.slug || activeSlug || "nuevo-proyecto"
  );
  $: previewFontStack = activeProject
    ? buildFontStack(getProjectInterfaceFontConfig(activeProject).family)
    : "";
  $: previewFontVars = activeProject ? buildPreviewFontVarStyle(activeProject) : "";
  $: fontFaceCss = activeProject ? buildProjectFontFaceCss(activeProject) : "";
  $: builtInFontHrefs = activeProject ? collectProjectBuiltinFontHrefs(activeProject) : [];
  $: previewBackgrounds =
    activeProject?.backgrounds
      ?.filter((item) => item.src && item.src.trim().length > 0)
      .map((item, index) => ({
        id: item.id || `bg-${index}`,
        src: item.src
      })) ?? [];
  $: sectionBackgroundIndexByCategory = buildSectionBackgroundIndexByCategoryWorkflow(
    activeProject,
    previewBackgrounds
  );
  $: fontStyleController.sync(fontFaceCss);
  $: {
    activeProject;
    previewBackgrounds;
    sectionBackgroundIndexByCategory;
    if (typeof window !== "undefined") {
      previewBackgroundController.syncForProjectChange();
    }
  }
  $: {
    activeBackgroundIndex;
    previewBackgrounds;
    if (typeof window !== "undefined") {
      previewBackgroundController.syncLoadedBackgroundIndexes();
    }
  }
  const touchDraft = () => {
    if (draft) {
      draft = { ...draft };
    }
  };
  const normalizeAssetSrc = normalizeAssetSourceWorkflow;
  const instructionCopy = instructionCopyConfig;
  const isProtectedAssetProjectSlug = (slug: string) => READ_ONLY_ASSET_PROJECTS.has(slug);
  const runtimePresentationController = createRuntimePresentationController({
    getLocale: () => locale,
    getDefaultLocale: () => activeProject?.meta.defaultLocale ?? "es",
    getTemplateId: () => activeTemplateId,
    getActiveProject: () => activeProject,
    textOfLocalized: textOfLocalizedWorkflow,
    getMenuTermLocalized: getMenuTermLocalizedWorkflow,
    getInstructionCopyLocalized: getInstructionCopyLocalizedWorkflow,
    getTemplateInstructionKey: (templateId) =>
      getTemplateCapabilities(templateId).instructionHintKey as InstructionKey,
    getLocalizedAllergenValues,
    formatProjectPrice: formatProjectPriceWorkflow,
    menuTerms,
    instructionCopy
  });
  const textOf = runtimePresentationController.textOf;
  const getMenuTerm = runtimePresentationController.getMenuTerm;
  const getLoadingLabel = runtimePresentationController.getLoadingLabel;
  const getDishTapHint = runtimePresentationController.getDishTapHint;
  const getAssetOwnershipDisclaimer = runtimePresentationController.getAssetOwnershipDisclaimer;
  const getTemplateScrollHint = runtimePresentationController.getTemplateScrollHint;
  const getAllergenValues = runtimePresentationController.getAllergenValues;
  const ensureMetaTitle = () => ensureDraftMetaLocalizedField(draft, "title");
  const ensureRestaurantName = () =>
    ensureDraftMetaLocalizedField(draft, "restaurantName");

  const cloneProject = cloneProjectWorkflow;
  const wizardShowcaseController = createWizardShowcaseController({
    templateDemoProjectSlug: TEMPLATE_DEMO_PROJECT_SLUG,
    cacheBust: "wizard-demo-rotation-v1",
    loadProject,
    normalizeProject,
    applyWizardDemoRotationDirections,
    cloneProject
  });
  const buildWizardShowcaseProject = async (templateId: string) =>
    await wizardShowcaseController.buildWizardShowcaseProject(draft, templateId);
  const createEmptyProject = (): MenuProject =>
    createEmptyProjectWorkflow(DEFAULT_BACKGROUND_CAROUSEL_SECONDS);

  const ensureDescription = ensureDescriptionWorkflow;
  const ensureLongDescription = ensureLongDescriptionWorkflow;
  const ensureAllergens = ensureAllergensWorkflow;

  const slugifyName = slugifyNameWorkflow;
  const normalizeZipName = normalizeZipNameWorkflow;
  const getSuggestedZipName = () => {
    if (lastSaveName) {
      const base = lastSaveName.replace(/\.json$/i, "").replace(/\.zip$/i, "");
      return getSuggestedZipNameWorkflow(base, "menu");
    }
    const baseName = draft?.meta.name?.trim() || draft?.meta.slug || "menu";
    return getSuggestedZipNameWorkflow(baseName, "menu");
  };

  const buildExportStyles = () => buildExportStylesWorkflow(appCssRaw);

  const buildExportScript = (data: MenuProject) =>
    buildRuntimeScript(data, {
      defaultBackgroundCarouselSeconds: DEFAULT_BACKGROUND_CAROUSEL_SECONDS,
      minBackgroundCarouselSeconds: MIN_BACKGROUND_CAROUSEL_SECONDS,
      maxBackgroundCarouselSeconds: MAX_BACKGROUND_CAROUSEL_SECONDS,
      instructionCopy
    });

  const runtimeAssetReader = createRuntimeAssetReader({
    getAssetMode: () => assetMode,
    getRootHandle: () => rootHandle,
    getFileHandleByPath: getFileHandleByFsPath,
    bridgeClient,
    resolveBridgeLookup: resolveBridgeAssetLookup,
    normalizeAssetSource: normalizeAssetSrc
  });
  const readAssetBytes = runtimeAssetReader.readAssetBytes;

  let wizardSteps: string[] = [];
  $: wizardSteps = [
    t("wizardStepStructure"),
    t("wizardStepIdentity"),
    t("wizardStepCategories"),
    t("wizardStepDishes"),
    t("wizardStepPreview")
  ];

  const buildResponsiveSrcSetFromMedia = (item: MenuItem) =>
    buildResponsiveSrcSetForMenuItem(item);

  const getCarouselImageSource = (item: MenuItem) =>
    getCarouselImageSourceForMenuItem(item);

  const getDetailImageSource = (item: MenuItem) =>
    getDetailImageSourceForMenuItem(item);

  const getInteractiveDetailAsset = interactiveMediaController.getInteractiveDetailAsset;
  const supportsInteractiveMedia = interactiveMediaController.supportsInteractiveMedia;
  const getInteractiveAssetBytes = interactiveMediaController.prefetchInteractiveBytes;
  const teardownInteractiveDetailMedia = interactiveMediaController.teardown;
  const setupInteractiveDetailMedia = interactiveMediaController.setup;

  const runtimeShellController = createRuntimeShellController({
    getState: () => ({
      editorOpen,
      deviceMode,
      previewMode,
      editorTab,
      wizardStep,
      wizardSteps,
      wizardStatus,
      wizardDemoPreview,
      wizardShowcaseProject
    }),
    setState: (next) => {
      if (next.editorOpen !== undefined) editorOpen = next.editorOpen;
      if (next.previewMode !== undefined) previewMode = next.previewMode;
      if (next.editorTab !== undefined) editorTab = next.editorTab;
      if (next.wizardStep !== undefined) wizardStep = next.wizardStep;
      if (next.wizardDemoPreview !== undefined) wizardDemoPreview = next.wizardDemoPreview;
    },
    syncCarousels: runtimePreviewAdapterController.syncCarousels,
    tryLockLandscape,
    isTargetWithinEditorPanel
  });

  const handleDesktopOutsidePointer = (event: PointerEvent) => {
    runtimeShellController.handleDesktopOutsidePointer(event);
  };
  const toggleEditor = () => runtimeShellController.toggleEditor();
  const setEditorTab = (tab: "info" | "assets" | "edit" | "wizard") =>
    runtimeShellController.setEditorTab(tab);
  const syncWizardShowcaseVisibility = () => runtimeShellController.syncWizardShowcaseVisibility();
  const isWizardStepValid = (index: number) => runtimeShellController.isWizardStepValid(index);
  const goToStep = (index: number) => runtimeShellController.goToStep(index);
  const goNextStep = () => runtimeShellController.goNextStep();
  const goPrevStep = () => runtimeShellController.goPrevStep();

  const getProjectSlug = () => draft?.meta.slug || activeSlug || "nuevo-proyecto";
  const normalizePath = normalizeAssetPath;

  const ensureAssetProjectWritable = () => {
    if (!assetProjectReadOnly) return true;
    fsError = t("assetsReadOnly");
    return false;
  };

  let updateAssetMode = () => {};
  let refreshBridgeEntries = async () => {};
  const runtimeStateBridge = createRuntimeStateBridge(
    createRuntimeStateAccessors([
      ["project", () => project, (value) => (project = value)],
      ["draft", () => draft, (value) => (draft = value)],
      ["projects", () => projects, (value) => (projects = value)],
      ["activeSlug", () => activeSlug, (value) => (activeSlug = value)],
      ["locale", () => locale, (value) => (locale = value)],
      ["loadError", () => loadError, (value) => (loadError = value)],
      ["uiLang", () => uiLang, (value) => (uiLang = value)],
      ["editLang", () => editLang, (value) => (editLang = value)],
      ["editPanel", () => editPanel, (value) => (editPanel = value)],
      ["wizardLang", () => wizardLang, (value) => (wizardLang = value)],
      ["wizardCategoryId", () => wizardCategoryId, (value) => (wizardCategoryId = value)],
      ["wizardItemId", () => wizardItemId, (value) => (wizardItemId = value)],
      ["wizardStep", () => wizardStep, (value) => (wizardStep = value)],
      ["wizardDemoPreview", () => wizardDemoPreview, (value) => (wizardDemoPreview = value)],
      ["wizardShowcaseProject", () => wizardShowcaseProject, (value) => (wizardShowcaseProject = value)],
      ["wizardCategory", () => wizardCategory, (value) => (wizardCategory = value)],
      ["wizardItem", () => wizardItem, (value) => (wizardItem = value)],
      ["lastSaveName", () => lastSaveName, (value) => (lastSaveName = value)],
      ["needsAssets", () => needsAssets, (value) => (needsAssets = value)],
      ["openError", () => openError, (value) => (openError = value)],
      ["exportError", () => exportError, (value) => (exportError = value)],
      ["exportStatus", () => exportStatus, (value) => (exportStatus = value)],
      ["workflowMode", () => workflowMode, (value) => (workflowMode = value)],
      ["workflowStep", () => workflowStep, (value) => (workflowStep = value)],
      ["workflowProgress", () => workflowProgress, (value) => (workflowProgress = value)],
      ["assetTaskVisible", () => assetTaskVisible, (value) => (assetTaskVisible = value)],
      ["assetTaskStep", () => assetTaskStep, (value) => (assetTaskStep = value)],
      ["assetTaskProgress", () => assetTaskProgress, (value) => (assetTaskProgress = value)],
      ["assetMode", () => assetMode, (value) => (assetMode = value)],
      ["editorTab", () => editorTab, (value) => (editorTab = value)],
      ["editorOpen", () => editorOpen, (value) => (editorOpen = value)],
      ["showLanding", () => showLanding, (value) => (showLanding = value)],
      ["activeProject", () => activeProject, (value) => (activeProject = value)],
      ["selectedCategoryId", () => selectedCategoryId, (value) => (selectedCategoryId = value)],
      ["selectedItemId", () => selectedItemId, (value) => (selectedItemId = value)],
      ["rootHandle", () => rootHandle, (value) => (rootHandle = value)],
      ["bridgeAvailable", () => bridgeAvailable, (value) => (bridgeAvailable = value)],
      ["bridgeProjectSlug", () => bridgeProjectSlug, (value) => (bridgeProjectSlug = value)],
      ["fsEntries", () => fsEntries, (value) => (fsEntries = value)],
      ["rootFiles", () => rootFiles, (value) => (rootFiles = value)],
      ["fsError", () => fsError, (value) => (fsError = value)],
      ["uploadTargetPath", () => uploadTargetPath, (value) => (uploadTargetPath = value)],
      ["uploadFolderOptions", () => uploadFolderOptions, (value) => (uploadFolderOptions = value)],
      ["expandedPaths", () => expandedPaths, (value) => (expandedPaths = value)],
      ["treeRows", () => treeRows, (value) => (treeRows = value)],
      ["selectedAssetIds", () => selectedAssetIds, (value) => (selectedAssetIds = value)],
      ["assetProjectReadOnly", () => assetProjectReadOnly, (value) => (assetProjectReadOnly = value)],
      ["activeItem", () => activeItem, (value) => (activeItem = value)],
      ["previewStartupLoading", () => previewStartupLoading, (value) => (previewStartupLoading = value)],
      ["previewStartupProgress", () => previewStartupProgress, (value) => (previewStartupProgress = value)],
      ["previewStartupBlockingSources", () => previewStartupBlockingSources, (value) => (previewStartupBlockingSources = value)]
    ])
  );

  const {
    runtimeBindings,
    runtimeBootstrapController,
    modalController: runtimeModalController,
    updateAssetMode: runtimeUpdateAssetMode,
    refreshBridgeEntries: runtimeRefreshBridgeEntries
  } = createRuntimeWiring({
    bindings: {
      t: () => t,
      fontOptions,
      templateOptions,
      commonAllergenCatalog,
      bridgeClient,
      userManagedRoots: USER_MANAGED_ASSET_ROOTS,
      workflowRefs: workflowProgressRefs,
      assetTaskRefs: assetTaskProgressRefs,
      getState: runtimeStateBridge.getState,
      setState: runtimeStateBridge.setState,
      touchDraft,
      cloneProject,
      createEmptyProject,
      initCarouselIndices: runtimePreviewAdapterController.initCarouselIndices,
      resetTemplateDemoCache: wizardShowcaseController.resetCache,
      syncWizardShowcaseVisibility,
      buildWizardShowcaseProject,
      getLocalizedValue,
      normalizeBackgroundCarouselSeconds,
      normalizeSectionBackgroundId,
      getSectionModeBackgroundEntries,
      autoAssignSectionBackgroundsByOrder,
      getNextUnusedSectionBackgroundId,
      ensureDescription,
      ensureLongDescription,
      ensureAllergens,
      resolveTemplateId,
      isWizardShowcaseEligible: isWizardShowcaseEligibleWorkflow,
      normalizePath,
      readAssetBytes,
      buildExportStyles,
      buildRuntimeScript: buildExportScript,
      getCarouselImageSource,
      mapLegacyAssetRelativeToManaged,
      isManagedAssetRelativePath,
      slugifyName,
      normalizeZipName,
      getSuggestedZipName,
      getProjectSlug,
      refreshBridgeEntries: async () => await refreshBridgeEntries(),
      ensureAssetProjectWritable,
      isProtectedAssetProjectSlug,
      isLockedManagedAssetRoot,
      joinAssetFolderPath,
      planEntryMove,
      planEntryRename,
      getDirectoryHandleByPath: getDirectoryHandleByFsPath,
      listFilesystemEntries,
      copyFileHandleTo,
      copyDirectoryHandleTo,
      writeFileToDirectory,
      showDirectoryPicker: (
        window as Window & { showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle> }
      ).showDirectoryPicker,
      prompt: (message, defaultValue = "") => window.prompt(message, defaultValue),
      openProjectDialog: () => projectFileInput?.click(),
      promptAssetUpload: async () => {
        await tick();
        assetUploadInput?.click();
      },
      getDetailImageSource,
      getInteractiveDetailAsset,
      supportsInteractiveMedia,
      prefetchInteractiveBytes: getInteractiveAssetBytes,
      setRotateDirection: (direction) => {
        interactiveMediaController.setRotateDirection(direction);
      },
      setupInteractiveMedia: setupInteractiveDetailMedia,
      teardownInteractiveMedia: teardownInteractiveDetailMedia,
      getDishRotateDirection: (item) => (item?.media.rotationDirection === "cw" ? -1 : 1),
      schedulePostOpen: (task) => void tick().then(() => task())
    },
    bootstrap: {
      appLifecycleMount: () => appLifecycleController.mount(),
      appLifecycleDestroy: () => appLifecycleController.destroy(),
      pingBridge: async () => await bridgeClient.ping(),
      getAssetMode: () => assetMode,
      loadProjects: async () => await loadProjects(),
      createEmptyProject,
      cloneProject,
      initCarouselIndices: runtimePreviewAdapterController.initCarouselIndices,
      setState: runtimeStateBridge.setState
    },
    buildDestroyCallbacks: ({ previewStartupController, workflowStatusController }) => [
      () => previewStartupController.destroy(),
      () => previewController.destroy(),
      () => teardownInteractiveDetailMedia(),
      () => previewBackgroundController.destroy(),
      () => fontStyleController.destroy(),
      () => workflowStatusController.destroy(),
      () => runtimePreviewAdapterController.clearCarouselWheelState()
    ]
  });

  const {
    workflowStatusController,
    previewStartupController,
    editorDraftController,
    projectWorkflowController,
    assetWorkspaceController
  } = runtimeBindings;
  modalController = runtimeModalController;
  updateAssetMode = runtimeUpdateAssetMode;
  refreshBridgeEntries = runtimeRefreshBridgeEntries;

  const runtimeModalSurfaceController = createRuntimeModalSurfaceController({
    getModalController: () => modalController,
    getInteractiveDetailAsset,
    setupInteractiveMedia: setupInteractiveDetailMedia,
    supportsInteractiveMedia
  });
  const prefetchDishDetail = runtimeModalSurfaceController.prefetchDishDetail;
  const openDish = runtimeModalSurfaceController.openDish;
  const closeDish = runtimeModalSurfaceController.closeDish;
  $: runtimeModalSurfaceController.syncInteractiveMedia({
    activeItem,
    modalMediaHost,
    modalMediaImage
  });

  $: previewStartupController.syncProject(activeProject);
  $: {
    fsEntries;
    rootFiles;
    assetMode;
    expandedPaths;
    assetWorkspaceController.syncDerivedState();
  }

  const buildFontStack = buildFontStackWorkflow;
  const getProjectInterfaceFontConfig = getProjectInterfaceFontConfigWorkflow;
  const collectProjectBuiltinFontHrefs = collectProjectBuiltinFontHrefsWorkflow;
  const buildProjectFontFaceCss = buildProjectFontFaceCssWorkflow;
  const buildPreviewFontVarStyle = buildPreviewFontVarStyleWorkflow;
  const getItemFontStyle = (item: MenuItem) => getItemFontStyleWorkflow(activeProject, item);

  const handleMenuWheel = runtimePreviewAdapterController.handleMenuWheel;
  const handleMenuScroll = runtimePreviewAdapterController.handleMenuScroll;
  const shiftSection = runtimePreviewAdapterController.shiftSection;
  const shiftCarousel = runtimePreviewAdapterController.shiftCarousel;
  const handleCarouselWheel = runtimePreviewAdapterController.handleCarouselWheel;
  const handleCarouselTouchStart = runtimePreviewAdapterController.handleCarouselTouchStart;
  const handleCarouselTouchMove = runtimePreviewAdapterController.handleCarouselTouchMove;
  const handleCarouselTouchEnd = runtimePreviewAdapterController.handleCarouselTouchEnd;

  let activeDish: MenuItem | null = null;
  let modalInteractiveEnabled = false;
  $: {
    const modalSurface = runtimeModalSurfaceController.resolveSurface({
      activeItem,
      hasActiveProject: Boolean(activeProject)
    });
    activeDish = modalSurface.dish;
    modalInteractiveEnabled = modalSurface.interactiveEnabled;
  }

  const formatPrice = runtimePresentationController.formatPrice;

  $: runtimeWorkspaceShell = { t, uiLang, locale, showLanding, loadError, project, activeProject, showEditorToggle, editorVisible, editorPresentation, editorTab, deviceMode, previewMode };
  $: runtimeWorkspaceEditor = {
    draft, templateOptions, workflowMode, openError, exportStatus, exportError, workflowStep, workflowProgress, fontChoice, fontAssetOptions, rootLabel, assetProjectReadOnly, assetUploadInput, uploadTargetPath, uploadFolderOptions,
    needsAssets, fsError, assetTaskVisible, assetTaskStep, assetTaskProgress, assetMode, fsEntries, treeRows, selectedAssetIds, editPanel, editLang, selectedCategoryId, selectedItemId, selectedCategory, selectedItem, assetOptions,
    sectionBackgroundOptionsByCategory, sectionBackgroundNeedsCoverage, sectionBackgroundHasDuplicates, commonAllergenCatalog, normalizeBackgroundCarouselSeconds, wizardStep, wizardSteps, wizardProgress, wizardStatus, wizardLang, wizardCategoryId, wizardItemId, wizardCategory, wizardItem,
    wizardDemoPreview, wizardNeedsRootBackground, getLocalizedValue, textOf, ensureRestaurantName, ensureMetaTitle, touchDraft
  };
  $: runtimeWorkspacePreview = {
    effectivePreview, previewStartupLoading, previewStartupProgress, previewStartupBlockingSources, previewBackgrounds, loadedPreviewBackgroundIndexes, activeBackgroundIndex, isBlankMenu, carouselActive, previewFontStack, previewFontVars,
    getLoadingLabel, getTemplateScrollHint, getCarouselImageSource, buildResponsiveSrcSetFromMedia, getMenuTerm, formatPrice, getDishTapHint, getAssetOwnershipDisclaimer, getItemFontStyle
  };
  $: runtimeWorkspaceControllers = { editorDraftController, projectWorkflowController, assetWorkspaceController };
  $: runtimeWorkspaceActions = {
    setProjectFileInput: (input: HTMLInputElement | null) => (projectFileInput = input), setUiLang: (lang: "es" | "en") => (uiLang = lang), setLocale: (value: string) => (locale = value),
    setEditorTab, toggleEditor, setUploadTargetPath: (path: string) => (uploadTargetPath = path), setAssetUploadInput: (input: HTMLInputElement | null) => (assetUploadInput = input),
    setEditPanel: (panel: "identity" | "background" | "section" | "dish") => (editPanel = panel), setSelectedCategoryId: (categoryId: string) => (selectedCategoryId = categoryId), setSelectedItemId: (itemId: string) => (selectedItemId = itemId),
    setWizardLang: (lang: string) => (wizardLang = lang), setWizardCategoryId: (categoryId: string) => (wizardCategoryId = categoryId), setWizardItemId: (itemId: string) => (wizardItemId = itemId),
    isWizardStepValid, goToStep, goPrevStep, goNextStep, shiftSection, handleMenuWheel, handleMenuScroll, shiftCarousel, handleCarouselWheel, handleCarouselTouchStart, handleCarouselTouchMove, handleCarouselTouchEnd, openDish, prefetchDishDetail
  };
  $: runtimeSurfaceModel = { activeItem, dish: activeDish, interactiveEnabled: modalInteractiveEnabled, itemFontStyle: activeDish ? getItemFontStyle(activeDish) : "", modalMediaHost, modalMediaImage, textOf, getDetailImageSource, getAllergenValues, getMenuTerm, formatPrice, assetOptions, fontAssetOptions };
  $: runtimeSurfaceActions = { closeDish, setModalMediaHost: (host: HTMLDivElement | null) => (modalMediaHost = host), setModalMediaImage: (image: HTMLImageElement | null) => (modalMediaImage = image) };
</script>
<svelte:window on:pointerdown={handleDesktopOutsidePointer} />
<RuntimeWorkspace
  shell={runtimeWorkspaceShell}
  editor={runtimeWorkspaceEditor}
  preview={runtimeWorkspacePreview}
  controllers={runtimeWorkspaceControllers}
  actions={runtimeWorkspaceActions}
/>
<RuntimeSurfaceHost model={runtimeSurfaceModel} actions={runtimeSurfaceActions} />
