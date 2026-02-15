import type { ProjectSummary } from "../../lib/loadProjects";
import type { MenuProject } from "../../lib/types";
import type { RuntimeBindingsPatch } from "./runtimeBindingsController";

export type RuntimeBootstrapDeps = {
  appLifecycleMount: () => void;
  appLifecycleDestroy: () => void;
  pingBridge: () => Promise<boolean>;
  updateAssetMode: () => void;
  getAssetMode: () => "filesystem" | "bridge" | "none";
  refreshBridgeEntries: () => Promise<void>;
  loadProjects: () => Promise<ProjectSummary[]>;
  createEmptyProject: () => MenuProject;
  cloneProject: (project: MenuProject) => MenuProject;
  initCarouselIndices: (project: MenuProject) => void;
  setState: (patch: RuntimeBindingsPatch) => void;
  destroyCallbacks: Array<() => void>;
};

export type RuntimeBootstrapController = {
  mount: () => Promise<void>;
  destroy: () => void;
};

export const createRuntimeBootstrapController = (
  deps: RuntimeBootstrapDeps
): RuntimeBootstrapController => {
  const mount = async () => {
    try {
      deps.appLifecycleMount();

      try {
        deps.setState({ bridgeAvailable: await deps.pingBridge() });
      } catch {
        deps.setState({ bridgeAvailable: false });
      }

      deps.updateAssetMode();
      if (deps.getAssetMode() === "bridge") {
        await deps.refreshBridgeEntries();
      }

      let projects: ProjectSummary[] = [];
      try {
        projects = await deps.loadProjects();
      } catch {
        projects = [];
      }

      const emptyProject = deps.createEmptyProject();
      deps.setState({
        projects,
        project: emptyProject,
        draft: deps.cloneProject(emptyProject),
        activeSlug: emptyProject.meta.slug,
        locale: emptyProject.meta.defaultLocale,
        loadError: ""
      });
      deps.initCarouselIndices(emptyProject);
    } catch (error) {
      deps.setState({
        loadError: error instanceof Error ? error.message : "Error desconocido"
      });
    }
  };

  const destroy = () => {
    deps.destroyCallbacks.forEach((callback) => callback());
    deps.appLifecycleDestroy();
  };

  return {
    mount,
    destroy
  };
};
