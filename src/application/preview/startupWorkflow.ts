import { buildStartupAssetPlan, collectItemPrioritySources } from "../../core/menu/startupAssets";
import type { MenuItem, MenuProject } from "../../lib/types";

export type StartupPlan = {
  blocking: string[];
  deferred: string[];
  all: string[];
};

export const normalizeStartupSourceKey = (value: string) =>
  value.trim().replace(/^\/+/, "").split(/[?#]/, 1)[0];

export const estimateStartupAssetBytes = (source: string) => {
  const key = normalizeStartupSourceKey(source).toLowerCase();
  const isBackground = key.includes("/backgrounds/");
  const isGif = key.endsWith(".gif");
  const isWebp = key.endsWith(".webp");
  const isAvif = key.endsWith(".avif");
  const isPng = key.endsWith(".png");
  const isJpeg = key.endsWith(".jpg") || key.endsWith(".jpeg");
  if (isBackground) {
    if (isGif) return 1_300_000;
    if (isWebp) return 650_000;
    if (isAvif) return 420_000;
    if (isPng || isJpeg) return 700_000;
    return 900_000;
  }
  if (isGif) return 650_000;
  if (isWebp) return 260_000;
  if (isAvif) return 180_000;
  if (isPng || isJpeg) return 320_000;
  return 300_000;
};

export const readStartupWeight = (source: string, sourceWeights: Record<string, number>) => {
  const direct = sourceWeights[source];
  if (typeof direct === "number" && Number.isFinite(direct) && direct > 0) {
    return Math.round(direct);
  }
  const normalized = sourceWeights[normalizeStartupSourceKey(source)];
  if (typeof normalized === "number" && Number.isFinite(normalized) && normalized > 0) {
    return Math.round(normalized);
  }
  return estimateStartupAssetBytes(source);
};

export const collectPreviewStartupPlan = (
  data: MenuProject,
  getCarouselImageSource: (item: MenuItem) => string
): StartupPlan => {
  const itemSources = collectItemPrioritySources(data, getCarouselImageSource);
  const backgroundSources = data.backgrounds.map((bg) => bg.src || "");
  const allSources = [...backgroundSources, ...itemSources].filter((source) => source.trim().length > 0);
  const sourceWeights = allSources.reduce<Record<string, number>>((acc, source) => {
    acc[source] = estimateStartupAssetBytes(source);
    acc[normalizeStartupSourceKey(source)] = acc[source];
    return acc;
  }, {});
  return buildStartupAssetPlan({
    backgroundSources,
    itemSources,
    blockingBackgroundLimit: 1,
    blockingItemLimit: 3,
    sourceWeights,
    prioritizeSmallerFirst: true
  });
};

export const buildStartupWeightMap = (sources: string[]) =>
  sources.reduce<Record<string, number>>((acc, source) => {
    const weight = estimateStartupAssetBytes(source);
    acc[source] = weight;
    acc[normalizeStartupSourceKey(source)] = weight;
    return acc;
  }, {});

export const preloadImageAsset = (src: string) =>
  new Promise<void>((resolve) => {
    if (!src) {
      resolve();
      return;
    }
    const image = new Image();
    const done = () => resolve();
    image.onload = done;
    image.onerror = done;
    image.src = src;
    if (image.complete) {
      resolve();
    }
  });

export const preloadImageAssetBatch = async (
  sources: string[],
  onProgress: ((source: string, loaded: number, total: number) => void) | null,
  concurrency = 4
) => {
  if (sources.length === 0) return;
  const queue = [...sources];
  const workers = Math.max(1, Math.min(concurrency, queue.length));
  let loaded = 0;
  const runWorker = async () => {
    while (queue.length > 0) {
      const source = queue.shift();
      if (!source) continue;
      await preloadImageAsset(source);
      loaded += 1;
      onProgress?.(source, loaded, sources.length);
    }
  };
  await Promise.all(Array.from({ length: workers }, () => runWorker()));
};

export const preloadDeferredPreviewAssets = (sources: string[]) => {
  if (!sources.length) return;
  const run = () => {
    void preloadImageAssetBatch(sources, null, 3);
  };
  if ("requestIdleCallback" in window) {
    (
      window as Window & {
        requestIdleCallback?: (cb: IdleRequestCallback, options?: IdleRequestOptions) => number;
      }
    ).requestIdleCallback?.(() => run(), { timeout: 900 });
    return;
  }
  window.setTimeout(run, 120);
};
