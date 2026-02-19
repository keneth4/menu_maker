<script lang="ts">
  import type { MenuCategory, MenuItem, MenuProject } from "../../lib/types";
  import AssetsManager from "./AssetsManager.svelte";
  import EditPanel from "./EditPanel.svelte";
  import ProjectInfoPanel from "./ProjectInfoPanel.svelte";
  import WizardPanel from "./WizardPanel.svelte";

  export let editorTab: "info" | "assets" | "edit" | "wizard" = "info";
  export let t: (key: string) => string = (key) => key;

  export let draft: MenuProject | null = null;
  export let uiLang: "es" | "en" = "es";
  export let templateOptions: Array<{ id: string; label: Record<string, string> }> = [];
  export let workflowMode: "save" | "export" | "upload" | null = null;
  export let openError = "";
  export let exportStatus = "";
  export let exportError = "";
  export let workflowStep = "";
  export let workflowProgress = 0;

  export let rootLabel = "";
  export let assetProjectReadOnly = false;
  export let assetUploadInput: HTMLInputElement | null = null;
  export let uploadTargetPath = "";
  export let uploadFolderOptions: Array<{ value: string; label: string }> = [];
  export let needsAssets = false;
  export let fsError = "";
  export let assetTaskVisible = false;
  export let assetTaskStep = "";
  export let assetTaskProgress = 0;
  export let assetMode: "filesystem" | "bridge" | "none" = "none";
  export let fsEntries: any[] = [];
  export let treeRows: any[] = [];
  export let selectedAssetIds: string[] = [];

  export let deviceMode: "mobile" | "desktop" = "desktop";
  export let previewMode: "device" | "mobile" | "full" = "device";
  export let editPanel: "identity" | "background" | "section" | "dish" = "identity";
  export let editLang = "es";
  export let selectedCategoryId = "";
  export let selectedItemId = "";
  export let selectedCategory: MenuCategory | null = null;
  export let selectedItem: MenuItem | null = null;
  export let assetOptions: Array<{ value: string; label: string }> = [];
  export let sectionBackgroundOptionsByCategory: Record<string, Array<{ value: string; label: string }>> =
    {};
  export let sectionBackgroundNeedsCoverage = false;
  export let sectionBackgroundHasDuplicates = false;
  export let commonAllergenCatalog: Array<{ id: string; label: Record<string, string> }> = [];
  export let normalizeBackgroundCarouselSeconds: (value: unknown) => number = () => 10;

  export let wizardStep = 0;
  export let wizardSteps: string[] = [];
  export let wizardProgress = 0;
  export let wizardStatus: {
    structure: boolean;
    identity: boolean;
    categories: boolean;
    dishes: boolean;
    preview: boolean;
  } = {
    structure: false,
    identity: false,
    categories: false,
    dishes: false,
    preview: false
  };
  export let wizardLang = "es";
  export let wizardCategoryId = "";
  export let wizardItemId = "";
  export let wizardCategory: MenuCategory | null = null;
  export let wizardItem: MenuItem | null = null;
  export let wizardDemoPreview = false;
  export let wizardNeedsRootBackground = false;

  export let editorDraftController: any;
  export let projectWorkflowController: any;
  export let assetWorkspaceController: any;

  export let getLocalizedValue: (
    value: Record<string, string> | undefined,
    locale: string,
    fallback?: string
  ) => string = () => "";
  export let textOf: (value: Record<string, string> | undefined, fallback?: string) => string =
    () => "";
  export let ensureRestaurantName: () => Record<string, string> | null = () => null;
  export let ensureMetaTitle: () => Record<string, string> | null = () => null;
  export let touchDraft: () => void = () => undefined;

  export let setUploadTargetPath: (path: string) => void = () => undefined;
  export let setAssetUploadInput: (input: HTMLInputElement | null) => void = () => undefined;
  export let setEditPanel: (panel: "identity" | "background" | "section" | "dish") => void =
    () => undefined;
  export let setSelectedCategoryId: (categoryId: string) => void = () => undefined;
  export let setSelectedItemId: (itemId: string) => void = () => undefined;
  export let setWizardLang: (lang: string) => void = () => undefined;
  export let setWizardCategoryId: (categoryId: string) => void = () => undefined;
  export let setWizardItemId: (itemId: string) => void = () => undefined;

  export let isWizardStepValid: (index: number) => boolean = () => false;
  export let goToStep: (index: number) => void = () => undefined;
  export let goPrevStep: () => void = () => undefined;
  export let goNextStep: () => void = () => undefined;
</script>

