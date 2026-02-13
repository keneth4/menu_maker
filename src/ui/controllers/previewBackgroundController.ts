import type { MenuProject } from "../../lib/types";
import type { BackgroundRotationController } from "./backgroundRotationController";

type PreviewBackground = {
  id: string;
  src: string;
};

type PreviewBackgroundControllerDeps = {
  defaultCarouselSeconds: number;
  minCarouselSeconds: number;
  maxCarouselSeconds: number;
  rotationController: BackgroundRotationController;
  getActiveProject: () => MenuProject | null;
  getPreviewBackgrounds: () => PreviewBackground[];
  getActiveBackgroundIndex: () => number;
  setActiveBackgroundIndex: (index: number) => void;
  getSectionBackgroundIndexByCategory: () => Record<string, number>;
  getActiveSectionCategoryId: () => string | null;
  getLoadedBackgroundIndexes: () => number[];
  setLoadedBackgroundIndexes: (indexes: number[]) => void;
};

export type PreviewBackgroundController = {
  normalizeBackgroundCarouselSeconds: (value: unknown) => number;
  isSectionBackgroundMode: (project: MenuProject | null) => boolean;
  getBackgroundRotationIntervalMs: (project: MenuProject | null) => number;
  syncRotation: () => void;
  syncSectionModeActiveIndex: () => void;
  syncLoadedBackgroundIndexes: () => void;
  destroy: () => void;
};

export const createPreviewBackgroundController = (
  deps: PreviewBackgroundControllerDeps
): PreviewBackgroundController => {
  const normalizeBackgroundCarouselSeconds = (value: unknown) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return deps.defaultCarouselSeconds;
    return Math.min(deps.maxCarouselSeconds, Math.max(deps.minCarouselSeconds, Math.round(parsed)));
  };

  const isSectionBackgroundMode = (project: MenuProject | null) =>
    project?.meta.backgroundDisplayMode === "section";

  const getBackgroundRotationIntervalMs = (project: MenuProject | null) =>
    normalizeBackgroundCarouselSeconds(project?.meta.backgroundCarouselSeconds) * 1000;

  const syncRotation = () => {
    const project = deps.getActiveProject();
    const count = deps.getPreviewBackgrounds().length;
    if (isSectionBackgroundMode(project)) {
      deps.rotationController.clear();
      if (count < 1 && deps.getActiveBackgroundIndex() !== -1) {
        deps.setActiveBackgroundIndex(-1);
      }
      return;
    }
    if (count < 2) {
      deps.rotationController.clear();
      if (deps.getActiveBackgroundIndex() !== 0) {
        deps.setActiveBackgroundIndex(0);
      }
      return;
    }
    const activeIndex = deps.getActiveBackgroundIndex();
    if (activeIndex < 0 || activeIndex >= count) {
      deps.setActiveBackgroundIndex(0);
    }
    deps.rotationController.sync(count, getBackgroundRotationIntervalMs(project), () => {
      deps.setActiveBackgroundIndex((deps.getActiveBackgroundIndex() + 1) % count);
    });
  };

  const syncSectionModeActiveIndex = () => {
    const project = deps.getActiveProject();
    if (!project || !isSectionBackgroundMode(project)) return;
    const activeCategoryId =
      deps.getActiveSectionCategoryId() ??
      project.categories[0]?.id ??
      null;
    if (!activeCategoryId) {
      if (deps.getActiveBackgroundIndex() !== -1) {
        deps.setActiveBackgroundIndex(-1);
      }
      return;
    }
    const mappedIndex = deps.getSectionBackgroundIndexByCategory()[activeCategoryId] ?? -1;
    if (mappedIndex !== deps.getActiveBackgroundIndex()) {
      deps.setActiveBackgroundIndex(mappedIndex);
    }
  };

  const syncLoadedBackgroundIndexes = () => {
    const previewBackgrounds = deps.getPreviewBackgrounds();
    const count = previewBackgrounds.length;
    const activeBackgroundIndex = deps.getActiveBackgroundIndex();
    const loadedPreviewBackgroundIndexes = deps.getLoadedBackgroundIndexes();
    const nextIndexes: number[] = [];
    if (count > 0 && activeBackgroundIndex >= 0) {
      const active = Math.min(Math.max(activeBackgroundIndex, 0), count - 1);
      nextIndexes.push(active);
      if (count > 1) {
        nextIndexes.push((active + 1) % count);
      }
      loadedPreviewBackgroundIndexes.forEach((index) => {
        if (index < 0 || index >= count) return;
        if (!nextIndexes.includes(index)) {
          nextIndexes.push(index);
        }
      });
    }
    const sameLength = nextIndexes.length === loadedPreviewBackgroundIndexes.length;
    const sameEntries =
      sameLength && nextIndexes.every((value, index) => value === loadedPreviewBackgroundIndexes[index]);
    if (!sameEntries) {
      deps.setLoadedBackgroundIndexes(nextIndexes);
    }
  };

  const destroy = () => {
    deps.rotationController.clear();
  };

  return {
    normalizeBackgroundCarouselSeconds,
    isSectionBackgroundMode,
    getBackgroundRotationIntervalMs,
    syncRotation,
    syncSectionModeActiveIndex,
    syncLoadedBackgroundIndexes,
    destroy
  };
};
