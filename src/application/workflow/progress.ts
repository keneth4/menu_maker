export type ProgressMode = "save" | "export" | "upload" | null;

export type ProgressState = {
  mode: ProgressMode;
  step: string;
  progress: number;
  visible: boolean;
};

type ProgressTimerRefs = {
  pulseTimer: ReturnType<typeof setInterval> | null;
  resetTimer: ReturnType<typeof setTimeout> | null;
};

export type ProgressController = {
  clearPulse: () => void;
  clearReset: () => void;
  start: (mode: Exclude<ProgressMode, null>, step: string, percent?: number) => void;
  update: (step: string, percent: number) => void;
  pulse: (
    targetPercent: number,
    step: string,
    options?: { cadenceMs?: number; tickIncrement?: number }
  ) => void;
  finish: (step: string) => void;
  fail: () => void;
  destroy: () => void;
};

type ProgressControllerOptions = {
  minStartPercent?: number;
  maxWorkingPercent?: number;
  finishResetDelayMs?: number;
};

export const createProgressController = (
  refs: ProgressTimerRefs,
  getState: () => ProgressState,
  setState: (next: Partial<ProgressState>) => void,
  options: ProgressControllerOptions = {}
): ProgressController => {
  const minStartPercent = options.minStartPercent ?? 0;
  const maxWorkingPercent = options.maxWorkingPercent ?? 100;
  const finishResetDelayMs = options.finishResetDelayMs ?? 900;

  const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));

  const clearPulse = () => {
    if (!refs.pulseTimer) return;
    clearInterval(refs.pulseTimer);
    refs.pulseTimer = null;
  };

  const clearReset = () => {
    if (!refs.resetTimer) return;
    clearTimeout(refs.resetTimer);
    refs.resetTimer = null;
  };

  const start = (mode: Exclude<ProgressMode, null>, step: string, percent = 3) => {
    clearPulse();
    clearReset();
    setState({
      mode,
      step,
      progress: clamp(percent, minStartPercent, maxWorkingPercent),
      visible: true
    });
  };

  const update = (step: string, percent: number) => {
    setState({ step, progress: clamp(percent, minStartPercent, maxWorkingPercent) });
  };

  const pulse = (
    targetPercent: number,
    step: string,
    options: { cadenceMs?: number; tickIncrement?: number } = {}
  ) => {
    clearPulse();
    const cadenceMs = options.cadenceMs ?? 60;
    const tickIncrement = options.tickIncrement ?? 0.1;
    refs.pulseTimer = setInterval(() => {
      const state = getState();
      if (state.progress >= targetPercent) {
        clearPulse();
        return;
      }
      const next = clamp(Math.min(targetPercent, state.progress + tickIncrement), minStartPercent, maxWorkingPercent);
      setState({ step, progress: next });
    }, cadenceMs);
  };

  const finish = (step: string) => {
    clearPulse();
    clearReset();
    setState({ step, progress: 100 });
    refs.resetTimer = setTimeout(() => {
      setState({ mode: null, visible: false, step: "", progress: 0 });
      refs.resetTimer = null;
    }, finishResetDelayMs);
  };

  const fail = () => {
    clearPulse();
    clearReset();
    setState({ mode: null, visible: false, step: "", progress: 0 });
  };

  const destroy = () => {
    clearPulse();
    clearReset();
  };

  return {
    clearPulse,
    clearReset,
    start,
    update,
    pulse,
    finish,
    fail,
    destroy
  };
};
