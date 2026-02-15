import type { TemplateOption } from "../../core/templates/templateOptions";
import type { MenuCategory, MenuItem, MenuProject } from "../../lib/types";
import type { DeviceMode, PreviewMode } from "./state";

export type AssetEntryModel = {
  id: string;
  name: string;
  path: string;
  kind: "file" | "directory";
};

export type AssetTreeRowModel = {
  entry: AssetEntryModel;
  depth: number;
  hasChildren: boolean;
  expanded: boolean;
};

export type AssetsManagerModel = {
  t: (key: string) => string;
  rootLabel: string;
  assetProjectReadOnly: boolean;
  assetUploadInput: HTMLInputElement | null;
  uploadTargetPath: string;
  uploadFolderOptions: { value: string; label: string }[];
  needsAssets: boolean;
  fsError: string;
  assetTaskVisible: boolean;
  assetTaskStep: string;
  assetTaskProgress: number;
  assetMode: "filesystem" | "bridge" | "none";
  fsEntries: AssetEntryModel[];
  treeRows: AssetTreeRowModel[];
  selectedAssetIds: string[];
};

export type AssetsManagerActions = {
  createFolder: () => void;
  handleAssetUpload: (event: Event) => void;
  handleAssetDragOver: (event: DragEvent) => void;
  handleAssetDrop: (event: DragEvent) => void;
  selectAllAssets: () => void;
  clearAssetSelection: () => void;
  bulkMove: () => void;
  bulkDelete: () => void;
  toggleAssetSelection: (entryId: string) => void;
  toggleExpandPath: (path: string) => void;
  renameEntry: (entry: AssetEntryModel) => void;
  moveEntry: (entry: AssetEntryModel) => void;
  deleteEntry: (entry: AssetEntryModel) => void;
  setUploadTargetPath: (path: string) => void;
  setAssetUploadInput: (input: HTMLInputElement | null) => void;
};

export type CommonAllergenModel = {
  id: string;
  label: Record<string, string>;
};

export type EditPanelModel = {
  t: (key: string) => string;
  draft: MenuProject | null;
  deviceMode: DeviceMode;
  previewMode: PreviewMode;
  editPanel: "identity" | "background" | "section" | "dish";
  editLang: string;
  selectedCategoryId: string;
  selectedItemId: string;
  selectedCategory: MenuCategory | null;
  selectedItem: MenuItem | null;
  assetOptions: Array<{ value: string; label: string }>;
  sectionBackgroundOptionsByCategory: Record<string, Array<{ value: string; label: string }>>;
  sectionBackgroundNeedsCoverage: boolean;
  sectionBackgroundHasDuplicates: boolean;
  commonAllergenCatalog: CommonAllergenModel[];
  backgroundCarouselSeconds: number;
};

export type EditPanelActions = {
  cycleEditLang: () => void;
  ensureRestaurantName: () => Record<string, string> | null;
  ensureMetaTitle: () => Record<string, string> | null;
  handleLocalizedInput: (
    localized: Record<string, string>,
    lang: string,
    event: Event
  ) => void;
  getLocalizedValue: (
    value: Record<string, string> | undefined,
    locale: string,
    fallback?: string
  ) => string;
  addSection: () => void;
  deleteSection: () => void;
  addBackground: () => void;
  moveBackground: (id: string, direction: -1 | 1) => void;
  removeBackground: (id: string) => void;
  setBackgroundDisplayMode: (mode: "carousel" | "section") => void;
  setCategoryBackgroundId: (category: MenuCategory, backgroundId: string) => void;
  setBackgroundCarouselSeconds: (seconds: number) => void;
  goPrevDish: () => void;
  goNextDish: () => void;
  addDish: () => void;
  deleteDish: () => void;
  textOf: (value: Record<string, string> | undefined, fallback?: string) => string;
  handleDescriptionInput: (item: MenuItem, lang: string, event: Event) => void;
  handleLongDescriptionInput: (item: MenuItem, lang: string, event: Event) => void;
  isCommonAllergenChecked: (item: MenuItem, id: string) => boolean;
  handleCommonAllergenToggle: (item: MenuItem, allergenId: string, event: Event) => void;
  getCommonAllergenLabel: (allergen: CommonAllergenModel, lang?: string) => string;
  getCustomAllergensInput: (item: MenuItem, lang?: string) => string;
  handleCustomAllergensInput: (item: MenuItem, lang: string, event: Event) => void;
  handleVeganToggle: (item: MenuItem, event: Event) => void;
  setIdentityMode: (mode: "text" | "logo") => void;
  setLogoSrc: (src: string) => void;
  setItemRotationDirection: (item: MenuItem, direction: "cw" | "ccw") => void;
  setItemScrollAnimationMode: (item: MenuItem, mode: "hero360" | "alternate") => void;
  setItemScrollAnimationSrc: (item: MenuItem, src: string) => void;
  setFontRoleSource: (role: "identity" | "section" | "item", source: string) => void;
  setItemFontSource: (item: MenuItem, source: string) => void;
  setItemPriceVisible: (item: MenuItem, visible: boolean) => void;
  touchDraft: () => void;
  setEditPanel: (panel: "identity" | "background" | "section" | "dish") => void;
  setSelectedCategoryId: (categoryId: string) => void;
  setSelectedItemId: (itemId: string) => void;
};

