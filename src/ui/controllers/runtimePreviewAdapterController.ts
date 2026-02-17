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
  getDeviceMode: () => "mobile" | "desktop";
  getActiveProject: () => MenuProject | null;
  getCarouselActive: () => Record<string, number>;
  setCarouselActive: (next: Record<string, number>) => void;
  wrapCarouselIndex: (index: number, count: number) => number;
  getJukeboxHorizontalSectionThresholdPx: () => number;
  carouselController: CarouselController;
  previewController: PreviewController;
  previewNavigationController: PreviewNavigationController;
};

export type RuntimePreviewAdapterController = {
  clearCarouselWheelState: () => void;
  syncCarousels: () => Promise<void>;
  initCarouselIndices: (project: MenuProject) => void;
  handleMenuWheel: (event: WheelEvent) => void;
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
  const JUKEBOX_HORIZONTAL_WHEEL_MIN_PX = 0.1;
  const JUKEBOX_VERTICAL_DOMINANCE_RATIO = 2.2;
  const JUKEBOX_VERTICAL_WHEEL_MIN_PX = 10;
  const JUKEBOX_SECTION_WHEEL_COOLDOWN_MS = 240;
  const JUKEBOX_HORIZONTAL_GESTURE_IDLE_MS = 240;
  let sectionWheelCarryByCategory: Record<string, number> = {};
  let sectionWheelCooldownUntilByCategory: Record<string, number> = {};
  let sectionWheelGestureUntilByCategory: Record<string, number> = {};
  let sectionWheelGestureConsumedByCategory: Record<string, boolean> = {};

  const clearCarouselWheelState = () => {
    sectionWheelCarryByCategory = {};
    sectionWheelCooldownUntilByCategory = {};
    sectionWheelGestureUntilByCategory = {};
    sectionWheelGestureConsumedByCategory = {};
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
      syncBackground: deps.previewNavigationController.syncSectionBackgroundByIndex,
      resolveHorizontalIndex:
        capabilities.sectionSnapAxis === "horizontal"
          ? deps.previewNavigationController.resolveHorizontalSectionIndex
          : undefined
    });
  };

  const routeDesktopJukeboxWheel = (categoryId: string, event: WheelEvent) => {
    const absX = Math.abs(event.deltaX);
    const absY = Math.abs(event.deltaY);
    if (absX <= 0.1 && absY <= 0.1) return false;
    const horizontalDelta =
      absX >= JUKEBOX_HORIZONTAL_WHEEL_MIN_PX ? event.deltaX : event.shiftKey ? event.deltaY : 0;
    const verticalIntent =
      !event.shiftKey &&
      absY >= JUKEBOX_VERTICAL_WHEEL_MIN_PX &&
      (absX < JUKEBOX_HORIZONTAL_WHEEL_MIN_PX ||
        absY >= absX * JUKEBOX_VERTICAL_DOMINANCE_RATIO);
    const horizontalIntent =
      Math.abs(horizontalDelta) >= JUKEBOX_HORIZONTAL_WHEEL_MIN_PX && !verticalIntent;
    if (horizontalIntent) {
      event.preventDefault();
      const now = Date.now();
      const gestureUntil = sectionWheelGestureUntilByCategory[categoryId] ?? 0;
      const inGesture = now <= gestureUntil;
      sectionWheelGestureUntilByCategory = {
        ...sectionWheelGestureUntilByCategory,
        [categoryId]: now + JUKEBOX_HORIZONTAL_GESTURE_IDLE_MS
      };
      if (!inGesture) {
        sectionWheelCarryByCategory = {
          ...sectionWheelCarryByCategory,
          [categoryId]: 0
        };
        sectionWheelGestureConsumedByCategory = {
          ...sectionWheelGestureConsumedByCategory,
          [categoryId]: false
        };
      }
      if (sectionWheelGestureConsumedByCategory[categoryId]) return true;
      const lockedUntil = sectionWheelCooldownUntilByCategory[categoryId] ?? 0;
      if (now < lockedUntil) return true;
      const nextCarry = (sectionWheelCarryByCategory[categoryId] ?? 0) + horizontalDelta;
      sectionWheelCarryByCategory = {
        ...sectionWheelCarryByCategory,
        [categoryId]: nextCarry
      };
      const sectionThresholdPx = Math.max(1, deps.getJukeboxHorizontalSectionThresholdPx());
      if (Math.abs(nextCarry) < sectionThresholdPx) return true;
      const direction = nextCarry > 0 ? 1 : -1;
      const menuScroll = deps.queryMenuScroll();
      if (menuScroll) {
        const sections = Array.from(menuScroll.querySelectorAll<HTMLElement>(".menu-section"));
        const currentIndex = deps.previewNavigationController.resolveHorizontalSectionIndex(menuScroll);
        if (
          sections.length > 0 &&
          currentIndex >= 0 &&
          ((direction < 0 && currentIndex <= 0) ||
            (direction > 0 && currentIndex >= sections.length - 1))
        ) {
          sectionWheelCarryByCategory = {
            ...sectionWheelCarryByCategory,
            [categoryId]: 0
          };
          deps.previewNavigationController.recoilSectionBoundary(direction);
          return true;
        }
      }
      sectionWheelCarryByCategory = {
        ...sectionWheelCarryByCategory,
        [categoryId]: 0
      };
      sectionWheelGestureConsumedByCategory = {
        ...sectionWheelGestureConsumedByCategory,
        [categoryId]: true
      };
      sectionWheelCooldownUntilByCategory = {
        ...sectionWheelCooldownUntilByCategory,
        [categoryId]: now + JUKEBOX_SECTION_WHEEL_COOLDOWN_MS
      };
      deps.previewNavigationController.shiftSection(direction);
      return true;
    }
    if (!verticalIntent) return false;
    sectionWheelCarryByCategory = {
      ...sectionWheelCarryByCategory,
      [categoryId]: 0
    };
    sectionWheelGestureConsumedByCategory = {
      ...sectionWheelGestureConsumedByCategory,
      [categoryId]: false
    };
    sectionWheelGestureUntilByCategory = {
      ...sectionWheelGestureUntilByCategory,
      [categoryId]: 0
    };
    deps.carouselController.handleWheel(categoryId, event);
    return true;
  };

  const resolveWheelCategoryId = (event: WheelEvent) => {
    const target = event.target as Element | null;
    const targetCategory = target?.closest<HTMLElement>(".menu-carousel")?.dataset.categoryId;
    if (targetCategory) return targetCategory;
    return deps.previewNavigationController.getActiveSectionCategoryId();
  };

  const shiftSection = (direction: number) => {
    deps.previewNavigationController.shiftSection(direction);
  };

  const shiftCarousel = (categoryId: string, direction: number) => {
    deps.carouselController.shift(categoryId, direction);
  };

  const handleMenuWheel = (event: WheelEvent) => {
    const capabilities = deps.getActiveTemplateCapabilities();
    const isDesktop = deps.getDeviceMode() === "desktop";
    const horizontalSectionMode = capabilities.sectionSnapAxis === "horizontal";
    if (!isDesktop || !horizontalSectionMode) return;
    const categoryId = resolveWheelCategoryId(event);
    if (!categoryId) return;
    if (routeDesktopJukeboxWheel(categoryId, event)) {
      event.stopPropagation();
    }
  };

  const handleCarouselWheel = (categoryId: string, event: WheelEvent) => {
    const capabilities = deps.getActiveTemplateCapabilities();
    const isDesktop = deps.getDeviceMode() === "desktop";
    const horizontalSectionMode = capabilities.sectionSnapAxis === "horizontal";
    if (isDesktop && horizontalSectionMode) {
      if (event.defaultPrevented) return;
      if (routeDesktopJukeboxWheel(categoryId, event)) return;
    }
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
    handleMenuWheel,
    handleMenuScroll,
    shiftSection,
    shiftCarousel,
    handleCarouselWheel,
    handleCarouselTouchStart,
    handleCarouselTouchMove,
    handleCarouselTouchEnd
  };
};
