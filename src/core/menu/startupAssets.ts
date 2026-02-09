import type { MenuItem, MenuProject } from "../../lib/types";

export const STARTUP_BLOCKING_BACKGROUND_LIMIT = 1;
export const STARTUP_BLOCKING_ITEM_LIMIT = 6;

type StartupAssetPlanOptions = {
  backgroundSources: string[];
  itemSources: string[];
  blockingBackgroundLimit?: number;
  blockingItemLimit?: number;
};

export type StartupAssetPlan = {
  blocking: string[];
  deferred: string[];
  all: string[];
};

const cleanSource = (value: string) => value.trim();

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
  const backgroundLimit = Math.max(
    0,
    options.blockingBackgroundLimit ?? STARTUP_BLOCKING_BACKGROUND_LIMIT
  );
  const itemLimit = Math.max(0, options.blockingItemLimit ?? STARTUP_BLOCKING_ITEM_LIMIT);

  const blocking: string[] = [];
  const blockingSet = new Set<string>();

  backgrounds.slice(0, backgroundLimit).forEach((source) => pushUnique(blocking, blockingSet, source));
  itemSources.slice(0, itemLimit).forEach((source) => pushUnique(blocking, blockingSet, source));

  const all = uniqueSources([...backgrounds, ...itemSources]);
  const deferred = all.filter((source) => !blockingSet.has(source));

  return { blocking, deferred, all };
};

