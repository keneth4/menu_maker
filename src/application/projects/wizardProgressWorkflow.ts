import type { MenuProject } from "../../lib/types";

export type WizardStatus = {
  structure: boolean;
  identity: boolean;
  categories: boolean;
  dishes: boolean;
  preview: boolean;
};

export type WizardProgressState = {
  wizardNeedsRootBackground: boolean;
  wizardStatus: WizardStatus;
  wizardProgress: number;
};

const EMPTY_WIZARD_STATUS: WizardStatus = {
  structure: false,
  identity: false,
  categories: false,
  dishes: false,
  preview: false
};

const normalizeAssetSrc = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed.replace(/^\/+/, "")}`;
};

export const isTemplateDemoAssetPath = (value: string, assetPrefixes: readonly string[]) => {
  const normalized = normalizeAssetSrc(value);
  if (!normalized) return false;
  return assetPrefixes.some((prefix) => normalized.startsWith(prefix));
};

export const hasWizardCustomBackground = (
  project: MenuProject,
  templateDemoPrefixes: readonly string[]
) =>
  project.backgrounds.some((background) => {
    const src = (background.src || "").trim();
    if (!src || isTemplateDemoAssetPath(src, templateDemoPrefixes)) return false;
    return true;
  });

export const buildWizardProgressState = (params: {
  draft: MenuProject | null;
  rootFiles: string[];
  assetMode: "filesystem" | "bridge" | "none";
  editorTab: "info" | "assets" | "edit" | "wizard";
  sectionBackgroundMappingValid: boolean;
  templateDemoPrefixes: readonly string[];
  wizardStepCount: number;
}): WizardProgressState => {
  const {
    draft,
    sectionBackgroundMappingValid,
    templateDemoPrefixes,
    wizardStepCount
  } = params;

  if (!draft) {
    return {
      wizardNeedsRootBackground: false,
      wizardStatus: EMPTY_WIZARD_STATUS,
      wizardProgress: 0
    };
  }

  const defaultLocale = draft.meta.defaultLocale || "es";
  const hasTemplate = Boolean(draft.meta.template);
  const sectionMode = (draft.meta.backgroundDisplayMode ?? "carousel") === "section";
  const hasBackground = draft.backgrounds.some((background) => background.src?.trim().length > 0);
  const hasOwnBackground = hasWizardCustomBackground(draft, templateDemoPrefixes);
  const hasDemoBackground = draft.backgrounds.some((background) =>
    isTemplateDemoAssetPath(background.src || "", templateDemoPrefixes)
  );
  const wizardNeedsRootBackground = hasDemoBackground && !hasOwnBackground;
  const hasIdentity = hasBackground && !wizardNeedsRootBackground;
  const hasCategories =
    draft.categories.length > 0 &&
    draft.categories.every((category) => category.name?.[defaultLocale]?.trim()) &&
    (!sectionMode || sectionBackgroundMappingValid);
  const dishCount = draft.categories.reduce((acc, category) => acc + category.items.length, 0);
  const hasDishes =
    dishCount > 0 &&
    draft.categories.every((category) =>
      category.items.every(
        (item) =>
          item.name?.[defaultLocale]?.trim() &&
          (item.priceVisible === false ||
            (typeof item.price?.amount === "number" && item.price.amount > 0))
      )
    );

  const wizardStatus: WizardStatus = {
    structure: hasTemplate,
    identity: hasIdentity,
    categories: hasCategories,
    dishes: hasDishes,
    preview: hasTemplate && hasIdentity && hasCategories && hasDishes
  };
  const completed = [
    wizardStatus.structure,
    wizardStatus.identity,
    wizardStatus.categories,
    wizardStatus.dishes,
    wizardStatus.preview
  ].filter(Boolean).length;

  return {
    wizardNeedsRootBackground,
    wizardStatus,
    wizardProgress: wizardStepCount > 0 ? completed / wizardStepCount : 0
  };
};

export const buildTemplateSyncSignature = (project: MenuProject | null) => {
  if (!project) return "";
  const categorySignature = project.categories
    .map((category) => `${category.id}:${category.items.length}`)
    .join("|");
  return `${project.meta.template || "focus-rows"}::${categorySignature}`;
};
