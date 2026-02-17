import type { MenuItem } from "../../lib/types";
import type { EditorTab, PreviewMode } from "./state";

export type ShellActions = {
  setEditorTab: (tab: EditorTab) => void;
  toggleEditor: () => void;
  togglePreviewMode: () => void;
  startCreateProject: () => Promise<void>;
  startOpenProject: () => void;
  startWizard: () => Promise<void>;
};

export type ProjectActions = {
  createNewProject: (options?: { forWizard?: boolean }) => Promise<void>;
  saveProject: () => Promise<void>;
  exportStaticSite: () => Promise<void>;
  handleProjectFile: (event: Event) => Promise<void>;
  touchDraft: () => void;
};

export type AssetActions = {
  pickRootFolder: () => Promise<void>;
  refreshEntries: () => Promise<void>;
  uploadAssets: (files: FileList | File[]) => Promise<void>;
  createFolder: () => Promise<void>;
  renameEntry: (entryId: string) => Promise<void>;
  moveEntry: (entryId: string) => Promise<void>;
  deleteEntry: (entryId: string) => Promise<void>;
  bulkMove: () => Promise<void>;
  bulkDelete: () => Promise<void>;
};

export type PreviewActions = {
  shiftSection: (direction: number) => void;
  shiftCarousel: (categoryId: string, direction: number) => void;
  handleMenuWheel: (event: WheelEvent) => void;
  handleMenuScroll: (event: Event) => void;
  handleCarouselWheel: (categoryId: string, event: WheelEvent) => void;
  handleCarouselTouchStart: (categoryId: string, event: TouchEvent) => void;
  handleCarouselTouchMove: (categoryId: string, event: TouchEvent) => void;
  handleCarouselTouchEnd: (categoryId: string, event: TouchEvent) => void;
  openDish: (categoryId: string, itemId: string) => void;
  closeDish: () => void;
  getItemFontStyle: (item: MenuItem) => string;
};

export type WorkflowActions = {
  startWorkflow: (mode: "save" | "export" | "upload", step: string, percent?: number) => void;
  updateWorkflow: (step: string, percent: number) => void;
  finishWorkflow: (step: string) => void;
  failWorkflow: () => void;
  startAssetTask: (step: string, percent?: number) => void;
  updateAssetTask: (step: string, percent: number) => void;
  finishAssetTask: (step: string) => void;
  failAssetTask: () => void;
};

export type ModalActions = {
  openDish: (categoryId: string, itemId: string) => void;
  closeDish: () => void;
};

export type AppActions = {
  shell: ShellActions;
  project: ProjectActions;
  asset: AssetActions;
  preview: PreviewActions;
  workflow: WorkflowActions;
  modal: ModalActions;
};
