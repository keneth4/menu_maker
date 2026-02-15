import {
  applySectionFocus as applySectionFocusWorkflow,
  centerSection as centerSectionWorkflow,
  centerSectionHorizontally as centerSectionHorizontallyWorkflow,
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
  resolveHorizontalSectionIndex: (container: HTMLElement) => number;
  shiftSection: (direction: number) => void;
  getActiveSectionCategoryId: () => string | null;
  handleDesktopPreviewKeydown: (event: KeyboardEvent) => void;
};

const queryMenuScrollContainerDefault = () =>
  document.querySelector<HTMLElement>(".menu-preview .menu-scroll");

export const createPreviewNavigationController = (
  deps: PreviewNavigationControllerDeps
): PreviewNavigationController => {
  const HORIZONTAL_INDEX_HYSTERESIS_PX = 24;
  let stableHorizontalIndex = -1;
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

  const resolveHorizontalSectionIndex = (container: HTMLElement) => {
    const sections = Array.from(container.querySelectorAll<HTMLElement>(".menu-section"));
    if (sections.length === 0) {
      stableHorizontalIndex = -1;
      return -1;
    }
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

    if (
      stableHorizontalIndex >= 0 &&
      stableHorizontalIndex < sections.length &&
      stableHorizontalIndex !== closestIndex
    ) {
      const stableSection = sections[stableHorizontalIndex];
      const stableCenter = stableSection.offsetLeft + stableSection.offsetWidth / 2;
      const stableDistance = Math.abs(stableCenter - centerX);
      const hysteresisPx = Math.max(
        HORIZONTAL_INDEX_HYSTERESIS_PX,
        Math.round(container.clientWidth * 0.04)
      );
      if (stableDistance <= closestDistance + hysteresisPx) {
        closestIndex = stableHorizontalIndex;
      }
    }

    stableHorizontalIndex = closestIndex;
    return closestIndex;
  };

  const shiftSection = (direction: number) => {
    const container = queryMenuScrollContainer();
    if (!container) return;
    const sections = Array.from(container.querySelectorAll<HTMLElement>(".menu-section"));
    if (sections.length <= 1) return;
    const capabilities = deps.getTemplateCapabilities();
    const current =
      capabilities.sectionSnapAxis === "horizontal"
        ? resolveHorizontalSectionIndex(container)
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
        ? resolveHorizontalSectionIndex(container)
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
    resolveHorizontalSectionIndex,
    shiftSection,
    getActiveSectionCategoryId,
    handleDesktopPreviewKeydown
  };
};
