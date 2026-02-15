import { writable } from "svelte/store";
import { getTemplateCapabilities, getTemplateStrategy } from "../../core/templates/registry";
import type { ProjectState } from "../contracts/state";

export const createProjectStore = (initial?: Partial<ProjectState>) =>
  writable<ProjectState>({
    project: null,
    draft: null,
    activeProject: null,
    projects: [],
    activeSlug: "nuevo-proyecto",
    locale: "es",
    editLang: "es",
    wizardLang: "es",
    wizardStep: 0,
    wizardCategoryId: "",
    wizardItemId: "",
    wizardCategory: null,
    wizardItem: null,
    wizardDemoPreview: false,
    wizardNeedsRootBackground: false,
    wizardShowcaseProject: null,
    wizardStatus: {
      structure: false,
      identity: false,
      categories: false,
      dishes: false,
      preview: false
    },
    wizardProgress: 0,
    templateSyncSignature: "",
    fontChoice: "Fraunces",
    selectedCategoryId: "",
    selectedItemId: "",
    selectedCategory: null,
    selectedItem: null,
    activeTemplateId: "focus-rows",
    activeTemplateCapabilities: getTemplateCapabilities("focus-rows"),
    activeTemplateStrategy: getTemplateStrategy("focus-rows"),
    ...initial
  });
