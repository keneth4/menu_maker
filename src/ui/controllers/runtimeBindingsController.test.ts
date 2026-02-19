import { describe, expect, it, vi } from "vitest";
import type { MenuProject } from "../../lib/types";
import { createRuntimeBindings } from "./runtimeBindingsController";

const createProject = (): MenuProject => ({
  meta: {
    name: "Demo",
    slug: "demo",
    locales: ["es", "en"],
    defaultLocale: "es",
    currency: "USD",
    currencyPosition: "left",
    backgroundDisplayMode: "carousel",
    template: "focus-rows"
  },
  backgrounds: [],
  categories: [
    {
      id: "c1",
      name: { es: "Categoria" },
      items: [
        {
          id: "i1",
          name: { es: "Plato" },
          description: { es: "Desc" },
          longDescription: { es: "" },
          priceVisible: true,
          price: { amount: 10, currency: "USD" },
          allergens: [],
          vegan: false,
          media: {
            hero360: "",
            originalHero360: "",
            rotationDirection: "ccw",
            scrollAnimationMode: "hero360",
            scrollAnimationSrc: ""
          },
          typography: {}
        }
      ]
    }
  ]
} as MenuProject);

describe("createRuntimeBindings", () => {
  it("wires controllers and updates modal/workflow state", async () => {
    const project = createProject();
    const state = {
      project,
      draft: project,
      projects: [],
      activeSlug: "demo",
      locale: "es",
      loadError: "",
      uiLang: "es" as const,
      editLang: "es",
      editPanel: "identity" as const,
      wizardLang: "es",
      wizardCategoryId: "",
      wizardItemId: "",
      wizardStep: 0,
      wizardDemoPreview: false,
      wizardShowcaseProject: null,
      wizardCategory: null,
      wizardItem: null,
      lastSaveName: "",
      needsAssets: false,
      openError: "",
      exportError: "",
      exportStatus: "",
      workflowMode: null as "save" | "export" | "upload" | null,
      workflowStep: "",
      workflowProgress: 0,
      assetTaskVisible: false,
      assetTaskStep: "",
      assetTaskProgress: 0,
      assetMode: "bridge" as const,
      editorTab: "info" as const,
      editorOpen: true,
      showLanding: false,
      activeProject: project,
      selectedCategoryId: "",
      selectedItemId: "",
      rootHandle: null,
      bridgeAvailable: true,
      bridgeProjectSlug: "demo",
      fsEntries: [],
      rootFiles: [],
      fsError: "",
      uploadTargetPath: "",
      uploadFolderOptions: [],
      expandedPaths: {},
      treeRows: [],
      selectedAssetIds: [],
      assetProjectReadOnly: false,
      activeItem: null as { category: string; itemId: string } | null,
      previewStartupLoading: false,
      previewStartupProgress: 100,
      previewStartupBlockingSources: new Set<string>()
    };

    const setRotateDirection = vi.fn();
    const setupInteractiveMedia = vi.fn(async () => undefined);
    const teardownInteractiveMedia = vi.fn();

    const bindings = createRuntimeBindings({
      t: () => (key) => key,
      fontOptions: [{ value: "Fraunces", label: "Fraunces" }],
      templateOptions: [],
      commonAllergenCatalog: [],
      bridgeClient: {
        ping: async () => true,
        list: async () => [],
        request: async () => undefined,
        readFileBytes: async () => null,
        prepareProjectDerivedAssets: async (_slug, value) => value
      },
      userManagedRoots: ["originals/backgrounds", "originals/items", "originals/fonts"],
      workflowRefs: { pulseTimer: null, resetTimer: null },
      assetTaskRefs: { pulseTimer: null, resetTimer: null },
      getState: () => state,
      setState: (patch) => Object.assign(state, patch),
      touchDraft: () => undefined,
      cloneProject: (value) => structuredClone(value),
      createEmptyProject: () => createProject(),
      initCarouselIndices: () => undefined,
      resetTemplateDemoCache: () => undefined,
      syncWizardShowcaseVisibility: () => undefined,
      buildWizardShowcaseProject: async () => null,
      getLocalizedValue: (value, locale, fallback) => value?.[locale] ?? fallback,
      normalizeBackgroundCarouselSeconds: (value) => Number(value) || 9,
      normalizeSectionBackgroundId: (value) => value ?? "",
      getSectionModeBackgroundEntries: () => [],
      autoAssignSectionBackgroundsByOrder: () => undefined,
      getNextUnusedSectionBackgroundId: () => "",
      ensureDescription: (item) => item.description,
      ensureLongDescription: (item) => item.longDescription,
      ensureAllergens: (item) => item.allergens ?? [],
      resolveTemplateId: (templateId) => templateId,
      isWizardShowcaseEligible: () => true,
      normalizePath: (value) => value,
      readAssetBytes: async () => null,
      buildExportStyles: () => "",
      buildRuntimeScript: () => "",
      getCarouselImageSource: () => "",
      mapLegacyAssetRelativeToManaged: (value) => value,
      isManagedAssetRelativePath: () => true,
      slugifyName: (value) => value,
      normalizeZipName: (value) => value,
      getSuggestedZipName: () => "menu",
      getProjectSlug: () => "demo",
      refreshBridgeEntries: async () => undefined,
      ensureAssetProjectWritable: () => true,
      isProtectedAssetProjectSlug: () => false,
      isLockedManagedAssetRoot: () => false,
      joinAssetFolderPath: (base, child) => `${base}/${child}`.replace(/\/+/g, "/"),
      planEntryMove: (_kind, name, targetPath) => ({
        destinationPath: `${targetPath}/${name}`.replace(/\/+/g, "/"),
        destinationDirPath: targetPath,
        destinationName: name
      }),
      planEntryRename: (currentPath, newName) => `${currentPath}/${newName}`,
      getDirectoryHandleByPath: async () => ({}) as FileSystemDirectoryHandle,
      listFilesystemEntries: async () => [],
      copyFileHandleTo: async () => undefined,
      copyDirectoryHandleTo: async () => undefined,
      writeFileToDirectory: async () => undefined,
      showDirectoryPicker: undefined,
      prompt: () => null,
      openProjectDialog: () => undefined,
      promptAssetUpload: async () => undefined,
      getDetailImageSource: () => "/projects/demo/assets/originals/items/img.webp",
      getInteractiveDetailAsset: () => null,
      supportsInteractiveMedia: () => true,
      prefetchInteractiveBytes: async () => null,
      setRotateDirection,
      setupInteractiveMedia,
      teardownInteractiveMedia,
      getDishRotateDirection: () => -1,
      schedulePostOpen: (task) => task()
    });

    bindings.workflowStatusController.startWorkflow("save", "progressSaveStart", 5);
    expect(state.workflowMode).toBe("save");

    bindings.modalController.openDish("c1", "i1");
    expect(state.activeItem).toEqual({ category: "c1", itemId: "i1" });

    bindings.modalController.closeDish();
    expect(state.activeItem).toBeNull();
    expect(setRotateDirection).toHaveBeenCalled();
    expect(setupInteractiveMedia).toHaveBeenCalled();
    expect(teardownInteractiveMedia).toHaveBeenCalled();
  });

  it("rewrites draft/project references after successful asset rename", async () => {
    const project = createProject();
    project.meta.logoSrc = "/projects/demo/assets/originals/backgrounds/hero-old.webp";
    project.meta.fontSource = "/projects/other/assets/originals/backgrounds/hero-old.webp";
    project.backgrounds = [
      {
        id: "bg-1",
        type: "image",
        label: "Hero",
        src: "/projects/demo/assets/originals/backgrounds/hero-old.webp",
        originalSrc: "assets/originals/backgrounds/hero-old.webp"
      }
    ] as any;
    project.categories[0].items[0].media.hero360 = "/projects/demo/assets/originals/items/dish-old.gif";
    project.categories[0].items[0].media.originalHero360 = "assets/originals/items/dish-old.gif";
    project.categories[0].items[0].typography = {
      item: {
        source: "assets/originals/backgrounds/hero-old.webp"
      }
    } as any;

    const state = {
      project,
      draft: project,
      projects: [],
      activeSlug: "demo",
      locale: "es",
      loadError: "",
      uiLang: "es" as const,
      editLang: "es",
      editPanel: "identity" as const,
      wizardLang: "es",
      wizardCategoryId: "",
      wizardItemId: "",
      wizardStep: 0,
      wizardDemoPreview: false,
      wizardShowcaseProject: null,
      wizardCategory: null,
      wizardItem: null,
      lastSaveName: "",
      needsAssets: false,
      openError: "",
      exportError: "",
      exportStatus: "",
      workflowMode: null as "save" | "export" | "upload" | null,
      workflowStep: "",
      workflowProgress: 0,
      assetTaskVisible: false,
      assetTaskStep: "",
      assetTaskProgress: 0,
      assetMode: "bridge" as const,
      editorTab: "assets" as const,
      editorOpen: true,
      showLanding: false,
      activeProject: project,
      selectedCategoryId: "",
      selectedItemId: "",
      rootHandle: null,
      bridgeAvailable: true,
      bridgeProjectSlug: "demo",
      fsEntries: [
        {
          id: "originals/backgrounds/hero-old.webp",
          name: "hero-old.webp",
          path: "originals/backgrounds/hero-old.webp",
          kind: "file",
          handle: null,
          parent: null,
          source: "bridge"
        }
      ],
      rootFiles: [],
      fsError: "",
      uploadTargetPath: "originals/backgrounds",
      uploadFolderOptions: [],
      expandedPaths: {},
      treeRows: [],
      selectedAssetIds: [],
      assetProjectReadOnly: false,
      activeItem: null as { category: string; itemId: string } | null,
      previewStartupLoading: false,
      previewStartupProgress: 100,
      previewStartupBlockingSources: new Set<string>()
    };

    const request = vi.fn(async () => undefined);
    const bindings = createRuntimeBindings({
      t: () => (key) => key,
      fontOptions: [{ value: "Fraunces", label: "Fraunces" }],
      templateOptions: [],
      commonAllergenCatalog: [],
      bridgeClient: {
        ping: async () => true,
        list: async () => [],
        request,
        readFileBytes: async () => null,
        prepareProjectDerivedAssets: async (_slug, value) => value
      },
      userManagedRoots: ["originals/backgrounds", "originals/items", "originals/fonts"],
      workflowRefs: { pulseTimer: null, resetTimer: null },
      assetTaskRefs: { pulseTimer: null, resetTimer: null },
      getState: () => state,
      setState: (patch) => Object.assign(state, patch),
      touchDraft: () => undefined,
      cloneProject: (value) => structuredClone(value),
      createEmptyProject: () => createProject(),
      initCarouselIndices: () => undefined,
      resetTemplateDemoCache: () => undefined,
      syncWizardShowcaseVisibility: () => undefined,
      buildWizardShowcaseProject: async () => null,
      getLocalizedValue: (value, locale, fallback) => value?.[locale] ?? fallback,
      normalizeBackgroundCarouselSeconds: (value) => Number(value) || 10,
      normalizeSectionBackgroundId: (value) => value ?? "",
      getSectionModeBackgroundEntries: () => [],
      autoAssignSectionBackgroundsByOrder: () => undefined,
      getNextUnusedSectionBackgroundId: () => "",
      ensureDescription: (item) => item.description,
      ensureLongDescription: (item) => item.longDescription,
      ensureAllergens: (item) => item.allergens ?? [],
      resolveTemplateId: (templateId) => templateId,
      isWizardShowcaseEligible: () => true,
      normalizePath: (value) => value,
      readAssetBytes: async () => null,
      buildExportStyles: () => "",
      buildRuntimeScript: () => "",
      getCarouselImageSource: () => "",
      mapLegacyAssetRelativeToManaged: (value) => value,
      isManagedAssetRelativePath: () => true,
      slugifyName: (value) => value,
      normalizeZipName: (value) => value,
      getSuggestedZipName: () => "menu",
      getProjectSlug: () => "demo",
      refreshBridgeEntries: async () => undefined,
      ensureAssetProjectWritable: () => true,
      isProtectedAssetProjectSlug: () => false,
      isLockedManagedAssetRoot: () => false,
      joinAssetFolderPath: (base, child) => `${base}/${child}`.replace(/\/+/g, "/"),
      planEntryMove: (_kind, name, targetPath) => ({
        destinationPath: `${targetPath}/${name}`.replace(/\/+/g, "/"),
        destinationDirPath: targetPath,
        destinationName: name
      }),
      planEntryRename: (currentPath, newName) => {
        const parts = currentPath.split("/");
        parts[parts.length - 1] = newName;
        return parts.join("/");
      },
      getDirectoryHandleByPath: async () => ({}) as FileSystemDirectoryHandle,
      listFilesystemEntries: async () => [],
      copyFileHandleTo: async () => undefined,
      copyDirectoryHandleTo: async () => undefined,
      writeFileToDirectory: async () => undefined,
      showDirectoryPicker: undefined,
      prompt: () => null,
      openProjectDialog: () => undefined,
      promptAssetUpload: async () => undefined,
      getDetailImageSource: () => "/projects/demo/assets/originals/items/img.webp",
      getInteractiveDetailAsset: () => null,
      supportsInteractiveMedia: () => false,
      prefetchInteractiveBytes: async () => null,
      setRotateDirection: () => undefined,
      setupInteractiveMedia: async () => undefined,
      teardownInteractiveMedia: () => undefined,
      getDishRotateDirection: () => -1,
      schedulePostOpen: (task) => task()
    });

    await bindings.assetWorkspaceController.renameEntryNamed(
      {
        id: "originals/backgrounds/hero-old.webp",
        name: "hero-old.webp",
        path: "originals/backgrounds/hero-old.webp",
        kind: "file"
      },
      "hero-new.webp"
    );

    expect(request).toHaveBeenCalledWith("move", "demo", {
      from: "originals/backgrounds/hero-old.webp",
      to: "originals/backgrounds/hero-new.webp"
    });
    expect(state.draft?.meta.logoSrc).toBe("/projects/demo/assets/originals/backgrounds/hero-new.webp");
    expect(state.draft?.meta.fontSource).toBe("/projects/other/assets/originals/backgrounds/hero-old.webp");
    expect(state.draft?.backgrounds[0].src).toBe(
      "/projects/demo/assets/originals/backgrounds/hero-new.webp"
    );
    expect(state.draft?.backgrounds[0].originalSrc).toBe("assets/originals/backgrounds/hero-new.webp");
    expect(state.draft?.categories[0].items[0].typography?.item?.source).toBe(
      "assets/originals/backgrounds/hero-new.webp"
    );
  });
});
