import { describe, expect, it, vi } from "vitest";
import {
  createEditorDraftController,
  type EditorDraftState
} from "./editorDraftController";
import type { MenuProject } from "../../lib/types";

const makeProject = (): MenuProject => ({
  meta: {
    slug: "demo",
    name: "Demo",
    restaurantName: { es: "Demo", en: "Demo" },
    title: { es: "Titulo", en: "Title" },
    identityMode: "text",
    logoSrc: "",
    fontFamily: "Fraunces",
    fontSource: "",
    fontRoles: {},
    template: "focus-rows",
    locales: ["es"],
    defaultLocale: "es",
    currency: "MXN",
    currencyPosition: "left",
    backgroundCarouselSeconds: 9,
    backgroundDisplayMode: "carousel"
  },
  backgrounds: [
    {
      id: "bg-1",
      label: "BG 1",
      src: "/projects/demo/assets/originals/backgrounds/bg.jpg",
      type: "image"
    }
  ],
  categories: [
    {
      id: "cat-1",
      name: { es: "Entradas", en: "Starters" },
      backgroundId: "",
      items: [
        {
          id: "dish-1",
          name: { es: "Taco", en: "Taco" },
          description: { es: "Desc", en: "Desc" },
          longDescription: { es: "Long", en: "Long" },
          priceVisible: true,
          price: { amount: 10, currency: "MXN" },
          allergens: [
            {
              id: "milk",
              label: { es: "Leche" }
            }
          ],
          vegan: false,
          media: {
            hero360: "/projects/demo/assets/originals/items/hero.jpg",
            rotationDirection: "ccw",
            scrollAnimationMode: "hero360",
            scrollAnimationSrc: ""
          },
          typography: {}
        }
      ]
    }
  ],
  sound: {
    enabled: false,
    theme: "bar-amber",
    volume: 0.6,
    map: {}
  }
});

const createHarness = (stateOverrides: Partial<EditorDraftState> = {}) => {
  let state: EditorDraftState = {
    draft: makeProject(),
    activeProject: null,
    editLang: "es",
    selectedCategoryId: "cat-1",
    selectedItemId: "dish-1",
    wizardCategoryId: "cat-1",
    wizardItemId: "dish-1",
    wizardDemoPreview: false,
    wizardShowcaseProject: null,
    ...stateOverrides
  };
  const touchDraft = vi.fn();
  const resetTemplateDemoCache = vi.fn();
  const syncWizardShowcaseVisibility = vi.fn();
  const initCarouselIndices = vi.fn();
  const buildWizardShowcaseProject = vi.fn(async () => makeProject());
  const setState = (next: Partial<EditorDraftState>) => {
    state = { ...state, ...next };
  };

  const controller = createEditorDraftController({
    t: (key) => key,
    fontOptions: [{ value: "Fraunces" }, { value: "Inter" }],
    commonAllergenCatalog: [
      {
        id: "milk",
        label: { es: "Leche", en: "Milk" }
      }
    ],
    getLocalizedValue: (entry, lang, fallback) => entry?.[lang] ?? entry?.[fallback] ?? "",
    normalizeBackgroundCarouselSeconds: (value) => Math.max(2, Math.min(60, Number(value) || 9)),
    normalizeSectionBackgroundId: (value) => (value ?? "").trim(),
    getSectionModeBackgroundEntries: (project) =>
      project.backgrounds
        .filter((background) => background.id && background.src.trim().length > 0)
        .map((background, index) => ({
          id: background.id,
          label: background.label || `BG ${index + 1}`
        })),
    autoAssignSectionBackgroundsByOrder: (project) => {
      const ids = project.backgrounds.map((background) => background.id);
      project.categories = project.categories.map((category, index) => ({
        ...category,
        backgroundId: ids[index] ?? ""
      }));
    },
    getNextUnusedSectionBackgroundId: (project, currentCategoryId = "") => {
      const used = new Set(
        project.categories
          .filter((category) => category.id !== currentCategoryId)
          .map((category) => (category.backgroundId ?? "").trim())
          .filter(Boolean)
      );
      return (
        project.backgrounds.find((background) => background.id && !used.has(background.id))?.id ?? ""
      );
    },
    ensureDescription: (item) => {
      if (!item.description) item.description = {};
      return item.description;
    },
    ensureLongDescription: (item) => {
      if (!item.longDescription) item.longDescription = {};
      return item.longDescription;
    },
    ensureAllergens: (item) => {
      if (!item.allergens) item.allergens = [];
      return item.allergens;
    },
    resolveTemplateId: (templateId) => templateId,
    buildWizardShowcaseProject,
    resetTemplateDemoCache,
    syncWizardShowcaseVisibility,
    initCarouselIndices,
    touchDraft,
    getState: () => state,
    setState
  });

  return {
    controller,
    getState: () => state,
    touchDraft,
    resetTemplateDemoCache,
    syncWizardShowcaseVisibility,
    initCarouselIndices,
    buildWizardShowcaseProject
  };
};

describe("editorDraftController", () => {
  it("applies wizard template and refreshes showcase state", async () => {
    const {
      controller,
      getState,
      touchDraft,
      resetTemplateDemoCache,
      syncWizardShowcaseVisibility,
      initCarouselIndices,
      buildWizardShowcaseProject
    } = createHarness();

    await controller.applyTemplate("jukebox", { source: "wizard" });

    expect(getState().draft?.meta.template).toBe("jukebox");
    expect(resetTemplateDemoCache).toHaveBeenCalledTimes(1);
    expect(buildWizardShowcaseProject).toHaveBeenCalledWith("jukebox");
    expect(syncWizardShowcaseVisibility).toHaveBeenCalledTimes(1);
    expect(initCarouselIndices).toHaveBeenCalledTimes(1);
    expect(touchDraft).toHaveBeenCalled();
    expect(getState().wizardShowcaseProject).not.toBeNull();
  });

  it("updates locale list and hydrates allergen labels for common entries", () => {
    const { controller, getState, touchDraft } = createHarness();

    controller.toggleLanguage("en");

    const draft = getState().draft;
    const allergen = draft?.categories[0]?.items[0]?.allergens?.[0];
    expect(draft?.meta.locales).toContain("en");
    expect(allergen?.label?.en).toBe("Milk");
    expect(touchDraft).toHaveBeenCalled();
  });

  it("adds dishes and updates selected item navigation", () => {
    const { controller, getState, touchDraft } = createHarness({
      selectedItemId: ""
    });

    controller.addDish();
    const firstSelection = getState().selectedItemId;
    controller.addDish();
    controller.goPrevDish();
    controller.deleteDish();

    expect(firstSelection).toMatch(/^dish-/);
    expect(getState().selectedItemId).toMatch(/^dish-/);
    expect(getState().draft?.categories[0]?.items.length).toBe(2);
    expect(touchDraft).toHaveBeenCalled();
  });
});