export type WizardStatusModel = {
  structure: boolean;
  identity: boolean;
  categories: boolean;
  dishes: boolean;
  preview: boolean;
};

export type WizardPanelModel = {
  t: (key: string) => string;
  draft: MenuProject | null;
  uiLang: "es" | "en";
  templateOptions: TemplateOption[];
  wizardStep: number;
  wizardSteps: string[];
  wizardProgress: number;
  wizardStatus: WizardStatusModel;
  wizardLang: string;
  wizardCategoryId: string;
  wizardItemId: string;
  wizardCategory: MenuCategory | null;
  wizardItem: MenuItem | null;
  wizardDemoPreview: boolean;
  wizardNeedsRootBackground: boolean;
  assetOptions: Array<{ value: string; label: string }>;
  sectionBackgroundOptionsByCategory: Record<string, Array<{ value: string; label: string }>>;
  sectionBackgroundNeedsCoverage: boolean;
  sectionBackgroundHasDuplicates: boolean;
};

export type WizardPanelActions = {
  isWizardStepValid: (index: number) => boolean;
  goToStep: (index: number) => void;
  applyTemplate: (templateId: string, options?: { source?: "wizard" | "project" }) => Promise<void> | void;
  addBackground: () => void;
  removeBackground: (id: string) => void;
  setBackgroundDisplayMode: (mode: "carousel" | "section") => void;
  setCategoryBackgroundId: (category: MenuCategory, backgroundId: string) => void;
  addWizardCategory: () => void;
  removeWizardCategory: (id: string) => void;
  addWizardDish: () => void;
  removeWizardDish: () => void;
  setIdentityMode: (mode: "text" | "logo") => void;
  setLogoSrc: (src: string) => void;
  setItemRotationDirection: (item: MenuItem, direction: "cw" | "ccw") => void;
  setItemScrollAnimationMode: (item: MenuItem, mode: "hero360" | "alternate") => void;
  setItemScrollAnimationSrc: (item: MenuItem, src: string) => void;
  setFontRoleSource: (role: "identity" | "section" | "item", source: string) => void;
  setItemFontSource: (item: MenuItem, source: string) => void;
  setItemPriceVisible: (item: MenuItem, visible: boolean) => void;
  handleLocalizedInput: (
    localized: Record<string, string>,
    lang: string,
    event: Event
  ) => void;
  handleDescriptionInput: (item: MenuItem, lang: string, event: Event) => void;
  getLocalizedValue: (
    value: Record<string, string> | undefined,
    locale: string,
    fallback?: string
  ) => string;
  goPrevStep: () => void;
  goNextStep: () => void;
  exportStaticSite: () => Promise<void> | void;
  touchDraft: () => void;
  setWizardLang: (lang: string) => void;
  setWizardCategoryId: (categoryId: string) => void;
  setWizardItemId: (itemId: string) => void;
};

export type ProjectInfoPanelModel = {
  t: (key: string) => string;
  draft: MenuProject | null;
  uiLang: "es" | "en";
  templateOptions: TemplateOption[];
  workflowMode: "save" | "export" | "upload" | null;
  openError: string;
  exportStatus: string;
  exportError: string;
  workflowStep: string;
  workflowProgress: number;
  fontChoice: string;
  fontAssetOptions: Array<{ value: string; label: string }>;
};

