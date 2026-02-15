import {
  applySectionFocus,
  centerSectionHorizontally,
  centerSection,
  getClosestHorizontalSectionIndex,
  getClosestSectionIndex
} from "../../application/preview/navigationWorkflow";

export type PreviewController = {
  syncFocus: (container: HTMLElement, syncBackground: (index: number) => void) => void;
  snapVertical: (container: HTMLElement) => void;
  snapHorizontal: (container: HTMLElement) => void;
  handleMenuScroll: (options: {
    container: HTMLElement;
    axis: "horizontal" | "vertical";
    snapDelayMs: number;
    syncBackground: (index: number) => void;
    resolveHorizontalIndex?: (container: HTMLElement) => number;
  }) => void;
  destroy: () => void;
};

export const createPreviewController = (): PreviewController => {
  let sectionFocusRaf: number | null = null;
  let sectionSnapTimeout: ReturnType<typeof setTimeout> | null = null;

  const syncFocus = (container: HTMLElement, syncBackground: (index: number) => void) => {
    applySectionFocus(container, syncBackground);
  };

  const snapVertical = (container: HTMLElement) => {
    const index = getClosestSectionIndex(container);
    if (index >= 0) {
      centerSection(container, index, "smooth");
    }
  };

  const snapHorizontal = (container: HTMLElement) => {
    const index = getClosestHorizontalSectionIndex(container);
    if (index >= 0) {
      centerSectionHorizontally(container, index, "smooth");
    }
  };

  const handleMenuScroll = ({
    container,
    axis,
    snapDelayMs,
    syncBackground,
    resolveHorizontalIndex
  }: {
    container: HTMLElement;
    axis: "horizontal" | "vertical";
    snapDelayMs: number;
    syncBackground: (index: number) => void;
    resolveHorizontalIndex?: (container: HTMLElement) => number;
  }) => {
    if (axis === "horizontal") {
      if (container.scrollWidth <= container.clientWidth + 4) return;
      const resolveIndex = resolveHorizontalIndex ?? getClosestHorizontalSectionIndex;
      const closestIndex = resolveIndex(container);
      if (closestIndex >= 0) {
        syncBackground(closestIndex);
      }
      if (sectionSnapTimeout) {
        clearTimeout(sectionSnapTimeout);
      }
      sectionSnapTimeout = setTimeout(() => {
        const snapIndex = resolveIndex(container);
        if (snapIndex >= 0) {
          centerSectionHorizontally(container, snapIndex, "smooth");
          syncBackground(snapIndex);
        }
      }, snapDelayMs);
      return;
    }

    if (sectionFocusRaf) {
      cancelAnimationFrame(sectionFocusRaf);
    }
    sectionFocusRaf = requestAnimationFrame(() => {
      applySectionFocus(container, syncBackground);
    });
    if (sectionSnapTimeout) {
      clearTimeout(sectionSnapTimeout);
    }
    sectionSnapTimeout = setTimeout(() => {
      if (container.scrollHeight <= container.clientHeight + 4) {
        applySectionFocus(container, syncBackground);
        return;
      }
      const closestIndex = getClosestSectionIndex(container);
      if (closestIndex < 0) return;
      centerSection(container, closestIndex, "smooth");
      applySectionFocus(container, syncBackground);
    }, snapDelayMs);
  };

  const destroy = () => {
    if (sectionFocusRaf) {
      cancelAnimationFrame(sectionFocusRaf);
      sectionFocusRaf = null;
    }
    if (sectionSnapTimeout) {
      clearTimeout(sectionSnapTimeout);
      sectionSnapTimeout = null;
    }
  };

  return { syncFocus, snapVertical, snapHorizontal, handleMenuScroll, destroy };
};
