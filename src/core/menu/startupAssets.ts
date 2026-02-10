import type { MenuItem, MenuProject } from "../../lib/types";

export const STARTUP_BLOCKING_BACKGROUND_LIMIT = 1;
export const STARTUP_BLOCKING_ITEM_LIMIT = 3;

type StartupAssetPlanOptions = {
  backgroundSources: string[];
  itemSources: string[];
  blockingBackgroundLimit?: number;
  blockingItemLimit?: number;
  sourceWeights?: Record<string, number> | Map<string, number>;
  prioritizeSmallerFirst?: boolean;
};

export type StartupAssetPlan = {
  blocking: string[];
  deferred: string[];
  all: string[];
};

const cleanSource = (value: string) => value.trim();
const normalizeSourceKey = (value: string) =>
  cleanSource(value).replace(/^\/+/, "").split(/[?#]/, 1)[0];

const pushUnique = (target: string[], seen: Set<string>, value: string) => {
  const source = cleanSource(value);
  if (!source || seen.has(source)) return;
  seen.add(source);
  target.push(source);
};

const uniqueSources = (values: string[]) => {
  const seen = new Set<string>();
  const next: string[] = [];
  values.forEach((value) => pushUnique(next, seen, value));
  return next;
};

const readWeight = (
  source: string,
  sourceWeights?: Record<string, number> | Map<string, number>
) => {
  if (!sourceWeights) return null;
  const direct = cleanSource(source);
  const normalized = normalizeSourceKey(source);
  const weight =
    sourceWeights instanceof Map
      ? (sourceWeights.get(direct) ?? sourceWeights.get(normalized))
      : sourceWeights[direct] ?? sourceWeights[normalized];
  if (typeof weight !== "number" || !Number.isFinite(weight) || weight <= 0) return null;
  return Math.round(weight);
};

const sortByWeightAscending = (
  values: string[],
  sourceWeights?: Record<string, number> | Map<string, number>
) =>
  [...values].sort((left, right) => {
    const leftWeight = readWeight(left, sourceWeights) ?? Number.POSITIVE_INFINITY;
    const rightWeight = readWeight(right, sourceWeights) ?? Number.POSITIVE_INFINITY;
    if (leftWeight !== rightWeight) return leftWeight - rightWeight;
    return 0;
  });

export const collectItemPrioritySources = (
  data: MenuProject,
  getItemSource: (item: MenuItem) => string
) => {
  const rows = data.categories.map((category) =>
    category.items
      .map((item) => cleanSource(getItemSource(item)))
      .filter((value) => value.length > 0)
  );
  const ordered: string[] = [];
  let index = 0;
  while (true) {
    let foundAtDepth = false;
    rows.forEach((row) => {
      const source = row[index];
      if (!source) return;
      ordered.push(source);
      foundAtDepth = true;
    });
    if (!foundAtDepth) break;
    index += 1;
  }
  return uniqueSources(ordered);
};

export const buildStartupAssetPlan = (options: StartupAssetPlanOptions): StartupAssetPlan => {
  const backgrounds = uniqueSources(options.backgroundSources);
  const itemSources = uniqueSources(options.itemSources);
  const sourceWeights = options.sourceWeights;
  const prioritizeSmallerFirst = Boolean(options.prioritizeSmallerFirst);
  const backgroundBlockingCandidates = prioritizeSmallerFirst
    ? sortByWeightAscending(backgrounds, sourceWeights)
    : backgrounds;
  const itemBlockingCandidates = prioritizeSmallerFirst
    ? sortByWeightAscending(itemSources, sourceWeights)
    : itemSources;
  const backgroundLimit = Math.max(
    0,
    options.blockingBackgroundLimit ?? STARTUP_BLOCKING_BACKGROUND_LIMIT
  );
  const itemLimit = Math.max(0, options.blockingItemLimit ?? STARTUP_BLOCKING_ITEM_LIMIT);

  const blocking: string[] = [];
  const blockingSet = new Set<string>();

  backgroundBlockingCandidates
    .slice(0, backgroundLimit)
    .forEach((source) => pushUnique(blocking, blockingSet, source));
  itemBlockingCandidates
    .slice(0, itemLimit)
    .forEach((source) => pushUnique(blocking, blockingSet, source));

  const all = uniqueSources([...backgrounds, ...itemSources]);
  const deferred = all.filter((source) => !blockingSet.has(source));

  return { blocking, deferred, all };
};
