import {
  buildStartupWeightMap,
  collectPreviewStartupPlan,
  preloadDeferredPreviewAssets,
  preloadImageAssetBatch,
  readStartupWeight,
  type StartupPlan
} from "../../application/preview/startupWorkflow";
import type { MenuItem, MenuProject } from "../../lib/types";

export type PreviewStartupViewState = {
  loading: boolean;
  progress: number;
  blockingSources: Set<string>;
};

type PreviewStartupControllerDeps = {
  getCarouselImageSource: (item: MenuItem) => string;
  onStateChange: (state: PreviewStartupViewState) => void;
  isBrowser?: () => boolean;
  collectPlan?: (project: MenuProject, getCarouselImageSource: (item: MenuItem) => string) => StartupPlan;
  buildWeightMap?: (sources: string[]) => Record<string, number>;
  readWeight?: (source: string, sourceWeights: Record<string, number>) => number;
  preloadBlocking?: (
    sources: string[],
    onProgress: ((source: string, loaded: number, total: number) => void) | null,
    concurrency?: number
  ) => Promise<void>;
  preloadDeferred?: (sources: string[]) => void;
};

export type PreviewStartupController = {
  syncProject: (project: MenuProject | null) => void;
  destroy: () => void;
};

type InternalState = {
  signature: string;
  loading: boolean;
  progress: number;
  sourceWeights: Record<string, number>;
  blockingSources: Set<string>;
};

const isSameSet = (left: Set<string>, right: Set<string>) => {
  if (left.size !== right.size) return false;
  for (const value of left) {
    if (!right.has(value)) return false;
  }
  return true;
};

export const createPreviewStartupController = (
  deps: PreviewStartupControllerDeps
): PreviewStartupController => {
  const isBrowser = deps.isBrowser ?? (() => typeof window !== "undefined");
  const collectPlan = deps.collectPlan ?? collectPreviewStartupPlan;
  const buildWeightMap = deps.buildWeightMap ?? buildStartupWeightMap;
  const readWeight = deps.readWeight ?? readStartupWeight;
  const preloadBlocking = deps.preloadBlocking ?? preloadImageAssetBatch;
  const preloadDeferred = deps.preloadDeferred ?? preloadDeferredPreviewAssets;

  let token = 0;
  let state: InternalState = {
    signature: "",
    loading: false,
    progress: 100,
    sourceWeights: {},
    blockingSources: new Set<string>()
  };
  let lastViewState: PreviewStartupViewState = {
    loading: state.loading,
    progress: state.progress,
    blockingSources: new Set(state.blockingSources)
  };

  const emit = () => {
    const nextView: PreviewStartupViewState = {
      loading: state.loading,
      progress: state.progress,
      blockingSources: new Set(state.blockingSources)
    };
    if (
      nextView.loading === lastViewState.loading &&
      nextView.progress === lastViewState.progress &&
      isSameSet(nextView.blockingSources, lastViewState.blockingSources)
    ) {
      return;
    }
    lastViewState = nextView;
    deps.onStateChange(nextView);
  };

  const isResetState = () =>
    state.signature === "" &&
    !state.loading &&
    state.progress === 100 &&
    state.blockingSources.size === 0 &&
    Object.keys(state.sourceWeights).length === 0;

  const reset = () => {
    if (isResetState()) return;
    state = {
      signature: "",
      loading: false,
      progress: 100,
      sourceWeights: {},
      blockingSources: new Set<string>()
    };
    emit();
  };

  const preloadPlan = async (plan: StartupPlan) => {
    const planToken = ++token;
    state = {
      ...state,
      blockingSources: new Set(plan.blocking),
      sourceWeights: buildWeightMap(plan.all)
    };
    emit();

    if (plan.blocking.length === 0) {
      state = {
        ...state,
        loading: false,
        progress: 100,
        blockingSources: new Set<string>()
      };
      emit();
      preloadDeferred(plan.deferred);
      return;
    }

    const totalWeight = Math.max(
      1,
      plan.blocking.reduce((sum, source) => sum + readWeight(source, state.sourceWeights), 0)
    );
    let loadedWeight = 0;
    state = { ...state, loading: true, progress: 0 };
    emit();

    await preloadBlocking(
      plan.blocking,
      (source) => {
        if (planToken !== token) return;
        loadedWeight += readWeight(source, state.sourceWeights);
        state = {
          ...state,
          progress: Math.max(1, Math.min(100, Math.round((loadedWeight / totalWeight) * 100)))
        };
        emit();
      },
      4
    );

    if (planToken !== token) return;
    state = {
      ...state,
      progress: 100,
      loading: false,
      blockingSources: new Set<string>()
    };
    emit();
    preloadDeferred(plan.deferred);
  };

  const syncProject = (project: MenuProject | null) => {
    if (!project || !isBrowser()) {
      token += 1;
      reset();
      return;
    }

    const plan = collectPlan(project, deps.getCarouselImageSource);
    const signature = plan.all.join("|");
    if (signature === state.signature) {
      return;
    }
    state = { ...state, signature };
    void preloadPlan(plan);
  };

  const destroy = () => {
    token += 1;
    reset();
  };

  return { syncProject, destroy };
};
