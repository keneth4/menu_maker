export type AppLifecycleController = {
  mount: () => void;
  destroy: () => void;
};

export const createAppLifecycleController = (deps: {
  onViewportChange?: () => void;
  onKeydown?: (event: KeyboardEvent) => void;
  onDesktopModeChange?: (isDesktop: boolean) => void;
  desktopMediaQuery?: string;
  viewportDebounceMs?: number;
} = {}): AppLifecycleController => {
  let resizeHandler: (() => void) | null = null;
  let orientationHandler: (() => void) | null = null;
  let keyHandler: ((event: KeyboardEvent) => void) | null = null;
  let mediaQuery: MediaQueryList | null = null;
  let mediaQueryHandler: ((event: MediaQueryListEvent) => void) | null = null;
  let viewportTimer: ReturnType<typeof setTimeout> | null = null;

  const desktopMediaQuery = deps.desktopMediaQuery ?? "(min-width: 900px)";
  const viewportDebounceMs = deps.viewportDebounceMs ?? 120;

  const mount = () => {
    if (typeof window === "undefined") return;
    if (resizeHandler || orientationHandler || keyHandler || mediaQueryHandler) {
      return;
    }
    const hasViewportChange = typeof deps.onViewportChange === "function";
    const hasKeydown = typeof deps.onKeydown === "function";
    const hasDesktopModeChange = typeof deps.onDesktopModeChange === "function";
    if (!hasViewportChange && !hasKeydown && !hasDesktopModeChange) {
      return;
    }
    mediaQuery = window.matchMedia(desktopMediaQuery);
    mediaQueryHandler = () => deps.onDesktopModeChange?.(mediaQuery?.matches ?? false);
    deps.onDesktopModeChange?.(mediaQuery.matches);
    mediaQuery.addEventListener?.("change", mediaQueryHandler);
    mediaQuery.addListener?.(mediaQueryHandler);
    const scheduleViewportSync = () => {
      if (viewportTimer) {
        clearTimeout(viewportTimer);
      }
      viewportTimer = setTimeout(() => {
        viewportTimer = null;
        deps.onViewportChange?.();
      }, viewportDebounceMs);
    };
    resizeHandler = () => scheduleViewportSync();
    orientationHandler = () => scheduleViewportSync();
    keyHandler = (event: KeyboardEvent) => deps.onKeydown?.(event);
    window.addEventListener("resize", resizeHandler);
    window.addEventListener("orientationchange", orientationHandler);
    window.addEventListener("keydown", keyHandler);
  };

  const destroy = () => {
    if (typeof window === "undefined") return;
    if (resizeHandler) window.removeEventListener("resize", resizeHandler);
    if (orientationHandler) window.removeEventListener("orientationchange", orientationHandler);
    if (keyHandler) window.removeEventListener("keydown", keyHandler);
    if (mediaQuery && mediaQueryHandler) {
      mediaQuery.removeEventListener?.("change", mediaQueryHandler);
      mediaQuery.removeListener?.(mediaQueryHandler);
    }
    if (viewportTimer) {
      clearTimeout(viewportTimer);
      viewportTimer = null;
    }
    resizeHandler = null;
    orientationHandler = null;
    keyHandler = null;
    mediaQuery = null;
    mediaQueryHandler = null;
  };

  return { mount, destroy };
};