export type ProjectInfoPanelActions = {
  createNewProject: () => Promise<void> | void;
  openProjectDialog: () => void;
  saveProject: () => Promise<void> | void;
  exportStaticSite: () => Promise<void> | void;
  setTemplate: (templateId: string) => Promise<void> | void;
  toggleLanguage: (code: string) => void;
  handleCurrencyChange: (event: Event) => void;
  toggleCurrencyPosition: () => void;
  handleFontSelect: (event: Event) => void;
  handleCustomFontSourceInput: (event: Event) => void;
};

export type PreviewBackgroundModel = {
  id: string;
  src: string;
};

export type PreviewCanvasModel = {
  effectivePreview: string;
  activeProject: MenuProject;
  previewStartupLoading: boolean;
  previewStartupProgress: number;
  startupBlockingSources: Set<string>;
  previewBackgrounds: PreviewBackgroundModel[];
  loadedBackgroundIndexes: number[];
  activeBackgroundIndex: number;
  isBlankMenu: boolean;
  locale: string;
  carouselActive: Record<string, number>;
  deviceMode: DeviceMode;
  previewFontStack: string;
  previewFontVars: string;
  t: (key: string) => string;
  textOf: (value: Record<string, string> | undefined, fallback?: string) => string;
  getLoadingLabel: (locale: string) => string;
  getTemplateScrollHint: (locale: string, templateId: string) => string;
  getCarouselImageSource: (item: MenuItem) => string;
  buildResponsiveSrcSetFromMedia: (item: MenuItem) => string | undefined;
  getMenuTerm: (key: string) => string;
  formatPrice: (amount: number) => string;
  getDishTapHint: (locale: string) => string;
  getAssetOwnershipDisclaimer: (locale: string) => string;
  getItemFontStyle: (item: MenuItem) => string;
};

export type PreviewCanvasActions = {
  shiftSection: (direction: number) => void;
  handleMenuScroll: (event: Event) => void;
  shiftCarousel: (categoryId: string, direction: number) => void;
  handleCarouselWheel: (categoryId: string, event: WheelEvent) => void;
  handleCarouselTouchStart: (categoryId: string, event: TouchEvent) => void;
  handleCarouselTouchMove: (categoryId: string, event: TouchEvent) => void;
  handleCarouselTouchEnd: (categoryId: string, event: TouchEvent) => void;
  openDish: (categoryId: string, itemId: string) => void;
  prefetchDishDetail: (categoryId: string, itemId: string, includeNeighbors?: boolean) => void;
  setLocale: (locale: string) => void;
};

export type DishModalModel = {
  dish: MenuItem;
  interactiveEnabled: boolean;
  itemFontStyle: string;
  modalMediaHost: HTMLDivElement | null;
  modalMediaImage: HTMLImageElement | null;
  textOf: (value: Record<string, string> | undefined, fallback?: string) => string;
  getDetailImageSource: (value: MenuItem) => string;
  getAllergenValues: (value: MenuItem) => string[];
  getMenuTerm: (key: string) => string;
  formatPrice: (value: number) => string;
};

export type DishModalActions = {
  close: () => void;
  setModalMediaHost: (host: HTMLDivElement | null) => void;
  setModalMediaImage: (image: HTMLImageElement | null) => void;
};

export type RuntimeSurfaceHostModel = {
  activeItem: { category: string; itemId: string } | null;
  dish: MenuItem | null;
  interactiveEnabled: boolean;
  itemFontStyle: string;
  modalMediaHost: HTMLDivElement | null;
  modalMediaImage: HTMLImageElement | null;
  textOf: (value: Record<string, string> | undefined, fallback?: string) => string;
  getDetailImageSource: (value: MenuItem) => string;
  getAllergenValues: (value: MenuItem) => string[];
  getMenuTerm: (key: string) => string;
  formatPrice: (value: number) => string;
  assetOptions: Array<{ value: string; label: string }>;
  fontAssetOptions: Array<{ value: string; label: string }>;
};

export type RuntimeSurfaceHostActions = {
  closeDish: () => void;
  setModalMediaHost: (host: HTMLDivElement | null) => void;
  setModalMediaImage: (image: HTMLImageElement | null) => void;
};
