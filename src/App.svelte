<svelte:head>
  <title>{t("appTitle")}</title>
  {#if builtInFontHref}
    <link rel="stylesheet" href={builtInFontHref} />
  {/if}
</svelte:head>

<script lang="ts">
  import { onDestroy, onMount, tick } from "svelte";
  import {
    getAllergenLabel as getLocalizedAllergenLabel,
    getAllergenValues as getLocalizedAllergenValues
  } from "./core/menu/allergens";
  import { commonAllergenCatalog, menuTerms } from "./core/menu/catalogs";
  import { getLocalizedValue, normalizeLocaleCode } from "./core/menu/localization";
  import { normalizeProject } from "./core/menu/normalization";
  import { formatMenuPrice } from "./core/menu/pricing";
  import {
    FOCUS_ROWS_TOUCH_DELTA_SCALE,
    FOCUS_ROWS_TOUCH_INTENT_THRESHOLD,
    FOCUS_ROWS_WHEEL_SETTLE_MS,
    FOCUS_ROWS_WHEEL_STEP_THRESHOLD,
    INTERACTIVE_GIF_MAX_FRAMES,
    INTERACTIVE_KEEP_ORIGINAL_PLACEMENT,
    JUKEBOX_TOUCH_DELTA_SCALE,
    JUKEBOX_TOUCH_INTENT_THRESHOLD,
    JUKEBOX_WHEEL_SETTLE_MS,
    JUKEBOX_WHEEL_STEP_THRESHOLD,
    getCircularOffset,
    getFocusRowCardStyle,
    getFocusRowRenderItems,
    getJukeboxCardStyle,
    getJukeboxRenderItems,
    normalizeFocusRowWheelDelta,
    normalizeJukeboxWheelDelta,
    wrapCarouselIndex
  } from "./core/templates/previewInteraction";
  import { templateOptions } from "./core/templates/templateOptions";
  import { createZipBlob, readZip } from "./lib/zip";
  import { loadProject } from "./lib/loadProject";
  import { loadProjects, type ProjectSummary } from "./lib/loadProjects";
  import type { AllergenEntry, MenuCategory, MenuItem, MenuProject } from "./lib/types";
  import {
    instructionCopy as instructionCopyConfig,
    type InstructionKey
  } from "./ui/config/instructionCopy";
  import {
    builtInFontSources,
    currencyOptions,
    fontOptions,
    languageOptions
  } from "./ui/config/staticOptions";
  import { uiCopy as uiCopyConfig, type UiKey } from "./ui/config/uiCopy";
  import appCssRaw from "./app.css?raw";

  let project: MenuProject | null = null;
  let draft: MenuProject | null = null;
  let projects: ProjectSummary[] = [];
  let activeSlug = "nuevo-proyecto";
  let locale = "es";
  let loadError = "";
  let activeProject: MenuProject | null = null;
  let showLanding = true;
  let previewFontStack = "";
  let fontFaceCss = "";
  let builtInFontHref = "";
  let fontStyleEl: HTMLStyleElement | null = null;
  let editorOpen = false;
  let previewMode: "device" | "mobile" | "full" = "device";
  let deviceMode: "mobile" | "desktop" = "desktop";
  let isJukeboxTemplate = false;
  let editorTab: "info" | "assets" | "edit" | "wizard" = "info";
  let wizardStep = 0;
  let projectFileInput: HTMLInputElement | null = null;
  let assetUploadInput: HTMLInputElement | null = null;
  let openError = "";
  let needsAssets = false;
  let lastSaveName = "";
  let exportError = "";
  let exportStatus = "";
  let activeItem: { category: string; itemId: string } | null = null;
  let modalMediaHost: HTMLDivElement | null = null;
  let modalMediaImage: HTMLImageElement | null = null;
  let modalMediaCleanup: (() => void) | null = null;
  let modalMediaToken = 0;
  let detailRotateDirection: 1 | -1 = -1;
  let detailRotateSource = "";
  const detailRotateDirectionBySource = new Map<string, 1 | -1>();
  const DEBUG_INTERACTIVE_CENTER =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("debugRotate");
  const interactiveDetailBytesCache = new Map<string, ArrayBuffer>();
  const interactiveDetailBytesPending = new Map<string, Promise<ArrayBuffer | null>>();
  const interactiveDetailCenterOffsetCache = new Map<string, { x: number; y: number }>();
  let interactivePrewarmSignature = "";
  let carouselActive: Record<string, number> = {};
  let focusRowSnapTimeout: Record<string, ReturnType<typeof setTimeout> | null> = {};
  let focusRowTouchState: Record<
    string,
    | {
        touchId: number;
        startX: number;
        startY: number;
        lastX: number;
        axis: "pending" | "vertical" | "horizontal";
      }
    | null
  > = {};
  let jukeboxWheelSnapTimeout: Record<string, ReturnType<typeof setTimeout> | null> = {};
  let jukeboxTouchState: Record<
    string,
    | {
        touchId: number;
        startX: number;
        startY: number;
        lastY: number;
        axis: "pending" | "vertical" | "horizontal";
      }
    | null
  > = {};
  let sectionFocusRaf: number | null = null;
  let sectionSnapTimeout: ReturnType<typeof setTimeout> | null = null;
  let languageMenuOpen = false;
  let uiLang: "es" | "en" = "es";
  let editLang = "es";
  let editPanel: "identity" | "section" | "dish" = "identity";
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
  let fsEntries: {
    id: string;
    name: string;
    path: string;
    kind: "file" | "directory";
    handle: FileSystemHandle | null;
    parent: FileSystemDirectoryHandle | null;
    source: "filesystem" | "bridge";
  }[] = [];
  let fsError = "";
  let rootFiles: string[] = [];
  let assetOptions: string[] = [];
  let rootLabel = "";
  let assetProjectReadOnly = false;
  let expandedPaths: Record<string, boolean> = {};
  let treeRows: {
    entry: (typeof fsEntries)[number];
    depth: number;
    hasChildren: boolean;
    expanded: boolean;
  }[] = [];
  let uploadTargetPath = "";
  let uploadFolderOptions: { value: string; label: string }[] = [];
  let fontChoice = "Fraunces";
  let previewBackgrounds: { id: string; src: string }[] = [];
  let activeBackgroundIndex = 0;
  let backgroundRotationTimer: ReturnType<typeof setInterval> | null = null;
  let backgroundRotationCount = 0;
  let previewStartupLoading = false;
  let previewStartupProgress = 100;
  let previewStartupSignature = "";
  let previewStartupToken = 0;
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

  const RESPONSIVE_IMAGE_WIDTHS = {
    small: 480,
    medium: 960,
    large: 1440
  } as const;
  type ResponsiveMediaPaths = {
    small: string;
    medium: string;
    large: string;
  };

  const uiCopy = uiCopyConfig;

  let t: (key: UiKey) => string = (key) => uiCopy.es[key];
  let selectedLabel: (count: number) => string = (count) => `${count} seleccionados`;
  $: t = (key) => uiCopy[uiLang]?.[key] ?? key;
  $: selectedLabel = (count) =>
    uiLang === "es" ? `${count} seleccionados` : `${count} selected`;

  $: if (draft) {
    const validCategory = draft.categories.some((item) => item.id === selectedCategoryId);
    if (!selectedCategoryId || !validCategory) {
      selectedCategoryId = draft.categories[0]?.id ?? "";
    }
    selectedCategory = draft.categories.find((item) => item.id === selectedCategoryId) ?? null;
    const validItem = selectedCategory?.items.some((item) => item.id === selectedItemId);
    if (!selectedItemId || !validItem) {
      selectedItemId = selectedCategory?.items[0]?.id ?? "";
    }
    selectedItem =
      selectedCategory?.items.find((item) => item.id === selectedItemId) ?? null;

    if (!draft.meta.locales.includes(editLang)) {
      editLang = draft.meta.defaultLocale;
    }
    if (!draft.meta.locales.includes(wizardLang)) {
      wizardLang = draft.meta.defaultLocale;
    }
    if (!draft.meta.currencyPosition) {
      draft.meta.currencyPosition = "left";
    }
    const matchesFont = fontOptions.some((option) => option.value === draft.meta.fontFamily);
    fontChoice = matchesFont ? draft.meta.fontFamily ?? "Fraunces" : "custom";
    const validWizardCategory = draft.categories.some((item) => item.id === wizardCategoryId);
    if (!wizardCategoryId || !validWizardCategory) {
      wizardCategoryId = draft.categories[0]?.id ?? "";
    }
    wizardCategory = draft.categories.find((item) => item.id === wizardCategoryId) ?? null;
    const validWizardItem = wizardCategory?.items.some((item) => item.id === wizardItemId);
    if (!wizardItemId || !validWizardItem) {
      wizardItemId = wizardCategory?.items[0]?.id ?? "";
    }
    wizardItem =
      wizardCategory?.items.find((item) => item.id === wizardItemId) ?? null;
  }

  $: if (draft) {
    const backgrounds =
      draft.backgrounds?.map((asset) => ({
        id: `bg-${asset.id}`,
        label: asset.label,
        src: asset.src,
        group: "Fondos"
      })) ?? [];
    const dishes = draft.categories.flatMap((category) =>
      category.items
        .filter((item) => item.media.hero360)
        .map((item) => ({
          id: `dish-${item.id}`,
          label: getLocalizedValue(item.name, editLang, draft.meta.defaultLocale),
          src: item.media.hero360 ?? "",
          group: "Platillos"
        }))
    );
    const fonts = draft.meta.fontSource
      ? [
          {
            id: "font-source",
            label: draft.meta.fontFamily ?? "Font",
            src: draft.meta.fontSource ?? "",
            group: "Fuentes"
          }
        ]
      : [];
    projectAssets = [...backgrounds, ...dishes, ...fonts];
  }

  $: assetOptions = rootFiles.length
    ? rootFiles
    : editorTab === "wizard" && wizardDemoPreview
      ? []
      : projectAssets.map((asset) => asset.src).filter(Boolean);
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

  const buildTreeRows = () => {
    if (!fsEntries.length) {
      treeRows = [];
      return;
    }
    const entryMap = new Map<string, (typeof fsEntries)[number]>();
    fsEntries.forEach((entry) => entryMap.set(entry.path, entry));

    const childrenMap = new Map<string, Set<string>>();
    const ensureChildren = (parent: string) => {
      if (!childrenMap.has(parent)) childrenMap.set(parent, new Set());
      return childrenMap.get(parent)!;
    };

    fsEntries.forEach((entry) => {
      const parts = entry.path.split("/").filter(Boolean);
      let parent = "";
      parts.forEach((part, index) => {
        const current = parts.slice(0, index + 1).join("/");
        ensureChildren(parent).add(current);
        parent = current;
      });
    });

    const getEntry = (path: string) => {
      const existing = entryMap.get(path);
      if (existing) return existing;
      const name = path.split("/").filter(Boolean).pop() ?? path;
      return {
        id: path,
        name,
        path,
        kind: "directory",
        handle: null,
        parent: null,
        source: assetMode === "filesystem" ? "filesystem" : "bridge"
      } as (typeof fsEntries)[number];
    };

    const rows: {
      entry: (typeof fsEntries)[number];
      depth: number;
      hasChildren: boolean;
      expanded: boolean;
    }[] = [];

    const sortPaths = (a: string, b: string) => {
      const entryA = getEntry(a);
      const entryB = getEntry(b);
      if (entryA.kind !== entryB.kind) {
        return entryA.kind === "directory" ? -1 : 1;
      }
      return entryA.name.localeCompare(entryB.name);
    };

    const walk = (parent: string, depth: number) => {
      const children = Array.from(childrenMap.get(parent) ?? []).sort(sortPaths);
      children.forEach((child) => {
        const entry = getEntry(child);
        const hasChildren = (childrenMap.get(child)?.size ?? 0) > 0;
        const expanded = expandedPaths[child] ?? (depth === 0);
        rows.push({ entry, depth, hasChildren, expanded });
        if (entry.kind === "directory" && expanded) {
          walk(child, depth + 1);
        }
      });
    };

    walk("", 0);
    treeRows = rows;
  };

  $: {
    const folders = fsEntries
      .filter((entry) => entry.kind === "directory")
      .map((entry) => {
        const depth = entry.path.split("/").filter(Boolean).length;
        const prefix = depth > 1 ? `${"—".repeat(depth - 1)} ` : "";
        return { value: entry.path, label: `${prefix}${entry.path}` };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
    uploadFolderOptions = [{ value: "", label: "/" }, ...folders];
    if (
      uploadTargetPath &&
      !uploadFolderOptions.some((option) => option.value === uploadTargetPath)
    ) {
      uploadTargetPath = "";
    }
  }

  $: if (fsEntries) {
    fsEntries.forEach((entry) => {
      if (entry.kind === "directory" && expandedPaths[entry.path] === undefined) {
        const isTopLevel = !entry.path.includes("/");
        expandedPaths = { ...expandedPaths, [entry.path]: isTopLevel };
      }
    });
    buildTreeRows();
  }

  $: effectivePreview =
    previewMode === "device" ? (deviceMode === "mobile" ? "mobile" : "full") : previewMode;
  $: editorLocked = deviceMode === "desktop" && effectivePreview === "mobile";
  $: layoutMode = editorLocked ? "split" : "full";
  $: editorVisible = editorLocked ? true : editorOpen;
  $: showEditorToggle = !editorLocked;
  $: isBlankMenu =
    !!activeProject &&
    !activeProject.meta.template &&
    activeProject.backgrounds.length === 0 &&
    activeProject.categories.length === 0;

  $: if (draft) {
    const defaultLocale = draft.meta.defaultLocale || "es";
    const hasTemplate = Boolean(draft.meta.template);
    const hasBackground = draft.backgrounds.some((bg) => bg.src && bg.src.trim().length > 0);
    const hasOwnBackground = hasWizardCustomBackground(draft, rootFiles, assetMode === "none");
    const hasDemoBackground = draft.backgrounds.some((bg) =>
      isTemplateDemoAssetPath(bg.src || "")
    );
    wizardNeedsRootBackground =
      hasBackground && (hasDemoBackground || (editorTab === "wizard" && !hasOwnBackground));
    const hasIdentity = hasBackground && !wizardNeedsRootBackground;
    const hasCategories =
      draft.categories.length > 0 &&
      draft.categories.every((category) => category.name?.[defaultLocale]?.trim());
    const dishCount = draft.categories.reduce((acc, category) => acc + category.items.length, 0);
    const hasDishes =
      dishCount > 0 &&
      draft.categories.every((category) =>
        category.items.every(
          (item) =>
            item.name?.[defaultLocale]?.trim() &&
            typeof item.price?.amount === "number" &&
            item.price.amount > 0
        )
      );
    wizardStatus = {
      structure: hasTemplate,
      identity: hasIdentity,
      categories: hasCategories,
      dishes: hasDishes,
      preview: hasTemplate && hasIdentity && hasCategories && hasDishes
    };
    const completed = [
      wizardStatus.structure,
      wizardStatus.identity,
      wizardStatus.categories,
      wizardStatus.dishes,
      wizardStatus.preview
    ].filter(Boolean).length;
    wizardProgress = completed / wizardSteps.length;
  } else {
    wizardNeedsRootBackground = false;
    templateSyncSignature = "";
    wizardStatus = {
      structure: false,
      identity: false,
      categories: false,
      dishes: false,
      preview: false
    };
    wizardProgress = 0;
  }

  $: if (draft) {
    const categorySignature = draft.categories
      .map((category) => `${category.id}:${category.items.length}`)
      .join("|");
    const signature = `${draft.meta.template || "focus-rows"}::${categorySignature}`;
    if (signature !== templateSyncSignature) {
      templateSyncSignature = signature;
      initCarouselIndices(draft);
    }
  }

  onMount(async () => {
    try {
      const query = window.matchMedia("(min-width: 900px)");
      const updateDeviceMode = () => {
        deviceMode = query.matches ? "desktop" : "mobile";
        void syncCarousels();
      };
      updateDeviceMode();
      query.addEventListener?.("change", updateDeviceMode);
      query.addListener?.(updateDeviceMode);
      let resizeTimeout: ReturnType<typeof setTimeout> | null = null;
      const handleViewportChange = () => {
        if (resizeTimeout) {
          clearTimeout(resizeTimeout);
        }
        resizeTimeout = setTimeout(() => {
          void syncCarousels();
        }, 120);
      };
      window.addEventListener("resize", handleViewportChange);
      window.addEventListener("orientationchange", handleViewportChange);

      try {
        const response = await fetch("/api/assets/ping");
        bridgeAvailable = response.ok;
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
    previewStartupToken += 1;
    teardownInteractiveDetailMedia();
    clearBackgroundRotation();
    clearCarouselWheelState();
    if (sectionFocusRaf) {
      cancelAnimationFrame(sectionFocusRaf);
      sectionFocusRaf = null;
    }
    if (sectionSnapTimeout) {
      clearTimeout(sectionSnapTimeout);
      sectionSnapTimeout = null;
    }
  });

  $: {
    const showcaseActive =
      editorTab === "wizard" &&
      wizardStep === 0 &&
      wizardDemoPreview &&
      wizardShowcaseProject;
    activeProject = showcaseActive ? wizardShowcaseProject : (draft ?? project);
  }
  $: if (activeProject && supportsInteractiveMedia()) {
    const signature = activeProject.categories
      .map((category) =>
        category.items
          .map((item) => getInteractiveDetailAsset(item)?.source || "")
          .filter(Boolean)
          .join("|")
      )
      .join("::");
    if (signature !== interactivePrewarmSignature) {
      interactivePrewarmSignature = signature;
      void prewarmInteractiveDetailAssets(activeProject);
    }
  }
  $: isJukeboxTemplate = activeProject?.meta.template === "jukebox";
  $: assetProjectReadOnly = isProtectedAssetProjectSlug(
    draft?.meta.slug || activeSlug || "nuevo-proyecto"
  );
  $: previewFontStack = activeProject ? buildFontStack(activeProject.meta.fontFamily) : "";
  $: fontFaceCss = activeProject
    ? buildFontFaceCss(activeProject.meta.fontFamily, activeProject.meta.fontSource)
    : "";
  $: builtInFontHref = activeProject ? getBuiltinFontHref(activeProject.meta.fontFamily) : "";
  $: previewBackgrounds =
    activeProject?.backgrounds
      ?.filter((item) => item.src && item.src.trim().length > 0)
      .map((item, index) => ({
        id: item.id || `bg-${index}`,
        src: item.src
      })) ?? [];
  $: if (typeof document !== "undefined") {
    if (!fontFaceCss) {
      if (fontStyleEl) {
        fontStyleEl.remove();
        fontStyleEl = null;
      }
    } else {
      if (!fontStyleEl) {
        fontStyleEl = document.createElement("style");
        fontStyleEl.dataset.menuFont = "true";
        document.head.appendChild(fontStyleEl);
      }
      fontStyleEl.textContent = fontFaceCss;
    }
  }

  const clearBackgroundRotation = () => {
    if (backgroundRotationTimer) {
      window.clearInterval(backgroundRotationTimer);
      backgroundRotationTimer = null;
    }
    backgroundRotationCount = 0;
  };

  const syncBackgroundRotation = (count: number) => {
    if (count < 2) {
      clearBackgroundRotation();
      activeBackgroundIndex = 0;
      return;
    }
    if (activeBackgroundIndex >= count) {
      activeBackgroundIndex = 0;
    }
    if (backgroundRotationTimer && backgroundRotationCount === count) return;
    clearBackgroundRotation();
    backgroundRotationCount = count;
    backgroundRotationTimer = window.setInterval(() => {
      activeBackgroundIndex = (activeBackgroundIndex + 1) % count;
    }, 9000);
  };

  $: if (typeof window !== "undefined") {
    syncBackgroundRotation(previewBackgrounds.length);
  }

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

  const isTemplateDemoAssetPath = (value: string) => {
    const normalized = normalizeAssetSrc(value);
    if (!normalized) return false;
    return TEMPLATE_DEMO_ASSET_PREFIXES.some((prefix) => normalized.startsWith(prefix));
  };

  const hasWizardCustomBackground = (
    value: MenuProject,
    availableRootFiles: string[],
    allowManualWhenRootMissing: boolean
  ) =>
    value.backgrounds.some((bg) => {
      const src = (bg.src || "").trim();
      if (!src || isTemplateDemoAssetPath(src)) return false;
      if (availableRootFiles.length === 0) return allowManualWhenRootMissing;
      return availableRootFiles.includes(src);
    });

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

  const getJukeboxScrollHint = (lang = locale) => getInstructionCopy("jukeboxHint", lang);

  const getFocusRowsScrollHint = (lang = locale) => getInstructionCopy("focusRowsHint", lang);

  const isProtectedAssetProjectSlug = (slug: string) => READ_ONLY_ASSET_PROJECTS.has(slug);

  const getAllergenLabel = (entry: AllergenEntry, lang = locale) => {
    const defaultLocale = activeProject?.meta.defaultLocale ?? "es";
    return getLocalizedAllergenLabel(entry, lang, defaultLocale);
  };

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

  const changeProject = async (slug: string) => {
    try {
      activeSlug = slug;
      project = normalizeProject(await loadProject(slug));
      draft = cloneProject(project);
      wizardDemoPreview = false;
      wizardShowcaseProject = null;
      locale = project.meta.defaultLocale;
      loadError = "";
      initCarouselIndices(project);
      if (assetMode === "bridge") {
        await refreshBridgeEntries();
      }
    } catch (error) {
      loadError = error instanceof Error ? error.message : "Error desconocido";
    }
  };

  const cloneProject = (value: MenuProject) => {
    if (typeof structuredClone === "function") {
      return structuredClone(value);
    }
    return JSON.parse(JSON.stringify(value)) as MenuProject;
  };

  const loadTemplateDemoProject = async () => {
    if (templateDemoProjectCache) {
      return cloneProject(templateDemoProjectCache);
    }
    if (!templateDemoProjectPromise) {
      templateDemoProjectPromise = loadProject(TEMPLATE_DEMO_PROJECT_SLUG)
        .then((value) => normalizeProject(value))
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
    showcase.meta.fontFamily = draft.meta.fontFamily;
    showcase.meta.fontSource = draft.meta.fontSource;
    return showcase;
  };

  const createEmptyProject = (): MenuProject => ({
    meta: {
      slug: "nuevo-proyecto",
      name: "Nuevo proyecto",
      restaurantName: { es: "", en: "" },
      title: { es: "", en: "" },
      fontFamily: "Fraunces",
      fontSource: "",
      template: "focus-rows",
      locales: ["es", "en"],
      defaultLocale: "es",
      currency: "MXN",
      currencyPosition: "left"
    },
    backgrounds: [],
    categories: [],
    sound: {
      enabled: false,
      theme: "bar-amber",
      volume: 0.6,
      map: {}
    }
  });

  const toggleLanguage = (code: string) => {
    if (!draft) return;
    const set = new Set(draft.meta.locales);
    if (set.has(code)) {
      set.delete(code);
    } else {
      set.add(code);
    }
    if (set.size === 0) {
      set.add(draft.meta.defaultLocale || "es");
    }
    draft.meta.locales = Array.from(set);
    if (!draft.meta.locales.includes(draft.meta.defaultLocale)) {
      draft.meta.defaultLocale = draft.meta.locales[0];
    }
    draft.categories.forEach((category) => {
      category.items.forEach((item) => {
        (item.allergens ?? []).forEach((entry) => {
          if (!entry.label) {
            entry.label = {};
          }
          const common = entry.id
            ? commonAllergenCatalog.find((catalogItem) => catalogItem.id === entry.id)
            : null;
          draft.meta.locales.forEach((lang) => {
            if (entry.label[lang] === undefined) {
              entry.label[lang] = common
                ? getLocalizedValue(common.label, lang, draft.meta.defaultLocale)
                : "";
            }
          });
        });
      });
    });
    touchDraft();
  };

  const setCurrency = (code: string) => {
    if (!draft) return;
    draft.meta.currency = code;
  };

  const toggleCurrencyPosition = () => {
    if (!draft) return;
    draft.meta.currencyPosition = draft.meta.currencyPosition === "right" ? "left" : "right";
  };

  const slugifyName = (value: string) =>
    value
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60);

  const normalizeZipName = (value: string) => {
    const sanitized = value.replace(/[\\/:*?"<>|]/g, "").trim();
    if (!sanitized) return "";
    const lower = sanitized.toLowerCase();
    if (lower.endsWith(".zip")) return sanitized;
    if (lower.endsWith(".json")) return `${sanitized.slice(0, -5)}.zip`;
    return `${sanitized}.zip`;
  };

  const getSuggestedZipName = () => {
    if (lastSaveName) {
      const base = lastSaveName.replace(/\.json$/i, "").replace(/\.zip$/i, "");
      const slug = slugifyName(base) || "menu";
      return `${slug}.zip`;
    }
    const baseName = draft?.meta.name?.trim() || draft?.meta.slug || "menu";
    const slug = slugifyName(baseName) || "menu";
    return `${slug}.zip`;
  };

  const updateAssetPathsForSlug = (fromSlug: string, toSlug: string) => {
    if (!draft) return;
    if (!fromSlug || !toSlug || fromSlug === toSlug) return;
    const fromPrefix = `/projects/${fromSlug}/assets/`;
    const toPrefix = `/projects/${toSlug}/assets/`;
    const updatePath = (value: string) =>
      value.startsWith(fromPrefix) ? `${toPrefix}${value.slice(fromPrefix.length)}` : value;

    if (draft.meta.fontSource) {
      draft.meta.fontSource = updatePath(draft.meta.fontSource);
    }
    draft.backgrounds = draft.backgrounds.map((bg) => ({
      ...bg,
      src: bg.src ? updatePath(bg.src) : bg.src
    }));
    draft.categories = draft.categories.map((category) => ({
      ...category,
      items: category.items.map((item) => ({
        ...item,
        media: {
          ...item.media,
          hero360: item.media.hero360 ? updatePath(item.media.hero360) : item.media.hero360
        }
      }))
    }));
  };

  const mapImportedAssetPath = (value: string, slug: string) => {
    if (!value) return value;
    const normalized = value.replace(/^\/+/, "");
    if (normalized.startsWith("assets/")) {
      return `/projects/${slug}/${normalized}`;
    }
    const match = normalized.match(/^projects\/[^/]+\/(assets\/.*)$/);
    if (match) {
      return `/projects/${slug}/${match[1]}`;
    }
    return value;
  };

  const applyImportedPaths = (data: MenuProject, slug: string) => {
    if (data.meta.fontSource) {
      data.meta.fontSource = mapImportedAssetPath(data.meta.fontSource, slug);
    }
    data.backgrounds = data.backgrounds.map((bg) => ({
      ...bg,
      src: bg.src ? mapImportedAssetPath(bg.src, slug) : bg.src
    }));
    data.categories = data.categories.map((category) => ({
      ...category,
      items: category.items.map((item) => ({
        ...item,
        media: {
          ...item.media,
          hero360: item.media.hero360 ? mapImportedAssetPath(item.media.hero360, slug) : item.media.hero360
        }
      }))
    }));
  };

  const saveProject = async () => {
    if (!draft) return;
    const suggested = getSuggestedZipName();
    const response = window.prompt(t("promptSaveName"), suggested);
    if (!response) return;
    const fileName = normalizeZipName(response) || suggested;
    lastSaveName = fileName;
    const base = fileName.replace(/\.zip$/i, "");
    const nextSlug = slugifyName(base) || draft.meta.slug || "menu";
    const previousSlug = getProjectSlug();
    if (previousSlug && nextSlug && previousSlug !== nextSlug) {
      if (assetMode === "bridge") {
        try {
          await bridgeRequest("rename-project", { from: previousSlug, to: nextSlug });
        } catch (error) {
          console.warn("Unable to rename project folder", error);
        }
      }
      updateAssetPathsForSlug(previousSlug, nextSlug);
      draft.meta.slug = nextSlug;
      activeSlug = nextSlug;
    } else if (!draft.meta.slug) {
      draft.meta.slug = nextSlug;
      activeSlug = nextSlug;
    }

    if (assetMode === "bridge") {
      try {
        await bridgeRequest("save-project", {
          slug: draft.meta.slug || nextSlug,
          name: draft.meta.name,
          template: draft.meta.template,
          cover: draft.backgrounds?.[0]?.src ?? "",
          project: draft
        });
        const existingIndex = projects.findIndex(
          (item) => item.slug === draft.meta.slug || item.slug === previousSlug
        );
        const summary = {
          slug: draft.meta.slug,
          name: draft.meta.name,
          template: draft.meta.template,
          cover: draft.backgrounds?.[0]?.src
        };
        if (existingIndex >= 0) {
          projects = [
            ...projects.slice(0, existingIndex),
            summary,
            ...projects.slice(existingIndex + 1)
          ];
        } else {
          projects = [...projects, summary];
        }
        await refreshBridgeEntries();
      } catch (error) {
        openError = error instanceof Error ? error.message : t("errOpenProject");
      }
    }
    const zipEntries = await buildProjectZipEntries(draft.meta.slug || nextSlug);
    if (zipEntries.length === 0) return;
    const blob = createZipBlob(zipEntries);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const EXPORT_SHARED_STYLE_START = "/* EXPORT_SHARED_STYLES_START */";
  const EXPORT_SHARED_STYLE_END = "/* EXPORT_SHARED_STYLES_END */";
  const FAVICON_ICO_BASE64 =
    "AAABAAIAEBAAAAAAIACGAgAAJgAAACAgAAAAACAAGwEAAKwCAACJUE5HDQoaCgAAAA1JSERSAAAAEAAAABAIBgAAAB/z/2EAAAJNSURBVHicpZM9aFRBFIW/O++92eRtyA9BYwr/sNAIsVJUDFgHxRQqmDbYiJtWUBBiBBXbpE4nCqIQFHshoJIyEMUmEhuDiu66+9x982auxZoYAyLiaYZ7OXPuHeYcsemgsgVxDEUBrmjXSfyrtxVmcyHSPrOaUnjY3kfY3kcofLu3mbMxbEPJgHOQJDB90daODBk3vMcUAEvvQrz4OiS3HrjudU4IP4fadFBF2usZ4Ont0uedO8Rfmc27X7wOFuD4kMnvVmzt/QeNTl9t9Yefz1QFKaWDqkAaE+5Plb48fO475+ZdioDtFIyBZkNBYWIsyc6fjL6PT7X6sgIjgIkjyDOlcjZp7B0QPzfv0lJZKHcLeROadaWzLHR0CXPzLt07IL5yNmnkmRJHYJyHcoqODJt8cjbvMbEQR9CoKqPHIm5eKhECBA9RIkzO5D0jwyYvp6jzEDsPvT2iB3eJX3wTbGThe6aMnoh5fLuDjn7h0G5hfLqFj2DxbbAHd4kvd4l+rCKGLTACoYCRYUNHv5CvKaeOxqSpEDwIv/+jSSJo1FWWVzU6csDkRQ5pl3DnnmP+SUHTwJnrTarflAg4vF/y5VWNGnWVJFoXyJCFpWBnKrbqnRKAZgHnbzTZdy7j2SuPSaBwykzFVheWgm1ktAUKDzYVZh+58sqaRhNjSdasK64FQeFTTSFAq65MjCXZyppGs49c2aZC4f9ipJdv1AIcG5L87uU/GGk9TJutfO1C8m9W3hwm1baxTEnY1ksA+PgVE1qKTWWDs3Hnf+P8AxXTLWCAumbQAAAAAElFTkSuQmCCiVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAA4klEQVR4nO1WQQ7DIAxLp2qH8YK+qe/tm/oCzttpE9ri4KQg1mk+tRXYBkya6Xpb7jIQl5HifwMiInNkUt7Srn1Pa168XBMbQiSKwJqhDLyLI3J2nMtAScquyjPHNPAkipwtOx/egqPi5VwrP6oBb+AYIE6zDhxZPcsxvBB9hNBz9nlLr+e05tpYlTe8A6W49s4iZACJRUwMz8A5DaDA1YJIGWCqlyZmiVs3K9QPMKIszCNoUZJrHKqBFiWY5YQ7wGbBAlNVv7sh0Qgt0i4tGSKvoWlTyprp2pb3wjn/BT9l4AFrDIU9CgVSeAAAAABJRU5ErkJggg==";

  const getSharedExportStyles = () => {
    const start = appCssRaw.indexOf(EXPORT_SHARED_STYLE_START);
    const end = appCssRaw.indexOf(EXPORT_SHARED_STYLE_END);
    if (start < 0 || end < 0 || end <= start) {
      console.warn("Shared export style markers are missing in src/app.css");
      return "";
    }
    return appCssRaw
      .slice(start + EXPORT_SHARED_STYLE_START.length, end)
      .trim();
  };

  const buildExportStyles = () => `
* { box-sizing: border-box; }
html,
body,
#app {
  height: 100%;
}
html,
body {
  margin: 0;
  overflow: hidden;
}
body {
  background: #05060f;
  color: #e2e8f0;
}
#app {
  min-height: 100vh;
  min-height: 100dvh;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
}
${getSharedExportStyles()}

.dish-modal {
  display: none;
}
.dish-modal.open {
  display: grid;
}
`;

  const buildExportScript = (data: MenuProject) => {
    const payload = JSON.stringify(data);
    return `
const DATA = ${payload};
const currencySymbols = {
  MXN: "$", USD: "$", EUR: "€", GBP: "£", JPY: "¥", COP: "$", ARS: "$"
};
const FOCUS_ROWS_WHEEL_STEP_THRESHOLD = 260;
const FOCUS_ROWS_WHEEL_SETTLE_MS = 200;
const FOCUS_ROWS_WHEEL_DELTA_CAP = 140;
const FOCUS_ROWS_TOUCH_DELTA_SCALE = 2.2;
const FOCUS_ROWS_TOUCH_INTENT_THRESHOLD = 10;
let locale = DATA.meta.defaultLocale || DATA.meta.locales[0] || "es";
const fontFamily = DATA.meta.fontFamily || "Fraunces";
const fontSource = DATA.meta.fontSource || "";
const builtInFontSources = {
  Fraunces: "https://fonts.googleapis.com/css2?family=Fraunces:wght@400;500;700&display=swap",
  Cinzel: "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;700&display=swap",
  "Cormorant Garamond":
    "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;700&display=swap",
  "Playfair Display":
    "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;700&display=swap",
  Poppins: "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;700&display=swap"
};
const builtInFontHref = builtInFontSources[fontFamily] || "";
const backgrounds = (DATA.backgrounds || []).filter(
  (item) => item?.src && String(item.src).trim().length > 0
);
let activeBackgroundIndex = 0;
let backgroundTimer;
let fontInjected = false;
let fontLinkInjected = false;
const app = document.getElementById("app");
const modal = document.getElementById("dish-modal");
const modalContent = document.getElementById("dish-modal-content");
let modalMediaCleanup = null;
let modalMediaToken = 0;
let carouselCleanup = [];
let startupLoading = true;
let startupProgress = 0;
let startupToken = 0;
const JUKEBOX_WHEEL_STEP_THRESHOLD = 300;
const JUKEBOX_WHEEL_SETTLE_MS = 240;
const JUKEBOX_WHEEL_DELTA_CAP = 140;
const JUKEBOX_TOUCH_DELTA_SCALE = 2.1;
const JUKEBOX_TOUCH_INTENT_THRESHOLD = 10;
const INTERACTIVE_GIF_MAX_FRAMES = 72;
const INTERACTIVE_KEEP_ORIGINAL_PLACEMENT = true;
const DEBUG_INTERACTIVE_CENTER = new URLSearchParams(window.location.search).has("debugRotate");
const interactiveDetailBytesCache = new Map();
const interactiveDetailBytesPending = new Map();
const interactiveDetailCenterOffsetCache = new Map();
let detailRotateDirection = -1;
let detailRotateSource = "";
const detailRotateDirectionBySource = new Map();
const jukeboxWheelState = new Map();
const focusRowWheelState = new Map();

const textOf = (entry) => entry?.[locale] ?? entry?.[DATA.meta.defaultLocale] ?? "";
const menuTerms = {
  es: { allergens: "Alérgenos", vegan: "Vegano" },
  en: { allergens: "Allergens", vegan: "Vegan" },
  fr: { allergens: "Allergènes", vegan: "Végétalien" },
  pt: { allergens: "Alergênicos", vegan: "Vegano" },
  it: { allergens: "Allergeni", vegan: "Vegano" },
  de: { allergens: "Allergene", vegan: "Vegan" },
  ja: { allergens: "アレルゲン", vegan: "ヴィーガン" },
  ko: { allergens: "알레르겐", vegan: "비건" },
  zh: { allergens: "过敏原", vegan: "纯素" }
};
const getTerm = (key) => {
  const lang = (locale || "").toLowerCase().split("-")[0];
  return (menuTerms[lang] || menuTerms.en)[key];
};
const getAllergenValues = (dish) =>
  (dish.allergens || [])
    .map((entry) => {
      if (!entry) return "";
      if (typeof entry === "string") return entry;
      const lang = (locale || "").toLowerCase();
      const langBase = lang.split("-")[0];
      const defaultLang = (DATA.meta.defaultLocale || "en").toLowerCase();
      const defaultBase = defaultLang.split("-")[0];
      return (
        entry.label?.[lang] ??
        entry.label?.[langBase] ??
        entry.label?.[defaultLang] ??
        entry.label?.[defaultBase] ??
        entry.label?.en ??
        ""
      );
    })
    .filter((value) => value && value.trim().length > 0);
const formatPrice = (amount) => {
  const symbol = currencySymbols[DATA.meta.currency] || DATA.meta.currency;
  const position = DATA.meta.currencyPosition || "left";
  return position === "left" ? symbol + amount : amount + symbol;
};
const getFontStack = (family) => {
  const cleaned = (family || "").replace(/"/g, "");
  const primary = cleaned ? '"' + cleaned + '", ' : "";
  return primary + '"Fraunces", "Georgia", serif';
};
const ensureFont = () => {
  if (fontSource && !fontInjected) {
    const ext = fontSource.split(".").pop()?.toLowerCase();
    let format = "";
    if (ext === "woff2") format = "woff2";
    if (ext === "woff") format = "woff";
    if (ext === "otf") format = "opentype";
    if (ext === "ttf") format = "truetype";
    const formatLine = format ? ' format("' + format + '")' : "";
    const style = document.createElement("style");
    style.textContent =
      '@font-face { font-family: "' +
      fontFamily +
      '"; src: url("' +
      fontSource +
      '")' +
      formatLine +
      '; font-display: swap; }';
    document.head.appendChild(style);
    fontInjected = true;
  }
  if (!fontSource && builtInFontHref && !fontLinkInjected) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = builtInFontHref;
    document.head.appendChild(link);
    fontLinkInjected = true;
  }
};

const getFocusRowItems = (items) =>
  items.map((item, index) => ({
    item,
    sourceIndex: index,
    key: item.id + "-focus"
  }));
const getJukeboxItems = (items) =>
  items.map((item, index) => ({
    item,
    sourceIndex: index,
    key: item.id + "-jukebox"
  }));
const getCircularOffset = (activeIndex, targetIndex, count) => {
  if (count <= 1) return 0;
  let offset = targetIndex - activeIndex;
  const half = count / 2;
  while (offset > half) offset -= count;
  while (offset < -half) offset += count;
  return offset;
};
const wrapCarouselIndex = (value, count) => {
  if (count <= 0) return 0;
  return ((value % count) + count) % count;
};
const normalizeJukeboxWheelDelta = (event) => {
  const modeScale = event.deltaMode === 1 ? 40 : event.deltaMode === 2 ? 240 : 1;
  const scaled = event.deltaY * modeScale;
  return Math.max(-JUKEBOX_WHEEL_DELTA_CAP, Math.min(JUKEBOX_WHEEL_DELTA_CAP, scaled));
};
const normalizeFocusRowWheelDelta = (event) => {
  const modeScale = event.deltaMode === 1 ? 40 : event.deltaMode === 2 ? 240 : 1;
  const scaled = event.deltaX * modeScale;
  return Math.max(-FOCUS_ROWS_WHEEL_DELTA_CAP, Math.min(FOCUS_ROWS_WHEEL_DELTA_CAP, scaled));
};

const responsiveWidths = { small: 480, medium: 960, large: 1440 };
const buildSrcSet = (item) => {
  const responsive = item?.media?.responsive;
  if (!responsive) return "";
  const ordered = [
    { src: responsive.small, width: responsiveWidths.small },
    { src: responsive.medium, width: responsiveWidths.medium },
    { src: responsive.large, width: responsiveWidths.large }
  ].filter((entry) => entry.src);
  if (ordered.length === 0) return "";
  const unique = new Map();
  ordered.forEach((entry) => {
    if (!unique.has(entry.src)) {
      unique.set(entry.src, entry.width);
    }
  });
  return Array.from(unique.entries())
    .map(([src, width]) => src + " " + width + "w")
    .join(", ");
};
const getCarouselImageSrc = (item) =>
  item?.media?.responsive?.medium ||
  item?.media?.responsive?.large ||
  item?.media?.responsive?.small ||
  item?.media?.hero360 ||
  "";
const getDetailImageSrc = (item) =>
  item?.media?.responsive?.large ||
  item?.media?.responsive?.medium ||
  item?.media?.responsive?.small ||
  item?.media?.hero360 ||
  "";
const decodeMaybe = (value) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};
const getInteractiveAssetMime = (source) => {
  if (!source) return null;
  const candidates = [decodeMaybe(source.trim()).toLowerCase()];
  try {
    const url = new URL(source, window.location.href);
    const encodedPath = url.searchParams.get("path");
    if (encodedPath) {
      candidates.push(decodeMaybe(encodedPath).toLowerCase());
    }
  } catch {}
  for (const candidate of candidates) {
    if (/\\.gif(?:$|[?#&])/i.test(candidate)) return "image/gif";
    if (/\\.webp(?:$|[?#&])/i.test(candidate)) return "image/webp";
  }
  return null;
};
const getInteractiveDetailAsset = (item) => {
  const candidates = [
    item?.media?.hero360,
    item?.media?.responsive?.large,
    item?.media?.responsive?.medium,
    item?.media?.responsive?.small
  ];
  for (const candidate of candidates) {
    const source = (candidate || "").trim();
    if (!source) continue;
    const mime = getInteractiveAssetMime(source);
    if (mime) return { source, mime };
  }
  return null;
};
const supportsInteractiveMedia = () => "ImageDecoder" in window;
const getDetailRotateHint = () => {
  const isTouch = window.matchMedia("(pointer: coarse)").matches;
  return getInstructionCopy(isTouch ? "rotateHintTouch" : "rotateHintMouse");
};
const getDetailRotateToggleHint = () => {
  return getInstructionCopy("rotateToggle");
};
const toggleDetailRotateDirection = () => {
  detailRotateDirection = detailRotateDirection === 1 ? -1 : 1;
  if (detailRotateSource) {
    detailRotateDirectionBySource.set(detailRotateSource, detailRotateDirection);
  }
};
const INTERACTIVE_CENTER_SAMPLE_TARGET = 6;
  const readForegroundCenterFromBitmap = (bitmap) => {
    const maxSize = 140;
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const offscreen = document.createElement("canvas");
  offscreen.width = width;
  offscreen.height = height;
  const ctx = offscreen.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(bitmap, 0, 0, width, height);
  const { data } = ctx.getImageData(0, 0, width, height);
  const alphaThreshold = 16;

  const readAlphaBounds = () => {
    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const idx = (y * width + x) * 4;
        if (data[idx + 3] <= alphaThreshold) continue;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
    if (maxX < 0 || maxY < 0) return null;
    return { minX, minY, maxX, maxY };
  };

  let r = 0;
  let g = 0;
  let b = 0;
  let r2 = 0;
  let g2 = 0;
  let b2 = 0;
  let samples = 0;
  const sampleEdge = (x, y) => {
    const idx = (y * width + x) * 4;
    if (data[idx + 3] <= alphaThreshold) return;
    const rv = data[idx];
    const gv = data[idx + 1];
    const bv = data[idx + 2];
    r += rv;
    g += gv;
    b += bv;
    r2 += rv * rv;
    g2 += gv * gv;
    b2 += bv * bv;
    samples += 1;
  };
  for (let x = 0; x < width; x += 1) {
    sampleEdge(x, 0);
    if (height > 1) sampleEdge(x, height - 1);
  }
  for (let y = 1; y < height - 1; y += 1) {
    sampleEdge(0, y);
    if (width > 1) sampleEdge(width - 1, y);
  }
  if (samples === 0) {
    const bounds = readAlphaBounds();
    if (!bounds) return null;
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    const invScale = scale > 0 ? 1 / scale : 1;
    return {
      center: { x: centerX * invScale, y: centerY * invScale },
      bounds: {
        minX: bounds.minX * invScale,
        minY: bounds.minY * invScale,
        maxX: bounds.maxX * invScale,
        maxY: bounds.maxY * invScale
      }
    };
  }
  const meanR = r / samples;
  const meanG = g / samples;
  const meanB = b / samples;
  const varR = Math.max(0, r2 / samples - meanR * meanR);
  const varG = Math.max(0, g2 / samples - meanG * meanG);
  const varB = Math.max(0, b2 / samples - meanB * meanB);
  const colorStd = Math.sqrt(varR + varG + varB);
  const threshold = Math.max(12, Math.min(60, colorStd * 2.6 + 10));
  const thresholdSq = threshold * threshold;

  const isBackground = (idx) => {
    if (data[idx + 3] <= alphaThreshold) return true;
    const dr = data[idx] - meanR;
    const dg = data[idx + 1] - meanG;
    const db = data[idx + 2] - meanB;
    return dr * dr + dg * dg + db * db <= thresholdSq;
  };

  const pixelTotal = width * height;
  const visited = new Uint8Array(pixelTotal);
  const queue = [];
  const pushIfBackground = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const idx = y * width + x;
    if (visited[idx]) return;
    if (!isBackground(idx * 4)) return;
    visited[idx] = 1;
    queue.push(idx);
  };

  for (let x = 0; x < width; x += 1) {
    pushIfBackground(x, 0);
    if (height > 1) pushIfBackground(x, height - 1);
  }
  for (let y = 1; y < height - 1; y += 1) {
    pushIfBackground(0, y);
    if (width > 1) pushIfBackground(width - 1, y);
  }

  while (queue.length) {
    const idx = queue.pop() ?? 0;
    const x = idx % width;
    const y = Math.floor(idx / width);
    pushIfBackground(x + 1, y);
    pushIfBackground(x - 1, y);
    pushIfBackground(x, y + 1);
    pushIfBackground(x, y - 1);
  }

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  const rowCounts = new Uint32Array(height);
  const colCounts = new Uint32Array(width);
  let foregroundTotal = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = y * width + x;
      if (visited[idx]) continue;
      const dataIdx = idx * 4;
      if (data[dataIdx + 3] <= alphaThreshold) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      rowCounts[y] += 1;
      colCounts[x] += 1;
      foregroundTotal += 1;
    }
  }
  if (maxX < 0 || maxY < 0) {
    const bounds = readAlphaBounds();
    if (!bounds) return null;
    minX = bounds.minX;
    minY = bounds.minY;
    maxX = bounds.maxX;
    maxY = bounds.maxY;
  } else if (foregroundTotal > 0) {
    const trimCount = Math.max(1, Math.round(foregroundTotal * 0.01));
    const findMinIndex = (counts) => {
      let acc = 0;
      for (let i = 0; i < counts.length; i += 1) {
        acc += counts[i];
        if (acc >= trimCount) return i;
      }
      return 0;
    };
    const findMaxIndex = (counts) => {
      let acc = 0;
      for (let i = counts.length - 1; i >= 0; i -= 1) {
        acc += counts[i];
        if (acc >= trimCount) return i;
      }
      return counts.length - 1;
    };
    const trimmedMinY = findMinIndex(rowCounts);
    const trimmedMaxY = findMaxIndex(rowCounts);
    const trimmedMinX = findMinIndex(colCounts);
    const trimmedMaxX = findMaxIndex(colCounts);
    const baseW = maxX - minX;
    const baseH = maxY - minY;
    const trimmedW = trimmedMaxX - trimmedMinX;
    const trimmedH = trimmedMaxY - trimmedMinY;
    if (trimmedW > baseW * 0.4 && trimmedH > baseH * 0.4) {
      minX = Math.min(Math.max(trimmedMinX, 0), width - 1);
      maxX = Math.min(Math.max(trimmedMaxX, minX), width - 1);
      minY = Math.min(Math.max(trimmedMinY, 0), height - 1);
      maxY = Math.min(Math.max(trimmedMaxY, minY), height - 1);
    }
  }
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const invScale = scale > 0 ? 1 / scale : 1;
  return {
    center: { x: centerX * invScale, y: centerY * invScale },
    bounds: {
      minX: minX * invScale,
      minY: minY * invScale,
      maxX: maxX * invScale,
      maxY: maxY * invScale
    }
  };
};
const readCenterOffsetFromBitmaps = (bitmaps) => {
  if (!bitmaps.length) return null;
  const sampleTarget = Math.min(INTERACTIVE_CENTER_SAMPLE_TARGET, bitmaps.length);
  const step = Math.max(1, Math.floor(bitmaps.length / sampleTarget));
  const centers = [];
  for (let index = 0; index < bitmaps.length && centers.length < sampleTarget; index += step) {
    const info = readForegroundCenterFromBitmap(bitmaps[index]);
    if (info) centers.push(info.center);
  }
  if (!centers.length) return null;
  const xs = centers.map((center) => center.x).sort((a, b) => a - b);
  const ys = centers.map((center) => center.y).sort((a, b) => a - b);
  const medianX = xs[Math.floor(xs.length / 2)];
  const medianY = ys[Math.floor(ys.length / 2)];
  const width = bitmaps[0].width;
  const height = bitmaps[0].height;
  return {
    x: Math.round(width / 2 - medianX),
    y: Math.round(height / 2 - medianY)
  };
};
const readContentBoundsFromBitmaps = (bitmaps) => {
  if (!bitmaps.length) return null;
  const sampleTarget = Math.min(INTERACTIVE_CENTER_SAMPLE_TARGET, bitmaps.length);
  const step = Math.max(1, Math.floor(bitmaps.length / sampleTarget));
  const boundsList = [];
  for (let index = 0; index < bitmaps.length && boundsList.length < sampleTarget; index += step) {
    const info = readForegroundCenterFromBitmap(bitmaps[index]);
    if (info) boundsList.push(info.bounds);
  }
  if (!boundsList.length) return null;
  const median = (values) => {
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
  };
  const minX = median(boundsList.map((b) => b.minX));
  const minY = median(boundsList.map((b) => b.minY));
  const maxX = median(boundsList.map((b) => b.maxX));
  const maxY = median(boundsList.map((b) => b.maxY));
  return { minX, minY, maxX, maxY };
};
const getInteractiveAssetBytes = async (source) => {
  const cached = interactiveDetailBytesCache.get(source);
  if (cached) return cached;
  const pending = interactiveDetailBytesPending.get(source);
  if (pending) return pending;
  const task = (async () => {
    try {
      const response = await fetch(source, { cache: "force-cache" });
      if (!response.ok) return null;
      const bytes = await response.arrayBuffer();
      interactiveDetailBytesCache.set(source, bytes);
      return bytes;
    } catch {
      return null;
    } finally {
      interactiveDetailBytesPending.delete(source);
    }
  })();
  interactiveDetailBytesPending.set(source, task);
  return task;
};
const prewarmInteractiveDetailAssets = async () => {
  if (!supportsInteractiveMedia()) return;
  const sources = new Set();
  DATA.categories.forEach((category) => {
    category.items.forEach((item) => {
      const asset = getInteractiveDetailAsset(item);
      if (asset) sources.add(asset.source);
    });
  });
  await Promise.allSettled(Array.from(sources).slice(0, 12).map((source) => getInteractiveAssetBytes(source)));
};
const teardownInteractiveModalMedia = () => {
  modalMediaToken += 1;
  if (modalMediaCleanup) {
    modalMediaCleanup();
    modalMediaCleanup = null;
  }
};
const setupInteractiveModalMedia = async (asset) => {
  teardownInteractiveModalMedia();
  if (!asset || !modalContent) return;
  const Decoder = window.ImageDecoder;
  if (!Decoder) return;
  const host = modalContent.querySelector(".dish-modal__media");
  const image = host?.querySelector("img");
  if (!host || !image) return;
  const token = ++modalMediaToken;
  const abortController = new AbortController();
  let disposed = false;
  let decoder = null;
  const bitmaps = [];
  let canvas = null;
  let ctx = null;
  let canvasDisplayWidth = 0;
  let canvasDisplayHeight = 0;
  let resizeObserver = null;
  let pointerId = null;
  let lastX = 0;
  let frameCursor = 0;
  let interactiveReady = false;
  let imageHidden = false;
  const allowAutoCenter = !INTERACTIVE_KEEP_ORIGINAL_PLACEMENT;
  let centerOffset = allowAutoCenter
    ? interactiveDetailCenterOffsetCache.get(asset.source) || { x: 0, y: 0 }
    : { x: 0, y: 0 };
  let contentBounds = null;
  let renderSpec = null;
  const debugEnabled = DEBUG_INTERACTIVE_CENTER;
  let debugEl = null;
  let debugBounds = null;
  let debugVisibleRect = null;
  let debugFrameSize = null;
  host.classList.add("is-loading-interactive");
  if (debugEnabled) {
    debugEl = document.createElement("div");
    debugEl.className = "dish-modal__media-debug";
    host.appendChild(debugEl);
  }
  const hideImage = () => {
    if (imageHidden) return;
    imageHidden = true;
    image.classList.add("is-hidden");
  };
  const updateDebugOverlay = () => {
    if (!debugEnabled || !debugEl) return;
    const frameLabel = canvas ? canvas.width + "x" + canvas.height : "-";
    const offsetLabel = Math.round(centerOffset.x) + ", " + Math.round(centerOffset.y);
    const boundsLabel = debugBounds
      ? Math.round(debugBounds.minX) +
        "," +
        Math.round(debugBounds.minY) +
        " " +
        Math.round(debugBounds.maxX - debugBounds.minX) +
        "x" +
        Math.round(debugBounds.maxY - debugBounds.minY)
      : "-";
    const visibleLabel = debugVisibleRect
      ? Math.round(debugVisibleRect.x) +
        "," +
        Math.round(debugVisibleRect.y) +
        " " +
        Math.round(debugVisibleRect.width) +
        "x" +
        Math.round(debugVisibleRect.height)
      : "-";
    const frameSizeLabel = debugFrameSize
      ? Math.round(debugFrameSize.width) + "x" + Math.round(debugFrameSize.height)
      : "-";
    debugEl.textContent =
      "offset: " +
      offsetLabel +
      "\\nframe: " +
      frameLabel +
      "\\nsource: " +
      frameSizeLabel +
      "\\nvisible: " +
      visibleLabel +
      "\\nbounds: " +
      boundsLabel;
  };
  const cleanup = () => {
    if (disposed) return;
    disposed = true;
    abortController.abort();
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
    if (canvas) {
      canvas.remove();
    }
    if (debugEl) {
      debugEl.remove();
      debugEl = null;
    }
    if (imageHidden) {
      image.classList.remove("is-hidden");
    }
    host.classList.remove("is-loading-interactive");
    host.classList.remove("is-interactive");
    bitmaps.forEach((bitmap) => bitmap.close?.());
    bitmaps.length = 0;
    try {
      decoder?.close?.();
    } catch {}
  };
  modalMediaCleanup = cleanup;
  try {
    const bytes = await getInteractiveAssetBytes(asset.source);
    if (!bytes) {
      cleanup();
      return;
    }
    if (disposed || token !== modalMediaToken) {
      cleanup();
      return;
    }
    decoder = new Decoder({ data: bytes, type: asset.mime });
    await decoder.tracks.ready;
    const frameCount = Number(decoder.tracks?.selectedTrack?.frameCount ?? 0);
    if (frameCount < 2) {
      cleanup();
      return;
    }
    const frameStep = Math.max(1, Math.ceil(frameCount / INTERACTIVE_GIF_MAX_FRAMES));
    const decodeIndices = [];
    for (let frameIndex = 0; frameIndex < frameCount; frameIndex += frameStep) {
      decodeIndices.push(frameIndex);
    }
    if (decodeIndices[decodeIndices.length - 1] !== frameCount - 1) {
      decodeIndices.push(frameCount - 1);
    }
    const pixelsPerFrame = window.matchMedia("(pointer: coarse)").matches ? 7 : 4;
    const computeRenderSpec = () => {
      if (!canvas || !contentBounds) return null;
      const dpr = window.devicePixelRatio || 1;
      const width = canvasDisplayWidth || canvas.width / dpr;
      const height = canvasDisplayHeight || canvas.height / dpr;
      const boundsW = Math.max(1, contentBounds.maxX - contentBounds.minX);
      const boundsH = Math.max(1, contentBounds.maxY - contentBounds.minY);
      const padding = Math.max(boundsW, boundsH) * 0.08;
      let sx = contentBounds.minX - padding;
      let sy = contentBounds.minY - padding;
      let sw = boundsW + padding * 2;
      let sh = boundsH + padding * 2;

      sx = Math.max(0, Math.min(sx, width - 1));
      sy = Math.max(0, Math.min(sy, height - 1));
      sw = Math.max(1, Math.min(sw, width));
      sh = Math.max(1, Math.min(sh, height));
      if (sx + sw > width) {
        sx = Math.max(0, width - sw);
      }
      if (sy + sh > height) {
        sy = Math.max(0, height - sh);
      }

      const scale = Math.min(width / sw, height / sh);
      const dw = sw * scale;
      const dh = sh * scale;
      const dx = (width - dw) / 2;
      const dy = (height - dh) / 2;
      return { sx, sy, sw, sh, dx, dy, dw, dh };
    };
  const render = () => {
    if (!canvas || !ctx || disposed) return;
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = canvasDisplayWidth || canvas.width / dpr;
    const displayHeight = canvasDisplayHeight || canvas.height / dpr;
    const frameCountSafe = Math.max(1, bitmaps.length);
    const normalized =
      ((Math.round(frameCursor) % frameCountSafe) + frameCountSafe) % frameCountSafe;
    const frame = bitmaps[normalized];
    if (!frame) return;
    ctx.clearRect(0, 0, displayWidth, displayHeight);
    let containScale = 1;
    let containDx = 0;
    let containDy = 0;
    if (renderSpec) {
      ctx.drawImage(
        frame,
        renderSpec.sx,
        renderSpec.sy,
        renderSpec.sw,
        renderSpec.sh,
        renderSpec.dx,
        renderSpec.dy,
        renderSpec.dw,
        renderSpec.dh
      );
    } else {
      containScale = Math.min(displayWidth / frame.width, displayHeight / frame.height);
      const dw = frame.width * containScale;
      const dh = frame.height * containScale;
      containDx = (displayWidth - dw) / 2;
      containDy = (displayHeight - dh) / 2;
      ctx.drawImage(frame, containDx, containDy, dw, dh);
    }
      if (debugEnabled && debugBounds) {
        let rectX = debugBounds.minX + centerOffset.x;
        let rectY = debugBounds.minY + centerOffset.y;
        let rectW = debugBounds.maxX - debugBounds.minX;
        let rectH = debugBounds.maxY - debugBounds.minY;
        if (renderSpec) {
          const scaleX = renderSpec.dw / renderSpec.sw;
          const scaleY = renderSpec.dh / renderSpec.sh;
          rectX = renderSpec.dx + (debugBounds.minX - renderSpec.sx) * scaleX;
          rectY = renderSpec.dy + (debugBounds.minY - renderSpec.sy) * scaleY;
          rectW = (debugBounds.maxX - debugBounds.minX) * scaleX;
          rectH = (debugBounds.maxY - debugBounds.minY) * scaleY;
        } else {
          rectX = containDx + debugBounds.minX * containScale;
          rectY = containDy + debugBounds.minY * containScale;
          rectW = (debugBounds.maxX - debugBounds.minX) * containScale;
          rectH = (debugBounds.maxY - debugBounds.minY) * containScale;
        }
        const centerX = displayWidth / 2;
        const centerY = displayHeight / 2;
        const boundsCenterX = rectX + rectW / 2;
        const boundsCenterY = rectY + rectH / 2;
        ctx.save();
        ctx.strokeStyle = "rgba(248, 250, 252, 0.7)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(centerX - 12, centerY);
        ctx.lineTo(centerX + 12, centerY);
        ctx.moveTo(centerX, centerY - 12);
        ctx.lineTo(centerX, centerY + 12);
        ctx.stroke();
        ctx.strokeStyle = "rgba(251, 191, 36, 0.85)";
        ctx.lineWidth = 2;
        ctx.strokeRect(rectX, rectY, rectW, rectH);
        ctx.fillStyle = "rgba(34, 197, 94, 0.9)";
        ctx.beginPath();
        ctx.arc(boundsCenterX, boundsCenterY, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      updateDebugOverlay();
    };
    const ensureCanvas = (firstBitmap) => {
      if (canvas || disposed) return;
      if (allowAutoCenter) {
        const computedOffset = readCenterOffsetFromBitmaps(bitmaps);
        if (computedOffset) {
          centerOffset = computedOffset;
          interactiveDetailCenterOffsetCache.set(asset.source, centerOffset);
        }
      }
      canvas = document.createElement("canvas");
      canvas.className = "dish-modal__media-canvas";
      canvas.width = firstBitmap.width;
      canvas.height = firstBitmap.height;
      ctx = canvas.getContext("2d");
      if (!ctx) {
        cleanup();
        return;
      }
      if (allowAutoCenter && contentBounds) {
        renderSpec = computeRenderSpec();
      }
      const onPointerDown = (event) => {
        pointerId = event.pointerId;
        lastX = event.clientX;
        canvas.setPointerCapture(pointerId);
        canvas.classList.add("is-dragging");
        event.preventDefault();
      };
      const onPointerMove = (event) => {
        if (pointerId !== event.pointerId) return;
        const deltaX = event.clientX - lastX;
        lastX = event.clientX;
        frameCursor += (deltaX / pixelsPerFrame) * detailRotateDirection;
        render();
        event.preventDefault();
      };
      const onPointerRelease = (event) => {
        if (pointerId !== event.pointerId) return;
        try {
          canvas.releasePointerCapture(pointerId);
        } catch {}
        pointerId = null;
        canvas.classList.remove("is-dragging");
      };
      canvas.addEventListener("pointerdown", onPointerDown);
      canvas.addEventListener("pointermove", onPointerMove);
      canvas.addEventListener("pointerup", onPointerRelease);
      canvas.addEventListener("pointercancel", onPointerRelease);
      canvas.addEventListener("contextmenu", (event) => event.preventDefault());
      canvas.addEventListener("dragstart", (event) => event.preventDefault());

      host.appendChild(canvas);
      const syncCanvasToImage = () => {
        if (!canvas || !ctx) return;
        const imageRect = image.getBoundingClientRect();
        const hostRect = host.getBoundingClientRect();
        const width = imageRect.width;
        const height = imageRect.height;
        if (!width || !height) {
          requestAnimationFrame(syncCanvasToImage);
          return;
        }
        canvasDisplayWidth = width;
        canvasDisplayHeight = height;
        canvas.style.position = "absolute";
        canvas.style.left = imageRect.left - hostRect.left + "px";
        canvas.style.top = imageRect.top - hostRect.top + "px";
        canvas.style.width = width + "px";
        canvas.style.height = height + "px";
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.max(1, Math.round(width * dpr));
        canvas.height = Math.max(1, Math.round(height * dpr));
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };
      syncCanvasToImage();
      requestAnimationFrame(syncCanvasToImage);
      if (!resizeObserver && "ResizeObserver" in window) {
        resizeObserver = new ResizeObserver(() => {
          syncCanvasToImage();
          render();
        });
        resizeObserver.observe(host);
      }
      hideImage();
      host.classList.remove("is-loading-interactive");
    };
    const normalizeDecodedFrame = async (frame) => {
      if (debugEnabled && !debugFrameSize) {
        debugFrameSize = {
          width: frame.codedWidth || frame.displayWidth || frame.visibleRect?.width || 0,
          height: frame.codedHeight || frame.displayHeight || frame.visibleRect?.height || 0
        };
      }
      const visibleRect = frame.visibleRect;
      if (debugEnabled && !debugVisibleRect && visibleRect) {
        debugVisibleRect = {
          x: visibleRect.x,
          y: visibleRect.y,
          width: visibleRect.width,
          height: visibleRect.height
        };
      }
      const fullWidth = frame.codedWidth || frame.displayWidth || visibleRect?.width || 0;
      const fullHeight = frame.codedHeight || frame.displayHeight || visibleRect?.height || 0;
      if (!visibleRect || !fullWidth || !fullHeight) {
        return createImageBitmap(frame);
      }
      const sameBounds =
        Math.round(visibleRect.x) === 0 &&
        Math.round(visibleRect.y) === 0 &&
        Math.round(visibleRect.width) === Math.round(fullWidth) &&
        Math.round(visibleRect.height) === Math.round(fullHeight);
      if (sameBounds) {
        return createImageBitmap(frame);
      }
      const offscreen = document.createElement("canvas");
      offscreen.width = fullWidth;
      offscreen.height = fullHeight;
      const offCtx = offscreen.getContext("2d");
      if (!offCtx) {
        return createImageBitmap(frame);
      }
      offCtx.clearRect(0, 0, fullWidth, fullHeight);
      offCtx.drawImage(
        frame,
        0,
        0,
        visibleRect.width,
        visibleRect.height,
        visibleRect.x,
        visibleRect.y,
        visibleRect.width,
        visibleRect.height
      );
      return createImageBitmap(offscreen);
    };
    let decodedCount = 0;
    for (const frameIndex of decodeIndices) {
      const decoded = await decoder.decode({ frameIndex, completeFramesOnly: true });
      const frame = decoded?.image;
      if (!frame) continue;
      const bitmap = await normalizeDecodedFrame(frame);
      frame.close?.();
      if (disposed || token !== modalMediaToken) {
        bitmap.close?.();
        cleanup();
        return;
      }
      bitmaps.push(bitmap);
      if (debugEnabled && !debugBounds) {
        const info = readForegroundCenterFromBitmap(bitmap);
        if (info) debugBounds = info.bounds;
      }
      if (
        allowAutoCenter &&
        (bitmaps.length === 1 || bitmaps.length === INTERACTIVE_CENTER_SAMPLE_TARGET)
      ) {
        const computedOffset = readCenterOffsetFromBitmaps(bitmaps);
        if (computedOffset) {
          const delta =
            Math.abs(computedOffset.x - centerOffset.x) +
            Math.abs(computedOffset.y - centerOffset.y);
          if (delta > 1) {
            centerOffset = computedOffset;
            interactiveDetailCenterOffsetCache.set(asset.source, centerOffset);
          }
        }
        const computedBounds = readContentBoundsFromBitmaps(bitmaps);
        if (computedBounds) {
          contentBounds = computedBounds;
          renderSpec = computeRenderSpec();
          if (debugEnabled) {
            debugBounds = computedBounds;
          }
        }
      }
      if (!canvas) {
        ensureCanvas(bitmap);
      }
      render();
      if (!interactiveReady && bitmaps.length >= 2) {
        interactiveReady = true;
        host.classList.add("is-interactive");
      }
      decodedCount += 1;
      if (decodedCount % 6 === 0) {
        await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
      }
    }
    if (!canvas) {
      cleanup();
      return;
    }
    if (allowAutoCenter) {
      const computedOffset = readCenterOffsetFromBitmaps(bitmaps);
      if (computedOffset) {
        centerOffset = computedOffset;
        interactiveDetailCenterOffsetCache.set(asset.source, centerOffset);
        render();
      }
      const computedBounds = readContentBoundsFromBitmaps(bitmaps);
      if (computedBounds) {
        contentBounds = computedBounds;
        renderSpec = computeRenderSpec();
        if (debugEnabled) {
          debugBounds = computedBounds;
        }
        render();
      }
    }
    if (!interactiveReady && bitmaps.length >= 2) {
      interactiveReady = true;
      host.classList.add("is-interactive");
    }
  } catch (error) {
    const isAbort = error instanceof DOMException && error.name === "AbortError";
    if (!isAbort) {
      console.warn("Interactive GIF decode failed", error);
    }
    cleanup();
  }
};
const instructionCopy = {
  en: {
    loadingLabel: "Loading assets",
    tapHint: "Tap or click a dish for details",
    assetDisclaimer:
      "Assets belong to their owners. Do not copy or reuse this content without permission.",
    jukeboxHint: "Scroll vertically to spin the disc. Horizontal to switch sections.",
    focusRowsHint: "Scroll vertically for sections. Horizontally for dishes.",
    rotateHintTouch: "Swipe horizontally on the image to rotate",
    rotateHintMouse: "Drag horizontally with the mouse to rotate",
    rotateToggle: "Reverse rotation"
  },
  es: {
    loadingLabel: "Cargando assets",
    tapHint: "Toca o haz clic en un platillo para ver detalles",
    assetDisclaimer:
      "Los assets pertenecen a sus propietarios. No copies ni reutilices este contenido sin autorización.",
    jukeboxHint: "Desliza vertical para girar el disco. Horizontal para cambiar sección.",
    focusRowsHint: "Desliza vertical para secciones. Horizontal para platillos.",
    rotateHintTouch: "Desliza horizontal sobre la imagen para girar",
    rotateHintMouse: "Arrastra horizontal con el mouse para girar",
    rotateToggle: "Invertir giro"
  },
  fr: {
    loadingLabel: "Chargement des assets",
    tapHint: "Touchez ou cliquez sur un plat pour voir les détails",
    assetDisclaimer:
      "Les assets appartiennent à leurs propriétaires. Ne copiez ni ne réutilisez ce contenu sans autorisation.",
    jukeboxHint:
      "Faites défiler verticalement pour faire tourner le disque. Horizontalement pour changer de section.",
    focusRowsHint: "Faites défiler verticalement pour les sections. Horizontalement pour les plats.",
    rotateHintTouch: "Balayez horizontalement l'image pour faire tourner",
    rotateHintMouse: "Faites glisser horizontalement avec la souris pour faire tourner",
    rotateToggle: "Inverser la rotation"
  },
  pt: {
    loadingLabel: "Carregando assets",
    tapHint: "Toque ou clique em um prato para ver detalhes",
    assetDisclaimer:
      "Os assets pertencem aos seus proprietários. Não copie nem reutilize este conteúdo sem autorização.",
    jukeboxHint: "Deslize verticalmente para girar o disco. Horizontalmente para mudar de seção.",
    focusRowsHint: "Deslize verticalmente para seções. Horizontalmente para pratos.",
    rotateHintTouch: "Deslize horizontalmente na imagem para girar",
    rotateHintMouse: "Arraste horizontalmente com o mouse para girar",
    rotateToggle: "Inverter rotação"
  },
  it: {
    loadingLabel: "Caricamento assets",
    tapHint: "Tocca o fai clic su un piatto per vedere i dettagli",
    assetDisclaimer:
      "Gli assets appartengono ai rispettivi proprietari. Non copiare o riutilizzare questo contenuto senza autorizzazione.",
    jukeboxHint: "Scorri verticalmente per far girare il disco. Orizzontalmente per cambiare sezione.",
    focusRowsHint: "Scorri verticalmente per le sezioni. Orizzontalmente per i piatti.",
    rotateHintTouch: "Scorri orizzontalmente sull'immagine per ruotare",
    rotateHintMouse: "Trascina orizzontalmente con il mouse per ruotare",
    rotateToggle: "Inverti rotazione"
  },
  de: {
    loadingLabel: "Assets werden geladen",
    tapHint: "Tippe oder klicke auf ein Gericht, um Details zu sehen",
    assetDisclaimer:
      "Assets gehören ihren Eigentümern. Bitte nicht ohne Genehmigung kopieren oder wiederverwenden.",
    jukeboxHint: "Vertikal scrollen, um die Scheibe zu drehen. Horizontal, um die Sektion zu wechseln.",
    focusRowsHint: "Vertikal für Sektionen scrollen. Horizontal für Gerichte.",
    rotateHintTouch: "Wische horizontal über das Bild, um zu drehen",
    rotateHintMouse: "Ziehe horizontal mit der Maus, um zu drehen",
    rotateToggle: "Drehrichtung umkehren"
  },
  ja: {
    loadingLabel: "アセットを読み込み中",
    tapHint: "料理をタップまたはクリックして詳細を見る",
    assetDisclaimer:
      "アセットは各所有者に帰属します。許可なく複製・再利用しないでください。",
    jukeboxHint: "縦スクロールでディスクを回転。横スクロールでセクション切替。",
    focusRowsHint: "縦スクロールでセクション。横スクロールで料理。",
    rotateHintTouch: "画像上で横にスワイプして回転",
    rotateHintMouse: "画像上で横にドラッグして回転",
    rotateToggle: "回転方向を反転"
  },
  ko: {
    loadingLabel: "에셋 로딩 중",
    tapHint: "요리를 탭하거나 클릭해 상세 정보를 확인하세요",
    assetDisclaimer:
      "에셋은 각 소유자에게 귀속됩니다. 허가 없이 복사하거나 재사용하지 마세요.",
    jukeboxHint: "세로 스크롤로 디스크를 회전. 가로 스크롤로 섹션 전환.",
    focusRowsHint: "세로 스크롤로 섹션. 가로 스크롤로 요리.",
    rotateHintTouch: "이미지에서 가로로 스와이프해 회전",
    rotateHintMouse: "마우스로 가로로 드래그해 회전",
    rotateToggle: "회전 방향 반전"
  },
  zh: {
    loadingLabel: "正在加载素材",
    tapHint: "点按或点击菜品查看详情",
    assetDisclaimer: "素材归其所有者所有。未经许可请勿复制或再利用。",
    jukeboxHint: "纵向滚动旋转转盘，横向滚动切换分类。",
    focusRowsHint: "纵向滚动浏览分类，横向滚动浏览菜品。",
    rotateHintTouch: "在图片上横向滑动以旋转",
    rotateHintMouse: "用鼠标横向拖动以旋转",
    rotateToggle: "反向旋转"
  }
};

const normalizeLocale = (value) => (value || "").toLowerCase().split("-")[0];

const getInstructionCopy = (key) => {
  const localeKey = normalizeLocale(locale);
  const pack = instructionCopy[localeKey] || instructionCopy.en;
  return pack[key] || instructionCopy.en[key];
};

const getLoadingLabel = () => getInstructionCopy("loadingLabel");
const getTapHint = () => getInstructionCopy("tapHint");
const getAssetDisclaimer = () => getInstructionCopy("assetDisclaimer");
const getJukeboxHint = () => getInstructionCopy("jukeboxHint");
const getFocusRowsHint = () => getInstructionCopy("focusRowsHint");
const isJukeboxTemplate = () => (DATA.meta.template || "focus-rows") === "jukebox";
const collectStartupSources = () => {
  const urls = new Set();
  backgrounds.forEach((bg) => {
    const src = (bg?.src || "").trim();
    if (src) urls.add(src);
  });
  DATA.categories.forEach((category) => {
    category.items.forEach((item) => {
      const src = (getCarouselImageSrc(item) || "").trim();
      if (src) urls.add(src);
    });
  });
  return Array.from(urls);
};
const preloadImageAsset = (src) =>
  new Promise((resolve) => {
    if (!src) {
      resolve();
      return;
    }
    const image = new Image();
    const done = () => resolve();
    image.onload = done;
    image.onerror = done;
    image.src = src;
    if (image.complete) {
      resolve();
    }
  });
const syncStartupUi = () => {
  const preview = app.querySelector(".menu-preview");
  const loader = app.querySelector(".menu-startup-loader");
  const fill = app.querySelector(".menu-startup-loader__fill");
  const value = app.querySelector(".menu-startup-loader__value");
  preview?.classList.toggle("is-loading", startupLoading);
  loader?.classList.toggle("active", startupLoading);
  if (fill) fill.style.width = startupProgress + "%";
  if (value) value.textContent = Math.round(startupProgress) + "%";
};
const preloadStartupAssets = async () => {
  const token = ++startupToken;
  const sources = collectStartupSources();
  if (sources.length === 0) {
    startupProgress = 100;
    startupLoading = false;
    syncStartupUi();
    return;
  }
  startupLoading = true;
  startupProgress = 0;
  syncStartupUi();
  let loaded = 0;
  await Promise.all(
    sources.map((src) =>
      preloadImageAsset(src).finally(() => {
        if (token !== startupToken) return;
        loaded += 1;
        startupProgress = Math.round((loaded / sources.length) * 100);
        syncStartupUi();
      })
    )
  );
  if (token !== startupToken) return;
  startupProgress = 100;
  startupLoading = false;
  syncStartupUi();
};

const buildCarousel = (category) => {
  const entries = isJukeboxTemplate()
    ? getJukeboxItems(category.items)
    : getFocusRowItems(category.items);
  return \`
    <div class="menu-section__head">
      <p class="menu-section__title">\${textOf(category.name)}</p>
      <span class="menu-section__count">\${category.items.length} items</span>
    </div>
    \${category.items.length > 1 && !isJukeboxTemplate()
      ? '<div class="carousel-nav">' +
        '<button class="carousel-nav__btn prev" type="button" data-category-id="' +
        category.id +
        '" data-dir="-1" aria-label="Previous item"><span aria-hidden="true">‹</span></button>' +
        '<button class="carousel-nav__btn next" type="button" data-category-id="' +
        category.id +
        '" data-dir="1" aria-label="Next item"><span aria-hidden="true">›</span></button>' +
        "</div>"
      : ""}
    <div class="menu-carousel \${category.items.length <= 1 ? "single" : ""}" data-category-id="\${category.id}">
      \${entries
        .map(
          (entry) => \`
            <button class="carousel-card" type="button" data-item="\${entry.item.id}" data-source="\${entry.sourceIndex}">
              <div class="carousel-media">
                <img src="\${getCarouselImageSrc(entry.item)}" \${buildSrcSet(entry.item) ? 'srcset="' + buildSrcSet(entry.item) + '"' : ""} sizes="(max-width: 640px) 64vw, (max-width: 1200px) 34vw, 260px" alt="\${textOf(entry.item.name)}" draggable="false" oncontextmenu="return false;" ondragstart="return false;" loading="lazy" decoding="async" fetchpriority="low" />
              </div>
              <div class="carousel-text">
                <div class="carousel-row">
                  <p class="carousel-title">\${textOf(entry.item.name)}\${entry.item.vegan ? '<span class="vegan-icon" title="' + getTerm("vegan") + '">🌿</span>' : ""}</p>
                  <span class="carousel-price">\${formatPrice(entry.item.price.amount)}</span>
                </div>
                <p class="carousel-desc">\${textOf(entry.item.description)}</p>
              </div>
            </button>
          \`
        )
        .join("")}
    </div>
  \`;
};

const render = () => {
  const restaurantName =
    DATA.meta.restaurantName?.[locale] ??
    DATA.meta.restaurantName?.[DATA.meta.defaultLocale] ??
    "";
  const menuTitle =
    DATA.meta.title?.[locale] ??
    DATA.meta.title?.[DATA.meta.defaultLocale] ??
    "";
  const templateClass = "template-" + (DATA.meta.template || "focus-rows");
  ensureFont();
  app.innerHTML = \`
    <div class="menu-preview \${templateClass} \${startupLoading ? "is-loading" : ""}">
      <div class="menu-startup-loader \${startupLoading ? "active" : ""}">
        <div class="menu-startup-loader__card">
          <p class="menu-startup-loader__label">\${getLoadingLabel()}</p>
          <div class="menu-startup-loader__track">
            <span class="menu-startup-loader__fill" style="width:\${startupProgress}%"></span>
          </div>
          <p class="menu-startup-loader__value">\${Math.round(startupProgress)}%</p>
        </div>
      </div>
      \${backgrounds
        .map(
          (item, index) =>
            \`<div class="menu-background \${index === activeBackgroundIndex ? "active" : ""}" style="background-image:url('\${item.src}');"></div>\`
        )
        .join("")}
      <div class="menu-overlay"></div>
      <header class="menu-topbar">
        <div class="menu-title-block">
          <p class="menu-eyebrow">\${restaurantName}</p>
          <h1 class="menu-title">\${menuTitle || "Menu"}</h1>
        </div>
        <div class="menu-lang">
          <select class="menu-select" id="menu-locale">
            \${DATA.meta.locales
              .map((lang) => \`<option value="\${lang}" \${lang === locale ? "selected" : ""}>\${lang.toUpperCase()}</option>\`)
              .join("")}
          </select>
        </div>
      </header>
      \${isJukeboxTemplate() && DATA.categories.length > 1
        ? '<div class="section-nav">' +
          '<button class="section-nav__btn prev" type="button" data-section-dir="-1" aria-label="Previous section"><span aria-hidden="true">‹</span></button>' +
          '<span class="section-nav__label">' + getJukeboxHint() + "</span>" +
          '<button class="section-nav__btn next" type="button" data-section-dir="1" aria-label="Next section"><span aria-hidden="true">›</span></button>' +
          "</div>"
        : ""}
      \${!isJukeboxTemplate()
        ? '<div class="focus-rows-hint" aria-hidden="true"><span class="focus-rows-hint__label">' +
          getFocusRowsHint() +
          "</span></div>"
        : ""}
      <div class="menu-scroll">
        \${DATA.categories
          .map(
            (category) =>
              \`<section class="menu-section">\${buildCarousel(
                category
              )}</section>\`
          )
          .join("")}
      </div>
      <div class="menu-tap-hint" aria-hidden="true">
        <span class="menu-tap-hint__dot"></span>
        <span>\${getTapHint()}</span>
      </div>
      <p class="menu-asset-disclaimer" aria-hidden="true">\${getAssetDisclaimer()}</p>
    </div>
  \`;
  const preview = app.querySelector(".menu-preview");
  if (preview) {
    preview.style.setProperty("--menu-font", getFontStack(fontFamily));
    preview.addEventListener("contextmenu", (event) => event.preventDefault());
    preview.addEventListener("dragstart", (event) => {
      const target = event.target;
      if (target instanceof HTMLImageElement) {
        event.preventDefault();
      }
    });
  }
  const applyBackgroundState = () => {
    const layers = Array.from(app.querySelectorAll(".menu-background"));
    layers.forEach((layer, index) => {
      layer.classList.toggle("active", index === activeBackgroundIndex);
    });
  };
  const startBackgroundRotation = () => {
    if (backgroundTimer) {
      window.clearInterval(backgroundTimer);
      backgroundTimer = undefined;
    }
    if (backgrounds.length < 2) {
      applyBackgroundState();
      return;
    }
    backgroundTimer = window.setInterval(() => {
      activeBackgroundIndex = (activeBackgroundIndex + 1) % backgrounds.length;
      applyBackgroundState();
    }, 9000);
  };
  applyBackgroundState();
  startBackgroundRotation();
  const localeSelect = document.getElementById("menu-locale");
  localeSelect?.addEventListener("change", (event) => {
    locale = event.target.value;
    render();
  });
  bindCarousels();
  bindCarouselNav();
  bindSectionNav();
  bindSectionFocus();
  bindCards();
  syncStartupUi();
};

const applyFocusState = (container, activeIndex, itemCount = 0) => {
  const cards = Array.from(container.querySelectorAll(".carousel-card"));
  const count = itemCount || cards.length || 1;
  const hideAt = Math.max(1.6, count / 2 - 0.25);
  if (isJukeboxTemplate()) {
    cards.forEach((card, index) => {
      const sourceIndex = Number(card.dataset.source || index);
      const offset = getCircularOffset(activeIndex, sourceIndex, count);
      const distance = Math.abs(offset);
      const wheelRadius = 420;
      const stepY = 210;
      const discBiasX = -72;
      const rawY = offset * stepY;
      const clampedY = Math.max(-wheelRadius, Math.min(wheelRadius, rawY));
      const chord = Math.sqrt(Math.max(0, wheelRadius * wheelRadius - clampedY * clampedY));
      const arcX = distance < 0.5 ? discBiasX : discBiasX - (wheelRadius - chord);
      const focusShift = distance < 0.5 ? -arcX : 0;
      const arcY = clampedY;
      const scale = distance < 0.5 ? 1 : 0.88;
      const opacity = distance < 0.5 ? 1 : distance <= 1.2 ? 0.82 : 0;
      const depth = Math.max(1, 220 - Math.round(distance * 26));
      card.style.setProperty("--arc-x", arcX.toFixed(1) + "px");
      card.style.setProperty("--arc-y", arcY.toFixed(1) + "px");
      card.style.setProperty("--card-scale", scale.toFixed(3));
      card.style.setProperty("--card-opacity", opacity.toFixed(3));
      card.style.setProperty("--focus-shift", focusShift.toFixed(1) + "px");
      card.style.setProperty("--ring-depth", String(depth));
      card.classList.toggle("active", Math.abs(offset) < 0.5);
      card.classList.toggle("near", Math.abs(offset) >= 0.5 && Math.abs(offset) < 1.25);
      card.classList.toggle("far", Math.abs(offset) >= 1.25);
      card.classList.toggle("is-hidden", distance >= hideAt);
    });
    return;
  }

  cards.forEach((card, index) => {
    const sourceIndex = Number(card.dataset.source || index);
    const offset = getCircularOffset(activeIndex, sourceIndex, count);
    const distance = Math.abs(offset);
    const stepX = 220;
    const maxDistance = 2.6;
    const x = offset * stepX;
    const y = Math.min(18, distance * 6);
    const scale = distance < 0.5 ? 1 : Math.max(0.68, 1 - distance * 0.14);
    let opacity =
      distance < 0.5 ? 1 : distance <= maxDistance ? Math.max(0, 1 - distance * 0.34) : 0;
    if (distance >= hideAt) {
      opacity = 0;
    }
    const blur = Math.min(8, distance * 2.4);
    const depth = Math.max(1, 120 - Math.round(distance * 18));
    card.style.setProperty("--row-x", x.toFixed(1) + "px");
    card.style.setProperty("--row-y", y.toFixed(1) + "px");
    card.style.setProperty("--row-scale", scale.toFixed(3));
    card.style.setProperty("--row-opacity", opacity.toFixed(3));
    card.style.setProperty("--row-blur", blur.toFixed(2) + "px");
    card.style.setProperty("--row-depth", String(depth));
    card.classList.toggle("active", distance < 0.5);
    card.classList.toggle("near", distance >= 0.5 && distance < 1.5);
    card.classList.toggle("far", distance >= 1.5 && distance < 2.5);
    card.classList.toggle("is-hidden", distance >= hideAt);
  });
};

const shiftCarousel = (categoryId, direction) => {
  const container = app.querySelector(
    '.menu-carousel[data-category-id="' + categoryId + '"]'
  );
  if (!container) return;
  const category = DATA.categories.find((item) => item.id === categoryId);
  const count = category?.items.length || 0;
  if (count === 0) return;
  const current = Math.round(Number(container.dataset.activeIndex || "0") || 0);
  const next = wrapCarouselIndex(current + direction, count);
  container.dataset.activeIndex = String(next);
  applyFocusState(container, next, count);
};

const bindCarouselNav = () => {
  const buttons = Array.from(app.querySelectorAll(".carousel-nav__btn"));
  buttons.forEach((button) => {
    const handler = () => {
      const categoryId = button.dataset.categoryId;
      if (!categoryId) return;
      const direction = Number(button.dataset.dir || "1");
      shiftCarousel(categoryId, direction);
    };
    button.addEventListener("click", handler);
    carouselCleanup.push(() => {
      button.removeEventListener("click", handler);
    });
  });
};

const getClosestHorizontalSectionIndex = (container) => {
  const sections = Array.from(container.querySelectorAll(".menu-section"));
  if (sections.length === 0) return -1;
  const center = container.scrollLeft + container.clientWidth / 2;
  let closest = 0;
  let minDistance = Number.POSITIVE_INFINITY;
  sections.forEach((section, index) => {
    const sectionCenter = section.offsetLeft + section.offsetWidth / 2;
    const distance = Math.abs(sectionCenter - center);
    if (distance < minDistance) {
      minDistance = distance;
      closest = index;
    }
  });
  return closest;
};

const centerSectionHorizontally = (container, index, behavior = "smooth") => {
  const sections = Array.from(container.querySelectorAll(".menu-section"));
  const target = sections[index];
  if (!target || container.clientWidth === 0) return;
  const targetLeft = target.offsetLeft + target.offsetWidth / 2 - container.clientWidth / 2;
  container.scrollTo({ left: targetLeft, behavior });
};

const shiftSection = (direction) => {
  const container = app.querySelector(".menu-scroll");
  if (!container) return;
  const sections = Array.from(container.querySelectorAll(".menu-section"));
  if (sections.length <= 1) return;
  const current = getClosestHorizontalSectionIndex(container);
  if (current < 0) return;
  const next = (current + direction + sections.length) % sections.length;
  centerSectionHorizontally(container, next, "smooth");
};

const bindSectionNav = () => {
  const buttons = Array.from(app.querySelectorAll(".section-nav__btn"));
  buttons.forEach((button) => {
    const handler = () => {
      const direction = Number(button.dataset.sectionDir || "1");
      shiftSection(direction);
    };
    button.addEventListener("click", handler);
    carouselCleanup.push(() => {
      button.removeEventListener("click", handler);
    });
  });
};

const bindCarousels = () => {
  carouselCleanup.forEach((dispose) => dispose());
  carouselCleanup = [];
  const carousels = Array.from(document.querySelectorAll(".menu-carousel"));
  carousels.forEach((container) => {
    const id = container.dataset.categoryId;
    const category = DATA.categories.find((item) => item.id === id);
    const count = category?.items.length || 0;
    if (count === 0) return;
    if (isJukeboxTemplate()) {
      const start = 0;
      container.dataset.activeIndex = String(start);
      applyFocusState(container, start, count);
      const state = jukeboxWheelState.get(id) || { settle: 0, touch: null };
      jukeboxWheelState.set(id, state);
      const queueSnap = () => {
        if (state.settle) window.clearTimeout(state.settle);
        state.settle = window.setTimeout(() => {
          const activeIndex = Number(container.dataset.activeIndex || "0") || 0;
          const normalized = wrapCarouselIndex(Math.round(activeIndex), count);
          container.dataset.activeIndex = String(normalized);
          applyFocusState(container, normalized, count);
          state.settle = 0;
        }, JUKEBOX_WHEEL_SETTLE_MS);
      };
      const applyDelta = (delta) => {
        if (!delta) return;
        const current = Number(container.dataset.activeIndex || "0") || 0;
        const next = wrapCarouselIndex(current + delta / JUKEBOX_WHEEL_STEP_THRESHOLD, count);
        container.dataset.activeIndex = String(next);
        applyFocusState(container, next, count);
        queueSnap();
      };
      const onWheel = (event) => {
        if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
        event.preventDefault();
        const delta = normalizeJukeboxWheelDelta(event);
        if (!delta) return;
        applyDelta(delta);
      };
      const onTouchStart = (event) => {
        const touch = event.changedTouches?.[0];
        if (!touch) return;
        state.touch = {
          id: touch.identifier,
          startX: touch.clientX,
          startY: touch.clientY,
          lastY: touch.clientY,
          axis: "pending"
        };
      };
      const onTouchMove = (event) => {
        if (!state.touch) return;
        const touch = Array.from(event.touches || []).find(
          (entry) => entry.identifier === state.touch.id
        );
        if (!touch) return;
        const totalDx = touch.clientX - state.touch.startX;
        const totalDy = touch.clientY - state.touch.startY;
        if (
          state.touch.axis === "pending" &&
          Math.max(Math.abs(totalDx), Math.abs(totalDy)) >= JUKEBOX_TOUCH_INTENT_THRESHOLD
        ) {
          state.touch.axis = Math.abs(totalDy) >= Math.abs(totalDx) ? "vertical" : "horizontal";
        }
        if (state.touch.axis !== "vertical") return;
        event.preventDefault();
        const deltaY = touch.clientY - state.touch.lastY;
        state.touch.lastY = touch.clientY;
        if (Math.abs(deltaY) < 0.2) return;
        applyDelta(-deltaY * JUKEBOX_TOUCH_DELTA_SCALE);
      };
      const clearTouch = (event) => {
        if (!state.touch) return;
        const ended = Array.from(event.changedTouches || []).some(
          (entry) => entry.identifier === state.touch.id
        );
        if (!ended) return;
        state.touch = null;
      };
      container.addEventListener("wheel", onWheel, { passive: false });
      container.addEventListener("touchstart", onTouchStart, { passive: true });
      container.addEventListener("touchmove", onTouchMove, { passive: false });
      container.addEventListener("touchend", clearTouch, { passive: true });
      container.addEventListener("touchcancel", clearTouch, { passive: true });
      carouselCleanup.push(() => {
        container.removeEventListener("wheel", onWheel);
        container.removeEventListener("touchstart", onTouchStart);
        container.removeEventListener("touchmove", onTouchMove);
        container.removeEventListener("touchend", clearTouch);
        container.removeEventListener("touchcancel", clearTouch);
        if (state.settle) {
          window.clearTimeout(state.settle);
        }
        state.touch = null;
        jukeboxWheelState.delete(id);
      });
      return;
    }
    const start = 0;
    container.dataset.activeIndex = String(start);
    applyFocusState(container, start, count);
    const state = focusRowWheelState.get(id) || { settle: 0, touch: null };
    focusRowWheelState.set(id, state);
    const queueSnap = () => {
      if (state.settle) window.clearTimeout(state.settle);
      state.settle = window.setTimeout(() => {
        const activeIndex = Number(container.dataset.activeIndex || "0") || 0;
        const normalized = wrapCarouselIndex(Math.round(activeIndex), count);
        container.dataset.activeIndex = String(normalized);
        applyFocusState(container, normalized, count);
        state.settle = 0;
      }, FOCUS_ROWS_WHEEL_SETTLE_MS);
    };
    const applyDelta = (delta) => {
      if (!delta) return;
      const current = Number(container.dataset.activeIndex || "0") || 0;
      const next = wrapCarouselIndex(current + delta / FOCUS_ROWS_WHEEL_STEP_THRESHOLD, count);
      container.dataset.activeIndex = String(next);
      applyFocusState(container, next, count);
      queueSnap();
    };
    const onWheel = (event) => {
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
      event.preventDefault();
      const delta = normalizeFocusRowWheelDelta(event);
      if (!delta) return;
      applyDelta(delta);
    };
    const onTouchStart = (event) => {
      const touch = event.changedTouches?.[0];
      if (!touch) return;
      state.touch = {
        id: touch.identifier,
        startX: touch.clientX,
        startY: touch.clientY,
        lastX: touch.clientX,
        axis: "pending"
      };
    };
    const onTouchMove = (event) => {
      if (!state.touch) return;
      const touch = Array.from(event.touches || []).find(
        (entry) => entry.identifier === state.touch.id
      );
      if (!touch) return;
      const totalDx = touch.clientX - state.touch.startX;
      const totalDy = touch.clientY - state.touch.startY;
      if (
        state.touch.axis === "pending" &&
        Math.max(Math.abs(totalDx), Math.abs(totalDy)) >= FOCUS_ROWS_TOUCH_INTENT_THRESHOLD
      ) {
        state.touch.axis = Math.abs(totalDx) >= Math.abs(totalDy) ? "horizontal" : "vertical";
      }
      if (state.touch.axis !== "horizontal") return;
      event.preventDefault();
      const deltaX = touch.clientX - state.touch.lastX;
      state.touch.lastX = touch.clientX;
      if (Math.abs(deltaX) < 0.2) return;
      applyDelta(-deltaX * FOCUS_ROWS_TOUCH_DELTA_SCALE);
    };
    const clearTouch = (event) => {
      if (!state.touch) return;
      const ended = Array.from(event.changedTouches || []).some(
        (entry) => entry.identifier === state.touch.id
      );
      if (!ended) return;
      state.touch = null;
    };
    container.addEventListener("wheel", onWheel, { passive: false });
    container.addEventListener("touchstart", onTouchStart, { passive: true });
    container.addEventListener("touchmove", onTouchMove, { passive: false });
    container.addEventListener("touchend", clearTouch, { passive: true });
    container.addEventListener("touchcancel", clearTouch, { passive: true });
    carouselCleanup.push(() => {
      container.removeEventListener("wheel", onWheel);
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchmove", onTouchMove);
      container.removeEventListener("touchend", clearTouch);
      container.removeEventListener("touchcancel", clearTouch);
      if (state.settle) {
        window.clearTimeout(state.settle);
      }
      state.touch = null;
      focusRowWheelState.delete(id);
    });
  });
};

const bindCards = () => {
  document.querySelectorAll(".carousel-card").forEach((card) => {
    card.addEventListener("click", () => {
      const categoryId = card.closest(".menu-carousel")?.dataset.categoryId;
      const itemId = card.dataset.item;
      const category = DATA.categories.find((item) => item.id === categoryId);
      const dish = category?.items.find((item) => item.id === itemId);
      if (!dish) return;
      const allergenLabel = getTerm("allergens");
      const veganLabel = getTerm("vegan");
      const longDesc = textOf(dish.longDescription);
      const allergens = getAllergenValues(dish).join(", ");
      const asset = getInteractiveDetailAsset(dish);
      detailRotateSource = asset?.source || "";
      detailRotateDirection = detailRotateSource
        ? detailRotateDirectionBySource.get(detailRotateSource) || -1
        : -1;
      modalContent.innerHTML = \`
        <div class="dish-modal__header">
          <p class="dish-modal__title">\${textOf(dish.name)}</p>
          <button class="dish-modal__close" id="modal-close">✕</button>
        </div>
        <div class="dish-modal__media">
          \${asset && supportsInteractiveMedia() ? '<p class="dish-modal__media-note">' + getDetailRotateHint() + "</p><button class=\\\"dish-modal__media-toggle\\\" id=\\\"modal-rotate-toggle\\\" type=\\\"button\\\" title=\\\"" + getDetailRotateToggleHint() + "\\\" aria-label=\\\"" + getDetailRotateToggleHint() + "\\\"><span aria-hidden=\\\"true\\\">⇄</span></button>" : ""}
          <img src="\${getDetailImageSrc(dish)}" \${buildSrcSet(dish) ? 'srcset="' + buildSrcSet(dish) + '"' : ""} sizes="(max-width: 720px) 90vw, 440px" alt="\${textOf(dish.name)}" draggable="false" oncontextmenu="return false;" ondragstart="return false;" decoding="async" />
        </div>
        <div class="dish-modal__content">
          <div class="dish-modal__text">
            <p class="dish-modal__desc">\${textOf(dish.description)}</p>
            \${longDesc ? '<p class="dish-modal__long">' + longDesc + '</p>' : ""}
            \${allergens ? '<p class="dish-modal__allergens">' + allergenLabel + ': ' + allergens + '</p>' : ""}
            \${dish.vegan ? '<span class="dish-modal__badge">🌿 ' + veganLabel + '</span>' : ""}
          </div>
          <p class="dish-modal__price">\${formatPrice(dish.price.amount)}</p>
        </div>
      \`;
      modal.classList.add("open");
      if (asset && supportsInteractiveMedia()) {
        void setupInteractiveModalMedia(asset);
      }
      const toggleButton = modal.querySelector("#modal-rotate-toggle");
      if (toggleButton) {
        toggleButton.classList.toggle("is-reversed", detailRotateDirection === -1);
        toggleButton.addEventListener("click", (event) => {
          event.stopPropagation();
          toggleDetailRotateDirection();
          toggleButton.classList.toggle("is-reversed", detailRotateDirection === -1);
        });
      }
      modal.querySelector("#modal-close")?.addEventListener("click", closeModal);
    });
  });
};

const getClosestSectionIndex = (container) => {
  const sections = Array.from(container.querySelectorAll(".menu-section"));
  if (sections.length === 0) return -1;
  const centerY = container.scrollTop + container.clientHeight / 2;
  let closest = 0;
  let minDistance = Number.POSITIVE_INFINITY;
  sections.forEach((section, index) => {
    const sectionCenter = section.offsetTop + section.offsetHeight / 2;
    const distance = Math.abs(sectionCenter - centerY);
    if (distance < minDistance) {
      minDistance = distance;
      closest = index;
    }
  });
  return closest;
};

const centerSection = (container, index, behavior = "smooth") => {
  const sections = Array.from(container.querySelectorAll(".menu-section"));
  const target = sections[index];
  if (!target || container.clientHeight === 0) return;
  const targetTop = target.offsetTop + target.offsetHeight / 2 - container.clientHeight / 2;
  container.scrollTo({ top: targetTop, behavior });
};

const applySectionFocus = (container) => {
  const sections = Array.from(container.querySelectorAll(".menu-section"));
  if (sections.length === 0) return;
  const centerY = container.scrollTop + container.clientHeight / 2;
  const maxDistance = Math.max(container.clientHeight * 0.6, 1);
  const closestIndex = getClosestSectionIndex(container);
  sections.forEach((section, index) => {
    const sectionCenter = section.offsetTop + section.offsetHeight / 2;
    const distance = Math.abs(sectionCenter - centerY);
    const ratio = Math.min(1, distance / maxDistance);
    const focus = 1 - ratio * 0.14;
    section.style.setProperty("--section-focus", focus.toFixed(3));
    section.classList.toggle("is-centered", index === closestIndex);
  });
};

const bindSectionFocus = () => {
  const scroll = app.querySelector(".menu-scroll");
  if (!scroll) return;
  const sections = Array.from(scroll.querySelectorAll(".menu-section"));
  if (sections.length === 0) return;
  if (isJukeboxTemplate()) {
    if (scroll.scrollWidth <= scroll.clientWidth + 4) return;
    let snapTimeout;
    const onScroll = () => {
      if (snapTimeout) window.clearTimeout(snapTimeout);
      snapTimeout = window.setTimeout(() => {
        const closestIndex = getClosestHorizontalSectionIndex(scroll);
        if (closestIndex >= 0) {
          centerSectionHorizontally(scroll, closestIndex, "smooth");
        }
      }, 170);
    };
    scroll.addEventListener("scroll", onScroll);
    carouselCleanup.push(() => {
      scroll.removeEventListener("scroll", onScroll);
      if (snapTimeout) window.clearTimeout(snapTimeout);
    });
    return;
  }
  applySectionFocus(scroll);
  if (scroll.scrollHeight <= scroll.clientHeight + 4) return;

  let raf;
  let snapTimeout;
  const onScroll = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      applySectionFocus(scroll);
    });
    if (snapTimeout) window.clearTimeout(snapTimeout);
    snapTimeout = window.setTimeout(() => {
      const closestIndex = getClosestSectionIndex(scroll);
      if (closestIndex >= 0) {
        centerSection(scroll, closestIndex, "smooth");
      }
      applySectionFocus(scroll);
    }, 180);
  };
  const onResize = () => {
    applySectionFocus(scroll);
  };

  scroll.addEventListener("scroll", onScroll);
  window.addEventListener("resize", onResize);
  window.addEventListener("orientationchange", onResize);
  carouselCleanup.push(() => {
    scroll.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("orientationchange", onResize);
    if (raf) cancelAnimationFrame(raf);
    if (snapTimeout) window.clearTimeout(snapTimeout);
  });
};

const closeModal = () => {
  teardownInteractiveModalMedia();
  detailRotateSource = "";
  modal.classList.remove("open");
};

modal?.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});
modal?.addEventListener("contextmenu", (event) => event.preventDefault());
modal?.addEventListener("dragstart", (event) => {
  if (event.target instanceof HTMLImageElement) {
    event.preventDefault();
  }
});

render();
void preloadStartupAssets();
void prewarmInteractiveDetailAssets();
`;
  };

  const buildExportHtml = (version: string) => `
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
    <meta http-equiv="Pragma" content="no-cache" />
    <meta http-equiv="Expires" content="0" />
    <title>Menu Export</title>
    <link rel="icon" href="favicon.ico" />
    <link rel="stylesheet" href="styles.css?v=${version}" />
  </head>
  <body>
    <div id="app"></div>
    <div id="dish-modal" class="dish-modal">
      <div id="dish-modal-content" class="dish-modal__card"></div>
    </div>
    <script src="app.js?v=${version}"></scr${"ipt"}>
  </body>
</html>
`;

  const collectAssetPaths = (data: MenuProject) => {
    const assets = new Set<string>();
    if (data.meta.fontSource) {
      assets.add(data.meta.fontSource);
    }
    data.backgrounds.forEach((bg) => {
      if (bg.src) assets.add(bg.src);
    });
    data.categories.forEach((category) => {
      category.items.forEach((item) => {
        if (item.media.hero360) assets.add(item.media.hero360);
      });
    });
    return Array.from(assets)
      .map((path) => normalizePath(path))
      .filter((path) => path && !path.startsWith("http"));
  };

  const readAssetBytes = async (
    slug: string,
    sourcePath: string
  ): Promise<Uint8Array | null> => {
    if (assetMode === "filesystem" && rootHandle) {
      try {
        const fileHandle = await getFileHandleByPath(sourcePath);
        const file = await fileHandle.getFile();
        const buffer = await file.arrayBuffer();
        return new Uint8Array(buffer);
      } catch {
        // Fall back to static fetch for demo assets referenced from /projects/*.
      }
    }
    if (assetMode === "bridge") {
      const lookup = resolveBridgeAssetLookup(sourcePath, slug);
      const response = await fetch(
        `/api/assets/file?project=${encodeURIComponent(lookup.slug)}&path=${encodeURIComponent(
          lookup.path
        )}`
      );
      if (!response.ok) return null;
      const buffer = await response.arrayBuffer();
      return new Uint8Array(buffer);
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

  const buildProjectZipEntries = async (slug: string) => {
    if (!draft) return [];
    const encoder = new TextEncoder();
    const exportProject = JSON.parse(JSON.stringify(draft)) as MenuProject;
    const assets = collectAssetPaths(draft);
    const assetPairs = assets.map((assetPath) => {
      const normalized = normalizePath(assetPath);
      const prefix = `projects/${slug}/assets/`;
      let relativePath = normalized;
      if (normalized.startsWith(prefix)) {
        relativePath = normalized.slice(prefix.length);
      } else if (normalized.includes("assets/")) {
        relativePath = normalized.slice(normalized.lastIndexOf("assets/") + "assets/".length);
      } else {
        relativePath = normalized.split("/").filter(Boolean).pop() ?? "asset";
      }
      return {
        sourcePath: normalized,
        relativePath,
        zipPath: `${slug}/assets/${relativePath}`
      };
    });

    if (exportProject.meta.fontSource) {
      const normalized = normalizePath(exportProject.meta.fontSource);
      const pair = assetPairs.find((item) => item.sourcePath === normalized);
      if (pair) {
        exportProject.meta.fontSource = `assets/${pair.relativePath}`;
      }
    }

    exportProject.backgrounds = exportProject.backgrounds.map((bg) => {
      const normalized = normalizePath(bg.src || "");
      const pair = assetPairs.find((item) => item.sourcePath === normalized);
      return { ...bg, src: pair ? `assets/${pair.relativePath}` : bg.src };
    });
    exportProject.categories = exportProject.categories.map((category) => ({
      ...category,
      items: category.items.map((item) => {
        const hero = normalizePath(item.media.hero360 || "");
        const pair = assetPairs.find((p) => p.sourcePath === hero);
        const media = {
          ...item.media,
          hero360: pair ? `assets/${pair.relativePath}` : item.media.hero360
        };
        delete (media as { responsive?: unknown }).responsive;
        return {
          ...item,
          media
        };
      })
    }));

    const entries: { name: string; data: Uint8Array }[] = [];
    const menuData = JSON.stringify(exportProject, null, 2);
    entries.push({ name: `${slug}/menu.json`, data: encoder.encode(menuData) });

    for (const pair of assetPairs) {
      try {
        const data = await readAssetBytes(slug, pair.sourcePath);
        if (!data) continue;
        entries.push({ name: pair.zipPath, data });
      } catch (error) {
        console.warn("Missing asset", pair.sourcePath, error);
      }
    }

    return entries;
  };

  const exportStaticSite = async () => {
    if (!draft) return;
    exportError = "";
    exportStatus = t("exporting");
    try {
      const slug = getProjectSlug();
      const exportProject = JSON.parse(JSON.stringify(draft)) as MenuProject;
      const assets = collectAssetPaths(draft);
      const assetPairs = assets.map((assetPath) => {
        const normalized = normalizePath(assetPath);
        const prefix = `projects/${slug}/assets/`;
        let exportPath = normalized;
        if (normalized.startsWith(prefix)) {
          exportPath = `assets/${normalized.slice(prefix.length)}`;
        } else if (normalized.includes("assets/")) {
          exportPath = `assets/${normalized.slice(normalized.lastIndexOf("assets/") + "assets/".length)}`;
        } else if (!normalized.startsWith("assets/")) {
          const fileName = normalized.split("/").filter(Boolean).pop() ?? "asset";
          exportPath = `assets/${fileName}`;
        }
        return { sourcePath: normalized, exportPath };
      });
      const entries: { name: string; data: Uint8Array }[] = [];
      const heroSources = new Set<string>();
      draft.categories.forEach((category) => {
        category.items.forEach((item) => {
          const hero = normalizePath(item.media.hero360 || "");
          if (hero) heroSources.add(hero);
        });
      });
      const sourceToExportPath = new Map<string, string>();
      const sourceToResponsive = new Map<string, ResponsiveMediaPaths>();

      for (const pair of assetPairs) {
        try {
          const data = await readAssetBytes(slug, pair.sourcePath);
          if (!data) continue;
          const mime = getMimeType(pair.exportPath).toLowerCase();
          const shouldResize = heroSources.has(pair.sourcePath) && isResponsiveImageMime(mime);
          if (shouldResize) {
            const responsive = await createResponsiveImageVariants(pair.exportPath, data, mime);
            if (responsive) {
              responsive.entries.forEach((entry) => entries.push(entry));
              sourceToExportPath.set(pair.sourcePath, responsive.paths.large);
              sourceToResponsive.set(pair.sourcePath, responsive.paths);
              continue;
            }
          }
          entries.push({ name: pair.exportPath, data });
          sourceToExportPath.set(pair.sourcePath, pair.exportPath);
        } catch (error) {
          console.warn("Missing asset", pair.sourcePath, error);
        }
      }

      exportProject.backgrounds = exportProject.backgrounds.map((bg) => {
        const normalized = normalizePath(bg.src || "");
        const mapped = sourceToExportPath.get(normalized);
        return { ...bg, src: mapped ?? bg.src };
      });

      if (exportProject.meta.fontSource) {
        const normalized = normalizePath(exportProject.meta.fontSource);
        const mapped = sourceToExportPath.get(normalized);
        if (mapped) {
          exportProject.meta.fontSource = mapped;
        }
      }

      exportProject.categories = exportProject.categories.map((category) => ({
        ...category,
        items: category.items.map((item) => {
          const hero = normalizePath(item.media.hero360 || "");
          const mappedHero = sourceToExportPath.get(hero);
          const responsive = sourceToResponsive.get(hero);
          const nextMedia = {
            ...item.media,
            hero360: mappedHero ?? item.media.hero360
          };
          if (responsive) {
            nextMedia.responsive = responsive;
          } else if ("responsive" in nextMedia) {
            delete (nextMedia as { responsive?: unknown }).responsive;
          }
          return {
            ...item,
            media: nextMedia
          };
        })
      }));

      const encoder = new TextEncoder();
      const exportVersion = String(Date.now());
      const menuData = JSON.stringify(exportProject, null, 2);
      const serveCommand = `#!/bin/bash
set -e
cd "$(dirname "$0")"
python3 -m http.server 4173 --bind 127.0.0.1
`;
      const serveBat = `@echo off
cd /d %~dp0
python -m http.server 4173 --bind 127.0.0.1
`;
      const readme = `Open this exported site with a local server (recommended).

macOS / Linux:
1. Run chmod +x serve.command
2. Run ./serve.command
3. Open http://127.0.0.1:4173

Windows:
1. Run serve.bat
2. Open http://127.0.0.1:4173
`;
      entries.push({ name: "menu.json", data: encoder.encode(menuData) });
      entries.push({ name: "styles.css", data: encoder.encode(buildExportStyles()) });
      entries.push({ name: "app.js", data: encoder.encode(buildExportScript(exportProject)) });
      entries.push({ name: "index.html", data: encoder.encode(buildExportHtml(exportVersion)) });
      entries.push({ name: "favicon.ico", data: fromBase64(FAVICON_ICO_BASE64) });
      entries.push({ name: "serve.command", data: encoder.encode(serveCommand) });
      entries.push({ name: "serve.bat", data: encoder.encode(serveBat) });
      entries.push({ name: "README.txt", data: encoder.encode(readme) });

      const blob = createZipBlob(entries);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${draft.meta.slug || "menu"}-export.zip`;
      anchor.click();
      URL.revokeObjectURL(url);
      exportStatus = t("exportReady");
    } catch (error) {
      exportStatus = "";
      exportError = error instanceof Error ? error.message : t("exportFailed");
    }
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
    if (previewMode === "device" && !editorLocked) {
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
    Object.values(jukeboxWheelSnapTimeout).forEach((timer) => {
      if (timer) {
        clearTimeout(timer);
      }
    });
    Object.values(focusRowSnapTimeout).forEach((timer) => {
      if (timer) {
        clearTimeout(timer);
      }
    });
    jukeboxWheelSnapTimeout = {};
    jukeboxTouchState = {};
    focusRowSnapTimeout = {};
    focusRowTouchState = {};
  };

  const buildResponsiveSrcSetFromMedia = (item: MenuItem) => {
    const responsive = item.media.responsive;
    if (!responsive) return undefined;
    const ordered = [
      { src: responsive.small, width: RESPONSIVE_IMAGE_WIDTHS.small },
      { src: responsive.medium, width: RESPONSIVE_IMAGE_WIDTHS.medium },
      { src: responsive.large, width: RESPONSIVE_IMAGE_WIDTHS.large }
    ].filter((entry): entry is { src: string; width: number } => Boolean(entry.src));
    if (ordered.length === 0) return undefined;
    const unique = new Map<string, number>();
    ordered.forEach((entry) => {
      if (!unique.has(entry.src)) {
        unique.set(entry.src, entry.width);
      }
    });
    return Array.from(unique.entries())
      .map(([src, width]) => `${src} ${width}w`)
      .join(", ");
  };

  const getCarouselImageSource = (item: MenuItem) =>
    item.media.responsive?.medium ||
    item.media.responsive?.large ||
    item.media.responsive?.small ||
    item.media.hero360 ||
    "";

  const getDetailImageSource = (item: MenuItem) =>
    item.media.responsive?.large ||
    item.media.responsive?.medium ||
    item.media.responsive?.small ||
    item.media.hero360 ||
    "";

  type InteractiveDetailAsset = {
    source: string;
    mime: "image/gif" | "image/webp";
  };

  const decodeMaybe = (value: string) => {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  };

  const getInteractiveAssetMime = (source?: string | null): InteractiveDetailAsset["mime"] | null => {
    if (!source) return null;
    const candidates = [decodeMaybe(source.trim()).toLowerCase()];
    try {
      const url = new URL(source, window.location.href);
      const encodedPath = url.searchParams.get("path");
      if (encodedPath) {
        candidates.push(decodeMaybe(encodedPath).toLowerCase());
      }
    } catch {
      // Ignore malformed URLs; raw candidate already included.
    }
    for (const candidate of candidates) {
      if (/\.gif(?:$|[?#&])/i.test(candidate)) return "image/gif";
      if (/\.webp(?:$|[?#&])/i.test(candidate)) return "image/webp";
    }
    return null;
  };

  const getInteractiveDetailAsset = (item: MenuItem | null): InteractiveDetailAsset | null => {
    if (!item) return null;
    const candidates = [
      item.media.hero360,
      item.media.responsive?.large,
      item.media.responsive?.medium,
      item.media.responsive?.small
    ];
    for (const candidate of candidates) {
      const source = (candidate || "").trim();
      if (!source) continue;
      const mime = getInteractiveAssetMime(source);
      if (mime) {
        return { source, mime };
      }
    }
    return null;
  };

  const supportsInteractiveMedia = () =>
    typeof window !== "undefined" && "ImageDecoder" in window;

  const getDetailRotateHint = (lang: string) => {
    const key = deviceMode === "mobile" ? "rotateHintTouch" : "rotateHintMouse";
    return getInstructionCopy(key, lang);
  };

  const getDetailRotateToggleHint = (lang: string) => getInstructionCopy("rotateToggle", lang);

  const toggleDetailRotateDirection = () => {
    detailRotateDirection = detailRotateDirection === 1 ? -1 : 1;
    if (detailRotateSource) {
      detailRotateDirectionBySource.set(detailRotateSource, detailRotateDirection);
    }
  };

  const INTERACTIVE_CENTER_SAMPLE_TARGET = 6;

  const readForegroundCenterFromBitmap = (bitmap: ImageBitmap) => {
    const maxSize = 140;
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const offscreen = document.createElement("canvas");
    offscreen.width = width;
    offscreen.height = height;
    const ctx = offscreen.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0, width, height);
    const { data } = ctx.getImageData(0, 0, width, height);
    const alphaThreshold = 16;

    const readAlphaBounds = () => {
      let minX = width;
      let minY = height;
      let maxX = -1;
      let maxY = -1;
      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const idx = (y * width + x) * 4;
          if (data[idx + 3] <= alphaThreshold) continue;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
      if (maxX < 0 || maxY < 0) return null;
      return { minX, minY, maxX, maxY };
    };

    let r = 0;
    let g = 0;
    let b = 0;
    let r2 = 0;
    let g2 = 0;
    let b2 = 0;
    let samples = 0;
    const sampleEdge = (x: number, y: number) => {
      const idx = (y * width + x) * 4;
      if (data[idx + 3] <= alphaThreshold) return;
      const rv = data[idx];
      const gv = data[idx + 1];
      const bv = data[idx + 2];
      r += rv;
      g += gv;
      b += bv;
      r2 += rv * rv;
      g2 += gv * gv;
      b2 += bv * bv;
      samples += 1;
    };
    for (let x = 0; x < width; x += 1) {
      sampleEdge(x, 0);
      if (height > 1) sampleEdge(x, height - 1);
    }
    for (let y = 1; y < height - 1; y += 1) {
      sampleEdge(0, y);
      if (width > 1) sampleEdge(width - 1, y);
    }
    if (samples === 0) {
      const bounds = readAlphaBounds();
      if (!bounds) return null;
      const centerX = (bounds.minX + bounds.maxX) / 2;
      const centerY = (bounds.minY + bounds.maxY) / 2;
      const invScale = scale > 0 ? 1 / scale : 1;
      return {
        center: { x: centerX * invScale, y: centerY * invScale },
        bounds: {
          minX: bounds.minX * invScale,
          minY: bounds.minY * invScale,
          maxX: bounds.maxX * invScale,
          maxY: bounds.maxY * invScale
        }
      };
    }
    const meanR = r / samples;
    const meanG = g / samples;
    const meanB = b / samples;
    const varR = Math.max(0, r2 / samples - meanR * meanR);
    const varG = Math.max(0, g2 / samples - meanG * meanG);
    const varB = Math.max(0, b2 / samples - meanB * meanB);
    const colorStd = Math.sqrt(varR + varG + varB);
    const threshold = Math.max(12, Math.min(60, colorStd * 2.6 + 10));
    const thresholdSq = threshold * threshold;

    const isBackground = (idx: number) => {
      if (data[idx + 3] <= alphaThreshold) return true;
      const dr = data[idx] - meanR;
      const dg = data[idx + 1] - meanG;
      const db = data[idx + 2] - meanB;
      return dr * dr + dg * dg + db * db <= thresholdSq;
    };

  const pixelTotal = width * height;
  const visited = new Uint8Array(pixelTotal);
    const queue: number[] = [];
    const pushIfBackground = (x: number, y: number) => {
      if (x < 0 || y < 0 || x >= width || y >= height) return;
      const idx = y * width + x;
      if (visited[idx]) return;
      if (!isBackground(idx * 4)) return;
      visited[idx] = 1;
      queue.push(idx);
    };

    for (let x = 0; x < width; x += 1) {
      pushIfBackground(x, 0);
      if (height > 1) pushIfBackground(x, height - 1);
    }
    for (let y = 1; y < height - 1; y += 1) {
      pushIfBackground(0, y);
      if (width > 1) pushIfBackground(width - 1, y);
    }

    while (queue.length) {
      const idx = queue.pop() ?? 0;
      const x = idx % width;
      const y = Math.floor(idx / width);
      pushIfBackground(x + 1, y);
      pushIfBackground(x - 1, y);
      pushIfBackground(x, y + 1);
      pushIfBackground(x, y - 1);
    }

    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;
    const rowCounts = new Uint32Array(height);
    const colCounts = new Uint32Array(width);
    let foregroundTotal = 0;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const idx = y * width + x;
        if (visited[idx]) continue;
        const dataIdx = idx * 4;
        if (data[dataIdx + 3] <= alphaThreshold) continue;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        rowCounts[y] += 1;
        colCounts[x] += 1;
        foregroundTotal += 1;
      }
    }
    if (maxX < 0 || maxY < 0) {
      const bounds = readAlphaBounds();
      if (!bounds) return null;
      minX = bounds.minX;
      minY = bounds.minY;
      maxX = bounds.maxX;
      maxY = bounds.maxY;
    } else if (foregroundTotal > 0) {
      const trimCount = Math.max(1, Math.round(foregroundTotal * 0.01));
      const findMinIndex = (counts: Uint32Array) => {
        let acc = 0;
        for (let i = 0; i < counts.length; i += 1) {
          acc += counts[i];
          if (acc >= trimCount) return i;
        }
        return 0;
      };
      const findMaxIndex = (counts: Uint32Array) => {
        let acc = 0;
        for (let i = counts.length - 1; i >= 0; i -= 1) {
          acc += counts[i];
          if (acc >= trimCount) return i;
        }
        return counts.length - 1;
      };
      const trimmedMinY = findMinIndex(rowCounts);
      const trimmedMaxY = findMaxIndex(rowCounts);
      const trimmedMinX = findMinIndex(colCounts);
      const trimmedMaxX = findMaxIndex(colCounts);
      const baseW = maxX - minX;
      const baseH = maxY - minY;
      const trimmedW = trimmedMaxX - trimmedMinX;
      const trimmedH = trimmedMaxY - trimmedMinY;
      if (trimmedW > baseW * 0.4 && trimmedH > baseH * 0.4) {
        minX = Math.min(Math.max(trimmedMinX, 0), width - 1);
        maxX = Math.min(Math.max(trimmedMaxX, minX), width - 1);
        minY = Math.min(Math.max(trimmedMinY, 0), height - 1);
        maxY = Math.min(Math.max(trimmedMaxY, minY), height - 1);
      }
    }
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const invScale = scale > 0 ? 1 / scale : 1;
    return {
      center: { x: centerX * invScale, y: centerY * invScale },
      bounds: {
        minX: minX * invScale,
        minY: minY * invScale,
        maxX: maxX * invScale,
        maxY: maxY * invScale
      }
    };
  };

  const readCenterOffsetFromBitmaps = (bitmaps: ImageBitmap[]) => {
    if (!bitmaps.length) return null;
    const sampleTarget = Math.min(INTERACTIVE_CENTER_SAMPLE_TARGET, bitmaps.length);
    const step = Math.max(1, Math.floor(bitmaps.length / sampleTarget));
    const centers: { x: number; y: number }[] = [];
    for (let index = 0; index < bitmaps.length && centers.length < sampleTarget; index += step) {
      const info = readForegroundCenterFromBitmap(bitmaps[index]);
      if (info) centers.push(info.center);
    }
    if (!centers.length) return null;
    const xs = centers.map((center) => center.x).sort((a, b) => a - b);
    const ys = centers.map((center) => center.y).sort((a, b) => a - b);
    const medianX = xs[Math.floor(xs.length / 2)];
    const medianY = ys[Math.floor(ys.length / 2)];
    const width = bitmaps[0].width;
    const height = bitmaps[0].height;
    return {
      x: Math.round(width / 2 - medianX),
      y: Math.round(height / 2 - medianY)
    };
  };

  const readContentBoundsFromBitmaps = (bitmaps: ImageBitmap[]) => {
    if (!bitmaps.length) return null;
    const sampleTarget = Math.min(INTERACTIVE_CENTER_SAMPLE_TARGET, bitmaps.length);
    const step = Math.max(1, Math.floor(bitmaps.length / sampleTarget));
    const boundsList: { minX: number; minY: number; maxX: number; maxY: number }[] = [];
    for (let index = 0; index < bitmaps.length && boundsList.length < sampleTarget; index += step) {
      const info = readForegroundCenterFromBitmap(bitmaps[index]);
      if (info) boundsList.push(info.bounds);
    }
    if (!boundsList.length) return null;
    const median = (values: number[]) => {
      const sorted = [...values].sort((a, b) => a - b);
      return sorted[Math.floor(sorted.length / 2)];
    };
    const minX = median(boundsList.map((b) => b.minX));
    const minY = median(boundsList.map((b) => b.minY));
    const maxX = median(boundsList.map((b) => b.maxX));
    const maxY = median(boundsList.map((b) => b.maxY));
    return { minX, minY, maxX, maxY };
  };

  const getInteractiveAssetBytes = async (source: string) => {
    const cached = interactiveDetailBytesCache.get(source);
    if (cached) return cached;
    const pending = interactiveDetailBytesPending.get(source);
    if (pending) return pending;
    const task = (async () => {
      try {
        const response = await fetch(source, { cache: "force-cache" });
        if (!response.ok) return null;
        const bytes = await response.arrayBuffer();
        interactiveDetailBytesCache.set(source, bytes);
        return bytes;
      } catch {
        return null;
      } finally {
        interactiveDetailBytesPending.delete(source);
      }
    })();
    interactiveDetailBytesPending.set(source, task);
    return task;
  };

  const prewarmInteractiveDetailAssets = async (data: MenuProject) => {
    if (!supportsInteractiveMedia()) return;
    const sources = new Set<string>();
    data.categories.forEach((category) => {
      category.items.forEach((item) => {
        const asset = getInteractiveDetailAsset(item);
        if (asset) {
          sources.add(asset.source);
        }
      });
    });
    await Promise.allSettled(
      Array.from(sources)
        .slice(0, 12)
        .map((source) => getInteractiveAssetBytes(source))
    );
  };

  const teardownInteractiveDetailMedia = () => {
    modalMediaToken += 1;
    if (modalMediaCleanup) {
      modalMediaCleanup();
      modalMediaCleanup = null;
    }
  };

  const setupInteractiveDetailMedia = async (asset: InteractiveDetailAsset | null) => {
    teardownInteractiveDetailMedia();
    if (!asset || !modalMediaHost || !modalMediaImage) return;
    const Decoder = (window as Window & { ImageDecoder?: new (init: unknown) => any }).ImageDecoder;
    if (!Decoder) return;

    const token = ++modalMediaToken;
    const host = modalMediaHost;
    const image = modalMediaImage;
    const debugEnabled = DEBUG_INTERACTIVE_CENTER;
    let debugEl: HTMLDivElement | null = null;
    let debugBounds: { minX: number; minY: number; maxX: number; maxY: number } | null = null;
    let debugVisibleRect: { x: number; y: number; width: number; height: number } | null = null;
    let debugFrameSize: { width: number; height: number } | null = null;
    const abortController = new AbortController();
    let disposed = false;
    let decoder: any = null;
    const bitmaps: ImageBitmap[] = [];
    let canvas: HTMLCanvasElement | null = null;
    let ctx: CanvasRenderingContext2D | null = null;
    let canvasDisplayWidth = 0;
    let canvasDisplayHeight = 0;
    let resizeObserver: ResizeObserver | null = null;
    let pointerId: number | null = null;
    let lastX = 0;
    let frameCursor = 0;
    let interactiveReady = false;
    let imageHidden = false;
    const allowAutoCenter = !INTERACTIVE_KEEP_ORIGINAL_PLACEMENT;
    let centerOffset = allowAutoCenter
      ? interactiveDetailCenterOffsetCache.get(asset.source) ?? { x: 0, y: 0 }
      : { x: 0, y: 0 };
    let contentBounds: { minX: number; minY: number; maxX: number; maxY: number } | null = null;
    let renderSpec: {
      sx: number;
      sy: number;
      sw: number;
      sh: number;
      dx: number;
      dy: number;
      dw: number;
      dh: number;
    } | null = null;

    host.classList.add("is-loading-interactive");
    if (debugEnabled) {
      debugEl = document.createElement("div");
      debugEl.className = "dish-modal__media-debug";
      host.appendChild(debugEl);
    }
    const hideImage = () => {
      if (imageHidden) return;
      imageHidden = true;
      image.classList.add("is-hidden");
    };
    const updateDebugOverlay = () => {
      if (!debugEnabled || !debugEl) return;
      const frameLabel = canvas ? `${canvas.width}x${canvas.height}` : "-";
      const offsetLabel = `${Math.round(centerOffset.x)}, ${Math.round(centerOffset.y)}`;
      const boundsLabel = debugBounds
        ? `${Math.round(debugBounds.minX)},${Math.round(debugBounds.minY)} ${Math.round(
            debugBounds.maxX - debugBounds.minX
          )}x${Math.round(debugBounds.maxY - debugBounds.minY)}`
        : "-";
      const visibleLabel = debugVisibleRect
        ? `${Math.round(debugVisibleRect.x)},${Math.round(debugVisibleRect.y)} ${Math.round(
            debugVisibleRect.width
          )}x${Math.round(debugVisibleRect.height)}`
        : "-";
      const frameSizeLabel = debugFrameSize
        ? `${Math.round(debugFrameSize.width)}x${Math.round(debugFrameSize.height)}`
        : "-";
      debugEl.textContent = `offset: ${offsetLabel}\nframe: ${frameLabel}\nsource: ${frameSizeLabel}\nvisible: ${visibleLabel}\nbounds: ${boundsLabel}`;
    };

    const cleanup = () => {
      if (disposed) return;
      disposed = true;
      abortController.abort();
      if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
      }
      if (canvas) {
        canvas.remove();
      }
      if (debugEl) {
        debugEl.remove();
        debugEl = null;
      }
      if (imageHidden) {
        image.classList.remove("is-hidden");
      }
      host.classList.remove("is-loading-interactive");
      host.classList.remove("is-interactive");
      bitmaps.forEach((bitmap) => bitmap.close());
      bitmaps.length = 0;
      try {
        decoder?.close?.();
      } catch {
        // Ignore decoder close errors.
      }
    };

    modalMediaCleanup = cleanup;

    try {
      const bytes = await getInteractiveAssetBytes(asset.source);
      if (!bytes) {
        cleanup();
        return;
      }
      if (disposed || token !== modalMediaToken) {
        cleanup();
        return;
      }

      decoder = new Decoder({ data: bytes, type: asset.mime });
      await decoder.tracks.ready;
      const frameCount = Number(decoder.tracks?.selectedTrack?.frameCount ?? 0);
      if (frameCount < 2) {
        cleanup();
        return;
      }
      const frameStep = Math.max(1, Math.ceil(frameCount / INTERACTIVE_GIF_MAX_FRAMES));
      const decodeIndices: number[] = [];
      for (let frameIndex = 0; frameIndex < frameCount; frameIndex += frameStep) {
        decodeIndices.push(frameIndex);
      }
      if (decodeIndices[decodeIndices.length - 1] !== frameCount - 1) {
        decodeIndices.push(frameCount - 1);
      }

    const pixelsPerFrame = window.matchMedia("(pointer: coarse)").matches ? 7 : 4;
    const computeRenderSpec = () => {
      if (!canvas || !contentBounds) return null;
      const dpr = window.devicePixelRatio || 1;
      const width = canvasDisplayWidth || canvas.width / dpr;
      const height = canvasDisplayHeight || canvas.height / dpr;
      const boundsW = Math.max(1, contentBounds.maxX - contentBounds.minX);
      const boundsH = Math.max(1, contentBounds.maxY - contentBounds.minY);
      const padding = Math.max(boundsW, boundsH) * 0.08;
      let sx = contentBounds.minX - padding;
      let sy = contentBounds.minY - padding;
      let sw = boundsW + padding * 2;
      let sh = boundsH + padding * 2;

      sx = Math.max(0, Math.min(sx, width - 1));
      sy = Math.max(0, Math.min(sy, height - 1));
      sw = Math.max(1, Math.min(sw, width));
      sh = Math.max(1, Math.min(sh, height));
      if (sx + sw > width) {
        sx = Math.max(0, width - sw);
      }
      if (sy + sh > height) {
        sy = Math.max(0, height - sh);
      }

      const scale = Math.min(width / sw, height / sh);
      const dw = sw * scale;
      const dh = sh * scale;
      const dx = (width - dw) / 2;
      const dy = (height - dh) / 2;
      return { sx, sy, sw, sh, dx, dy, dw, dh };
    };
    const render = () => {
      if (!canvas || !ctx || disposed) return;
      const dpr = window.devicePixelRatio || 1;
      const displayWidth = canvasDisplayWidth || canvas.width / dpr;
      const displayHeight = canvasDisplayHeight || canvas.height / dpr;
      const frameCountSafe = Math.max(1, bitmaps.length);
      const normalized =
        ((Math.round(frameCursor) % frameCountSafe) + frameCountSafe) % frameCountSafe;
      const frame = bitmaps[normalized];
      if (!frame) return;
      ctx.clearRect(0, 0, displayWidth, displayHeight);
      let containScale = 1;
      let containDx = 0;
      let containDy = 0;
      if (renderSpec) {
        ctx.drawImage(
          frame,
          renderSpec.sx,
          renderSpec.sy,
          renderSpec.sw,
          renderSpec.sh,
          renderSpec.dx,
          renderSpec.dy,
          renderSpec.dw,
          renderSpec.dh
        );
      } else {
        containScale = Math.min(displayWidth / frame.width, displayHeight / frame.height);
        const dw = frame.width * containScale;
        const dh = frame.height * containScale;
        containDx = (displayWidth - dw) / 2;
        containDy = (displayHeight - dh) / 2;
        ctx.drawImage(frame, containDx, containDy, dw, dh);
      }
      if (debugEnabled && debugBounds) {
        let rectX = debugBounds.minX + centerOffset.x;
        let rectY = debugBounds.minY + centerOffset.y;
        let rectW = debugBounds.maxX - debugBounds.minX;
        let rectH = debugBounds.maxY - debugBounds.minY;
        if (renderSpec) {
          const scaleX = renderSpec.dw / renderSpec.sw;
          const scaleY = renderSpec.dh / renderSpec.sh;
          rectX = renderSpec.dx + (debugBounds.minX - renderSpec.sx) * scaleX;
          rectY = renderSpec.dy + (debugBounds.minY - renderSpec.sy) * scaleY;
          rectW = (debugBounds.maxX - debugBounds.minX) * scaleX;
          rectH = (debugBounds.maxY - debugBounds.minY) * scaleY;
        } else {
          rectX = containDx + debugBounds.minX * containScale;
          rectY = containDy + debugBounds.minY * containScale;
          rectW = (debugBounds.maxX - debugBounds.minX) * containScale;
          rectH = (debugBounds.maxY - debugBounds.minY) * containScale;
        }
        const centerX = displayWidth / 2;
        const centerY = displayHeight / 2;
        const boundsCenterX = rectX + rectW / 2;
        const boundsCenterY = rectY + rectH / 2;
        ctx.save();
        ctx.strokeStyle = "rgba(248, 250, 252, 0.7)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(centerX - 12, centerY);
        ctx.lineTo(centerX + 12, centerY);
        ctx.moveTo(centerX, centerY - 12);
        ctx.lineTo(centerX, centerY + 12);
        ctx.stroke();
        ctx.strokeStyle = "rgba(251, 191, 36, 0.85)";
        ctx.lineWidth = 2;
        ctx.strokeRect(rectX, rectY, rectW, rectH);
        ctx.fillStyle = "rgba(34, 197, 94, 0.9)";
        ctx.beginPath();
        ctx.arc(boundsCenterX, boundsCenterY, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      updateDebugOverlay();
    };

      const ensureCanvas = (firstBitmap: ImageBitmap) => {
        if (canvas || disposed) return;
        if (allowAutoCenter) {
          const computedOffset = readCenterOffsetFromBitmaps(bitmaps);
          if (computedOffset) {
            centerOffset = computedOffset;
            interactiveDetailCenterOffsetCache.set(asset.source, centerOffset);
          }
        }
        canvas = document.createElement("canvas");
        canvas.className = "dish-modal__media-canvas";
        canvas.width = firstBitmap.width;
        canvas.height = firstBitmap.height;
        ctx = canvas.getContext("2d");
        if (!ctx) {
          cleanup();
          return;
        }
        if (allowAutoCenter && contentBounds) {
          renderSpec = computeRenderSpec();
        }
        const onPointerDown = (event: PointerEvent) => {
          pointerId = event.pointerId;
          lastX = event.clientX;
          canvas?.setPointerCapture(pointerId);
          canvas?.classList.add("is-dragging");
          event.preventDefault();
        };
        const onPointerMove = (event: PointerEvent) => {
          if (pointerId !== event.pointerId) return;
          const deltaX = event.clientX - lastX;
          lastX = event.clientX;
          frameCursor += (deltaX / pixelsPerFrame) * detailRotateDirection;
          render();
          event.preventDefault();
        };
        const onPointerRelease = (event: PointerEvent) => {
          if (pointerId !== event.pointerId) return;
          try {
            canvas?.releasePointerCapture(pointerId);
          } catch {
            // Ignore pointer capture release errors.
          }
          pointerId = null;
          canvas?.classList.remove("is-dragging");
        };

        canvas.addEventListener("pointerdown", onPointerDown);
        canvas.addEventListener("pointermove", onPointerMove);
        canvas.addEventListener("pointerup", onPointerRelease);
        canvas.addEventListener("pointercancel", onPointerRelease);
        canvas.addEventListener("contextmenu", (event) => event.preventDefault());
        canvas.addEventListener("dragstart", (event) => event.preventDefault());

        host.appendChild(canvas);
        const syncCanvasToImage = () => {
          if (!canvas || !ctx) return;
          const imageRect = image.getBoundingClientRect();
          const hostRect = host.getBoundingClientRect();
          const width = imageRect.width;
          const height = imageRect.height;
          if (!width || !height) {
            requestAnimationFrame(syncCanvasToImage);
            return;
          }
          canvasDisplayWidth = width;
          canvasDisplayHeight = height;
          canvas.style.position = "absolute";
          canvas.style.left = imageRect.left - hostRect.left + "px";
          canvas.style.top = imageRect.top - hostRect.top + "px";
          canvas.style.width = width + "px";
          canvas.style.height = height + "px";
          const dpr = window.devicePixelRatio || 1;
          canvas.width = Math.max(1, Math.round(width * dpr));
          canvas.height = Math.max(1, Math.round(height * dpr));
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };
        syncCanvasToImage();
        requestAnimationFrame(syncCanvasToImage);
        if (!resizeObserver && "ResizeObserver" in window) {
          resizeObserver = new ResizeObserver(() => {
            syncCanvasToImage();
            render();
          });
          resizeObserver.observe(host);
        }
        hideImage();
        host.classList.remove("is-loading-interactive");
      };

      let decodedCount = 0;
    const normalizeDecodedFrame = async (frame: VideoFrame) => {
      if (debugEnabled && !debugFrameSize) {
        debugFrameSize = {
          width: frame.codedWidth || frame.displayWidth || frame.visibleRect?.width || 0,
          height: frame.codedHeight || frame.displayHeight || frame.visibleRect?.height || 0
        };
      }
      const visibleRect = frame.visibleRect;
      if (debugEnabled && !debugVisibleRect && visibleRect) {
        debugVisibleRect = {
          x: visibleRect.x,
          y: visibleRect.y,
          width: visibleRect.width,
          height: visibleRect.height
        };
      }
      const fullWidth = frame.codedWidth || frame.displayWidth || visibleRect?.width || 0;
      const fullHeight = frame.codedHeight || frame.displayHeight || visibleRect?.height || 0;
        if (!visibleRect || !fullWidth || !fullHeight) {
          return createImageBitmap(frame);
        }
        const sameBounds =
          Math.round(visibleRect.x) === 0 &&
          Math.round(visibleRect.y) === 0 &&
          Math.round(visibleRect.width) === Math.round(fullWidth) &&
          Math.round(visibleRect.height) === Math.round(fullHeight);
        if (sameBounds) {
          return createImageBitmap(frame);
        }
        const offscreen = document.createElement("canvas");
        offscreen.width = fullWidth;
        offscreen.height = fullHeight;
        const offCtx = offscreen.getContext("2d");
        if (!offCtx) {
          return createImageBitmap(frame);
        }
        offCtx.clearRect(0, 0, fullWidth, fullHeight);
        offCtx.drawImage(
          frame,
          0,
          0,
          visibleRect.width,
          visibleRect.height,
          visibleRect.x,
          visibleRect.y,
          visibleRect.width,
          visibleRect.height
        );
        return createImageBitmap(offscreen);
      };

      for (const frameIndex of decodeIndices) {
        const decoded = await decoder.decode({ frameIndex, completeFramesOnly: true });
        const frame = decoded?.image;
        if (!frame) continue;
      const bitmap = await normalizeDecodedFrame(frame);
      frame.close?.();
      if (disposed || token !== modalMediaToken) {
        bitmap.close();
        cleanup();
        return;
      }
      bitmaps.push(bitmap);
      if (debugEnabled && !debugBounds) {
        const info = readForegroundCenterFromBitmap(bitmap);
        if (info) debugBounds = info.bounds;
      }
        if (
          allowAutoCenter &&
          (bitmaps.length === 1 || bitmaps.length === INTERACTIVE_CENTER_SAMPLE_TARGET)
        ) {
          const computedOffset = readCenterOffsetFromBitmaps(bitmaps);
          if (computedOffset) {
            const delta =
              Math.abs(computedOffset.x - centerOffset.x) +
              Math.abs(computedOffset.y - centerOffset.y);
            if (delta > 1) {
              centerOffset = computedOffset;
              interactiveDetailCenterOffsetCache.set(asset.source, centerOffset);
            }
          }
          const computedBounds = readContentBoundsFromBitmaps(bitmaps);
          if (computedBounds) {
            contentBounds = computedBounds;
            renderSpec = computeRenderSpec();
            if (debugEnabled) {
              debugBounds = computedBounds;
            }
          }
        }
        if (!canvas) {
          ensureCanvas(bitmap);
        }
        render();
        if (!interactiveReady && bitmaps.length >= 2) {
          interactiveReady = true;
          host.classList.add("is-interactive");
        }
        decodedCount += 1;
        if (decodedCount % 6 === 0) {
          await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
        }
      }

      if (!canvas) {
        cleanup();
        return;
      }
      if (allowAutoCenter) {
        const computedOffset = readCenterOffsetFromBitmaps(bitmaps);
        if (computedOffset) {
          centerOffset = computedOffset;
          interactiveDetailCenterOffsetCache.set(asset.source, centerOffset);
          render();
        }
        const computedBounds = readContentBoundsFromBitmaps(bitmaps);
        if (computedBounds) {
          contentBounds = computedBounds;
          renderSpec = computeRenderSpec();
          if (debugEnabled) {
            debugBounds = computedBounds;
          }
          render();
        }
      }
      if (!interactiveReady && bitmaps.length >= 2) {
        interactiveReady = true;
        host.classList.add("is-interactive");
      }
    } catch (error) {
      const isAbort =
        error instanceof DOMException && (error.name === "AbortError" || error.name === "NotAllowedError");
      if (!isAbort) {
        console.warn("Interactive GIF decode failed", error);
      }
      cleanup();
    }
  };

  const preloadImageAsset = (src: string) =>
    new Promise<void>((resolve) => {
      if (!src) {
        resolve();
        return;
      }
      const image = new Image();
      const done = () => resolve();
      image.onload = done;
      image.onerror = done;
      image.src = src;
      if (image.complete) {
        resolve();
      }
    });

  const collectPreviewStartupSources = (data: MenuProject) => {
    const urls = new Set<string>();
    data.backgrounds.forEach((bg) => {
      const src = (bg.src || "").trim();
      if (src) {
        urls.add(src);
      }
    });
    data.categories.forEach((category) => {
      category.items.forEach((item) => {
        const src = getCarouselImageSource(item).trim();
        if (src) {
          urls.add(src);
        }
      });
    });
    return Array.from(urls);
  };

  const preloadPreviewStartupAssets = async (sources: string[]) => {
    const token = ++previewStartupToken;
    if (sources.length === 0) {
      previewStartupProgress = 100;
      previewStartupLoading = false;
      return;
    }
    previewStartupLoading = true;
    previewStartupProgress = 0;
    let loaded = 0;
    await Promise.all(
      sources.map((src) =>
        preloadImageAsset(src).finally(() => {
          if (token !== previewStartupToken) return;
          loaded += 1;
          previewStartupProgress = Math.round((loaded / sources.length) * 100);
        })
      )
    );
    if (token !== previewStartupToken) return;
    previewStartupProgress = 100;
    previewStartupLoading = false;
  };

  $: if (activeProject && typeof window !== "undefined") {
    const sources = collectPreviewStartupSources(activeProject);
    const signature = sources.join("|");
    if (signature !== previewStartupSignature) {
      previewStartupSignature = signature;
      void preloadPreviewStartupAssets(sources);
    }
  } else {
    previewStartupSignature = "";
    previewStartupProgress = 100;
    previewStartupLoading = false;
  }

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

  const applyLoadedProject = async (data: MenuProject, sourceName = "") => {
    project = data;
    draft = cloneProject(data);
    wizardDemoPreview = false;
    wizardShowcaseProject = null;
    activeSlug = data.meta.slug || "importado";
    lastSaveName = sourceName || `${activeSlug}.zip`;
    locale = data.meta.defaultLocale || "es";
    editPanel = "identity";
    initCarouselIndices(data);
    const existing = projects.find((item) => item.slug === activeSlug);
    const summary = {
      slug: activeSlug,
      name: data.meta.name,
      template: data.meta.template,
      cover: data.backgrounds?.[0]?.src
    };
    if (existing) {
      existing.name = summary.name;
      existing.template = summary.template;
      existing.cover = summary.cover;
      projects = [...projects];
    } else {
      projects = [...projects, summary];
    }
    openError = "";
    showLanding = false;
  };

  const createNewProject = async (options: { forWizard?: boolean } = {}) => {
    const empty = createEmptyProject();
    empty.meta.name = uiLang === "en" ? "New project" : "Nuevo proyecto";
    empty.meta.slug = "new-project";
    if (!empty.meta.locales.includes(uiLang)) {
      empty.meta.locales = [uiLang, ...empty.meta.locales];
    }
    empty.meta.defaultLocale = uiLang;
    project = empty;
    draft = cloneProject(empty);
    activeSlug = empty.meta.slug;
    locale = uiLang;
    editLang = uiLang;
    editPanel = "identity";
    wizardLang = uiLang;
    wizardCategoryId = "";
    wizardItemId = "";
    wizardDemoPreview = false;
    wizardShowcaseProject = null;
    lastSaveName = "";
    needsAssets = false;
    openError = "";
    exportStatus = "";
    exportError = "";
    wizardStep = 0;
    if (options.forWizard) {
      draft.backgrounds = [
        {
          id: `bg-${Date.now()}`,
          label: `${t("backgroundLabel")} 1`,
          src: "",
          type: "image"
        }
      ];
      await applyTemplate(empty.meta.template || "focus-rows", { source: "wizard" });
    } else {
      initCarouselIndices(empty);
    }
    if (assetMode === "bridge") {
      await refreshBridgeEntries();
    }
  };

  const startCreateProject = async () => {
    await createNewProject();
    setEditorTab("info");
    editorOpen = true;
    showLanding = false;
  };

  const startWizard = async () => {
    await createNewProject({ forWizard: true });
    setEditorTab("wizard");
    editorOpen = true;
    showLanding = false;
  };

  const startOpenProject = () => {
    setEditorTab("info");
    editorOpen = true;
    showLanding = false;
    openProjectDialog();
  };

  const openProjectDialog = () => {
    projectFileInput?.click();
  };

  const handleProjectFile = async (event: Event) => {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      openError = "";
      if (file.name.toLowerCase().endsWith(".zip")) {
        const buffer = await file.arrayBuffer();
        let entries: { name: string; data: Uint8Array }[] = [];
        try {
          entries = readZip(buffer);
        } catch (error) {
          const message = error instanceof Error ? error.message : "";
          openError = message.includes("compression") ? t("errZipCompression") : message;
          return;
        }
        const menuEntry = entries.find((entry) => entry.name.endsWith("menu.json"));
        if (!menuEntry) {
          openError = t("errZipMissing");
          return;
        }
        const menuText = new TextDecoder().decode(menuEntry.data);
        const data = normalizeProject(JSON.parse(menuText) as MenuProject);
        const prefix = menuEntry.name.replace(/menu\.json$/i, "");
        const folder = prefix.replace(/\/$/, "");
        const folderName = folder.split("/").filter(Boolean).pop() ?? "";
        const slug =
          slugifyName(data.meta.slug || folderName || data.meta.name || "menu") || "menu";
        data.meta.slug = slug;
        applyImportedPaths(data, slug);
        if (assetMode === "bridge") {
          const assetsPrefix = prefix ? `${prefix}assets/` : "assets/";
          const assetEntries = entries.filter((entry) => entry.name.startsWith(assetsPrefix));
          for (const entry of assetEntries) {
            const relative = entry.name.slice(assetsPrefix.length);
            if (!relative) continue;
            const parts = relative.split("/").filter(Boolean);
            const name = parts.pop() ?? "";
            const targetPath = parts.join("/");
            const mime = getMimeType(name);
            const dataUrl = `data:${mime};base64,${toBase64(entry.data)}`;
            await bridgeRequest(
              "upload",
              { path: targetPath, name, data: dataUrl },
              slug
            );
          }
          needsAssets = false;
        } else {
          needsAssets = true;
          openError = t("errZipNoBridge");
        }
        await applyLoadedProject(data, file.name);
        if (assetMode === "bridge") {
          await refreshBridgeEntries();
        }
      } else {
        const text = await file.text();
        const data = normalizeProject(JSON.parse(text) as MenuProject);
        const slug =
          slugifyName(data.meta.slug || data.meta.name || "importado") || "importado";
        data.meta.slug = slug;
        applyImportedPaths(data, slug);
        await applyLoadedProject(data, file.name);
        if (assetMode === "bridge") {
          needsAssets = true;
          editorTab = "assets";
          await tick();
          assetUploadInput?.click();
        }
      }
    } catch (error) {
      openError = error instanceof Error ? error.message : t("errOpenProject");
    } finally {
      input.value = "";
    }
  };

  const getClosestSectionIndex = (container: HTMLElement) => {
    const sections = Array.from(container.querySelectorAll<HTMLElement>(".menu-section"));
    if (sections.length === 0) return -1;
    const centerY = container.scrollTop + container.clientHeight / 2;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;
    sections.forEach((section, index) => {
      const sectionCenter = section.offsetTop + section.offsetHeight / 2;
      const distance = Math.abs(sectionCenter - centerY);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });
    return closestIndex;
  };

  const centerSection = (container: HTMLElement, index: number, behavior: ScrollBehavior) => {
    const sections = Array.from(container.querySelectorAll<HTMLElement>(".menu-section"));
    const target = sections[index];
    if (!target || container.clientHeight === 0) return;
    const targetTop = target.offsetTop + target.offsetHeight / 2 - container.clientHeight / 2;
    container.scrollTo({ top: targetTop, behavior });
  };

  const applySectionFocus = (container: HTMLElement) => {
    const sections = Array.from(container.querySelectorAll<HTMLElement>(".menu-section"));
    if (sections.length === 0) return;
    const centerY = container.scrollTop + container.clientHeight / 2;
    const maxDistance = Math.max(container.clientHeight * 0.6, 1);
    const closestIndex = getClosestSectionIndex(container);

    sections.forEach((section, index) => {
      const sectionCenter = section.offsetTop + section.offsetHeight / 2;
      const distance = Math.abs(sectionCenter - centerY);
      const ratio = Math.min(1, distance / maxDistance);
      const focus = 1 - ratio * 0.14;
      section.style.setProperty("--section-focus", focus.toFixed(3));
      section.classList.toggle("is-centered", index === closestIndex);
    });
  };

  const snapSectionToCenter = (container: HTMLElement) => {
    if (container.scrollHeight <= container.clientHeight + 4) {
      applySectionFocus(container);
      return;
    }
    const closestIndex = getClosestSectionIndex(container);
    if (closestIndex < 0) return;
    centerSection(container, closestIndex, "smooth");
    applySectionFocus(container);
  };

  const handleMenuScroll = (event: Event) => {
    const container = event.currentTarget as HTMLElement;
    if (isJukeboxTemplate) {
      if (container.scrollWidth <= container.clientWidth + 4) return;
      if (sectionSnapTimeout) {
        clearTimeout(sectionSnapTimeout);
      }
      sectionSnapTimeout = setTimeout(() => {
        const closestIndex = getClosestHorizontalSectionIndex(container);
        if (closestIndex >= 0) {
          centerSectionHorizontally(container, closestIndex, "smooth");
        }
      }, 170);
      return;
    }
    if (sectionFocusRaf) {
      cancelAnimationFrame(sectionFocusRaf);
    }
    sectionFocusRaf = requestAnimationFrame(() => {
      applySectionFocus(container);
    });
    if (sectionSnapTimeout) {
      clearTimeout(sectionSnapTimeout);
    }
    sectionSnapTimeout = setTimeout(() => {
      snapSectionToCenter(container);
    }, 180);
  };

  const syncCarousels = async () => {
    await tick();
    const menuScroll = document.querySelector<HTMLElement>(".menu-scroll");
    if (menuScroll) {
      applySectionFocus(menuScroll);
    }
    if (isJukeboxTemplate || !activeProject) {
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

  const getClosestHorizontalSectionIndex = (container: HTMLElement) => {
    const sections = Array.from(container.querySelectorAll<HTMLElement>(".menu-section"));
    if (sections.length === 0) return -1;
    const centerX = container.scrollLeft + container.clientWidth / 2;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;
    sections.forEach((section, index) => {
      const sectionCenter = section.offsetLeft + section.offsetWidth / 2;
      const distance = Math.abs(sectionCenter - centerX);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });
    return closestIndex;
  };

  const centerSectionHorizontally = (
    container: HTMLElement,
    index: number,
    behavior: ScrollBehavior
  ) => {
    const sections = Array.from(container.querySelectorAll<HTMLElement>(".menu-section"));
    const target = sections[index];
    if (!target || container.clientWidth === 0) return;
    const targetLeft = target.offsetLeft + target.offsetWidth / 2 - container.clientWidth / 2;
    container.scrollTo({ left: targetLeft, behavior });
  };

  const shiftSection = (direction: number) => {
    const container = document.querySelector<HTMLElement>(".menu-preview .menu-scroll");
    if (!container) return;
    const sections = Array.from(container.querySelectorAll<HTMLElement>(".menu-section"));
    if (sections.length <= 1) return;
    const current = getClosestHorizontalSectionIndex(container);
    if (current < 0) return;
    const next = (current + direction + sections.length) % sections.length;
    centerSectionHorizontally(container, next, "smooth");
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

  const pickRootFolder = async () => {
    try {
      const picker = (window as Window & { showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle> })
        .showDirectoryPicker;
      if (!picker) {
        if (bridgeAvailable) {
          assetMode = "bridge";
          fsError = "";
          await refreshBridgeEntries();
          return;
        }
        fsError = t("errNoFolder");
        return;
      }
      rootHandle = await picker();
      fsError = "";
      updateAssetMode();
      await refreshRootEntries();
    } catch (error) {
      fsError = error instanceof Error ? error.message : t("errOpenFolder");
    }
  };

  const refreshRootEntries = async () => {
    if (!rootHandle) return;
    const entries: {
      id: string;
      name: string;
      path: string;
      kind: "file" | "directory";
      handle: FileSystemHandle | null;
      parent: FileSystemDirectoryHandle | null;
      source: "filesystem" | "bridge";
    }[] = [];
    const walk = async (dir: FileSystemDirectoryHandle, prefix = "") => {
      for await (const [name, handle] of dir.entries()) {
        const path = `${prefix}${name}`;
        entries.push({
          id: path,
          name,
          path,
          kind: handle.kind,
          handle,
          parent: dir,
          source: "filesystem"
        });
        if (handle.kind === "directory") {
          await walk(handle as FileSystemDirectoryHandle, `${path}/`);
        }
      }
    };
    await walk(rootHandle);
    entries.sort((a, b) => {
      if (a.kind !== b.kind) {
        return a.kind === "directory" ? -1 : 1;
      }
      return a.path.localeCompare(b.path);
    });
    fsEntries = entries;
    rootFiles = entries.filter((entry) => entry.kind === "file").map((entry) => entry.path);
  };

  const getProjectSlug = () => draft?.meta.slug || activeSlug || "nuevo-proyecto";

  const ensureAssetProjectWritable = () => {
    if (!assetProjectReadOnly) return true;
    fsError = t("assetsReadOnly");
    return false;
  };

  const updateAssetMode = () => {
    if (rootHandle) {
      assetMode = "filesystem";
    } else if (bridgeAvailable) {
      assetMode = "bridge";
      fsError = "";
    } else {
      assetMode = "none";
    }
  };

  const refreshBridgeEntries = async () => {
    if (!bridgeAvailable) return;
    const slug = getProjectSlug();
    bridgeProjectSlug = slug;
    try {
      const response = await fetch(`/api/assets/list?project=${encodeURIComponent(slug)}`);
      if (!response.ok) {
        fsError = t("errOpenFolder");
        return;
      }
      const data = (await response.json()) as {
        entries?: { path: string; kind: "file" | "directory" }[];
      };
      const entries = (data.entries ?? []).map((entry) => {
        const name = entry.path.split("/").filter(Boolean).pop() ?? entry.path;
        return {
          id: entry.path,
          name,
          path: entry.path,
          kind: entry.kind,
          handle: null,
          parent: null,
          source: "bridge" as const
        };
      });
      fsEntries = entries;
      const prefix = `/projects/${slug}/assets/`;
      rootFiles = entries
        .filter((entry) => entry.kind === "file")
        .map((entry) => `${prefix}${entry.path}`);
      fsError = "";
    } catch (error) {
      fsError = error instanceof Error ? error.message : t("errOpenFolder");
    }
  };

  const bridgeRequest = async (
    endpoint: string,
    payload?: Record<string, unknown>,
    overrideSlug?: string
  ) => {
    const slug = overrideSlug ?? getProjectSlug();
    const response = await fetch(`/api/assets/${endpoint}?project=${encodeURIComponent(slug)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload ? JSON.stringify(payload) : undefined
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || "Bridge error");
    }
  };

  const normalizePath = (value: string) => value.replace(/^\/+/, "").trim();

  const resolveBridgeAssetLookup = (sourcePath: string, fallbackSlug: string) => {
    const normalized = normalizePath(sourcePath);
    const match = normalized.match(/^projects\/([^/]+)\/assets\/(.+)$/);
    if (match) {
      return { slug: match[1], path: match[2] };
    }
    if (normalized.includes("assets/")) {
      return {
        slug: fallbackSlug,
        path: normalized.slice(normalized.lastIndexOf("assets/") + "assets/".length)
      };
    }
    return { slug: fallbackSlug, path: normalized };
  };

  const toBase64 = (data: Uint8Array) => {
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.subarray(i, i + chunkSize);
      binary += String.fromCharCode(...chunk);
    }
    return btoa(binary);
  };

  const fromBase64 = (value: string) => {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  };

  const getMimeType = (name: string) => {
    const ext = name.split(".").pop()?.toLowerCase();
    if (!ext) return "application/octet-stream";
    if (["png", "gif", "webp", "jpg", "jpeg", "svg"].includes(ext)) {
      return `image/${ext === "jpg" ? "jpeg" : ext}`;
    }
    if (["mp4", "webm"].includes(ext)) {
      return `video/${ext}`;
    }
    return "application/octet-stream";
  };

  const isResponsiveImageMime = (mime: string) =>
    ["image/jpeg", "image/png", "image/webp"].includes(mime.toLowerCase());

  const withVariantSuffix = (path: string, suffix: string) => {
    const slash = path.lastIndexOf("/");
    const dot = path.lastIndexOf(".");
    if (dot <= slash) return `${path}-${suffix}`;
    return `${path.slice(0, dot)}-${suffix}${path.slice(dot)}`;
  };

  const createResponsiveImageVariants = async (
    basePath: string,
    sourceData: Uint8Array,
    mime: string
  ): Promise<{ paths: ResponsiveMediaPaths; entries: { name: string; data: Uint8Array }[] } | null> => {
    let bitmap: ImageBitmap;
    try {
      bitmap = await createImageBitmap(new Blob([sourceData], { type: mime }));
    } catch {
      return null;
    }
    const longestEdge = Math.max(bitmap.width, bitmap.height);
    const specs = [
      { key: "large", suffix: "lg", maxEdge: RESPONSIVE_IMAGE_WIDTHS.large },
      { key: "medium", suffix: "md", maxEdge: RESPONSIVE_IMAGE_WIDTHS.medium },
      { key: "small", suffix: "sm", maxEdge: RESPONSIVE_IMAGE_WIDTHS.small }
    ] as const;
    const variantByEdge = new Map<number, { path: string; data: Uint8Array }>();
    const paths: ResponsiveMediaPaths = { small: "", medium: "", large: "" };

    for (const spec of specs) {
      const targetEdge = Math.min(longestEdge, spec.maxEdge);
      const existing = variantByEdge.get(targetEdge);
      if (existing) {
        paths[spec.key] = existing.path;
        continue;
      }
      let nextData = sourceData;
      if (targetEdge < longestEdge) {
        const scale = targetEdge / Math.max(1, longestEdge);
        const width = Math.max(1, Math.round(bitmap.width * scale));
        const height = Math.max(1, Math.round(bitmap.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          bitmap.close();
          return null;
        }
        ctx.drawImage(bitmap, 0, 0, width, height);
        const quality = mime === "image/png" ? undefined : 0.86;
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, mime, quality)
        );
        if (!blob) {
          bitmap.close();
          return null;
        }
        const buffer = await blob.arrayBuffer();
        nextData = new Uint8Array(buffer);
      }
      const variantPath = withVariantSuffix(basePath, spec.suffix);
      variantByEdge.set(targetEdge, { path: variantPath, data: nextData });
      paths[spec.key] = variantPath;
    }
    bitmap.close();
    const entries = Array.from(variantByEdge.values()).map((entry) => ({
      name: entry.path,
      data: entry.data
    }));
    return { paths, entries };
  };

  const getFontFormat = (value: string) => {
    const ext = value.split(".").pop()?.toLowerCase();
    if (!ext) return "";
    if (ext === "woff2") return "woff2";
    if (ext === "woff") return "woff";
    if (ext === "otf") return "opentype";
    if (ext === "ttf") return "truetype";
    return "";
  };

  const buildFontStack = (family?: string) => {
    const cleaned = (family || "").replace(/"/g, "").trim();
    const primary = cleaned ? `"${cleaned}", ` : "";
    return `${primary}"Fraunces", "Georgia", serif`;
  };

  const getBuiltinFontHref = (family?: string) => {
    if (!family) return "";
    return builtInFontSources[family] ?? "";
  };

  const buildFontFaceCss = (family?: string, source?: string) => {
    if (!family || !source) return "";
    const format = getFontFormat(source);
    const formatLine = format ? ` format("${format}")` : "";
    return `@font-face { font-family: "${family}"; src: url("${source}")${formatLine}; font-display: swap; }`;
  };

  const getDirectoryHandleByPath = async (
    path: string,
    create = false
  ): Promise<FileSystemDirectoryHandle> => {
    if (!rootHandle) {
      throw new Error(t("errNoFolder"));
    }
    const parts = normalizePath(path).split("/").filter(Boolean);
    let current = rootHandle;
    for (const part of parts) {
      current = await current.getDirectoryHandle(part, { create });
    }
    return current;
  };

  const getFileHandleByPath = async (path: string): Promise<FileSystemFileHandle> => {
    const normalized = normalizePath(path);
    const parts = normalized.split("/").filter(Boolean);
    const fileName = parts.pop();
    if (!fileName) {
      throw new Error("Missing file name");
    }
    const dir = await getDirectoryHandleByPath(parts.join("/"), false);
    return await dir.getFileHandle(fileName);
  };

  const createFolder = async () => {
    if (!ensureAssetProjectWritable()) return;
    const name = window.prompt(t("promptNewFolder"));
    if (!name) return;
    if (assetMode === "filesystem") {
      if (!rootHandle) return;
      await getDirectoryHandleByPath(name, true);
      await refreshRootEntries();
      return;
    }
    if (assetMode === "bridge") {
      try {
        await bridgeRequest("mkdir", { path: name });
        await refreshBridgeEntries();
      } catch (error) {
        fsError = error instanceof Error ? error.message : t("errOpenFolder");
      }
    }
  };

  const writeFileTo = async (
    file: File,
    destination: FileSystemDirectoryHandle,
    name: string
  ) => {
    const newHandle = await destination.getFileHandle(name, { create: true });
    const writable = await newHandle.createWritable();
    await writable.write(await file.arrayBuffer());
    await writable.close();
  };

  const copyFileTo = async (
    source: FileSystemFileHandle,
    destination: FileSystemDirectoryHandle,
    name: string
  ) => {
    const file = await source.getFile();
    const newHandle = await destination.getFileHandle(name, { create: true });
    const writable = await newHandle.createWritable();
    await writable.write(await file.arrayBuffer());
    await writable.close();
  };

  const copyDirectoryTo = async (
    source: FileSystemDirectoryHandle,
    destination: FileSystemDirectoryHandle,
    name: string
  ) => {
    const newDir = await destination.getDirectoryHandle(name, { create: true });
    for await (const [entryName, handle] of source.entries()) {
      if (handle.kind === "file") {
        await copyFileTo(handle as FileSystemFileHandle, newDir, entryName);
      } else {
        await copyDirectoryTo(handle as FileSystemDirectoryHandle, newDir, entryName);
      }
    }
  };

  const renameEntry = async (entry: (typeof fsEntries)[number]) => {
    if (!ensureAssetProjectWritable()) return;
    const newName = window.prompt(t("promptRename"), entry.name);
    if (!newName || newName === entry.name) return;
    if (assetMode === "filesystem") {
      if (!rootHandle || !entry.parent || !entry.handle) return;
      if (entry.kind === "file") {
        await copyFileTo(entry.handle as FileSystemFileHandle, entry.parent, newName);
        await entry.parent.removeEntry(entry.name);
      } else {
        await copyDirectoryTo(entry.handle as FileSystemDirectoryHandle, entry.parent, newName);
        await entry.parent.removeEntry(entry.name, { recursive: true });
      }
      await refreshRootEntries();
      return;
    }
    if (assetMode === "bridge") {
      const parts = entry.path.split("/").filter(Boolean);
      parts.pop();
      const newPath = [...parts, newName].join("/");
      try {
        await bridgeRequest("move", { from: entry.path, to: newPath });
        await refreshBridgeEntries();
      } catch (error) {
        fsError = error instanceof Error ? error.message : t("errOpenFolder");
      }
    }
  };

  const moveEntryToPath = async (
    entry: (typeof fsEntries)[number],
    targetPath: string
  ) => {
    if (assetMode === "filesystem") {
      if (!rootHandle || !entry.parent || !entry.handle) return;
      const raw = normalizePath(targetPath);
      const endsWithSlash = targetPath.trim().endsWith("/");
      const parts = raw.split("/").filter(Boolean);
      if (entry.kind === "file") {
        let fileName = entry.name;
        let folderParts = parts;
        if (!endsWithSlash && parts.length) {
          fileName = parts[parts.length - 1];
          folderParts = parts.slice(0, -1);
        }
        const destination = await getDirectoryHandleByPath(folderParts.join("/"), true);
        await copyFileTo(entry.handle as FileSystemFileHandle, destination, fileName);
        await entry.parent.removeEntry(entry.name);
      } else {
        let folderName = entry.name;
        let folderParts = parts;
        if (!endsWithSlash && parts.length) {
          folderName = parts[parts.length - 1];
          folderParts = parts.slice(0, -1);
        }
        const destination = await getDirectoryHandleByPath(folderParts.join("/"), true);
        await copyDirectoryTo(entry.handle as FileSystemDirectoryHandle, destination, folderName);
        await entry.parent.removeEntry(entry.name, { recursive: true });
      }
      return;
    }
    if (assetMode === "bridge") {
      const raw = normalizePath(targetPath);
      const endsWithSlash = targetPath.trim().endsWith("/");
      const parts = raw.split("/").filter(Boolean);
      let destinationPath = raw;
      if (entry.kind === "file") {
        let fileName = entry.name;
        let folderParts = parts;
        if (!endsWithSlash && parts.length) {
          fileName = parts[parts.length - 1];
          folderParts = parts.slice(0, -1);
        }
        destinationPath = [...folderParts, fileName].join("/");
      } else {
        let folderName = entry.name;
        let folderParts = parts;
        if (!endsWithSlash && parts.length) {
          folderName = parts[parts.length - 1];
          folderParts = parts.slice(0, -1);
        }
        destinationPath = [...folderParts, folderName].join("/");
      }
      await bridgeRequest("move", { from: entry.path, to: destinationPath });
    }
  };

  const moveEntry = async (entry: (typeof fsEntries)[number]) => {
    if (!ensureAssetProjectWritable()) return;
    const target = window.prompt(t("promptMoveTo"), entry.path);
    if (!target) return;
    try {
      await moveEntryToPath(entry, target);
      if (assetMode === "filesystem") {
        await refreshRootEntries();
      } else if (assetMode === "bridge") {
        await refreshBridgeEntries();
      }
    } catch (error) {
      fsError = error instanceof Error ? error.message : t("errOpenFolder");
    }
  };

  const deleteEntry = async (entry: (typeof fsEntries)[number]) => {
    if (!ensureAssetProjectWritable()) return;
    if (assetMode === "filesystem") {
      if (!entry.parent) return;
      await entry.parent.removeEntry(entry.name, { recursive: entry.kind === "directory" });
      await refreshRootEntries();
      return;
    }
    if (assetMode === "bridge") {
      try {
        await bridgeRequest("delete", { path: entry.path });
        await refreshBridgeEntries();
      } catch (error) {
        fsError = error instanceof Error ? error.message : t("errOpenFolder");
      }
    }
  };

  const bulkDelete = async () => {
    if (!ensureAssetProjectWritable()) return;
    const targets = fsEntries.filter((entry) => selectedAssetIds.includes(entry.id));
    for (const entry of targets) {
      if (assetMode === "filesystem") {
        if (!entry.parent) continue;
        await entry.parent.removeEntry(entry.name, { recursive: entry.kind === "directory" });
      } else if (assetMode === "bridge") {
        await bridgeRequest("delete", { path: entry.path });
      }
    }
    selectedAssetIds = [];
    if (assetMode === "filesystem") {
      await refreshRootEntries();
    } else if (assetMode === "bridge") {
      await refreshBridgeEntries();
    }
  };

  const bulkMove = async () => {
    if (!ensureAssetProjectWritable()) return;
    const target = window.prompt(t("promptMoveTo"), "");
    if (!target) return;
    const targets = fsEntries.filter((entry) => selectedAssetIds.includes(entry.id));
    for (const entry of targets) {
      await moveEntryToPath(entry, target);
    }
    selectedAssetIds = [];
    if (assetMode === "filesystem") {
      await refreshRootEntries();
    } else if (assetMode === "bridge") {
      await refreshBridgeEntries();
    }
  };

  const uploadAssets = async (files: FileList | File[]) => {
    if (!ensureAssetProjectWritable()) return;
    const target = uploadTargetPath;
    const uploads = Array.from(files);
    fsError = "";
    if (assetMode === "filesystem") {
      if (!rootHandle) {
        fsError = t("errNoFolder");
        return;
      }
      const destination = await getDirectoryHandleByPath(target, true);
      for (const file of uploads) {
        await writeFileTo(file, destination, file.name);
      }
      await refreshRootEntries();
      return;
    }
    if (assetMode === "bridge") {
      try {
        for (const file of uploads) {
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ""));
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
          });
          await bridgeRequest("upload", { path: target, name: file.name, data: dataUrl });
        }
        await refreshBridgeEntries();
      } catch (error) {
        fsError = error instanceof Error ? error.message : t("errOpenFolder");
      }
      return;
    }
    fsError = t("errNoFolder");
  };

  const handleAssetUpload = async (event: Event) => {
    if (assetProjectReadOnly) {
      fsError = t("assetsReadOnly");
      return;
    }
    const input = event.currentTarget as HTMLInputElement;
    const files = input.files;
    if (!files || files.length === 0) return;
    await uploadAssets(files);
    input.value = "";
  };

  const handleAssetDrop = async (event: DragEvent) => {
    event.preventDefault();
    if (assetProjectReadOnly) {
      fsError = t("assetsReadOnly");
      return;
    }
    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) return;
    await uploadAssets(files);
  };

  const handleAssetDragOver = (event: DragEvent) => {
    event.preventDefault();
  };

  const toggleExpandPath = (path: string) => {
    expandedPaths = { ...expandedPaths, [path]: !expandedPaths[path] };
    buildTreeRows();
  };

  const toggleAssetSelection = (id: string) => {
    if (selectedAssetIds.includes(id)) {
      selectedAssetIds = selectedAssetIds.filter((item) => item !== id);
    } else {
      selectedAssetIds = [...selectedAssetIds, id];
    }
  };

  const selectAllAssets = () => {
    if (assetMode === "filesystem") {
      selectedAssetIds = fsEntries.map((entry) => entry.id);
    } else {
      selectedAssetIds = fsEntries.map((entry) => entry.id);
    }
  };

  const clearAssetSelection = () => {
    selectedAssetIds = [];
  };

  const createLocalized = (locales: string[]) => {
    return locales.reduce<Record<string, string>>((acc, lang) => {
      acc[lang] = "";
      return acc;
    }, {});
  };

  const applyTemplate = async (
    templateId: string,
    options: { source?: "wizard" | "project" } = {}
  ) => {
    if (!draft) return;
    draft.meta.template = templateId;
    const template = templateOptions.find((item) => item.id === templateId);
    if (!template) return;
    if (options.source === "wizard") {
      wizardShowcaseProject = await buildWizardShowcaseProject(templateId);
      syncWizardShowcaseVisibility();
    } else {
      wizardShowcaseProject = null;
      wizardDemoPreview = false;
    }

    touchDraft();
    initCarouselIndices(draft);
  };

  const addBackground = () => {
    if (!draft) return;
    const id = `bg-${Date.now()}`;
    draft.backgrounds = [
      ...draft.backgrounds,
      {
        id,
        label: `${t("backgroundLabel")} ${draft.backgrounds.length + 1}`,
        src: "",
        type: "image"
      }
    ];
    touchDraft();
  };

  const removeBackground = (id: string) => {
    if (!draft) return;
    draft.backgrounds = draft.backgrounds.filter((item) => item.id !== id);
    touchDraft();
  };

  const addSection = () => {
    if (!draft) return;
    const id = `section-${Date.now()}`;
    const newSection = {
      id,
      name: createLocalized(draft.meta.locales),
      items: []
    };
    draft.categories = [...draft.categories, newSection];
    selectedCategoryId = id;
    selectedItemId = "";
    touchDraft();
  };

  const deleteSection = () => {
    if (!draft) return;
    if (!selectedCategoryId) return;
    draft.categories = draft.categories.filter((item) => item.id !== selectedCategoryId);
    selectedCategoryId = draft.categories[0]?.id ?? "";
    selectedItemId = "";
    touchDraft();
  };

  const addDish = () => {
    if (!draft) return;
    const category = selectedCategory;
    if (!category) return;
    const id = `dish-${Date.now()}`;
    const newDish: MenuItem = {
      id,
      name: createLocalized(draft.meta.locales),
      description: createLocalized(draft.meta.locales),
      longDescription: createLocalized(draft.meta.locales),
      price: {
        amount: 0,
        currency: draft.meta.currency
      },
      allergens: [],
      vegan: false,
      media: {
        hero360: ""
      }
    };
    category.items = [...category.items, newDish];
    selectedItemId = id;
    touchDraft();
  };

  const addWizardCategory = () => {
    if (!draft) return;
    const id = `section-${Date.now()}`;
    const newSection = {
      id,
      name: createLocalized(draft.meta.locales),
      items: []
    };
    draft.categories = [...draft.categories, newSection];
    wizardCategoryId = id;
    wizardItemId = "";
    touchDraft();
  };

  const removeWizardCategory = (id: string) => {
    if (!draft) return;
    draft.categories = draft.categories.filter((item) => item.id !== id);
    wizardCategoryId = draft.categories[0]?.id ?? "";
    wizardItemId = "";
    touchDraft();
  };

  const addWizardDish = () => {
    if (!draft) return;
    const category = draft.categories.find((item) => item.id === wizardCategoryId);
    if (!category) return;
    const id = `dish-${Date.now()}`;
    const newDish: MenuItem = {
      id,
      name: createLocalized(draft.meta.locales),
      description: createLocalized(draft.meta.locales),
      longDescription: createLocalized(draft.meta.locales),
      price: {
        amount: 0,
        currency: draft.meta.currency
      },
      allergens: [],
      vegan: false,
      media: {
        hero360: ""
      }
    };
    category.items = [...category.items, newDish];
    wizardItemId = id;
    touchDraft();
  };

  const removeWizardDish = () => {
    if (!draft) return;
    const category = draft.categories.find((item) => item.id === wizardCategoryId);
    if (!category || !wizardItemId) return;
    category.items = category.items.filter((item) => item.id !== wizardItemId);
    wizardItemId = category.items[0]?.id ?? "";
    touchDraft();
  };

  const deleteDish = () => {
    const category = selectedCategory;
    if (!category) return;
    if (!selectedItemId) return;
    category.items = category.items.filter((item) => item.id !== selectedItemId);
    selectedItemId = category.items[0]?.id ?? "";
    touchDraft();
  };

  const goPrevDish = () => {
    const category = selectedCategory;
    if (!category) return;
    const index = category.items.findIndex((item) => item.id === selectedItemId);
    if (index > 0) {
      selectedItemId = category.items[index - 1].id;
    }
  };

  const goNextDish = () => {
    const category = selectedCategory;
    if (!category) return;
    const index = category.items.findIndex((item) => item.id === selectedItemId);
    if (index >= 0 && index < category.items.length - 1) {
      selectedItemId = category.items[index + 1].id;
    }
  };

  const shiftCarousel = (categoryId: string, direction: number) => {
    const category = activeProject?.categories.find((item) => item.id === categoryId);
    const count = category?.items.length ?? 0;
    if (count <= 1) return;
    const current = Math.round(carouselActive[categoryId] ?? 0);
    const next = wrapCarouselIndex(current + direction, count);
    carouselActive = { ...carouselActive, [categoryId]: next };
  };

  const queueFocusRowSnap = (categoryId: string, count: number) => {
    if (count <= 1) return;
    if (focusRowSnapTimeout[categoryId]) {
      clearTimeout(focusRowSnapTimeout[categoryId] ?? undefined);
    }
    const settleTimer = window.setTimeout(() => {
      const current = carouselActive[categoryId] ?? 0;
      const normalized = wrapCarouselIndex(Math.round(current), count);
      carouselActive = { ...carouselActive, [categoryId]: normalized };
      focusRowSnapTimeout = { ...focusRowSnapTimeout, [categoryId]: null };
    }, FOCUS_ROWS_WHEEL_SETTLE_MS);
    focusRowSnapTimeout = { ...focusRowSnapTimeout, [categoryId]: settleTimer };
  };

  const applyFocusRowDelta = (categoryId: string, count: number, delta: number) => {
    if (!delta || count <= 1) return;
    const current = carouselActive[categoryId] ?? 0;
    const next = wrapCarouselIndex(current + delta / FOCUS_ROWS_WHEEL_STEP_THRESHOLD, count);
    carouselActive = { ...carouselActive, [categoryId]: next };
    queueFocusRowSnap(categoryId, count);
  };

  const queueJukeboxSnap = (categoryId: string, count: number) => {
    if (count <= 1) return;
    if (jukeboxWheelSnapTimeout[categoryId]) {
      clearTimeout(jukeboxWheelSnapTimeout[categoryId] ?? undefined);
    }
    const settleTimer = window.setTimeout(() => {
      const current = carouselActive[categoryId] ?? 0;
      const normalized = wrapCarouselIndex(Math.round(current), count);
      carouselActive = { ...carouselActive, [categoryId]: normalized };
      jukeboxWheelSnapTimeout = { ...jukeboxWheelSnapTimeout, [categoryId]: null };
    }, JUKEBOX_WHEEL_SETTLE_MS);
    jukeboxWheelSnapTimeout = { ...jukeboxWheelSnapTimeout, [categoryId]: settleTimer };
  };

  const applyJukeboxDelta = (categoryId: string, count: number, delta: number) => {
    if (!delta || count <= 1) return;
    const current = carouselActive[categoryId] ?? 0;
    const next = wrapCarouselIndex(current + delta / JUKEBOX_WHEEL_STEP_THRESHOLD, count);
    carouselActive = { ...carouselActive, [categoryId]: next };
    queueJukeboxSnap(categoryId, count);
  };

  const handleCarouselWheel = (categoryId: string, event: WheelEvent) => {
    if (isJukeboxTemplate) {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      event.preventDefault();
      const category = activeProject?.categories.find((item) => item.id === categoryId);
      const count = category?.items.length ?? 0;
      if (count <= 1) return;
      const delta = normalizeJukeboxWheelDelta(event);
      if (!delta) return;
      applyJukeboxDelta(categoryId, count, delta);
      return;
    }
    if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
    event.preventDefault();
    const category = activeProject?.categories.find((item) => item.id === categoryId);
    const count = category?.items.length ?? 0;
    if (count <= 1) return;
    const delta = normalizeFocusRowWheelDelta(event);
    if (!delta) return;
    applyFocusRowDelta(categoryId, count, delta);
  };

  const handleCarouselTouchStart = (categoryId: string, event: TouchEvent) => {
    const touch = event.changedTouches[0];
    if (!touch) return;
    if (isJukeboxTemplate) {
      jukeboxTouchState = {
        ...jukeboxTouchState,
        [categoryId]: {
          touchId: touch.identifier,
          startX: touch.clientX,
          startY: touch.clientY,
          lastY: touch.clientY,
          axis: "pending"
        }
      };
      return;
    }
    focusRowTouchState = {
      ...focusRowTouchState,
      [categoryId]: {
        touchId: touch.identifier,
        startX: touch.clientX,
        startY: touch.clientY,
        lastX: touch.clientX,
        axis: "pending"
      }
    };
  };

  const handleCarouselTouchMove = (categoryId: string, event: TouchEvent) => {
    if (isJukeboxTemplate) {
      const state = jukeboxTouchState[categoryId];
      if (!state) return;
      const category = activeProject?.categories.find((item) => item.id === categoryId);
      const count = category?.items.length ?? 0;
      if (count <= 1) return;
      const trackedTouch = Array.from(event.touches).find(
        (touch) => touch.identifier === state.touchId
      );
      if (!trackedTouch) return;

      const totalDx = trackedTouch.clientX - state.startX;
      const totalDy = trackedTouch.clientY - state.startY;
      if (
        state.axis === "pending" &&
        Math.max(Math.abs(totalDx), Math.abs(totalDy)) >= JUKEBOX_TOUCH_INTENT_THRESHOLD
      ) {
        state.axis = Math.abs(totalDy) >= Math.abs(totalDx) ? "vertical" : "horizontal";
      }

      if (state.axis !== "vertical") return;

      event.preventDefault();
      const deltaY = trackedTouch.clientY - state.lastY;
      state.lastY = trackedTouch.clientY;
      if (Math.abs(deltaY) < 0.2) return;
      applyJukeboxDelta(categoryId, count, -deltaY * JUKEBOX_TOUCH_DELTA_SCALE);
      return;
    }

    const state = focusRowTouchState[categoryId];
    if (!state) return;
    const category = activeProject?.categories.find((item) => item.id === categoryId);
    const count = category?.items.length ?? 0;
    if (count <= 1) return;
    const trackedTouch = Array.from(event.touches).find(
      (touch) => touch.identifier === state.touchId
    );
    if (!trackedTouch) return;

    const totalDx = trackedTouch.clientX - state.startX;
    const totalDy = trackedTouch.clientY - state.startY;
    if (
      state.axis === "pending" &&
      Math.max(Math.abs(totalDx), Math.abs(totalDy)) >= FOCUS_ROWS_TOUCH_INTENT_THRESHOLD
    ) {
      state.axis = Math.abs(totalDx) >= Math.abs(totalDy) ? "horizontal" : "vertical";
    }

    if (state.axis !== "horizontal") return;

    event.preventDefault();
    const deltaX = trackedTouch.clientX - state.lastX;
    state.lastX = trackedTouch.clientX;
    if (Math.abs(deltaX) < 0.2) return;
    applyFocusRowDelta(categoryId, count, -deltaX * FOCUS_ROWS_TOUCH_DELTA_SCALE);
  };

  const handleCarouselTouchEnd = (categoryId: string, event: TouchEvent) => {
    if (isJukeboxTemplate) {
      const state = jukeboxTouchState[categoryId];
      if (!state) return;
      const ended = Array.from(event.changedTouches).some(
        (touch) => touch.identifier === state.touchId
      );
      if (!ended) return;
      jukeboxTouchState = { ...jukeboxTouchState, [categoryId]: null };
      return;
    }
    const state = focusRowTouchState[categoryId];
    if (!state) return;
    const ended = Array.from(event.changedTouches).some(
      (touch) => touch.identifier === state.touchId
    );
    if (!ended) return;
    focusRowTouchState = { ...focusRowTouchState, [categoryId]: null };
  };

  const openDish = (categoryId: string, itemId: string) => {
    activeItem = { category: categoryId, itemId };
    void tick().then(() => {
      const dish = resolveActiveDish();
      const asset = getInteractiveDetailAsset(dish);
      detailRotateSource = asset?.source || "";
      detailRotateDirection = detailRotateSource
        ? detailRotateDirectionBySource.get(detailRotateSource) ?? -1
        : -1;
      void setupInteractiveDetailMedia(asset);
    });
  };

  const closeDish = () => {
    teardownInteractiveDetailMedia();
    detailRotateSource = "";
    activeItem = null;
  };

  const resolveActiveDish = () => {
    if (!activeProject || !activeItem) return null;
    const category = activeProject.categories.find((item) => item.id === activeItem.category);
    const dish = category?.items.find((item) => item.id === activeItem.itemId);
    return dish ?? null;
  };

  const ensureDescription = (item: MenuItem) => {
    if (!item.description) {
      item.description = {};
    }
    return item.description;
  };

  const ensureLongDescription = (item: MenuItem) => {
    if (!item.longDescription) {
      item.longDescription = {};
    }
    return item.longDescription;
  };

  const handleDescriptionInput = (item: MenuItem, lang: string, event: Event) => {
    const input = event.currentTarget as HTMLTextAreaElement;
    const desc = ensureDescription(item);
    desc[lang] = input.value;
    touchDraft();
  };

  const handleLongDescriptionInput = (item: MenuItem, lang: string, event: Event) => {
    const input = event.currentTarget as HTMLTextAreaElement;
    const desc = ensureLongDescription(item);
    desc[lang] = input.value;
    touchDraft();
  };

  const ensureAllergens = (item: MenuItem) => {
    if (!item.allergens) {
      item.allergens = [];
    }
    return item.allergens;
  };

  const isCommonAllergenChecked = (item: MenuItem, id: string) =>
    (item.allergens ?? []).some((entry) => entry.id === id);

  const getCommonAllergenLabel = (
    entry: { label: Record<string, string> },
    lang: string = editLang
  ) => getLocalizedValue(entry.label, lang, activeProject?.meta.defaultLocale ?? "en");

  const getCustomAllergensInput = (item: MenuItem, lang: string = editLang) =>
    (item.allergens ?? [])
      .filter((entry) => !entry.id)
      .map((entry) => entry.label?.[lang] ?? "")
      .join(", ");

  const toggleCommonAllergen = (item: MenuItem, allergenId: string, checked: boolean) => {
    if (!draft) return;
    const list = ensureAllergens(item);
    const index = list.findIndex((entry) => entry.id === allergenId);
    if (checked && index === -1) {
      const common = commonAllergenCatalog.find((entry) => entry.id === allergenId);
      if (!common) return;
      list.push({
        id: common.id,
        label: draft.meta.locales.reduce<Record<string, string>>((acc, lang) => {
          acc[lang] = getLocalizedValue(common.label, lang, draft.meta.defaultLocale);
          return acc;
        }, {})
      });
    }
    if (!checked && index >= 0) {
      list.splice(index, 1);
    }
    touchDraft();
  };

  const handleCommonAllergenToggle = (item: MenuItem, allergenId: string, event: Event) => {
    const input = event.currentTarget as HTMLInputElement;
    toggleCommonAllergen(item, allergenId, input.checked);
  };

  const handleCustomAllergensInput = (item: MenuItem, lang: string, event: Event) => {
    if (!draft) return;
    const input = event.currentTarget as HTMLInputElement;
    const values = input.value.split(",").map((value) => value.trim());
    const list = ensureAllergens(item);
    const common = list.filter((entry) => entry.id);
    const custom = list.filter((entry) => !entry.id);
    const nextCount = Math.max(custom.length, values.length);
    const nextCustom: AllergenEntry[] = [];
    for (let index = 0; index < nextCount; index += 1) {
      const base = custom[index]?.label
        ? { ...custom[index].label }
        : draft.meta.locales.reduce<Record<string, string>>((acc, localeCode) => {
            acc[localeCode] = "";
            return acc;
          }, {});
      base[lang] = values[index] ?? "";
      const hasAny = draft.meta.locales.some((localeCode) => (base[localeCode] ?? "").trim());
      if (hasAny) {
        nextCustom.push({ label: base });
      }
    }
    item.allergens = [...common, ...nextCustom];
    touchDraft();
  };

  const formatPrice = (amount: number) => {
    const currency = activeProject?.meta.currency ?? "USD";
    const position = activeProject?.meta.currencyPosition ?? "left";
    return formatMenuPrice(amount, currency, position);
  };

  const handleLocalizedInput = (
    record: Record<string, string>,
    lang: string,
    event: Event
  ) => {
    const input = event.currentTarget as HTMLInputElement;
    record[lang] = input.value;
    touchDraft();
  };

  const cycleEditLang = () => {
    if (!draft) return;
    const locales = draft.meta.locales;
    if (!locales.length) return;
    const currentIndex = locales.indexOf(editLang);
    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % locales.length : 0;
    editLang = locales[nextIndex];
  };

  const handleCurrencyChange = (event: Event) => {
    const input = event.currentTarget as HTMLSelectElement;
    setCurrency(input.value);
  };

  const handleFontChoice = (value: string) => {
    if (!draft) return;
    if (value === "custom") {
      if (!draft.meta.fontFamily || fontOptions.some((opt) => opt.value === draft.meta.fontFamily)) {
        draft.meta.fontFamily = "Custom Font";
      }
      if (draft.meta.fontSource === undefined) {
        draft.meta.fontSource = "";
      }
    } else {
      draft.meta.fontFamily = value;
      draft.meta.fontSource = "";
    }
    touchDraft();
  };

  const handleFontSelect = (event: Event) => {
    const input = event.currentTarget as HTMLSelectElement;
    handleFontChoice(input.value);
  };

  const handleCustomFontNameInput = (event: Event) => {
    if (!draft) return;
    const input = event.currentTarget as HTMLInputElement;
    draft.meta.fontFamily = input.value;
    touchDraft();
  };

  const handleCustomFontSourceInput = (event: Event) => {
    if (!draft) return;
    const input = event.currentTarget as HTMLInputElement;
    draft.meta.fontSource = input.value;
    touchDraft();
  };

  const handleVeganToggle = (item: MenuItem, event: Event) => {
    const input = event.currentTarget as HTMLInputElement;
    item.vegan = input.checked;
    touchDraft();
  };
</script>

<main class="min-h-screen app-shell {layoutMode}">
  <input
    class="sr-only"
    type="file"
    accept=".json,.zip,application/zip"
    bind:this={projectFileInput}
    on:change={handleProjectFile}
  />
  {#if showLanding}
    <section class="landing-screen">
      <div class="landing-lang">
        <div class="lang-toggle" aria-label={t("toggleLang")}>
          <button
            class="lang-btn {uiLang === 'es' ? 'active' : ''}"
            type="button"
            on:click={() => (uiLang = 'es')}
          >
            ES
          </button>
          <button
            class="lang-btn {uiLang === 'en' ? 'active' : ''}"
            type="button"
            on:click={() => (uiLang = 'en')}
          >
            EN
          </button>
        </div>
      </div>
      <header class="landing-header">
        <h1>{t("landingTitle")}</h1>
        <p>{t("landingBy")}</p>
      </header>
      <div class="landing-actions">
        <button type="button" class="landing-action" on:click={startCreateProject}>
          <span class="landing-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 5v14"></path>
              <path d="M5 12h14"></path>
            </svg>
          </span>
          <span>{t("landingCreate")}</span>
        </button>
        <button type="button" class="landing-action" on:click={startOpenProject}>
          <span class="landing-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 7h6l2 2h10v8a2 2 0 0 1-2 2H3z"></path>
              <path d="M3 7v-2a2 2 0 0 1 2-2h4l2 2"></path>
            </svg>
          </span>
          <span>{t("landingOpen")}</span>
        </button>
        <button type="button" class="landing-action" on:click={startWizard}>
          <span class="landing-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 20l10-10"></path>
              <path d="M14 10l6-6"></path>
              <path d="M18 4l2 2"></path>
              <path d="M6 14l4 4"></path>
              <path d="M16 6l2 2"></path>
            </svg>
          </span>
          <span>{t("landingWizard")}</span>
        </button>
      </div>
    </section>
  {:else if loadError}
    <div class="rounded-2xl border border-red-500/30 bg-red-950/40 p-5 text-sm text-red-100">
      {loadError}
    </div>
  {:else if !project}
    <div class="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-200">
      {t("loadingProject")}
    </div>
  {:else if activeProject}
    <div class="split-layout {layoutMode}">
      {#if showEditorToggle}
        <button
          class="menu-fab"
          type="button"
          aria-label={editorOpen ? t("closeEditor") : t("openEditor")}
          on:click={toggleEditor}
        >
          <span class="menu-fab__icon"></span>
        </button>
      {/if}

      {#if editorVisible && !editorLocked}
        <div class="editor-backdrop" on:click={toggleEditor}></div>
      {/if}

      <aside class="editor-panel {editorVisible ? 'open' : ''} {editorLocked ? 'locked' : ''}">
        <div class="editor-panel__header">
          <div>
            <p class="editor-eyebrow">{t("studioTitle")}</p>
            <p class="mt-1 text-xs text-slate-400">{t("studioSubtitle")}</p>
          </div>
          <div class="editor-actions">
            <button
              class="icon-btn"
              type="button"
              aria-label={t("toggleView")}
              title={t("toggleView")}
              on:click={togglePreviewMode}
            >
              <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="2.5" y="4.5" width="13" height="9" rx="1.5"></rect>
                <rect x="18" y="6" width="3.5" height="10" rx="1"></rect>
                <path d="M6 18h6"></path>
              </svg>
            </button>
            <div class="lang-toggle" aria-label={t("toggleLang")}>
              <button
                class="lang-btn {uiLang === 'es' ? 'active' : ''}"
                type="button"
                on:click={() => (uiLang = 'es')}
              >
                ES
              </button>
              <button
                class="lang-btn {uiLang === 'en' ? 'active' : ''}"
                type="button"
                on:click={() => (uiLang = 'en')}
              >
                EN
              </button>
            </div>
            {#if !editorLocked}
              <button
                class="editor-close"
                type="button"
                aria-label={t("closeEditor")}
                on:click={toggleEditor}
              >
                ✕
              </button>
            {/if}
          </div>
        </div>

        <div class="editor-tabs">
          <button
            class="editor-tab {editorTab === 'info' ? 'active' : ''}"
            type="button"
            on:click={() => setEditorTab('info')}
          >
            <span class="editor-tab__icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 7h6l2 2h10v8a2 2 0 0 1-2 2H3z"></path>
                <path d="M3 7v-2a2 2 0 0 1 2-2h4l2 2"></path>
              </svg>
            </span>
            <span>{t("tabProject")}</span>
          </button>
          <button
            class="editor-tab {editorTab === 'assets' ? 'active' : ''}"
            type="button"
            on:click={() => setEditorTab('assets')}
          >
            <span class="editor-tab__icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 6h16v12H4z"></path>
                <path d="M8 10h8"></path>
                <path d="M8 14h6"></path>
              </svg>
            </span>
            <span>{t("tabAssets")}</span>
          </button>
          <button
            class="editor-tab {editorTab === 'edit' ? 'active' : ''}"
            type="button"
            on:click={() => setEditorTab('edit')}
          >
            <span class="editor-tab__icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 20h6"></path>
                <path d="M14 4l6 6"></path>
                <path d="M5 19l4-1 9-9-3-3-9 9z"></path>
              </svg>
            </span>
            <span>{t("tabEdit")}</span>
          </button>
          <button
            class="editor-tab {editorTab === 'wizard' ? 'active' : ''}"
            type="button"
            on:click={() => setEditorTab('wizard')}
          >
            <span class="editor-tab__icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 20l10-10"></path>
                <path d="M14 10l6-6"></path>
                <path d="M18 4l2 2"></path>
                <path d="M6 14l4 4"></path>
              </svg>
            </span>
            <span>{t("tabWizard")}</span>
          </button>
        </div>

        <div class="editor-content">
          {#if editorTab === "info"}
            <div class="editor-toolbar">
              <button
                class="icon-btn"
                type="button"
                aria-label={t("newProject")}
                title={t("newProject")}
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
                    <span>{t("fontCustomName")}</span>
                    <input
                      type="text"
                      class="editor-input"
                      value={draft.meta.fontFamily ?? ""}
                      on:input={handleCustomFontNameInput}
                    />
                  </label>
                  <label class="editor-field">
                    <span>{t("fontCustomSrc")}</span>
                    <input
                      type="text"
                      class="editor-input"
                      value={draft.meta.fontSource ?? ""}
                      list="asset-files"
                      on:input={handleCustomFontSourceInput}
                    />
                  </label>
                {/if}
              </div>
            {/if}
          {:else if editorTab === "assets"}
            <section class="asset-manager">
              <div class="asset-manager__header">
                <div>
                  <p>{t("rootTitle")}</p>
                  <span>{rootLabel}</span>
                </div>
                <div class="asset-actions">
                  <button type="button" on:click={createFolder} disabled={assetProjectReadOnly}>
                    {t("newFolder")}
                  </button>
                  <button
                    type="button"
                    disabled={assetProjectReadOnly}
                    on:click={() => assetUploadInput?.click()}
                  >
                    {t("uploadAssets")}
                  </button>
                  <input
                    class="sr-only"
                    type="file"
                    multiple
                    disabled={assetProjectReadOnly}
                    bind:this={assetUploadInput}
                    on:change={handleAssetUpload}
                  />
                </div>
              </div>
              <div class="asset-drop">
                <label class="editor-field">
                  <span>{t("uploadTo")}</span>
                  <select bind:value={uploadTargetPath} class="editor-select" disabled={assetProjectReadOnly}>
                    {#each uploadFolderOptions as folder}
                      <option value={folder.value}>{folder.label}</option>
                    {/each}
                  </select>
                </label>
                {#if needsAssets}
                  <p class="text-xs text-amber-200">{t("assetsRequired")}</p>
                {/if}
                <p>{t("uploadHint")}</p>
                <div
                  class={`asset-drop__zone ${assetProjectReadOnly ? "disabled" : ""}`}
                  on:dragover={handleAssetDragOver}
                  on:drop={handleAssetDrop}
                >
                  {t("dragDrop")}
                </div>
              </div>
              {#if assetProjectReadOnly}
                <p class="text-xs text-amber-200">{t("assetsReadOnly")}</p>
              {/if}
              {#if fsError}
                <p class="text-xs text-red-300">{fsError}</p>
              {/if}
              <div class="asset-bulk">
                <button type="button" on:click={selectAllAssets} disabled={assetProjectReadOnly}>
                  {t("selectAll")}
                </button>
                <button type="button" on:click={clearAssetSelection}>{t("clear")}</button>
                <button type="button" on:click={bulkMove} disabled={assetProjectReadOnly}>
                  {t("move")}
                </button>
                <button type="button" on:click={bulkDelete} disabled={assetProjectReadOnly}>
                  {t("delete")}
                </button>
              </div>
              <div class="asset-list">
                {#if assetMode === "none"}
                  <p class="text-xs text-slate-400">{t("pickRootHint")}</p>
                {:else if fsEntries.length === 0}
                  <p class="text-xs text-slate-400">{t("rootEmpty")}</p>
                {:else}
                  {#each treeRows as row}
                    <div class="asset-item">
                      <label class="asset-check">
                        <input
                          type="checkbox"
                          disabled={assetProjectReadOnly}
                          checked={selectedAssetIds.includes(row.entry.id)}
                          on:change={() => toggleAssetSelection(row.entry.id)}
                        />
                      </label>
                      <div>
                        <div
                          class="asset-name"
                          style={`padding-left:${row.depth * 16}px`}
                        >
                          {#if row.entry.kind === "directory" && row.hasChildren}
                            <button
                              class="asset-toggle"
                              type="button"
                              on:click={() => toggleExpandPath(row.entry.path)}
                            >
                              {row.expanded ? "▾" : "▸"}
                            </button>
                          {:else}
                            <span class="asset-toggle placeholder"></span>
                          {/if}
                          <span class="asset-icon">
                            {row.entry.kind === "directory" ? "📁" : "📄"}
                          </span>
                          <span>{row.entry.name}</span>
                        </div>
                        <p class="asset-meta">{row.entry.path}</p>
                      </div>
                      <div class="asset-actions">
                        <button
                          type="button"
                          class="asset-icon-btn"
                          title={t("rename")}
                          aria-label={t("rename")}
                          disabled={assetProjectReadOnly}
                          on:click={() => renameEntry(row.entry)}
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          class="asset-icon-btn"
                          title={t("move")}
                          aria-label={t("move")}
                          disabled={assetProjectReadOnly}
                          on:click={() => moveEntry(row.entry)}
                        >
                          ⇄
                        </button>
                        <button
                          type="button"
                          class="asset-icon-btn danger"
                          title={t("delete")}
                          aria-label={t("delete")}
                          disabled={assetProjectReadOnly}
                          on:click={() => deleteEntry(row.entry)}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  {/each}
                {/if}
              </div>
            </section>
          {:else if editorTab === "edit"}
            {#if deviceMode === "mobile" && previewMode === "full"}
              <p class="mt-2 text-xs text-amber-200">
                {t("tipRotate")}
              </p>
            {/if}

            {#if draft}
              <div class="edit-shell">
                <div class="edit-subtabs">
                  <button
                    class="edit-subtab {editPanel === 'identity' ? 'active' : ''}"
                    type="button"
                    on:click={() => (editPanel = 'identity')}
                  >
                    {t("editIdentity")}
                  </button>
                  <button
                    class="edit-subtab {editPanel === 'section' ? 'active' : ''}"
                    type="button"
                    on:click={() => (editPanel = 'section')}
                  >
                    {t("editSections")}
                  </button>
                  <button
                    class="edit-subtab {editPanel === 'dish' ? 'active' : ''}"
                    type="button"
                    on:click={() => (editPanel = 'dish')}
                  >
                    {t("editDishes")}
                  </button>
                  <button
                    class="edit-lang-chip"
                    type="button"
                    aria-label={t("editLang")}
                    title={t("editLang")}
                    on:click={cycleEditLang}
                  >
                    <span aria-hidden="true">🌐</span>
                    <span>{editLang.toUpperCase()}</span>
                  </button>
                </div>
                <p class="edit-hierarchy">{t("editHierarchyHint")}</p>

                {#if editPanel === "identity"}
                  <div class="edit-block">
                    <p class="edit-block__title">{t("restaurantName")}</p>
                    <label class="editor-field">
                      <span>{editLang.toUpperCase()}</span>
                      <input
                        type="text"
                        class="editor-input"
                        value={draft.meta.restaurantName?.[editLang] ?? ""}
                        on:input={(event) => {
                          const name = ensureRestaurantName();
                          if (!name) return;
                          handleLocalizedInput(name, editLang, event);
                        }}
                      />
                    </label>
                  </div>
                  <div class="edit-block">
                    <p class="edit-block__title">{t("menuTitle")}</p>
                    <label class="editor-field">
                      <span>{editLang.toUpperCase()}</span>
                      <input
                        type="text"
                        class="editor-input"
                        value={draft.meta.title?.[editLang] ?? ""}
                        on:input={(event) => {
                          const title = ensureMetaTitle();
                          if (!title) return;
                          handleLocalizedInput(title, editLang, event);
                        }}
                      />
                    </label>
                  </div>
                {:else}
                  <div class="edit-row">
                    <label class="editor-field">
                      <span>{t("section")}</span>
                      <select bind:value={selectedCategoryId} class="editor-select">
                        {#each draft.categories as category}
                          <option value={category.id}>
                            {getLocalizedValue(category.name, editLang, draft.meta.defaultLocale)}
                          </option>
                        {/each}
                      </select>
                    </label>
                    <div class="edit-actions">
                      <button
                        class="editor-outline"
                        type="button"
                        aria-label={t("addSection")}
                        title={t("addSection")}
                        on:click={addSection}
                      >
                        <span class="btn-icon">＋</span>
                      </button>
                      <button class="editor-outline danger" type="button" on:click={deleteSection}>
                        {t("deleteSection")}
                      </button>
                    </div>
                  </div>

                  {#if editPanel === "section" && selectedCategory}
                    <p class="edit-hint">{t("sectionHint")}</p>
                    <div class="edit-block">
                      <p class="edit-block__title">{t("sectionName")}</p>
                      <label class="editor-field">
                        <span>{editLang.toUpperCase()}</span>
                        <input
                          type="text"
                          class="editor-input"
                          value={selectedCategory.name?.[editLang] ?? ""}
                          on:input={(event) =>
                            handleLocalizedInput(selectedCategory.name, editLang, event)}
                        />
                      </label>
                    </div>
                  {/if}

                  {#if editPanel === "dish" && selectedCategory}
                    <p class="edit-hint">{t("dishHint")}</p>
                    <div class="edit-row">
                      <label class="editor-field">
                        <span>{t("dish")}</span>
                        <select bind:value={selectedItemId} class="editor-select">
                          {#each selectedCategory.items as item}
                            <option value={item.id}>
                              {getLocalizedValue(item.name, editLang, draft.meta.defaultLocale)}
                            </option>
                          {/each}
                        </select>
                      </label>
                      <div class="edit-actions">
                        <button
                          class="editor-outline"
                          type="button"
                          aria-label={t("prevDish")}
                          title={t("prevDish")}
                          on:click={goPrevDish}
                        >
                          <span class="btn-icon">◀</span>
                        </button>
                        <button
                          class="editor-outline"
                          type="button"
                          aria-label={t("nextDish")}
                          title={t("nextDish")}
                          on:click={goNextDish}
                        >
                          <span class="btn-icon">▶</span>
                        </button>
                        <button
                          class="editor-outline"
                          type="button"
                          aria-label={t("addDish")}
                          title={t("addDish")}
                          on:click={addDish}
                        >
                          <span class="btn-icon">＋</span>
                        </button>
                        <button class="editor-outline danger" type="button" on:click={deleteDish}>
                          {t("delete")}
                        </button>
                      </div>
                    </div>

                    {#if selectedItem}
                      <div class="edit-block">
                        <p class="edit-block__title">{t("dishData")}</p>
                        <div class="edit-item">
                          <div class="edit-item__media-row">
                            <div class="edit-item__media">
                              <img
                                src={selectedItem.media.hero360 ?? ""}
                                alt={textOf(selectedItem.name)}
                              />
                            </div>
                            <label class="editor-field edit-item__source">
                              <span>{t("asset360")}</span>
                              <input
                                type="text"
                                class="editor-input"
                                bind:value={selectedItem.media.hero360}
                                list="asset-files"
                              />
                            </label>
                          </div>
                          <div class="edit-item__content">
                            <label class="editor-field">
                              <span>{t("name")} ({editLang.toUpperCase()})</span>
                              <input
                                type="text"
                                class="editor-input"
                                value={selectedItem.name?.[editLang] ?? ""}
                                on:input={(event) =>
                                  handleLocalizedInput(selectedItem.name, editLang, event)}
                              />
                            </label>
                            <label class="editor-field">
                              <span>{t("description")} ({editLang.toUpperCase()})</span>
                              <textarea
                                class="editor-input"
                                rows="2"
                                value={selectedItem.description?.[editLang] ?? ""}
                                on:input={(event) =>
                                  handleDescriptionInput(selectedItem, editLang, event)}
                              ></textarea>
                            </label>
                            <label class="editor-field">
                              <span>{t("longDescription")} ({editLang.toUpperCase()})</span>
                              <textarea
                                class="editor-input"
                                rows="3"
                                value={selectedItem.longDescription?.[editLang] ?? ""}
                                on:input={(event) =>
                                  handleLongDescriptionInput(selectedItem, editLang, event)}
                              ></textarea>
                            </label>
                            <label class="editor-field">
                              <span>{t("price")}</span>
                              <input
                                type="number"
                                class="editor-input"
                                bind:value={selectedItem.price.amount}
                              />
                            </label>
                            <div class="editor-field">
                              <span>{t("commonAllergens")}</span>
                              <div class="allergen-checklist">
                                {#each commonAllergenCatalog as allergen}
                                  <label class="allergen-option">
                                    <input
                                      type="checkbox"
                                      checked={isCommonAllergenChecked(selectedItem, allergen.id)}
                                      on:change={(event) =>
                                        handleCommonAllergenToggle(selectedItem, allergen.id, event)}
                                    />
                                    <span>{getCommonAllergenLabel(allergen, editLang)}</span>
                                  </label>
                                {/each}
                              </div>
                            </div>
                            <label class="editor-field">
                              <span>{t("customAllergens")} ({editLang.toUpperCase()})</span>
                              <input
                                type="text"
                                class="editor-input"
                                value={getCustomAllergensInput(selectedItem, editLang)}
                                on:input={(event) =>
                                  handleCustomAllergensInput(selectedItem, editLang, event)}
                              />
                              <small class="editor-hint">{t("customAllergensHint")}</small>
                            </label>
                            <label class="editor-field editor-inline">
                              <span>{t("veganLabel")}</span>
                              <input
                                type="checkbox"
                                checked={selectedItem.vegan ?? false}
                                on:change={(event) => handleVeganToggle(selectedItem, event)}
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    {/if}
                  {/if}
                {/if}
              </div>
            {/if}
          {:else}
            <section class="wizard">
              <div class="wizard-header">
                <p class="text-[0.6rem] uppercase tracking-[0.35em] text-slate-300">
                  {t("tabWizard")}
                </p>
                <span class="text-xs text-slate-400">
                  {t("step")} {wizardStep + 1} / {wizardSteps.length}
                </span>
              </div>
              <div class="wizard-progress">
                <span>{t("wizardProgress")} {Math.round(wizardProgress * 100)}%</span>
                <div class="wizard-progress__bar">
                  <span style={`width:${wizardProgress * 100}%`}></span>
                </div>
              </div>
              <div class="wizard-steps">
                {#each wizardSteps as step, index}
                  <button
                    class="wizard-step {index === wizardStep ? 'active' : ''} {isWizardStepValid(index) ? 'done' : ''}"
                    type="button"
                    on:click={() => goToStep(index)}
                  >
                    <span>{step}</span>
                    <span class="wizard-step__status">
                      {isWizardStepValid(index) ? "●" : "○"}
                    </span>
                  </button>
                {/each}
              </div>
              <div class="wizard-body">
                {#if wizardStep === 0}
                  <p class="text-sm text-slate-200">{t("wizardPick")}</p>
                  <div class="wizard-card-grid">
                    {#each templateOptions as template}
                      <button
                        class="wizard-card {draft?.meta.template === template.id ? 'active' : ''}"
                        type="button"
                        on:click={() => applyTemplate(template.id, { source: "wizard" })}
                      >
                        <p class="wizard-card__title">
                          {template.label[uiLang] ?? template.label.es ?? template.id}
                        </p>
                        <p class="wizard-card__meta">
                          {(template.categories[uiLang] ?? template.categories.es ?? []).join(" • ")}
                        </p>
                      </button>
                    {/each}
                  </div>
                  <p class="text-xs text-slate-400">
                    {t("wizardTip")}
                  </p>
                  {#if wizardDemoPreview}
                    <p class="text-xs text-amber-200">{t("wizardDemoPreviewHint")}</p>
                  {/if}
                {:else if wizardStep === 1}
                  <p class="text-sm text-slate-200">{t("wizardIdentity")}</p>
                  {#if wizardNeedsRootBackground}
                    <p class="wizard-warning">{t("wizardRequireRootBackground")}</p>
                  {:else if !wizardStatus.identity}
                    <p class="wizard-warning">{t("wizardMissingBackground")}</p>
                  {/if}
                  {#if assetOptions.length === 0}
                    <p class="text-xs text-slate-400">{t("wizardAssetsHint")}</p>
                  {/if}
                  <div class="wizard-block">
                    <button class="editor-outline" type="button" on:click={addBackground}>
                      {t("wizardAddBg")}
                    </button>
                    {#if draft}
                      <div class="wizard-list">
                        {#each draft.backgrounds as bg}
                          <div class="wizard-item">
                            <label class="editor-field">
                              <span>{t("wizardLabel")}</span>
                              <input
                                type="text"
                                class="editor-input"
                                bind:value={bg.label}
                              />
                            </label>
                            <label class="editor-field">
                              <span>{t("wizardSrc")}</span>
                              {#if assetOptions.length}
                                <select bind:value={bg.src} class="editor-select">
                                  <option value=""></option>
                                  {#each assetOptions as path}
                                    <option value={path}>{path}</option>
                                  {/each}
                                </select>
                              {:else}
                                <input
                                  type="text"
                                  class="editor-input"
                                  bind:value={bg.src}
                                  list="asset-files"
                                />
                              {/if}
                            </label>
                            <button
                              class="editor-outline danger"
                              type="button"
                              on:click={() => removeBackground(bg.id)}
                            >
                              {t("delete")}
                            </button>
                          </div>
                        {/each}
                      </div>
                    {/if}
                  </div>
                {:else if wizardStep === 2}
                  <p class="text-sm text-slate-200">{t("wizardCategories")}</p>
                  {#if !wizardStatus.categories}
                    <p class="wizard-warning">{t("wizardMissingCategories")}</p>
                  {/if}
                  {#if draft}
                    <div class="wizard-block">
                      <label class="editor-field">
                        <span>{t("wizardLanguage")}</span>
                        <select bind:value={wizardLang} class="editor-select">
                          {#each draft.meta.locales as lang}
                            <option value={lang}>{lang.toUpperCase()}</option>
                          {/each}
                        </select>
                      </label>
                      <button class="editor-outline" type="button" on:click={addWizardCategory}>
                        {t("wizardAddCategory")}
                      </button>
                      <div class="wizard-list">
                        {#each draft.categories as category}
                          <div class="wizard-item">
                            <label class="editor-field">
                              <span>{t("name")} ({wizardLang.toUpperCase()})</span>
                              <input
                                type="text"
                                class="editor-input"
                                value={category.name?.[wizardLang] ?? ""}
                                on:input={(event) =>
                                  handleLocalizedInput(category.name, wizardLang, event)}
                              />
                            </label>
                            <button
                              class="editor-outline danger"
                              type="button"
                              on:click={() => removeWizardCategory(category.id)}
                            >
                              {t("delete")}
                            </button>
                          </div>
                        {/each}
                      </div>
                    </div>
                  {/if}
                {:else if wizardStep === 3}
                  <p class="text-sm text-slate-200">{t("wizardDishes")}</p>
                  {#if !wizardStatus.dishes}
                    <p class="wizard-warning">{t("wizardMissingDishes")}</p>
                  {/if}
                  {#if draft}
                    <div class="wizard-block">
                      <label class="editor-field">
                        <span>{t("wizardLanguage")}</span>
                        <select bind:value={wizardLang} class="editor-select">
                          {#each draft.meta.locales as lang}
                            <option value={lang}>{lang.toUpperCase()}</option>
                          {/each}
                        </select>
                      </label>
                      <label class="editor-field">
                        <span>{t("wizardCategory")}</span>
                        <select bind:value={wizardCategoryId} class="editor-select">
                          {#each draft.categories as category}
                            <option value={category.id}>
                              {getLocalizedValue(category.name, wizardLang, draft.meta.defaultLocale)}
                            </option>
                          {/each}
                        </select>
                      </label>
                      <div class="edit-actions">
                        <button class="editor-outline" type="button" on:click={addWizardDish}>
                          {t("wizardAddDish")}
                        </button>
                        <button class="editor-outline danger" type="button" on:click={removeWizardDish}>
                          {t("delete")}
                        </button>
                      </div>
                      {#if wizardCategory}
                        <label class="editor-field">
                          <span>{t("dish")}</span>
                          <select bind:value={wizardItemId} class="editor-select">
                            {#each wizardCategory.items as item}
                              <option value={item.id}>
                                {getLocalizedValue(item.name, wizardLang, draft.meta.defaultLocale)}
                              </option>
                            {/each}
                          </select>
                        </label>
                      {/if}
                      {#if wizardItem}
                        <label class="editor-field">
                          <span>{t("name")} ({wizardLang.toUpperCase()})</span>
                          <input
                            type="text"
                            class="editor-input"
                            value={wizardItem.name?.[wizardLang] ?? ""}
                            on:input={(event) =>
                              handleLocalizedInput(wizardItem.name, wizardLang, event)}
                          />
                        </label>
                        <label class="editor-field">
                          <span>{t("description")} ({wizardLang.toUpperCase()})</span>
                          <textarea
                            class="editor-input"
                            rows="2"
                            value={wizardItem.description?.[wizardLang] ?? ""}
                            on:input={(event) => handleDescriptionInput(wizardItem, wizardLang, event)}
                          ></textarea>
                        </label>
                        <label class="editor-field">
                          <span>{t("price")}</span>
                          <input
                            type="number"
                            class="editor-input"
                            bind:value={wizardItem.price.amount}
                          />
                        </label>
                        <label class="editor-field">
                          <span>{t("asset360")}</span>
                          <input
                            type="text"
                            class="editor-input"
                            bind:value={wizardItem.media.hero360}
                            list="asset-files"
                          />
                        </label>
                      {/if}
                    </div>
                  {/if}
                {:else}
                  <p class="text-sm text-slate-200">{t("wizardPreview")}</p>
                  <p class="text-xs text-slate-400">
                    {t("wizardExportNote")}
                  </p>
                {/if}
              </div>
              <div class="wizard-nav">
                <button
                  class="editor-outline"
                  type="button"
                  on:click={goPrevStep}
                  disabled={wizardStep === 0}
                >
                  {t("wizardBack")}
                </button>
                {#if wizardStep < wizardSteps.length - 1}
                  <button
                    class="editor-cta"
                    type="button"
                    on:click={goNextStep}
                    disabled={!isWizardStepValid(wizardStep)}
                  >
                    {t("wizardNext")}
                  </button>
                {:else}
                  <button
                    class="editor-cta"
                    type="button"
                    on:click={exportStaticSite}
                    disabled={!wizardStatus.preview}
                  >
                    {t("export")}
                  </button>
                {/if}
              </div>
            </section>
          {/if}
        </div>
      </aside>

      <section class="preview-panel {layoutMode}">
        <section class="preview-shell {effectivePreview}">
        <section
          class={`menu-preview template-${activeProject.meta.template || "focus-rows"} ${
            previewStartupLoading ? "is-loading" : ""
          }`}
          style={`--menu-font:${previewFontStack};`}
        >
            <div class={`menu-startup-loader ${previewStartupLoading ? "active" : ""}`}>
              <div class="menu-startup-loader__card">
                <p class="menu-startup-loader__label">{getLoadingLabel(locale)}</p>
                <div class="menu-startup-loader__track">
                  <span
                    class="menu-startup-loader__fill"
                    style={`width:${previewStartupProgress}%`}
                  ></span>
                </div>
                <p class="menu-startup-loader__value">{previewStartupProgress}%</p>
              </div>
            </div>
            {#if previewBackgrounds.length}
              {#each previewBackgrounds as background, index (`${background.id}-${index}`)}
                <div
                  class={`menu-background ${index === activeBackgroundIndex ? "active" : ""}`}
                  style={`background-image: url('${background.src}');`}
                ></div>
              {/each}
            {/if}
            <div class="menu-overlay"></div>

            {#if isBlankMenu}
              <div class="menu-blank">
                <p>{t("blankMenu")}</p>
              </div>
            {:else}
              <header class="menu-topbar">
                <div class="menu-title-block">
                  {#if textOf(activeProject.meta.restaurantName)}
                    <p class="menu-eyebrow">{textOf(activeProject.meta.restaurantName)}</p>
                  {/if}
                  <h1 class="menu-title">
                    {textOf(activeProject.meta.title, t("menuTitleFallback"))}
                  </h1>
                </div>
                <div class="menu-lang">
                  <select bind:value={locale} class="menu-select">
                    {#each activeProject.meta.locales as lang}
                      <option value={lang}>{lang.toUpperCase()}</option>
                    {/each}
                  </select>
                </div>
              </header>

              {#if !isJukeboxTemplate}
                <div class="focus-rows-hint" aria-hidden="true">
                  <span class="focus-rows-hint__label">
                    {getFocusRowsScrollHint(locale)}
                  </span>
                </div>
              {/if}

              {#if isJukeboxTemplate && activeProject.categories.length > 1}
                <div class="section-nav">
                  <button
                    class="section-nav__btn prev"
                    type="button"
                    aria-label={t("prevDish")}
                    on:click={() => shiftSection(-1)}
                  >
                    <span aria-hidden="true">‹</span>
                  </button>
                  <span class="section-nav__label">{getJukeboxScrollHint(locale)}</span>
                  <button
                    class="section-nav__btn next"
                    type="button"
                    aria-label={t("nextDish")}
                    on:click={() => shiftSection(1)}
                  >
                    <span aria-hidden="true">›</span>
                  </button>
                </div>
              {/if}

              <div class="menu-scroll" on:scroll={(event) => handleMenuScroll(event)}>
                {#each activeProject.categories as category}
                  {@const renderItems = isJukeboxTemplate
                    ? getJukeboxRenderItems(category.items)
                    : getFocusRowRenderItems(category.items)}
                  {@const activeIndex = carouselActive[category.id] ?? 0}
                  {@const hideThreshold = Math.max(1.6, category.items.length / 2 - 0.25)}
                  <section class="menu-section">
                    <div class="menu-section__head">
                      <p class="menu-section__title">{textOf(category.name)}</p>
                      <span class="menu-section__count">{category.items.length} items</span>
                    </div>
                    {#if deviceMode === "desktop" && category.items.length > 1 && !isJukeboxTemplate}
                      <div class="carousel-nav">
                        <button
                          class="carousel-nav__btn prev"
                          type="button"
                          aria-label={t("prevDish")}
                          on:click={() => shiftCarousel(category.id, -1)}
                        >
                          <span aria-hidden="true">‹</span>
                        </button>
                        <button
                          class="carousel-nav__btn next"
                          type="button"
                          aria-label={t("nextDish")}
                          on:click={() => shiftCarousel(category.id, 1)}
                        >
                          <span aria-hidden="true">›</span>
                        </button>
                      </div>
                    {/if}
                    <div
                      class="menu-carousel {category.items.length <= 1 ? 'single' : ''}"
                      on:wheel={(event) => handleCarouselWheel(category.id, event)}
                      on:touchstart={(event) => handleCarouselTouchStart(category.id, event)}
                      on:touchmove|nonpassive={(event) =>
                        handleCarouselTouchMove(category.id, event)}
                      on:touchend={(event) => handleCarouselTouchEnd(category.id, event)}
                      on:touchcancel={(event) => handleCarouselTouchEnd(category.id, event)}
                      data-category-id={category.id}
                    >
                      {#each renderItems as entry (entry.key)}
                        {@const distance = Math.abs(
                          getCircularOffset(activeIndex, entry.sourceIndex, category.items.length)
                        )}
                        {@const stateClass = isJukeboxTemplate
                          ? distance >= hideThreshold
                            ? "is-hidden"
                            : distance < 0.5
                              ? "active"
                              : distance < 1.25
                                ? "near"
                                : "far"
                          : distance >= hideThreshold
                            ? "is-hidden"
                            : distance < 0.5
                              ? "active"
                              : distance < 1.5
                                ? "near"
                                : "far"}
                        <button
                          class={`carousel-card ${stateClass}`}
                          type="button"
                          style={
                            isJukeboxTemplate
                              ? getJukeboxCardStyle(
                                  activeIndex,
                                  entry.sourceIndex,
                                  category.items.length
                                )
                              : getFocusRowCardStyle(
                                  activeIndex,
                                  entry.sourceIndex,
                                  category.items.length
                                )
                          }
                          on:click={() => openDish(category.id, entry.item.id)}
                        >
                          <div class="carousel-media">
                            <img
                              src={getCarouselImageSource(entry.item)}
                              srcset={buildResponsiveSrcSetFromMedia(entry.item)}
                              sizes="(max-width: 640px) 64vw, (max-width: 1200px) 34vw, 260px"
                              alt={textOf(entry.item.name)}
                              draggable="false"
                              on:contextmenu|preventDefault
                              on:dragstart|preventDefault
                              loading="lazy"
                              decoding="async"
                              fetchpriority="low"
                            />
                          </div>
                          <div class="carousel-text">
                            <div class="carousel-row">
                              <p class="carousel-title">
                                {textOf(entry.item.name)}
                                {#if entry.item.vegan}
                                  <span class="vegan-icon" title={getMenuTerm("vegan")}>🌿</span>
                                {/if}
                              </p>
                              <span class="carousel-price">
                                {formatPrice(entry.item.price.amount)}
                              </span>
                            </div>
                            <p class="carousel-desc">{textOf(entry.item.description)}</p>
                          </div>
                        </button>
                      {/each}
                    </div>
                  </section>
                {/each}
              </div>
              <div class="menu-tap-hint" aria-hidden="true">
                <span class="menu-tap-hint__dot"></span>
                <span>{getDishTapHint(locale)}</span>
              </div>
              <p class="menu-asset-disclaimer" aria-hidden="true">
                {getAssetOwnershipDisclaimer(locale)}
              </p>
            {/if}
          </section>
        </section>
      </section>
    </div>
  {/if}
</main>

{#if activeItem}
  {@const dish = resolveActiveDish()}
  {#if dish}
    {@const interactiveAsset = getInteractiveDetailAsset(dish)}
    <div class="dish-modal" on:click={closeDish}>
      <div class="dish-modal__card" on:click|stopPropagation>
        <div class="dish-modal__header">
          <p class="dish-modal__title">{textOf(dish.name)}</p>
          <button class="dish-modal__close" type="button" on:click={closeDish}>✕</button>
        </div>
        <div class="dish-modal__media" bind:this={modalMediaHost}>
          {#if interactiveAsset && supportsInteractiveMedia()}
            <p class="dish-modal__media-note">{getDetailRotateHint(locale)}</p>
            <button
              class={`dish-modal__media-toggle ${detailRotateDirection === -1 ? "is-reversed" : ""}`}
              type="button"
              title={getDetailRotateToggleHint(locale)}
              aria-label={getDetailRotateToggleHint(locale)}
              on:click|stopPropagation={toggleDetailRotateDirection}
            >
              <span aria-hidden="true">⇄</span>
            </button>
          {/if}
          <img
            bind:this={modalMediaImage}
            src={getDetailImageSource(dish)}
            srcset={buildResponsiveSrcSetFromMedia(dish)}
            sizes="(max-width: 720px) 90vw, 440px"
            alt={textOf(dish.name)}
            draggable="false"
            on:contextmenu|preventDefault
            on:dragstart|preventDefault
            decoding="async"
          />
        </div>
        <div class="dish-modal__content">
          <div class="dish-modal__text">
            <p class="dish-modal__desc">{textOf(dish.description)}</p>
            {#if textOf(dish.longDescription)}
              <p class="dish-modal__long">{textOf(dish.longDescription)}</p>
            {/if}
            {#if dish.allergens?.length}
              <p class="dish-modal__allergens">
                {getMenuTerm("allergens")}: {getAllergenValues(dish).join(", ")}
              </p>
            {/if}
            {#if dish.vegan}
              <span class="dish-modal__badge">🌿 {getMenuTerm("vegan")}</span>
            {/if}
          </div>
          <p class="dish-modal__price">
            {formatPrice(dish.price.amount)}
          </p>
        </div>
      </div>
    </div>
  {/if}
{/if}

{#if assetOptions.length}
  <datalist id="asset-files">
    {#each assetOptions as path}
      <option value={path}></option>
    {/each}
  </datalist>
{/if}