{#if editorTab === "info"}
  <ProjectInfoPanel
    model={{
      t,
      draft,
      uiLang,
      templateOptions,
      workflowMode,
      openError,
      exportStatus,
      exportError,
      workflowStep,
      workflowProgress,
      scrollSensitivity: {
        item: draft?.meta.scrollSensitivity?.item ?? 5,
        section: draft?.meta.scrollSensitivity?.section ?? 5
      }
    }}
    actions={{
      createNewProject: projectWorkflowController.createNewProject,
      openProjectDialog: projectWorkflowController.openProjectDialog,
      saveProject: projectWorkflowController.saveProject,
      exportStaticSite: projectWorkflowController.exportStaticSite,
      setTemplate: (templateId) =>
        editorDraftController.applyTemplate(templateId, { source: "project" }),
      toggleLanguage: editorDraftController.toggleLanguage,
      setDefaultLocale: editorDraftController.setDefaultLocale,
      handleCurrencyChange: editorDraftController.handleCurrencyChange,
      toggleCurrencyPosition: editorDraftController.toggleCurrencyPosition,
      setItemScrollSensitivity: editorDraftController.setItemScrollSensitivity,
      setSectionScrollSensitivity: editorDraftController.setSectionScrollSensitivity
    }}
  />
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
      createFolder: assetWorkspaceController.createFolder,
      createFolderNamed: assetWorkspaceController.createFolderNamed,
      handleAssetUpload: assetWorkspaceController.handleAssetUpload,
      handleAssetDragOver: assetWorkspaceController.handleAssetDragOver,
      handleAssetDrop: assetWorkspaceController.handleAssetDrop,
      selectAllAssets: assetWorkspaceController.selectAllAssets,
      clearAssetSelection: assetWorkspaceController.clearAssetSelection,
      bulkMove: assetWorkspaceController.bulkMove,
      bulkDelete: assetWorkspaceController.bulkDelete,
      toggleAssetSelection: assetWorkspaceController.toggleAssetSelection,
      toggleExpandPath: assetWorkspaceController.toggleExpandPath,
      renameEntry: assetWorkspaceController.renameEntry,
      renameEntryNamed: assetWorkspaceController.renameEntryNamed,
      moveEntry: assetWorkspaceController.moveEntry,
      deleteEntry: assetWorkspaceController.deleteEntry,
      setUploadTargetPath,
      setAssetUploadInput
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
      backgroundCarouselSeconds: normalizeBackgroundCarouselSeconds(draft?.meta.backgroundCarouselSeconds)
    }}
    actions={{
      cycleEditLang: editorDraftController.cycleEditLang,
      ensureRestaurantName,
      ensureMetaTitle,
      handleLocalizedInput: editorDraftController.handleLocalizedInput,
      getLocalizedValue,
      addSection: editorDraftController.addSection,
      deleteSection: editorDraftController.deleteSection,
      deleteSectionById: editorDraftController.deleteSectionById,
      setSectionNameById: editorDraftController.setSectionNameById,
      addBackground: editorDraftController.addBackground,
      moveBackground: editorDraftController.moveBackground,
      removeBackground: editorDraftController.removeBackground,
      setBackgroundDisplayMode: editorDraftController.setBackgroundDisplayMode,
      setCategoryBackgroundId: editorDraftController.setCategoryBackgroundId,
      setBackgroundCarouselSeconds: editorDraftController.setBackgroundCarouselSeconds,
      goPrevDish: editorDraftController.goPrevDish,
      goNextDish: editorDraftController.goNextDish,
      addDish: editorDraftController.addDish,
      deleteDish: editorDraftController.deleteDish,
      textOf,
      handleDescriptionInput: editorDraftController.handleDescriptionInput,
      handleLongDescriptionInput: editorDraftController.handleLongDescriptionInput,
      isCommonAllergenChecked: editorDraftController.isCommonAllergenChecked,
      handleCommonAllergenToggle: editorDraftController.handleCommonAllergenToggle,
      getCommonAllergenLabel: editorDraftController.getCommonAllergenLabel,
      getCustomAllergensInput: editorDraftController.getCustomAllergensInput,
      handleCustomAllergensInput: editorDraftController.handleCustomAllergensInput,
      handleVeganToggle: editorDraftController.handleVeganToggle,
      setIdentityMode: editorDraftController.setIdentityMode,
      setLogoSrc: editorDraftController.setLogoSrc,
      setFontRoleSelection: editorDraftController.setFontRoleSelection,
      setItemRotationDirection: editorDraftController.setItemRotationDirection,
      setItemScrollAnimationMode: editorDraftController.setItemScrollAnimationMode,
      setItemScrollAnimationSrc: editorDraftController.setItemScrollAnimationSrc,
      setItemFontSelection: editorDraftController.setItemFontSelection,
      setItemPriceVisible: editorDraftController.setItemPriceVisible,
      touchDraft,
      setEditPanel,
      setSelectedCategoryId,
      setSelectedItemId
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
      applyTemplate: editorDraftController.applyTemplate,
      addBackground: editorDraftController.addBackground,
      removeBackground: editorDraftController.removeBackground,
      setBackgroundDisplayMode: editorDraftController.setBackgroundDisplayMode,
      setCategoryBackgroundId: editorDraftController.setCategoryBackgroundId,
      addWizardCategory: editorDraftController.addWizardCategory,
      removeWizardCategory: editorDraftController.removeWizardCategory,
      addWizardDish: editorDraftController.addWizardDish,
      removeWizardDish: editorDraftController.removeWizardDish,
      setIdentityMode: editorDraftController.setIdentityMode,
      setLogoSrc: editorDraftController.setLogoSrc,
      setFontRoleSelection: editorDraftController.setFontRoleSelection,
      setItemRotationDirection: editorDraftController.setItemRotationDirection,
      setItemScrollAnimationMode: editorDraftController.setItemScrollAnimationMode,
      setItemScrollAnimationSrc: editorDraftController.setItemScrollAnimationSrc,
      setItemFontSelection: editorDraftController.setItemFontSelection,
      setItemPriceVisible: editorDraftController.setItemPriceVisible,
      handleLocalizedInput: editorDraftController.handleLocalizedInput,
      handleDescriptionInput: editorDraftController.handleDescriptionInput,
      getLocalizedValue,
      goPrevStep,
      goNextStep,
      exportStaticSite: projectWorkflowController.exportStaticSite,
      touchDraft,
      setWizardLang,
      setWizardCategoryId,
      setWizardItemId
    }}
  />
{/if}
