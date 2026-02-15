import type { MenuItem } from "../../lib/types";
import type { InteractiveDetailAsset } from "./interactiveMediaController";
import type { ActiveDishSelection, ModalController } from "./modalController";

type RuntimeModalSurfaceDeps = {
  getModalController: () => ModalController | null;
  getInteractiveDetailAsset: (item: MenuItem | null) => InteractiveDetailAsset | null;
  setupInteractiveMedia: (asset: InteractiveDetailAsset | null) => Promise<void>;
  supportsInteractiveMedia: () => boolean;
};

type RuntimeModalSyncState = {
  activeItem: ActiveDishSelection;
  modalMediaHost: HTMLDivElement | null;
  modalMediaImage: HTMLImageElement | null;
};

type RuntimeModalSurfaceState = {
  activeItem: ActiveDishSelection;
  hasActiveProject: boolean;
};

export type RuntimeModalSurface = {
  prefetchDishDetail: (categoryId: string, itemId: string, includeNeighbors?: boolean) => void;
  openDish: (categoryId: string, itemId: string) => void;
  closeDish: () => void;
  resolveActiveDish: () => MenuItem | null;
  syncInteractiveMedia: (state: RuntimeModalSyncState) => void;
  resolveSurface: (state: RuntimeModalSurfaceState) => {
    dish: MenuItem | null;
    interactiveAsset: InteractiveDetailAsset | null;
    interactiveEnabled: boolean;
  };
};

export const createRuntimeModalSurfaceController = (
  deps: RuntimeModalSurfaceDeps
): RuntimeModalSurface => {
  let interactiveSetupSignature = "";

  const resolveActiveDish = () => deps.getModalController()?.resolveActiveDish() ?? null;

  const prefetchDishDetail = (categoryId: string, itemId: string, includeNeighbors = false) => {
    deps.getModalController()?.prefetchDishDetail(categoryId, itemId, includeNeighbors);
  };

  const openDish = (categoryId: string, itemId: string) => {
    deps.getModalController()?.openDish(categoryId, itemId);
  };

  const closeDish = () => {
    deps.getModalController()?.closeDish();
  };

  const syncInteractiveMedia = (state: RuntimeModalSyncState) => {
    const dish = resolveActiveDish();
    const interactiveAsset = deps.getInteractiveDetailAsset(dish);
    const signature =
      state.activeItem && interactiveAsset && state.modalMediaHost && state.modalMediaImage
        ? [
            state.activeItem.category,
            state.activeItem.itemId,
            interactiveAsset.source,
            interactiveAsset.mime
          ].join("::")
        : "";
    if (signature !== interactiveSetupSignature) {
      interactiveSetupSignature = signature;
      if (signature) {
        void deps.setupInteractiveMedia(interactiveAsset);
      }
    }
  };

  const resolveSurface = (state: RuntimeModalSurfaceState) => {
    if (!state.activeItem || !state.hasActiveProject) {
      return {
        dish: null,
        interactiveAsset: null,
        interactiveEnabled: false
      };
    }
    const dish = resolveActiveDish();
    const interactiveAsset = deps.getInteractiveDetailAsset(dish);
    return {
      dish,
      interactiveAsset,
      interactiveEnabled: Boolean(interactiveAsset && deps.supportsInteractiveMedia())
    };
  };

  return {
    prefetchDishDetail,
    openDish,
    closeDish,
    resolveActiveDish,
    syncInteractiveMedia,
    resolveSurface
  };
};
