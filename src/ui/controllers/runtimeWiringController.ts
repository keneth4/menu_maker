import type { ModalController } from "./modalController";
import {
  createRuntimeBindings,
  type RuntimeBindings,
  type RuntimeBindingsDeps
} from "./runtimeBindingsController";
import {
  createRuntimeBootstrapController,
  type RuntimeBootstrapController,
  type RuntimeBootstrapDeps
} from "./runtimeBootstrapController";

type RuntimeWiringDeps = {
  bindings: RuntimeBindingsDeps;
  bootstrap: Omit<
    RuntimeBootstrapDeps,
    "updateAssetMode" | "refreshBridgeEntries" | "destroyCallbacks"
  >;
  buildDestroyCallbacks: (runtimeBindings: RuntimeBindings) => Array<() => void>;
};

type RuntimeWiringFactories = {
  createBindings?: (deps: RuntimeBindingsDeps) => RuntimeBindings;
  createBootstrap?: (deps: RuntimeBootstrapDeps) => RuntimeBootstrapController;
};

export type RuntimeWiring = {
  runtimeBindings: RuntimeBindings;
  runtimeBootstrapController: RuntimeBootstrapController;
  modalController: ModalController;
  updateAssetMode: () => void;
  refreshBridgeEntries: () => Promise<void>;
};

export const createRuntimeWiring = (
  deps: RuntimeWiringDeps,
  factories: RuntimeWiringFactories = {}
): RuntimeWiring => {
  const createBindings = factories.createBindings ?? createRuntimeBindings;
  const createBootstrap = factories.createBootstrap ?? createRuntimeBootstrapController;

  const runtimeBindings = createBindings(deps.bindings);
  const updateAssetMode = runtimeBindings.assetWorkspaceController.updateAssetMode;
  const refreshBridgeEntries = runtimeBindings.assetWorkspaceController.refreshBridgeEntries;

  const runtimeBootstrapController = createBootstrap({
    ...deps.bootstrap,
    updateAssetMode,
    refreshBridgeEntries,
    destroyCallbacks: deps.buildDestroyCallbacks(runtimeBindings)
  });

  return {
    runtimeBindings,
    runtimeBootstrapController,
    modalController: runtimeBindings.modalController,
    updateAssetMode,
    refreshBridgeEntries
  };
};
