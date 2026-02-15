import type { MenuItem, MenuProject } from "../../lib/types";
import type { InteractiveDetailAsset } from "./interactiveMediaController";

export type ActiveDishSelection = {
  category: string;
  itemId: string;
} | null;

type ModalControllerDeps = {
  getProject: () => MenuProject | null;
  getActiveItem: () => ActiveDishSelection;
  setActiveItem: (value: ActiveDishSelection) => void;
  getDetailImageSource: (item: MenuItem) => string;
  getInteractiveDetailAsset: (item: MenuItem | null) => InteractiveDetailAsset | null;
  supportsInteractiveMedia: () => boolean;
  prefetchInteractiveBytes: (source: string) => Promise<ArrayBuffer | null>;
  setRotateDirection: (direction: 1 | -1) => void;
  setupInteractiveMedia: (asset: InteractiveDetailAsset | null) => Promise<void>;
  teardownInteractiveMedia: () => void;
  getDishRotateDirection: (item: MenuItem | null) => 1 | -1;
  schedulePostOpen: (task: () => void) => void;
  createImage?: () => HTMLImageElement;
};

export type ModalController = {
  syncProject: (project: MenuProject | null) => void;
  prefetchDishDetail: (categoryId: string, itemId: string, includeNeighbors?: boolean) => void;
  openDish: (categoryId: string, itemId: string) => void;
  closeDish: () => void;
  resolveActiveDish: () => MenuItem | null;
};

const readProjectSignature = (project: MenuProject) =>
  [
    project.meta.slug || "",
    ...project.categories.map((category) =>
      category.items
        .map((item) => [item.media.originalHero360 || "", item.media.hero360 || ""].join("::"))
        .join("|")
    )
  ].join("||");

export const createModalController = (deps: ModalControllerDeps): ModalController => {
  const createImage = deps.createImage ?? (() => new Image());
  const prefetchedSources = new Set<string>();
  let projectSignature = "";

  const resolveActiveDish = () => {
    const project = deps.getProject();
    const activeItem = deps.getActiveItem();
    if (!project || !activeItem) return null;
    const category = project.categories.find((item) => item.id === activeItem.category);
    const dish = category?.items.find((item) => item.id === activeItem.itemId);
    return dish ?? null;
  };

  const prefetchDishDetailItem = (dish: MenuItem | null) => {
    if (!dish) return;
    const detailSource = deps.getDetailImageSource(dish).trim();
    if (detailSource && !prefetchedSources.has(detailSource)) {
      prefetchedSources.add(detailSource);
      const preload = createImage();
      preload.decoding = "async";
      preload.src = detailSource;
    }
    const interactiveAsset = deps.getInteractiveDetailAsset(dish);
    if (
      interactiveAsset &&
      deps.supportsInteractiveMedia() &&
      !prefetchedSources.has(interactiveAsset.source)
    ) {
      prefetchedSources.add(interactiveAsset.source);
      void deps.prefetchInteractiveBytes(interactiveAsset.source);
    }
  };

  const prefetchDishDetail = (categoryId: string, itemId: string, includeNeighbors = false) => {
    const project = deps.getProject();
    if (!project) return;
    const category = project.categories.find((item) => item.id === categoryId);
    if (!category || category.items.length === 0) return;
    const index = category.items.findIndex((item) => item.id === itemId);
    if (index < 0) return;
    const targets = [index];
    if (includeNeighbors && category.items.length > 1) {
      targets.push((index - 1 + category.items.length) % category.items.length);
      targets.push((index + 1) % category.items.length);
    }
    Array.from(new Set(targets)).forEach((target) => {
      prefetchDishDetailItem(category.items[target] ?? null);
    });
  };

  const openDish = (categoryId: string, itemId: string) => {
    prefetchDishDetail(categoryId, itemId, true);
    deps.setActiveItem({ category: categoryId, itemId });
    deps.schedulePostOpen(() => {
      const dish = resolveActiveDish();
      deps.setRotateDirection(deps.getDishRotateDirection(dish));
      const asset = deps.getInteractiveDetailAsset(dish);
      void deps.setupInteractiveMedia(asset);
    });
  };

  const closeDish = () => {
    deps.teardownInteractiveMedia();
    deps.setRotateDirection(-1);
    deps.setActiveItem(null);
  };

  const syncProject = (project: MenuProject | null) => {
    if (!project) return;
    const signature = readProjectSignature(project);
    if (signature !== projectSignature) {
      projectSignature = signature;
      prefetchedSources.clear();
    }
  };

  return {
    syncProject,
    prefetchDishDetail,
    openDish,
    closeDish,
    resolveActiveDish
  };
};
