import type { MenuCategory, MenuItem, MenuProject } from "../../lib/types";
import type { TemplateCapabilities, TemplateId, TemplateStrategy } from "../../core/templates/registry";
import type { ProjectSummary } from "../../lib/loadProjects";

export type EditorTab = "info" | "assets" | "edit" | "wizard";
export type DeviceMode = "mobile" | "desktop";
export type PreviewMode = "device" | "mobile" | "full";
export type WorkflowMode = "save" | "export" | "upload" | null;
export type AssetMode = "filesystem" | "bridge" | "none";

export type ShellState = {
  showLanding: boolean;
  editorOpen: boolean;
  editorTab: EditorTab;
  uiLang: "es" | "en";
  languageMenuOpen: boolean;
  loadError: string;
  openError: string;
  exportError: string;
  exportStatus: string;
  previewMode: PreviewMode;
  deviceMode: DeviceMode;
};

export type ProjectState = {
  project: MenuProject | null;
  draft: MenuProject | null;
  activeProject: MenuProject | null;
  projects: ProjectSummary[];
  activeSlug: string;
  locale: string;
  editLang: string;
  wizardLang: string;
  wizardStep: number;
  wizardCategoryId: string;
  wizardItemId: string;
  wizardCategory: MenuCategory | null;
  wizardItem: MenuItem | null;
  wizardDemoPreview: boolean;
  wizardNeedsRootBackground: boolean;
  wizardShowcaseProject: MenuProject | null;
  wizardStatus: {
    structure: boolean;
    identity: boolean;
    categories: boolean;
    dishes: boolean;
    preview: boolean;
  };
  wizardProgress: number;
  templateSyncSignature: string;
  fontChoice: string;
  selectedCategoryId: string;
  selectedItemId: string;
  selectedCategory: MenuCategory | null;
  selectedItem: MenuItem | null;
  activeTemplateId: TemplateId;
  activeTemplateCapabilities: TemplateCapabilities;
  activeTemplateStrategy: TemplateStrategy;
};

export type AssetTreeEntry = {
  id: string;
  name: string;
  path: string;
  kind: "file" | "directory";
  source: "filesystem" | "bridge";
};

export type AssetState = {
  assetMode: AssetMode;
  assetProjectReadOnly: boolean;
  bridgeAvailable: boolean;
  bridgeProjectSlug: string;
  rootLabel: string;
  fsError: string;
  fsEntries: AssetTreeEntry[];
  selectedAssetIds: string[];
  uploadTargetPath: string;
  uploadFolderOptions: { value: string; label: string }[];
  expandedPaths: Record<string, boolean>;
  rootFiles: string[];
  assetOptions: { value: string; label: string }[];
  fontAssetOptions: { value: string; label: string }[];
};

export type PreviewState = {
  previewFontStack: string;
  previewFontVars: string;
  fontFaceCss: string;
  builtInFontHrefs: string[];
  carouselActive: Record<string, number>;
  previewBackgrounds: { id: string; src: string }[];
  loadedPreviewBackgroundIndexes: number[];
  activeBackgroundIndex: number;
  previewStartupLoading: boolean;
  previewStartupProgress: number;
  previewStartupBlockingSources: Set<string>;
  sectionBackgroundIndexByCategory: Record<string, number>;
};

export type WorkflowState = {
  workflowMode: WorkflowMode;
  workflowStep: string;
  workflowProgress: number;
  assetTaskVisible: boolean;
  assetTaskStep: string;
  assetTaskProgress: number;
};

export type ModalState = {
  activeItem: { category: string; itemId: string } | null;
  detailRotateDirection: 1 | -1;
};
