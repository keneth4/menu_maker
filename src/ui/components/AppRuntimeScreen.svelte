<svelte:head>
  <title>{t("appTitle")}</title>
  {#each builtInFontHrefs as href (href)}
    <link rel="stylesheet" href={href} />
  {/each}
</svelte:head>

<script lang="ts">
  import { createEmptyProject as createEmptyProjectWorkflow, cloneProject as cloneProjectWorkflow } from "../../application/projects/session";
  import {
    getSuggestedZipName as getSuggestedZipNameWorkflow,
    normalizeZipName as normalizeZipNameWorkflow,
    slugifyName as slugifyNameWorkflow
  } from "../../application/projects/saveWorkflow";
  import {
    normalizeDraftSelectionState as normalizeDraftSelectionStateWorkflow
  } from "../../application/projects/draftSelectionWorkflow";
  import {
    ensureAllergens as ensureAllergensWorkflow,
    ensureDescription as ensureDescriptionWorkflow,
    ensureLongDescription as ensureLongDescriptionWorkflow
  } from "../../application/projects/draftMutations";
  import {
    buildTemplateSyncSignature as buildTemplateSyncSignatureWorkflow,
    buildWizardProgressState as buildWizardProgressStateWorkflow
  } from "../../application/projects/wizardProgressWorkflow";
  import {
    buildAssetOptionSourcePaths as buildAssetOptionSourcePathsWorkflow,
    buildFontAssetOptions as buildFontAssetOptionsWorkflow,
    buildProjectAssetEntries as buildProjectAssetEntriesWorkflow
  } from "../../application/assets/projectAssetWorkflow";
  import { buildExportStyles as buildExportStylesWorkflow } from "../../application/export/exportStylesWorkflow";
  import {
    buildAssetOptions as buildAssetOptionsWorkflow,
    isLockedManagedAssetRoot as isLockedManagedAssetRootWorkflow,
    isManagedAssetRelativePath as isManagedAssetRelativePathWorkflow,
    isManagedAssetSourcePath as isManagedAssetSourcePathWorkflow,
    joinAssetFolderPath as joinAssetFolderPathWorkflow,
    mapLegacyAssetRelativeToManaged as mapLegacyAssetRelativeToManagedWorkflow,
    normalizeAssetFolderPath as normalizeAssetFolderPathWorkflow,
    toAssetRelativeForUi as toAssetRelativeForUiWorkflow,
    USER_MANAGED_ASSET_ROOTS as USER_MANAGED_ASSET_ROOTS_WORKFLOW
  } from "../../application/assets/workspaceWorkflow";
  import {
    autoAssignSectionBackgroundsByOrder as autoAssignSectionBackgroundsByOrderWorkflow,
    buildSectionBackgroundIndexByCategory as buildSectionBackgroundIndexByCategoryWorkflow,
    buildSectionBackgroundState as buildSectionBackgroundStateWorkflow,
    getNextUnusedSectionBackgroundId as getNextUnusedSectionBackgroundIdWorkflow,
    getSectionModeBackgroundEntries as getSectionModeBackgroundEntriesWorkflow,
    normalizeSectionBackgroundId as normalizeSectionBackgroundIdWorkflow
  } from "../../application/preview/sectionBackgroundWorkflow";
  import {
    buildPreviewFontVarStyle as buildPreviewFontVarStyleWorkflow,
    buildProjectFontFaceCss as buildProjectFontFaceCssWorkflow,
    buildFontStack as buildFontStackWorkflow,
    collectProjectBuiltinFontHrefs as collectProjectBuiltinFontHrefsWorkflow,
    getItemFontStyle as getItemFontStyleWorkflow,
    getProjectInterfaceFontConfig as getProjectInterfaceFontConfigWorkflow
  } from "../../application/typography/fontWorkflow";
  import { onDestroy, onMount, tick } from "svelte";
  import {
    getAllergenValues as getLocalizedAllergenValues
  } from "../../core/menu/allergens";
  import { commonAllergenCatalog, menuTerms } from "../../core/menu/catalogs";
  import { getLocalizedValue, normalizeLocaleCode } from "../../core/menu/localization";
  import { normalizeProject } from "../../core/menu/normalization";
  import { formatMenuPrice } from "../../core/menu/pricing";
  import { applyWizardDemoRotationDirections } from "../../core/menu/wizardDemoRotation";
  import {
    INTERACTIVE_GIF_MAX_FRAMES,
    INTERACTIVE_KEEP_ORIGINAL_PLACEMENT,
    wrapCarouselIndex
  } from "../../core/templates/previewInteraction";
  import {
    getTemplateCapabilities,
    getTemplateStrategy,
    resolveTemplateId,
    type TemplateCapabilities,
    type TemplateId,
    type TemplateStrategy
  } from "../../core/templates/registry";
  import { templateOptions } from "../../core/templates/templateOptions";
  import {
    buildResponsiveSrcSetForMenuItem,
    getCarouselImageSourceForMenuItem,
    getDetailImageSourceForMenuItem
  } from "../../export-runtime/imageSources";
  import { buildRuntimeScript } from "../../export-runtime/buildRuntimeScript";
  import { createBridgeAssetClient } from "../../infrastructure/bridge/client";
  import {
    normalizeAssetPath,
    planEntryMove,
    planEntryRename,
    resolveBridgeAssetLookup
  } from "../../infrastructure/bridge/pathing";
  import {
    copyDirectoryHandleTo,
    copyFileHandleTo,
    getDirectoryHandleByPath as getDirectoryHandleByFsPath,
    getFileHandleByPath as getFileHandleByFsPath,
    listFilesystemEntries,
    writeFileToDirectory
  } from "../../infrastructure/filesystem/client";
  import { loadProject } from "../../lib/loadProject";
  import { loadProjects, type ProjectSummary } from "../../lib/loadProjects";
  import type {
    MenuCategory,
    MenuItem,
    MenuProject
  } from "../../lib/types";
  import {
    instructionCopy as instructionCopyConfig,
    type InstructionKey
  } from "../config/instructionCopy";
  import { currencyOptions, fontOptions, languageOptions } from "../config/staticOptions";
  import AssetsManager from "./AssetsManager.svelte";
  import DishModal from "./DishModal.svelte";
  import EditorShell from "./EditorShell.svelte";
  import EditPanel from "./EditPanel.svelte";
  import LandingView from "./LandingView.svelte";
  import PreviewCanvas from "./PreviewCanvas.svelte";
  import WizardPanel from "./WizardPanel.svelte";
  import { uiCopy as uiCopyConfig, type UiKey } from "../config/uiCopy";
  import type { AppController } from "../controllers/createAppController";
  import { createAppLifecycleController } from "../controllers/appLifecycleController";
  import {
    createAssetWorkspaceController,
    type AssetWorkspaceEntry,
    type AssetWorkspaceFolderOption,
    type AssetWorkspaceTreeRow
  } from "../controllers/assetWorkspaceController";
  import { createBackgroundRotationController } from "../controllers/backgroundRotationController";
  import { createCarouselController } from "../controllers/carouselController";
  import { createEditorDraftController } from "../controllers/editorDraftController";
  import { createFontStyleController } from "../controllers/fontStyleController";
  import { createInteractiveMediaController } from "../controllers/interactiveMediaController";
  import { createModalController } from "../controllers/modalController";
  import { createPreviewBackgroundController } from "../controllers/previewBackgroundController";
  import { createPreviewNavigationController } from "../controllers/previewNavigationController";
  import { createPreviewController } from "../controllers/previewController";
  import { createPreviewStartupController } from "../controllers/previewStartupController";
  import { createProjectWorkflowController } from "../controllers/projectWorkflowController";
  import { createWorkflowStatusController } from "../controllers/workflowStatusController";
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
  let languageMenuOpen = false;
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
  let sectionBackgroundIndexByCategory: Record<string, number> = {};
  let sectionBackgroundOptionsByCategory: Record<
    string,
    { value: string; label: string }[]
  > = {};
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
    getConfig: () => activeTemplateCapabilities.carousel,
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
    shiftCarousel: (categoryId, direction) => shiftCarousel(categoryId, direction)
  });
  const previewController = createPreviewController();
  const backgroundRotationController = createBackgroundRotationController();
  const appLifecycleController = createAppLifecycleController({
    onDesktopModeChange: (isDesktop) => {
      deviceMode = isDesktop ? "desktop" : "mobile";
      void syncCarousels();
    },
    onViewportChange: () => {
      void syncCarousels();
    },
    onKeydown: (event) => {
      previewNavigationController.handleDesktopPreviewKeydown(event);
    },
    viewportDebounceMs: 120
  });
  let previewStartupLoading = false;
  let previewStartupProgress = 100;
  let previewStartupBlockingSources = new Set<string>();
  let modalController: ReturnType<typeof createModalController> | null = null;
  let templateSyncSignature = "";
  let wizardDemoPreview = false;
  let wizardNeedsRootBackground = false;
  let wizardShowcaseProject: MenuProject | null = null;
  let templateDemoProjectCache: MenuProject | null = null;
  let templateDemoProjectPromise: Promise<MenuProject | null> | null = null;

  const TEMPLATE_DEMO_PROJECT_SLUG = "sample-cafebrunch-menu";
  const TEMPLATE_DEMO_ASSET_PREFIXES = [
    `/projects/${TEMPLATE_DEMO_PROJECT_SLUG}/assets/`,
    "/projects/demo/assets/"
  ] as const;
  const READ_ONLY_ASSET_PROJECTS = new Set<string>([
    TEMPLATE_DEMO_PROJECT_SLUG,
    "demo"
  ]);
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
  let selectedLabel: (count: number) => string = (count) => `${count} seleccionados`;
  $: t = (key) => uiCopy[uiLang]?.[key] ?? key;
  $: selectedLabel = (count) =>
    uiLang === "es" ? `${count} seleccionados` : `${count} selected`;

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

  $: if (draft) {
    const signature = buildTemplateSyncSignatureWorkflow(draft);
    if (signature !== templateSyncSignature) {
      templateSyncSignature = signature;
      initCarouselIndices(draft);
    }
  }

  onMount(async () => {
    try {
      appLifecycleController.mount();

      try {
        bridgeAvailable = await bridgeClient.ping();
      } catch {
        bridgeAvailable = false;
      }
      updateAssetMode();
      if (assetMode === "bridge") {
        await refreshBridgeEntries();
      }

      try {
        projects = await loadProjects();
      } catch {
        projects = [];
      }
      const emptyProject = createEmptyProject();
      project = emptyProject;
      draft = cloneProject(emptyProject);
      activeSlug = emptyProject.meta.slug;
      locale = emptyProject.meta.defaultLocale;
      initCarouselIndices(emptyProject);
    } catch (error) {
      loadError = error instanceof Error ? error.message : "Error desconocido";
    }
  });

  onDestroy(() => {
    previewStartupController.destroy();
    appLifecycleController.destroy();
    previewController.destroy();
    teardownInteractiveDetailMedia();
    previewBackgroundController.destroy();
    fontStyleController.destroy();
    workflowStatusController.destroy();
    clearCarouselWheelState();
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

  $: if (typeof window !== "undefined") {
    previewBackgroundController.syncRotation();
  }
  $: previewBackgroundController.syncSectionModeActiveIndex();
  $: previewBackgroundController.syncLoadedBackgroundIndexes();

  const touchDraft = () => {
    if (draft) {
      draft = { ...draft };
    }
  };

  const textOf = (entry: Record<string, string> | undefined, fallback = "") => {
    if (!entry) return fallback;
    return entry[locale] ?? entry[activeProject?.meta.defaultLocale ?? "es"] ?? fallback;
  };

  const normalizeAssetSrc = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return "";
    return trimmed.startsWith("/") ? trimmed : `/${trimmed.replace(/^\/+/, "")}`;
  };

  const getMenuTerm = (term: "allergens" | "vegan", lang = locale) => {
    const localeKey = normalizeLocaleCode(lang) as keyof typeof menuTerms;
    return menuTerms[localeKey]?.[term] ?? menuTerms.en[term];
  };

  const instructionCopy = instructionCopyConfig;

  const getInstructionCopy = (key: InstructionKey, lang = locale) => {
    const localeKey = normalizeLocaleCode(lang) as keyof typeof instructionCopy;
    return (instructionCopy[localeKey] ?? instructionCopy.en)[key] ?? instructionCopy.en[key];
  };

  const getLoadingLabel = (lang = locale) => getInstructionCopy("loadingLabel", lang);

  const getDishTapHint = (lang = locale) => getInstructionCopy("tapHint", lang);

  const getAssetOwnershipDisclaimer = (lang = locale) => getInstructionCopy("assetDisclaimer", lang);

  const getTemplateScrollHint = (
    lang = locale,
    templateId: string = activeTemplateId
  ) => getInstructionCopy(getTemplateCapabilities(templateId).instructionHintKey, lang);

  const isProtectedAssetProjectSlug = (slug: string) => READ_ONLY_ASSET_PROJECTS.has(slug);

  const getAllergenValues = (item: MenuItem, lang = locale) =>
    getLocalizedAllergenValues(item.allergens, lang, activeProject?.meta.defaultLocale ?? "es");

  const ensureMetaTitle = () => {
    if (!draft) return null;
    if (!draft.meta.title) {
      draft.meta.title = createLocalized(draft.meta.locales);
    }
    return draft.meta.title;
  };

  const ensureRestaurantName = () => {
    if (!draft) return null;
    if (!draft.meta.restaurantName) {
      draft.meta.restaurantName = createLocalized(draft.meta.locales);
    }
    return draft.meta.restaurantName;
  };

  const cloneProject = cloneProjectWorkflow;

  const loadTemplateDemoProject = async () => {
    if (templateDemoProjectCache) {
      return cloneProject(templateDemoProjectCache);
    }
    if (!templateDemoProjectPromise) {
      templateDemoProjectPromise = loadProject(TEMPLATE_DEMO_PROJECT_SLUG, {
        cacheBust: "wizard-demo-rotation-v1"
      })
        .then((value) => normalizeProject(value))
        .then((value) => applyWizardDemoRotationDirections(value))
        .then((value) => {
          templateDemoProjectCache = cloneProject(value);
          return cloneProject(value);
        })
        .catch((error) => {
          console.warn("Unable to load template demo project", error);
          return null;
        })
        .finally(() => {
          templateDemoProjectPromise = null;
        });
    }
    const loaded = await templateDemoProjectPromise;
    return loaded ? cloneProject(loaded) : null;
  };

  const buildWizardShowcaseProject = async (templateId: string) => {
    if (!draft) return null;
    const demo = await loadTemplateDemoProject();
    if (!demo) return null;
    const showcase = cloneProject(demo);
    showcase.meta.template = templateId;
    showcase.meta.locales = [...draft.meta.locales];
    showcase.meta.defaultLocale = draft.meta.defaultLocale;
    showcase.meta.currency = draft.meta.currency;
    showcase.meta.currencyPosition = draft.meta.currencyPosition;
    showcase.meta.identityMode = draft.meta.identityMode;
    showcase.meta.logoSrc = draft.meta.logoSrc;
    showcase.meta.fontFamily = draft.meta.fontFamily;
    showcase.meta.fontSource = draft.meta.fontSource;
    showcase.meta.fontRoles = draft.meta.fontRoles;
    showcase.meta.backgroundCarouselSeconds = draft.meta.backgroundCarouselSeconds;
    showcase.meta.backgroundDisplayMode = draft.meta.backgroundDisplayMode;
    return showcase;
  };

  const createEmptyProject = (): MenuProject =>
    createEmptyProjectWorkflow(DEFAULT_BACKGROUND_CAROUSEL_SECONDS);

  let toggleLanguage = (_code: string) => {};
  let toggleCurrencyPosition = () => {};
  let applyTemplate = async (
    _templateId: string,
    _options: { source?: "wizard" | "project" } = {}
  ) => {};
  let addBackground = () => {};
  let setBackgroundDisplayMode = (_mode: "carousel" | "section") => {};
  let setCategoryBackgroundId = (_category: MenuCategory, _backgroundId: string) => {};
  let setBackgroundCarouselSeconds = (_seconds: number) => {};
  let moveBackground = (_id: string, _direction: -1 | 1) => {};
  let removeBackground = (_id: string) => {};
  let addSection = () => {};
  let deleteSection = () => {};
  let addDish = () => {};
  let addWizardCategory = () => {};
  let removeWizardCategory = (_id: string) => {};
  let addWizardDish = () => {};
  let removeWizardDish = () => {};
  let deleteDish = () => {};
  let goPrevDish = () => {};
  let goNextDish = () => {};
  let handleDescriptionInput = (_item: MenuItem, _lang: string, _event: Event) => {};
  let handleLongDescriptionInput = (_item: MenuItem, _lang: string, _event: Event) => {};
  let isCommonAllergenChecked = (_item: MenuItem, _id: string) => false;
  let getCommonAllergenLabel = (_entry: { label: Record<string, string> }, _lang: string = editLang) =>
    "";
  let getCustomAllergensInput = (_item: MenuItem, _lang: string = editLang) => "";
  let toggleCommonAllergen = (_item: MenuItem, _allergenId: string, _checked: boolean) => {};
  let handleCommonAllergenToggle = (_item: MenuItem, _allergenId: string, _event: Event) => {};
  let handleCustomAllergensInput = (_item: MenuItem, _lang: string, _event: Event) => {};
  let handleLocalizedInput = (
    _record: Record<string, string>,
    _lang: string,
    _event: Event
  ) => {};
  let cycleEditLang = () => {};
  let handleCurrencyChange = (_event: Event) => {};
  let handleFontChoice = (_value: string) => {};
  let handleFontSelect = (_event: Event) => {};
  let handleCustomFontSourceInput = (_event: Event) => {};
  let setIdentityMode = (_mode: "text" | "logo") => {};
  let setLogoSrc = (_src: string) => {};
  let setFontRoleSource = (_role: "identity" | "section" | "item", _source: string) => {};
  let setItemScrollAnimationMode = (_item: MenuItem, _mode: "hero360" | "alternate") => {};
  let setItemScrollAnimationSrc = (_item: MenuItem, _source: string) => {};
  let setItemPriceVisible = (_item: MenuItem, _visible: boolean) => {};
  let setItemFontSource = (_item: MenuItem, _source: string) => {};
  let getDishRotateDirection = (_item: MenuItem | null): 1 | -1 => -1;
  let setItemRotationDirection = (_item: MenuItem, _direction: "cw" | "ccw") => {};
  let handleVeganToggle = (_item: MenuItem, _event: Event) => {};

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

  const workflowStatusController = createWorkflowStatusController({
    translate: (key) => t(key),
    workflowRefs: workflowProgressRefs,
    assetTaskRefs: assetTaskProgressRefs,
    getState: () => ({
      workflowMode,
      workflowStep,
      workflowProgress,
      assetTaskVisible,
      assetTaskStep,
      assetTaskProgress,
      uiLang
    }),
    setState: (next) => {
      if (next.workflowMode !== undefined) workflowMode = next.workflowMode;
      if (next.workflowStep !== undefined) workflowStep = next.workflowStep;
      if (next.workflowProgress !== undefined) workflowProgress = next.workflowProgress;
      if (next.assetTaskVisible !== undefined) assetTaskVisible = next.assetTaskVisible;
      if (next.assetTaskStep !== undefined) assetTaskStep = next.assetTaskStep;
      if (next.assetTaskProgress !== undefined) assetTaskProgress = next.assetTaskProgress;
    }
  });

  const clearWorkflowPulse = workflowStatusController.clearWorkflowPulse;
  const startWorkflow = workflowStatusController.startWorkflow;
  const updateWorkflow = workflowStatusController.updateWorkflow;
  const pulseWorkflow = workflowStatusController.pulseWorkflow;
  const updateWorkflowAssetStep = workflowStatusController.updateWorkflowAssetStep;
  const finishWorkflow = workflowStatusController.finishWorkflow;
  const failWorkflow = workflowStatusController.failWorkflow;
  const clearAssetTaskPulse = workflowStatusController.clearAssetTaskPulse;
  const startAssetTask = workflowStatusController.startAssetTask;
  const updateAssetTask = workflowStatusController.updateAssetTask;
  const pulseAssetTask = workflowStatusController.pulseAssetTask;
  const finishAssetTask = workflowStatusController.finishAssetTask;
  const failAssetTask = workflowStatusController.failAssetTask;

  let queueBridgeDerivedPreparation = async (
    _slug: string,
    sourceProject: MenuProject,
    _options: { applyIfUnchanged: boolean }
  ) => sourceProject;
  const buildExportStyles = () => buildExportStylesWorkflow(appCssRaw);

  const buildExportScript = (data: MenuProject) =>
    buildRuntimeScript(data, {
      defaultBackgroundCarouselSeconds: DEFAULT_BACKGROUND_CAROUSEL_SECONDS,
      minBackgroundCarouselSeconds: MIN_BACKGROUND_CAROUSEL_SECONDS,
      maxBackgroundCarouselSeconds: MAX_BACKGROUND_CAROUSEL_SECONDS,
      instructionCopy
    });

  const readAssetBytes = async (
    slug: string,
    sourcePath: string
  ): Promise<Uint8Array | null> => {
    if (assetMode === "filesystem" && rootHandle) {
      try {
        const fileHandle = await getFileHandleByFsPath(rootHandle, sourcePath);
        const file = await fileHandle.getFile();
        const buffer = await file.arrayBuffer();
        return new Uint8Array(buffer);
      } catch {
        // Fall back to static fetch for demo assets referenced from /projects/*.
      }
    }
    if (assetMode === "bridge") {
      const lookup = resolveBridgeAssetLookup(sourcePath, slug);
      return await bridgeClient.readFileBytes(lookup.slug, lookup.path);
    }
    const publicPath = normalizeAssetSrc(sourcePath);
    if (publicPath.startsWith("/projects/")) {
      const response = await fetch(publicPath);
      if (!response.ok) return null;
      const buffer = await response.arrayBuffer();
      return new Uint8Array(buffer);
    }
    return null;
  };

  let saveProject = async () => {};
  let exportStaticSite = async () => {};

  const isTargetWithinEditorPanel = (target: EventTarget | null): boolean => {
    if (!(target instanceof Node)) return false;
    const panel = document.querySelector(".editor-panel");
    return panel?.contains(target) ?? false;
  };

  const handleDesktopOutsidePointer = (event: PointerEvent) => {
    if (!editorOpen || deviceMode !== "desktop") return;
    if (isTargetWithinEditorPanel(event.target)) return;
    editorOpen = false;
  };

  const toggleEditor = () => {
    editorOpen = !editorOpen;
  };

  const togglePreviewMode = () => {
    if (previewMode === "device") {
      previewMode = deviceMode === "mobile" ? "full" : "mobile";
    } else {
      previewMode = "device";
    }
    if (deviceMode === "mobile" && previewMode === "full") {
      void tryLockLandscape();
    }
    if (deviceMode === "mobile" && previewMode === "device") {
      screen.orientation?.unlock?.();
    }
    if (previewMode === "device") {
      editorOpen = false;
    }
    void syncCarousels();
  };

  const tryLockLandscape = async () => {
    try {
      if (screen.orientation?.lock) {
        await screen.orientation.lock("landscape");
      }
    } catch {
      // Ignore failures; browser may require fullscreen or user gesture.
    }
  };

  let wizardSteps: string[] = [];
  $: wizardSteps = [
    t("wizardStepStructure"),
    t("wizardStepIdentity"),
    t("wizardStepCategories"),
    t("wizardStepDishes"),
    t("wizardStepPreview")
  ];

  const clearCarouselWheelState = () => {
    carouselController.clear();
  };

  const buildResponsiveSrcSetFromMedia = (item: MenuItem) =>
    buildResponsiveSrcSetForMenuItem(item);

  const getCarouselImageSource = (item: MenuItem) =>
    getCarouselImageSourceForMenuItem(item);

  const getDetailImageSource = (item: MenuItem) =>
    getDetailImageSourceForMenuItem(item);

  const getInteractiveAssetMime = interactiveMediaController.getInteractiveAssetMime;
  const getInteractiveDetailAsset = interactiveMediaController.getInteractiveDetailAsset;
  const supportsInteractiveMedia = interactiveMediaController.supportsInteractiveMedia;
  const getInteractiveAssetBytes = interactiveMediaController.prefetchInteractiveBytes;
  const teardownInteractiveDetailMedia = interactiveMediaController.teardown;
  const setupInteractiveDetailMedia = interactiveMediaController.setup;

  modalController = createModalController({
    getProject: () => activeProject,
    getActiveItem: () => activeItem,
    setActiveItem: (value) => {
      activeItem = value;
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
    getDishRotateDirection: (item) => getDishRotateDirection(item),
    schedulePostOpen: (task) => {
      void tick().then(() => task());
    }
  });

  const prefetchDishDetail = (categoryId: string, itemId: string, includeNeighbors = false) => {
    modalController?.prefetchDishDetail(categoryId, itemId, includeNeighbors);
  };
  const openDish = (categoryId: string, itemId: string) => {
    modalController?.openDish(categoryId, itemId);
  };
  const closeDish = () => {
    modalController?.closeDish();
  };
  const resolveActiveDish = () => modalController?.resolveActiveDish() ?? null;
  let interactiveSetupSignature = "";
  $: {
    const dish = resolveActiveDish();
    const interactiveAsset = getInteractiveDetailAsset(dish);
    const signature =
      activeItem && interactiveAsset && modalMediaHost && modalMediaImage
        ? [
            activeItem.category,
            activeItem.itemId,
            interactiveAsset.source,
            interactiveAsset.mime
          ].join("::")
        : "";
    if (signature !== interactiveSetupSignature) {
      interactiveSetupSignature = signature;
      if (signature) {
        void setupInteractiveDetailMedia(interactiveAsset);
      }
    }
  }

  const previewStartupController = createPreviewStartupController({
    getCarouselImageSource,
    onStateChange: (state) => {
      previewStartupLoading = state.loading;
      previewStartupProgress = state.progress;
      previewStartupBlockingSources = state.blockingSources;
    }
  });

  $: previewStartupController.syncProject(activeProject);

  const syncWizardShowcaseVisibility = () => {
    wizardDemoPreview =
      editorTab === "wizard" && wizardStep === 0 && Boolean(wizardShowcaseProject);
  };

  const goToStep = (index: number) => {
    wizardStep = index;
    syncWizardShowcaseVisibility();
  };

  const isWizardStepValid = (index: number) => {
    if (index === 0) return wizardStatus.structure;
    if (index === 1) return wizardStatus.identity;
    if (index === 2) return wizardStatus.categories;
    if (index === 3) return wizardStatus.dishes;
    return wizardStatus.preview;
  };

  const goNextStep = () => {
    if (wizardStep >= wizardSteps.length - 1) return;
    if (!isWizardStepValid(wizardStep)) return;
    wizardStep += 1;
    syncWizardShowcaseVisibility();
  };

  const goPrevStep = () => {
    if (wizardStep <= 0) return;
    wizardStep -= 1;
    syncWizardShowcaseVisibility();
  };

  const setEditorTab = (tab: "info" | "assets" | "edit" | "wizard") => {
    editorTab = tab;
    syncWizardShowcaseVisibility();
  };

  let applyLoadedProject = async (_data: MenuProject, _sourceName = "") => {};
  let createNewProject = async (_options: { forWizard?: boolean } = {}) => {};
  let startCreateProject = async () => {};
  let startWizard = async () => {};
  let startOpenProject = () => {};
  let openProjectDialog = () => {};
  let handleProjectFile = async (_event: Event) => {};

  const handleMenuScroll = (event: Event) => {
    const container = event.currentTarget as HTMLElement | null;
    if (!container) return;
    previewController.handleMenuScroll({
      container,
      axis: activeTemplateCapabilities.sectionSnapAxis,
      snapDelayMs: activeTemplateCapabilities.sectionSnapDelayMs,
      syncBackground: previewNavigationController.syncSectionBackgroundByIndex
    });
  };

  const syncCarousels = async () => {
    await tick();
    const menuScroll = document.querySelector<HTMLElement>(".menu-scroll");
    if (menuScroll) {
      previewNavigationController.applySectionFocus(menuScroll);
    }
    if (activeTemplateCapabilities.carousel.primaryAxis === "vertical" || !activeProject) {
      return;
    }
    const next = { ...carouselActive };
    activeProject.categories.forEach((category) => {
      const count = category.items.length;
      const current = next[category.id] ?? 0;
      next[category.id] = count > 0 ? wrapCarouselIndex(Math.round(current), count) : 0;
    });
    carouselActive = next;
  };

  const shiftSection = (direction: number) => {
    previewNavigationController.shiftSection(direction);
  };

  const initCarouselIndices = (value: MenuProject) => {
    clearCarouselWheelState();
    const next: Record<string, number> = {};
    value.categories.forEach((category) => {
      next[category.id] = 0;
    });
    carouselActive = next;
    void syncCarousels();
  };

  const editorDraftController = createEditorDraftController({
    t,
    fontOptions,
    commonAllergenCatalog,
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
    buildWizardShowcaseProject,
    resetTemplateDemoCache: () => {
      templateDemoProjectCache = null;
      templateDemoProjectPromise = null;
    },
    syncWizardShowcaseVisibility,
    initCarouselIndices,
    touchDraft,
    getState: () => ({
      draft,
      activeProject,
      editLang,
      selectedCategoryId,
      selectedItemId,
      wizardCategoryId,
      wizardItemId,
      wizardDemoPreview,
      wizardShowcaseProject
    }),
    setState: (next) => {
      if (next.draft !== undefined) draft = next.draft;
      if (next.activeProject !== undefined) activeProject = next.activeProject;
      if (next.editLang !== undefined) editLang = next.editLang;
      if (next.selectedCategoryId !== undefined) selectedCategoryId = next.selectedCategoryId;
      if (next.selectedItemId !== undefined) selectedItemId = next.selectedItemId;
      if (next.wizardCategoryId !== undefined) wizardCategoryId = next.wizardCategoryId;
      if (next.wizardItemId !== undefined) wizardItemId = next.wizardItemId;
      if (next.wizardDemoPreview !== undefined) wizardDemoPreview = next.wizardDemoPreview;
      if (next.wizardShowcaseProject !== undefined) wizardShowcaseProject = next.wizardShowcaseProject;
    }
  });

  toggleLanguage = editorDraftController.toggleLanguage;
  toggleCurrencyPosition = editorDraftController.toggleCurrencyPosition;
  applyTemplate = editorDraftController.applyTemplate;
  addBackground = editorDraftController.addBackground;
  setBackgroundDisplayMode = editorDraftController.setBackgroundDisplayMode;
  setCategoryBackgroundId = editorDraftController.setCategoryBackgroundId;
  setBackgroundCarouselSeconds = editorDraftController.setBackgroundCarouselSeconds;
  moveBackground = editorDraftController.moveBackground;
  removeBackground = editorDraftController.removeBackground;
  addSection = editorDraftController.addSection;
  deleteSection = editorDraftController.deleteSection;
  addDish = editorDraftController.addDish;
  addWizardCategory = editorDraftController.addWizardCategory;
  removeWizardCategory = editorDraftController.removeWizardCategory;
  addWizardDish = editorDraftController.addWizardDish;
  removeWizardDish = editorDraftController.removeWizardDish;
  deleteDish = editorDraftController.deleteDish;
  goPrevDish = editorDraftController.goPrevDish;
  goNextDish = editorDraftController.goNextDish;
  handleDescriptionInput = editorDraftController.handleDescriptionInput;
  handleLongDescriptionInput = editorDraftController.handleLongDescriptionInput;
  isCommonAllergenChecked = editorDraftController.isCommonAllergenChecked;
  getCommonAllergenLabel = editorDraftController.getCommonAllergenLabel;
  getCustomAllergensInput = editorDraftController.getCustomAllergensInput;
  toggleCommonAllergen = editorDraftController.toggleCommonAllergen;
  handleCommonAllergenToggle = editorDraftController.handleCommonAllergenToggle;
  handleCustomAllergensInput = editorDraftController.handleCustomAllergensInput;
  handleLocalizedInput = editorDraftController.handleLocalizedInput;
  cycleEditLang = editorDraftController.cycleEditLang;
  handleCurrencyChange = editorDraftController.handleCurrencyChange;
  handleFontChoice = editorDraftController.handleFontChoice;
  handleFontSelect = editorDraftController.handleFontSelect;
  handleCustomFontSourceInput = editorDraftController.handleCustomFontSourceInput;
  setIdentityMode = editorDraftController.setIdentityMode;
  setLogoSrc = editorDraftController.setLogoSrc;
  setFontRoleSource = editorDraftController.setFontRoleSource;
  setItemScrollAnimationMode = editorDraftController.setItemScrollAnimationMode;
  setItemScrollAnimationSrc = editorDraftController.setItemScrollAnimationSrc;
  setItemPriceVisible = editorDraftController.setItemPriceVisible;
  setItemFontSource = editorDraftController.setItemFontSource;
  getDishRotateDirection = editorDraftController.getDishRotateDirection;
  setItemRotationDirection = editorDraftController.setItemRotationDirection;
  handleVeganToggle = editorDraftController.handleVeganToggle;

  const getProjectSlug = () => draft?.meta.slug || activeSlug || "nuevo-proyecto";
  const normalizePath = normalizeAssetPath;

  const ensureAssetProjectWritable = () => {
    if (!assetProjectReadOnly) return true;
    fsError = t("assetsReadOnly");
    return false;
  };

  const projectWorkflowController = createProjectWorkflowController({
    t,
    bridgeClient,
    getProjectSlug,
    refreshBridgeEntries: async () => await refreshBridgeEntries(),
    initCarouselIndices,
    cloneProject,
    createEmptyProject,
    applyTemplate: async (templateId, options) => await applyTemplate(templateId, options),
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
    prompt: (message, defaultValue = "") => window.prompt(message, defaultValue),
    startWorkflow,
    updateWorkflow,
    pulseWorkflow,
    clearWorkflowPulse,
    updateWorkflowAssetStep,
    finishWorkflow,
    failWorkflow,
    onOpenProjectDialog: () => {
      projectFileInput?.click();
    },
    onPromptAssetUpload: async () => {
      await tick();
      assetUploadInput?.click();
    },
    getState: () => ({
      project,
      draft,
      projects,
      activeSlug,
      locale,
      uiLang,
      editLang,
      editPanel,
      wizardLang,
      wizardCategoryId,
      wizardItemId,
      wizardStep,
      wizardDemoPreview,
      wizardShowcaseProject,
      lastSaveName,
      needsAssets,
      openError,
      exportError,
      exportStatus,
      workflowMode,
      assetMode,
      editorTab,
      editorOpen,
      showLanding
    }),
    setState: (next) => {
      if (next.project !== undefined) project = next.project;
      if (next.draft !== undefined) draft = next.draft;
      if (next.projects !== undefined) projects = next.projects;
      if (next.activeSlug !== undefined) activeSlug = next.activeSlug;
      if (next.locale !== undefined) locale = next.locale;
      if (next.uiLang !== undefined) uiLang = next.uiLang;
      if (next.editLang !== undefined) editLang = next.editLang;
      if (next.editPanel !== undefined) editPanel = next.editPanel;
      if (next.wizardLang !== undefined) wizardLang = next.wizardLang;
      if (next.wizardCategoryId !== undefined) wizardCategoryId = next.wizardCategoryId;
      if (next.wizardItemId !== undefined) wizardItemId = next.wizardItemId;
      if (next.wizardStep !== undefined) wizardStep = next.wizardStep;
      if (next.wizardDemoPreview !== undefined) wizardDemoPreview = next.wizardDemoPreview;
      if (next.wizardShowcaseProject !== undefined) wizardShowcaseProject = next.wizardShowcaseProject;
      if (next.lastSaveName !== undefined) lastSaveName = next.lastSaveName;
      if (next.needsAssets !== undefined) needsAssets = next.needsAssets;
      if (next.openError !== undefined) openError = next.openError;
      if (next.exportError !== undefined) exportError = next.exportError;
      if (next.exportStatus !== undefined) exportStatus = next.exportStatus;
      if (next.workflowMode !== undefined) workflowMode = next.workflowMode;
      if (next.assetMode !== undefined) assetMode = next.assetMode;
      if (next.editorTab !== undefined) editorTab = next.editorTab;
      if (next.editorOpen !== undefined) editorOpen = next.editorOpen;
      if (next.showLanding !== undefined) showLanding = next.showLanding;
    }
  });

  queueBridgeDerivedPreparation = projectWorkflowController.queueBridgeDerivedPreparation;
  saveProject = projectWorkflowController.saveProject;
  exportStaticSite = projectWorkflowController.exportStaticSite;
  applyLoadedProject = projectWorkflowController.applyLoadedProject;
  createNewProject = projectWorkflowController.createNewProject;
  startCreateProject = projectWorkflowController.startCreateProject;
  startWizard = projectWorkflowController.startWizard;
  startOpenProject = projectWorkflowController.startOpenProject;
  openProjectDialog = projectWorkflowController.openProjectDialog;
  handleProjectFile = projectWorkflowController.handleProjectFile;

  const assetWorkspaceController = createAssetWorkspaceController({
    t,
    userManagedRoots: USER_MANAGED_ASSET_ROOTS,
    bridgeClient,
    getProjectSlug,
    mapLegacyAssetRelativeToManaged,
    isManagedAssetRelativePath,
    isLockedManagedAssetRoot,
    joinAssetFolderPath,
    planEntryMove,
    planEntryRename,
    getDirectoryHandleByPath: getDirectoryHandleByFsPath,
    listFilesystemEntries,
    copyFileHandleTo,
    copyDirectoryHandleTo,
    writeFileToDirectory,
    ensureAssetProjectWritable,
    getDraftProject: () => draft,
    cloneProject,
    isProtectedAssetProjectSlug,
    queueBridgeDerivedPreparation: async (slug, project, options) => {
      await queueBridgeDerivedPreparation(slug, project, options);
    },
    startAssetTask,
    updateAssetTask,
    finishAssetTask,
    failAssetTask,
    pulseAssetTask,
    clearAssetTaskPulse,
    prompt: (message, defaultValue = "") => window.prompt(message, defaultValue),
    showDirectoryPicker: (
      window as Window & { showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle> }
    ).showDirectoryPicker,
    getState: () => ({
      rootHandle,
      bridgeAvailable,
      assetMode,
      bridgeProjectSlug,
      fsEntries,
      rootFiles,
      fsError,
      uploadTargetPath,
      uploadFolderOptions,
      expandedPaths,
      treeRows,
      selectedAssetIds,
      assetProjectReadOnly
    }),
    setState: (next) => {
      if (next.rootHandle !== undefined) rootHandle = next.rootHandle;
      if (next.bridgeAvailable !== undefined) bridgeAvailable = next.bridgeAvailable;
      if (next.assetMode !== undefined) assetMode = next.assetMode;
      if (next.bridgeProjectSlug !== undefined) bridgeProjectSlug = next.bridgeProjectSlug;
      if (next.fsEntries !== undefined) fsEntries = next.fsEntries;
      if (next.rootFiles !== undefined) rootFiles = next.rootFiles;
      if (next.fsError !== undefined) fsError = next.fsError;
      if (next.uploadTargetPath !== undefined) uploadTargetPath = next.uploadTargetPath;
      if (next.uploadFolderOptions !== undefined) uploadFolderOptions = next.uploadFolderOptions;
      if (next.expandedPaths !== undefined) expandedPaths = next.expandedPaths;
      if (next.treeRows !== undefined) treeRows = next.treeRows;
      if (next.selectedAssetIds !== undefined) selectedAssetIds = next.selectedAssetIds;
      if (next.assetProjectReadOnly !== undefined) {
        assetProjectReadOnly = next.assetProjectReadOnly;
      }
    }
  });

  const updateAssetMode = assetWorkspaceController.updateAssetMode;
  const refreshRootEntries = assetWorkspaceController.refreshRootEntries;
  const refreshBridgeEntries = assetWorkspaceController.refreshBridgeEntries;
  const pickRootFolder = assetWorkspaceController.pickRootFolder;
  const createFolder = assetWorkspaceController.createFolder;
  const renameEntry = assetWorkspaceController.renameEntry;
  const moveEntry = assetWorkspaceController.moveEntry;
  const deleteEntry = assetWorkspaceController.deleteEntry;
  const bulkDelete = assetWorkspaceController.bulkDelete;
  const bulkMove = assetWorkspaceController.bulkMove;
  const uploadAssets = assetWorkspaceController.uploadAssets;
  const handleAssetUpload = assetWorkspaceController.handleAssetUpload;
  const handleAssetDrop = assetWorkspaceController.handleAssetDrop;
  const handleAssetDragOver = assetWorkspaceController.handleAssetDragOver;
  const toggleExpandPath = assetWorkspaceController.toggleExpandPath;
  const toggleAssetSelection = assetWorkspaceController.toggleAssetSelection;
  const selectAllAssets = assetWorkspaceController.selectAllAssets;
  const clearAssetSelection = assetWorkspaceController.clearAssetSelection;

  $: assetWorkspaceController.syncDerivedState();

  const buildFontStack = buildFontStackWorkflow;
  const getProjectInterfaceFontConfig = getProjectInterfaceFontConfigWorkflow;
  const collectProjectBuiltinFontHrefs = collectProjectBuiltinFontHrefsWorkflow;
  const buildProjectFontFaceCss = buildProjectFontFaceCssWorkflow;
  const buildPreviewFontVarStyle = buildPreviewFontVarStyleWorkflow;
  const getItemFontStyle = (item: MenuItem) => getItemFontStyleWorkflow(activeProject, item);

  const createLocalized = (locales: string[]) => {
    return locales.reduce<Record<string, string>>((acc, lang) => {
      acc[lang] = "";
      return acc;
    }, {});
  };

  const shiftCarousel = (categoryId: string, direction: number) => {
    carouselController.shift(categoryId, direction);
  };

  const handleCarouselWheel = (categoryId: string, event: WheelEvent) => {
    carouselController.handleWheel(categoryId, event);
  };

  const handleCarouselTouchStart = (categoryId: string, event: TouchEvent) => {
    carouselController.handleTouchStart(categoryId, event);
  };

  const handleCarouselTouchMove = (categoryId: string, event: TouchEvent) => {
    carouselController.handleTouchMove(categoryId, event);
  };

  const handleCarouselTouchEnd = (categoryId: string, event: TouchEvent) => {
    carouselController.handleTouchEnd(categoryId, event);
  };

  const formatPrice = (amount: number) => {
    const currency = activeProject?.meta.currency ?? "USD";
    const position = activeProject?.meta.currencyPosition ?? "left";
    return formatMenuPrice(amount, currency, position);
  };

</script>

<svelte:window on:pointerdown={handleDesktopOutsidePointer} />

<main class="min-h-screen app-shell">
  <input
    class="sr-only"
    type="file"
    accept=".json,.zip,application/zip"
    bind:this={projectFileInput}
    on:change={handleProjectFile}
  />
  {#if showLanding}
    <LandingView
      {uiLang}
      {t}
      on:switchLang={(event) => (uiLang = event.detail)}
      on:createProject={startCreateProject}
      on:openProject={startOpenProject}
      on:startWizard={startWizard}
    />
  {:else if loadError}
    <div class="rounded-2xl border border-red-500/30 bg-red-950/40 p-5 text-sm text-red-100">
      {loadError}
    </div>
  {:else if !project}
    <div class="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-200">
      {t("loadingProject")}
    </div>
  {:else if activeProject}
    <div class="split-layout">
      {#if showEditorToggle}
        <button
          class="menu-fab"
          type="button"
          aria-label={t("openEditor")}
          on:click={toggleEditor}
        >
          <span class="menu-fab__icon"></span>
        </button>
      {/if}

      {#if editorVisible && editorPresentation === "desktop-card"}
        <button
          class="editor-backdrop"
          type="button"
          aria-label={t("closeEditor")}
          on:click={toggleEditor}
        ></button>
      {/if}

      <EditorShell
        {t}
        {editorVisible}
        {editorPresentation}
        {uiLang}
        {editorTab}
        setUiLang={(lang) => (uiLang = lang)}
        {setEditorTab}
        {togglePreviewMode}
        {toggleEditor}
      >
          {#if editorTab === "info"}
            <div class="editor-toolbar">
              <button
                class="icon-btn"
                type="button"
                aria-label={t("newProject")}
                title={t("newProject")}
                disabled={workflowMode !== null}
                on:click={createNewProject}
              >
                <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 5v14"></path>
                  <path d="M5 12h14"></path>
                </svg>
              </button>
              <button
                class="icon-btn"
                type="button"
                aria-label={t("open")}
                title={t("open")}
                disabled={workflowMode !== null}
                on:click={openProjectDialog}
              >
                <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M3 7h6l2 2h10v8a2 2 0 0 1-2 2H3z"></path>
                  <path d="M3 7v-2a2 2 0 0 1 2-2h4l2 2"></path>
                </svg>
              </button>
              <button
                class="icon-btn"
                type="button"
                aria-label={t("save")}
                title={t("save")}
                disabled={workflowMode !== null}
                on:click={saveProject}
              >
                <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 4h12l2 2v14H5z"></path>
                  <path d="M7 4v6h10V4"></path>
                  <rect x="8" y="14" width="8" height="5" rx="1"></rect>
                </svg>
              </button>
              <button
                class="icon-btn"
                type="button"
                aria-label={t("export")}
                title={t("export")}
                disabled={workflowMode !== null}
                on:click={exportStaticSite}
              >
                <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 3v10"></path>
                  <path d="M8 7l4-4 4 4"></path>
                  <rect x="4" y="13" width="16" height="8" rx="2"></rect>
                </svg>
              </button>
            </div>

            {#if openError}
              <p class="mt-2 text-xs text-red-300">{openError}</p>
            {/if}
            {#if exportStatus}
              <p class="mt-2 text-xs text-emerald-200">{exportStatus}</p>
            {/if}
            {#if exportError}
              <p class="mt-2 text-xs text-red-300">{exportError}</p>
            {/if}
            {#if workflowMode}
              <div class="mt-3 rounded-lg border border-emerald-400/25 bg-emerald-950/30 p-2">
                <p class="text-[11px] font-medium text-emerald-100">
                  {workflowMode === "save"
                    ? t("progressSaveLabel")
                    : workflowMode === "upload"
                      ? t("progressUploadLabel")
                      : t("progressExportLabel")}
                </p>
                <p class="mt-0.5 text-[11px] text-emerald-200">{workflowStep}</p>
                <div class="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-emerald-500/25">
                  <div
                    class="h-full rounded-full bg-emerald-300 transition-all duration-300 ease-out"
                    style={`width:${Math.max(3, Math.min(100, workflowProgress))}%`}
                  ></div>
                </div>
                <p class="mt-1 text-[10px] text-emerald-200/90">{workflowProgress.toFixed(1)}%</p>
              </div>
            {/if}

            {#if draft}
              <div class="mt-5 grid gap-4">
                <label class="editor-field">
                  <span>{t("projectName")}</span>
                  <input
                    type="text"
                    bind:value={draft.meta.name}
                    class="editor-input"
                    placeholder={t("projectName")}
                  />
                </label>
                <label class="editor-field">
                  <span>{t("template")}</span>
                  <select bind:value={draft.meta.template} class="editor-select">
                    {#each templateOptions as template}
                      <option value={template.id}>
                        {template.label[uiLang] ?? template.label.es ?? template.id}
                      </option>
                    {/each}
                  </select>
                </label>
                <div class="editor-field">
                  <span>{t("languages")}</span>
                  <button
                    class="editor-select"
                    type="button"
                    on:click={() => (languageMenuOpen = !languageMenuOpen)}
                  >
                    {selectedLabel(draft.meta.locales.length)}
                  </button>
                  {#if languageMenuOpen}
                    <div class="dropdown-panel">
                      {#each languageOptions as lang}
                        <label class="dropdown-item">
                          <input
                            type="checkbox"
                            checked={draft.meta.locales.includes(lang.code)}
                            on:change={() => toggleLanguage(lang.code)}
                          />
                          <span>{lang.label}</span>
                        </label>
                      {/each}
                    </div>
                  {/if}
                </div>
                <label class="editor-field">
                  <span>{t("defaultLang")}</span>
                  <select bind:value={draft.meta.defaultLocale} class="editor-select">
                    {#each draft.meta.locales as lang}
                      <option value={lang}>{lang.toUpperCase()}</option>
                    {/each}
                  </select>
                </label>
                <label class="editor-field">
                  <span>{t("currency")}</span>
                  <select
                    class="editor-select"
                    bind:value={draft.meta.currency}
                    on:change={handleCurrencyChange}
                  >
                    {#each currencyOptions as currency}
                      <option value={currency.code}>{currency.label}</option>
                    {/each}
                  </select>
                </label>
                <div class="editor-field">
                  <span>{t("currencyPos")}</span>
                  <button class="editor-outline" type="button" on:click={toggleCurrencyPosition}>
                    {draft.meta.currencyPosition === "right"
                      ? t("currencyRight")
                      : t("currencyLeft")}
                  </button>
                </div>
                <label class="editor-field">
                  <span>{t("font")}</span>
                  <select
                    class="editor-select"
                    bind:value={fontChoice}
                    on:change={handleFontSelect}
                  >
                    {#each fontOptions as font}
                      <option value={font.value}>{font.label}</option>
                    {/each}
                    <option value="custom">{t("fontCustom")}</option>
                  </select>
                </label>
                {#if fontChoice === "custom"}
                  <label class="editor-field">
                    <span>{t("fontCustomSrc")}</span>
                    {#if fontAssetOptions.length}
                      <select
                        class="editor-select"
                        value={draft.meta.fontSource ?? ""}
                        on:change={handleCustomFontSourceInput}
                      >
                        <option value=""></option>
                        {#each fontAssetOptions as option}
                          <option value={option.value}>{option.label}</option>
                        {/each}
                      </select>
                    {:else}
                      <input
                        type="text"
                        class="editor-input"
                        value={draft.meta.fontSource ?? ""}
                        list="font-asset-files"
                        on:input={handleCustomFontSourceInput}
                      />
                    {/if}
                  </label>
                {/if}
              </div>
            {/if}
          {:else if editorTab === "assets"}
            <AssetsManager
              model={{
                t,
                rootLabel,
                assetProjectReadOnly,
                assetUploadInput,
                uploadTargetPath,
                uploadFolderOptions,
                needsAssets,
                fsError,
                assetTaskVisible,
                assetTaskStep,
                assetTaskProgress,
                assetMode,
                fsEntries,
                treeRows,
                selectedAssetIds
              }}
              actions={{
                createFolder,
                handleAssetUpload,
                handleAssetDragOver,
                handleAssetDrop,
                selectAllAssets,
                clearAssetSelection,
                bulkMove,
                bulkDelete,
                toggleAssetSelection,
                toggleExpandPath,
                renameEntry,
                moveEntry,
                deleteEntry,
                setUploadTargetPath: (path) => (uploadTargetPath = path),
                setAssetUploadInput: (input) => (assetUploadInput = input)
              }}
            />
          {:else if editorTab === "edit"}
            <EditPanel
              model={{
                t,
                draft,
                deviceMode,
                previewMode,
                editPanel,
                editLang,
                selectedCategoryId,
                selectedItemId,
                selectedCategory,
                selectedItem,
                assetOptions,
                sectionBackgroundOptionsByCategory,
                sectionBackgroundNeedsCoverage,
                sectionBackgroundHasDuplicates,
                commonAllergenCatalog,
                backgroundCarouselSeconds: normalizeBackgroundCarouselSeconds(
                  draft?.meta.backgroundCarouselSeconds
                )
              }}
              actions={{
                cycleEditLang,
                ensureRestaurantName,
                ensureMetaTitle,
                handleLocalizedInput,
                getLocalizedValue,
                addSection,
                deleteSection,
                addBackground,
                moveBackground,
                removeBackground,
                setBackgroundDisplayMode,
                setCategoryBackgroundId,
                setBackgroundCarouselSeconds,
                goPrevDish,
                goNextDish,
                addDish,
                deleteDish,
                textOf,
                handleDescriptionInput,
                handleLongDescriptionInput,
                isCommonAllergenChecked,
                handleCommonAllergenToggle,
                getCommonAllergenLabel,
                getCustomAllergensInput,
                handleCustomAllergensInput,
                handleVeganToggle,
                setIdentityMode,
                setLogoSrc,
                setItemRotationDirection,
                setItemScrollAnimationMode,
                setItemScrollAnimationSrc,
                setFontRoleSource,
                setItemFontSource,
                setItemPriceVisible,
                touchDraft,
                setEditPanel: (panel) => (editPanel = panel),
                setSelectedCategoryId: (categoryId) => (selectedCategoryId = categoryId),
                setSelectedItemId: (itemId) => (selectedItemId = itemId)
              }}
            />
          {:else}
            <WizardPanel
              model={{
                t,
                draft,
                uiLang,
                templateOptions,
                wizardStep,
                wizardSteps,
                wizardProgress,
                wizardStatus,
                wizardLang,
                wizardCategoryId,
                wizardItemId,
                wizardCategory,
                wizardItem,
                wizardDemoPreview,
                wizardNeedsRootBackground,
                assetOptions,
                sectionBackgroundOptionsByCategory,
                sectionBackgroundNeedsCoverage,
                sectionBackgroundHasDuplicates
              }}
              actions={{
                isWizardStepValid,
                goToStep,
                applyTemplate,
                addBackground,
                removeBackground,
                setBackgroundDisplayMode,
                setCategoryBackgroundId,
                addWizardCategory,
                removeWizardCategory,
                addWizardDish,
                removeWizardDish,
                setIdentityMode,
                setLogoSrc,
                setItemRotationDirection,
                setItemScrollAnimationMode,
                setItemScrollAnimationSrc,
                setFontRoleSource,
                setItemFontSource,
                setItemPriceVisible,
                handleLocalizedInput,
                handleDescriptionInput,
                getLocalizedValue,
                goPrevStep,
                goNextStep,
                exportStaticSite,
                touchDraft,
                setWizardLang: (lang) => (wizardLang = lang),
                setWizardCategoryId: (categoryId) => (wizardCategoryId = categoryId),
                setWizardItemId: (itemId) => (wizardItemId = itemId)
              }}
            />
          {/if}
      </EditorShell>

      <PreviewCanvas
        model={{
          effectivePreview,
          activeProject,
          locale,
          previewStartupLoading,
          previewStartupProgress,
          startupBlockingSources: previewStartupBlockingSources,
          previewBackgrounds,
          loadedBackgroundIndexes: loadedPreviewBackgroundIndexes,
          activeBackgroundIndex,
          isBlankMenu,
          carouselActive,
          deviceMode,
          previewFontStack,
          previewFontVars,
          t,
          textOf,
          getLoadingLabel,
          getTemplateScrollHint,
          getCarouselImageSource,
          buildResponsiveSrcSetFromMedia,
          getMenuTerm,
          formatPrice,
          getDishTapHint,
          getAssetOwnershipDisclaimer,
          getItemFontStyle
        }}
        actions={{
          shiftSection,
          handleMenuScroll,
          shiftCarousel,
          handleCarouselWheel,
          handleCarouselTouchStart,
          handleCarouselTouchMove,
          handleCarouselTouchEnd,
          openDish,
          prefetchDishDetail,
          setLocale: (value) => (locale = value)
        }}
      />
    </div>
  {/if}
</main>

{#if activeItem}
  {@const dish = resolveActiveDish()}
  {#if dish}
    {@const interactiveAsset = getInteractiveDetailAsset(dish)}
    <DishModal
      model={{
        dish,
        interactiveEnabled: Boolean(interactiveAsset && supportsInteractiveMedia()),
        itemFontStyle: getItemFontStyle(dish),
        modalMediaHost,
        modalMediaImage,
        textOf,
        getDetailImageSource,
        getAllergenValues,
        getMenuTerm,
        formatPrice
      }}
      actions={{
        close: closeDish,
        setModalMediaHost: (host) => (modalMediaHost = host),
        setModalMediaImage: (image) => (modalMediaImage = image)
      }}
    />
  {/if}
{/if}

{#if assetOptions.length}
  <datalist id="asset-files">
    {#each assetOptions as option}
      <option value={option.value} label={option.label}></option>
    {/each}
  </datalist>
{/if}
{#if fontAssetOptions.length}
  <datalist id="font-asset-files">
    {#each fontAssetOptions as option}
      <option value={option.value} label={option.label}></option>
    {/each}
  </datalist>
{/if}
