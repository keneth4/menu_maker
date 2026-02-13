export type BackgroundRotationController = {
  clear: () => void;
  sync: (count: number, intervalMs: number, onTick: () => void) => void;
};

export const createBackgroundRotationController = (): BackgroundRotationController => {
  let timer: ReturnType<typeof setInterval> | null = null;
  let lastCount = 0;
  let lastInterval = 0;

  const clear = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    lastCount = 0;
    lastInterval = 0;
  };

  const sync = (count: number, intervalMs: number, onTick: () => void) => {
    if (count < 2) {
      clear();
      return;
    }
    if (timer && count === lastCount && intervalMs === lastInterval) {
      return;
    }
    clear();
    lastCount = count;
    lastInterval = intervalMs;
    timer = setInterval(() => onTick(), intervalMs);
  };

  return { clear, sync };
};
