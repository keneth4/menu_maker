import {
  applySectionFocus as applySectionFocusWorkflow,
  centerSection as centerSectionWorkflow,
  centerSectionHorizontally as centerSectionHorizontallyWorkflow,
  getClosestHorizontalSectionIndex as getClosestHorizontalSectionIndexWorkflow,
  getClosestSectionIndex as getClosestSectionIndexWorkflow,
  isKeyboardEditableTarget as isKeyboardEditableTargetWorkflow
} from "../../application/preview/navigationWorkflow";
import type { MenuProject } from "../../lib/types";

type ActiveItem = { category: string; itemId: string } | null;

type PreviewCapabilities = {
  sectionSnapAxis: "horizontal" | "vertical";
};

type PreviewNavigationControllerDeps = {
  getProject: () => MenuProject | null;
  getTemplateCapabilities: () => PreviewCapabilities;
  getDeviceMode: () => "mobile" | "desktop";
  getActiveItem: () => ActiveItem;
  getSectionBackgroundIndexByCategory: () => Record<string, number>;
  getActiveBackgroundIndex: () => number;
  setActiveBackgroundIndex: (index: number) => void;
  isSectionBackgroundMode: (project: MenuProject | null) => boolean;
  closeDish: () => void;
  shiftCarousel: (categoryId: string, direction: number) => void;
  isKeyboardEditableTarget?: (target: EventTarget | null) => boolean;
  queryMenuScrollContainer?: () => HTMLElement | null;
};

export type PreviewNavigationController = {
  applySectionFocus: (container: HTMLElement) => void;
  syncSectionBackgroundByIndex: (index: number) => void;
  shiftSection: (direction: number) => void;
  getActiveSectionCategoryId: () => string | null;
  handleDesktopPreviewKeydown: (event: KeyboardEvent) => void;
};

const queryMenuScrollContainerDefault = () =>
  document.querySelector<HTMLElement>(".menu-preview .menu-scroll");

export const createPreviewNavigationController = (
  deps: PreviewNavigationControllerDeps
): PreviewNavigationController => {
  const isKeyboardEditableTarget = deps.isKeyboardEditableTarget ?? isKeyboardEditableTargetWorkflow;
  const queryMenuScrollContainer = deps.queryMenuScrollContainer ?? queryMenuScrollContainerDefault;

  const syncSectionBackgroundByIndex = (index: number) => {
    const project = deps.getProject();
    if (!project || !deps.isSectionBackgroundMode(project)) return;
    const categoryId = project.categories[index]?.id;
    if (!categoryId) return;
    const mappedIndex = deps.getSectionBackgroundIndexByCategory()[categoryId] ?? -1;
    if (mappedIndex === deps.getActiveBackgroundIndex()) return;
    deps.setActiveBackgroundIndex(mappedIndex);
  };

  const applySectionFocus = (container: HTMLElement) => {
    applySectionFocusWorkflow(container, syncSectionBackgroundByIndex);
  };

  const shiftSection = (direction: number) => {
    const container = queryMenuScrollContainer();
    if (!container) return;
    const sections = Array.from(container.querySelectorAll<HTMLElement>(".menu-section"));
    if (sections.length <= 1) return;
    const capabilities = deps.getTemplateCapabilities();
    const current =
      capabilities.sectionSnapAxis === "horizontal"
        ? getClosestHorizontalSectionIndexWorkflow(container)
        : getClosestSectionIndexWorkflow(container);
    if (current < 0) return;
    const next = (current + direction + sections.length) % sections.length;
    if (capabilities.sectionSnapAxis === "horizontal") {
      centerSectionHorizontallyWorkflow(container, next, "smooth");
      syncSectionBackgroundByIndex(next);
      return;
    }
    centerSectionWorkflow(container, next, "smooth");
    applySectionFocus(container);
    syncSectionBackgroundByIndex(next);
  };

  const getActiveSectionCategoryId = () => {
    const project = deps.getProject();
    if (!project?.categories.length) return null;
    const container = queryMenuScrollContainer();
    if (!container) return project.categories[0]?.id ?? null;
    const capabilities = deps.getTemplateCapabilities();
    const index =
      capabilities.sectionSnapAxis === "horizontal"
        ? getClosestHorizontalSectionIndexWorkflow(container)
        : getClosestSectionIndexWorkflow(container);
    if (index < 0) return project.categories[0]?.id ?? null;
    return project.categories[index]?.id ?? project.categories[0]?.id ?? null;
  };

  const handleDesktopPreviewKeydown = (event: KeyboardEvent) => {
    if (event.defaultPrevented) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (isKeyboardEditableTarget(event.target)) return;

    if (event.key === "Escape") {
      if (deps.getActiveItem()) {
        event.preventDefault();
        deps.closeDish();
      }
      return;
    }

    if (deps.getDeviceMode() !== "desktop") return;
    const project = deps.getProject();
    if (deps.getActiveItem() || !project || project.categories.length === 0) return;

    const activeCategoryId = getActiveSectionCategoryId();
    if (!activeCategoryId) return;

    const capabilities = deps.getTemplateCapabilities();
    if (capabilities.sectionSnapAxis === "horizontal") {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        shiftSection(-1);
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        shiftSection(1);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        deps.shiftCarousel(activeCategoryId, -1);
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        deps.shiftCarousel(activeCategoryId, 1);
      }
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      shiftSection(-1);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      shiftSection(1);
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      deps.shiftCarousel(activeCategoryId, -1);
      return;
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      deps.shiftCarousel(activeCategoryId, 1);
    }
  };

  return {
    applySectionFocus,
    syncSectionBackgroundByIndex,
    shiftSection,
    getActiveSectionCategoryId,
    handleDesktopPreviewKeydown
  };
};
