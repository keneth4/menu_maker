import type { MenuProject } from "../../lib/types";
import type { CarouselController } from "./carouselController";
import type { PreviewController } from "./previewController";
import type { PreviewNavigationController } from "./previewNavigationController";

type RuntimePreviewCapabilities = {
  sectionSnapAxis: "horizontal" | "vertical";
  sectionSnapDelayMs: number;
  carousel: {
    primaryAxis: "horizontal" | "vertical";
  };
};

type RuntimePreviewAdapterDeps = {
  tick: () => Promise<void>;
  queryMenuScroll: () => HTMLElement | null;
  getActiveTemplateCapabilities: () => RuntimePreviewCapabilities;
  getActiveProject: () => MenuProject | null;
  getCarouselActive: () => Record<string, number>;
  setCarouselActive: (next: Record<string, number>) => void;
  wrapCarouselIndex: (index: number, count: number) => number;
  carouselController: CarouselController;
  previewController: PreviewController;
  previewNavigationController: PreviewNavigationController;
};

export type RuntimePreviewAdapterController = {
  clearCarouselWheelState: () => void;
  syncCarousels: () => Promise<void>;
  initCarouselIndices: (project: MenuProject) => void;
  handleMenuScroll: (event: Event) => void;
  shiftSection: (direction: number) => void;
  shiftCarousel: (categoryId: string, direction: number) => void;
  handleCarouselWheel: (categoryId: string, event: WheelEvent) => void;
  handleCarouselTouchStart: (categoryId: string, event: TouchEvent) => void;
  handleCarouselTouchMove: (categoryId: string, event: TouchEvent) => void;
  handleCarouselTouchEnd: (categoryId: string, event: TouchEvent) => void;
};

export const createRuntimePreviewAdapterController = (
  deps: RuntimePreviewAdapterDeps
): RuntimePreviewAdapterController => {
  const clearCarouselWheelState = () => {
    deps.carouselController.clear();
  };

  const syncCarousels = async () => {
    await deps.tick();
    const menuScroll = deps.queryMenuScroll();
    if (menuScroll) {
      deps.previewNavigationController.applySectionFocus(menuScroll);
    }
    if (
      deps.getActiveTemplateCapabilities().carousel.primaryAxis === "vertical" ||
      !deps.getActiveProject()
    ) {
      return;
    }
    const next = { ...deps.getCarouselActive() };
    deps.getActiveProject()?.categories.forEach((category) => {
      const count = category.items.length;
      const current = next[category.id] ?? 0;
      next[category.id] = count > 0 ? deps.wrapCarouselIndex(Math.round(current), count) : 0;
    });
    deps.setCarouselActive(next);
  };

  const initCarouselIndices = (project: MenuProject) => {
    clearCarouselWheelState();
    const next: Record<string, number> = {};
    project.categories.forEach((category) => {
      next[category.id] = 0;
    });
    deps.setCarouselActive(next);
    void syncCarousels();
  };

  const handleMenuScroll = (event: Event) => {
    const container = event.currentTarget as HTMLElement | null;
    if (!container) return;
    const capabilities = deps.getActiveTemplateCapabilities();
    deps.previewController.handleMenuScroll({
      container,
      axis: capabilities.sectionSnapAxis,
      snapDelayMs: capabilities.sectionSnapDelayMs,
      syncBackground: deps.previewNavigationController.syncSectionBackgroundByIndex
    });
  };

  const shiftSection = (direction: number) => {
    deps.previewNavigationController.shiftSection(direction);
  };

  const shiftCarousel = (categoryId: string, direction: number) => {
    deps.carouselController.shift(categoryId, direction);
  };

  const handleCarouselWheel = (categoryId: string, event: WheelEvent) => {
    deps.carouselController.handleWheel(categoryId, event);
  };

  const handleCarouselTouchStart = (categoryId: string, event: TouchEvent) => {
    deps.carouselController.handleTouchStart(categoryId, event);
  };

  const handleCarouselTouchMove = (categoryId: string, event: TouchEvent) => {
    deps.carouselController.handleTouchMove(categoryId, event);
  };

  const handleCarouselTouchEnd = (categoryId: string, event: TouchEvent) => {
    deps.carouselController.handleTouchEnd(categoryId, event);
  };

  return {
    clearCarouselWheelState,
    syncCarousels,
    initCarouselIndices,
    handleMenuScroll,
    shiftSection,
    shiftCarousel,
    handleCarouselWheel,
    handleCarouselTouchStart,
    handleCarouselTouchMove,
    handleCarouselTouchEnd
  };
};
