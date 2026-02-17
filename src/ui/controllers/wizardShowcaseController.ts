import type { MenuProject } from "../../lib/types";

type WizardShowcaseControllerDeps = {
  templateDemoProjectSlug: string;
  cacheBust: string;
  loadProject: (slug: string, options: { cacheBust: string }) => Promise<MenuProject>;
  normalizeProject: (project: MenuProject) => MenuProject;
  applyWizardDemoRotationDirections: (project: MenuProject) => MenuProject;
  cloneProject: (project: MenuProject) => MenuProject;
  warn?: (message: string, error: unknown) => void;
};

export type WizardShowcaseController = {
  loadTemplateDemoProject: () => Promise<MenuProject | null>;
  buildWizardShowcaseProject: (draft: MenuProject | null, templateId: string) => Promise<MenuProject | null>;
  resetCache: () => void;
};

export const createWizardShowcaseController = (
  deps: WizardShowcaseControllerDeps
): WizardShowcaseController => {
  const warn = deps.warn ?? console.warn;
  let templateDemoProjectCache: MenuProject | null = null;
  let templateDemoProjectPromise: Promise<MenuProject | null> | null = null;

  const loadTemplateDemoProject = async () => {
    if (templateDemoProjectCache) {
      return deps.cloneProject(templateDemoProjectCache);
    }
    if (!templateDemoProjectPromise) {
      templateDemoProjectPromise = deps
        .loadProject(deps.templateDemoProjectSlug, { cacheBust: deps.cacheBust })
        .then((value) => deps.normalizeProject(value))
        .then((value) => deps.applyWizardDemoRotationDirections(value))
        .then((value) => {
          templateDemoProjectCache = deps.cloneProject(value);
          return deps.cloneProject(value);
        })
        .catch((error) => {
          warn("Unable to load template demo project", error);
          return null;
        })
        .finally(() => {
          templateDemoProjectPromise = null;
        });
    }
    const loaded = await templateDemoProjectPromise;
    return loaded ? deps.cloneProject(loaded) : null;
  };

  const buildWizardShowcaseProject = async (
    draft: MenuProject | null,
    templateId: string
  ): Promise<MenuProject | null> => {
    if (!draft) return null;
    const demo = await loadTemplateDemoProject();
    if (!demo) return null;
    const showcase = deps.cloneProject(demo);
    showcase.meta.template = templateId;
    showcase.meta.locales = [...draft.meta.locales];
    showcase.meta.defaultLocale = draft.meta.defaultLocale;
    showcase.meta.currency = draft.meta.currency;
    showcase.meta.currencyPosition = draft.meta.currencyPosition;
    showcase.meta.identityMode = draft.meta.identityMode;
    showcase.meta.logoSrc = draft.meta.logoSrc;
    showcase.meta.fontFamily = draft.meta.fontFamily;
    showcase.meta.fontSource = draft.meta.fontSource;
    showcase.meta.fontRoles = draft.meta.fontRoles;
    showcase.meta.backgroundCarouselSeconds = draft.meta.backgroundCarouselSeconds;
    showcase.meta.backgroundDisplayMode = draft.meta.backgroundDisplayMode;
    return showcase;
  };

  const resetCache = () => {
    templateDemoProjectCache = null;
    templateDemoProjectPromise = null;
  };

  return {
    loadTemplateDemoProject,
    buildWizardShowcaseProject,
    resetCache
  };
};
