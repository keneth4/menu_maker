type CarouselTouchAxis = "pending" | "primary" | "secondary";

type CarouselTouchState = {
  touchId: number;
  startX: number;
  startY: number;
  lastPrimary: number;
  axis: CarouselTouchAxis;
};

export type CarouselControllerConfig = {
  primaryAxis: "horizontal" | "vertical";
  wheelStepThreshold: number;
  wheelSettleMs: number;
  touchIntentThreshold: number;
  touchDeltaScale: number;
};

type CreateCarouselControllerDeps = {
  getActive: () => Record<string, number>;
  setActive: (next: Record<string, number>) => void;
  getItemCount: (categoryId: string) => number;
  getConfig: () => CarouselControllerConfig;
  normalizeWheelDelta: (event: WheelEvent) => number;
  wrapIndex: (index: number, count: number) => number;
};

export type CarouselController = {
  clear: () => void;
  shift: (categoryId: string, direction: number) => void;
  handleWheel: (categoryId: string, event: WheelEvent) => void;
  handleTouchStart: (categoryId: string, event: TouchEvent) => void;
  handleTouchMove: (categoryId: string, event: TouchEvent) => void;
  handleTouchEnd: (categoryId: string, event: TouchEvent) => void;
};

const getPrimaryTouchValue = (touch: Touch, axis: "horizontal" | "vertical") =>
  axis === "vertical" ? touch.clientY : touch.clientX;

export const createCarouselController = (
  deps: CreateCarouselControllerDeps
): CarouselController => {
  let snapTimers: Record<string, ReturnType<typeof setTimeout> | null> = {};
  let touchStateByCategory: Record<string, CarouselTouchState | null> = {};

  const clearCategorySnap = (categoryId: string) => {
    const timer = snapTimers[categoryId];
    if (timer) {
      clearTimeout(timer);
    }
    snapTimers = { ...snapTimers, [categoryId]: null };
  };

  const clear = () => {
    Object.values(snapTimers).forEach((timer) => {
      if (timer) {
        clearTimeout(timer);
      }
    });
    snapTimers = {};
    touchStateByCategory = {};
  };

  const queueSnap = (categoryId: string, count: number) => {
    if (count <= 1) return;
    clearCategorySnap(categoryId);
    const config = deps.getConfig();
    const settleTimer = setTimeout(() => {
      const current = deps.getActive()[categoryId] ?? 0;
      const normalized = deps.wrapIndex(Math.round(current), count);
      deps.setActive({ ...deps.getActive(), [categoryId]: normalized });
      snapTimers = { ...snapTimers, [categoryId]: null };
    }, config.wheelSettleMs);
    snapTimers = { ...snapTimers, [categoryId]: settleTimer };
  };

  const applyDelta = (categoryId: string, count: number, delta: number) => {
    if (!delta || count <= 1) return;
    const config = deps.getConfig();
    const current = deps.getActive()[categoryId] ?? 0;
    const next = deps.wrapIndex(current + delta / config.wheelStepThreshold, count);
    deps.setActive({ ...deps.getActive(), [categoryId]: next });
    queueSnap(categoryId, count);
  };

  const shift = (categoryId: string, direction: number) => {
    const count = deps.getItemCount(categoryId);
    if (count <= 1) return;
    const current = Math.round(deps.getActive()[categoryId] ?? 0);
    const next = deps.wrapIndex(current + direction, count);
    deps.setActive({ ...deps.getActive(), [categoryId]: next });
  };

  const handleWheel = (categoryId: string, event: WheelEvent) => {
    const config = deps.getConfig();
    const isPrimaryDelta =
      config.primaryAxis === "vertical"
        ? Math.abs(event.deltaY) > Math.abs(event.deltaX)
        : Math.abs(event.deltaX) > Math.abs(event.deltaY);
    if (!isPrimaryDelta) return;
    event.preventDefault();
    const count = deps.getItemCount(categoryId);
    if (count <= 1) return;
    const delta = deps.normalizeWheelDelta(event);
    if (!delta) return;
    applyDelta(categoryId, count, delta);
  };

  const handleTouchStart = (categoryId: string, event: TouchEvent) => {
    const touch = event.changedTouches[0];
    if (!touch) return;
    const config = deps.getConfig();
    touchStateByCategory = {
      ...touchStateByCategory,
      [categoryId]: {
        touchId: touch.identifier,
        startX: touch.clientX,
        startY: touch.clientY,
        lastPrimary: getPrimaryTouchValue(touch, config.primaryAxis),
        axis: "pending"
      }
    };
  };

  const handleTouchMove = (categoryId: string, event: TouchEvent) => {
    const state = touchStateByCategory[categoryId];
    if (!state) return;
    const count = deps.getItemCount(categoryId);
    if (count <= 1) return;
    const trackedTouch = Array.from(event.touches).find(
      (touch) => touch.identifier === state.touchId
    );
    if (!trackedTouch) return;

    const config = deps.getConfig();
    const totalDx = trackedTouch.clientX - state.startX;
    const totalDy = trackedTouch.clientY - state.startY;
    const primaryMagnitude =
      config.primaryAxis === "vertical" ? Math.abs(totalDy) : Math.abs(totalDx);
    const secondaryMagnitude =
      config.primaryAxis === "vertical" ? Math.abs(totalDx) : Math.abs(totalDy);
    if (
      state.axis === "pending" &&
      Math.max(Math.abs(totalDx), Math.abs(totalDy)) >= config.touchIntentThreshold
    ) {
      state.axis = primaryMagnitude >= secondaryMagnitude ? "primary" : "secondary";
    }
    if (state.axis !== "primary") return;

    event.preventDefault();
    const currentPrimary = getPrimaryTouchValue(trackedTouch, config.primaryAxis);
    const delta = currentPrimary - state.lastPrimary;
    state.lastPrimary = currentPrimary;
    if (Math.abs(delta) < 0.2) return;
    applyDelta(categoryId, count, -delta * config.touchDeltaScale);
  };

  const handleTouchEnd = (categoryId: string, event: TouchEvent) => {
    const state = touchStateByCategory[categoryId];
    if (!state) return;
    const ended = Array.from(event.changedTouches).some(
      (touch) => touch.identifier === state.touchId
    );
    if (!ended) return;
    touchStateByCategory = { ...touchStateByCategory, [categoryId]: null };
  };

  return {
    clear,
    shift,
    handleWheel,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  };
};
