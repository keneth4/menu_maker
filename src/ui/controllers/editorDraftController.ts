import type { AllergenEntry, MenuCategory, MenuItem, MenuProject } from "../../lib/types";

type CommonAllergen = {
  id: string;
  label: Record<string, string>;
};

type RoleFontConfig = {
  source?: string;
};

type ItemFontConfig = {
  source?: string;
};

type FontOption = {
  value: string;
};

export type EditorDraftState = {
  draft: MenuProject | null;
  activeProject: MenuProject | null;
  editLang: string;
  selectedCategoryId: string;
  selectedItemId: string;
  wizardCategoryId: string;
  wizardItemId: string;
  wizardDemoPreview: boolean;
  wizardShowcaseProject: MenuProject | null;
};

type EditorDraftControllerDeps = {
  t: (key: string) => string;
  fontOptions: FontOption[];
  commonAllergenCatalog: CommonAllergen[];
  getLocalizedValue: (entry: Record<string, string> | undefined, lang: string, fallback: string) => string;
  normalizeBackgroundCarouselSeconds: (value: unknown) => number;
  normalizeSectionBackgroundId: (value?: string) => string;
  getSectionModeBackgroundEntries: (project: MenuProject) => { id: string; label: string }[];
  autoAssignSectionBackgroundsByOrder: (project: MenuProject) => void;
  getNextUnusedSectionBackgroundId: (project: MenuProject, currentCategoryId?: string) => string;
  ensureDescription: (item: MenuItem) => Record<string, string>;
  ensureLongDescription: (item: MenuItem) => Record<string, string>;
  ensureAllergens: (item: MenuItem) => AllergenEntry[];
  resolveTemplateId: (templateId: string) => string;
  isWizardShowcaseEligible: (project: MenuProject | null) => boolean;
  buildWizardShowcaseProject: (templateId: string) => Promise<MenuProject | null>;
  resetTemplateDemoCache: () => void;
  syncWizardShowcaseVisibility: () => void;
  initCarouselIndices: (project: MenuProject) => void;
  touchDraft: () => void;
  getState: () => EditorDraftState;
  setState: (next: Partial<EditorDraftState>) => void;
};

export type EditorDraftController = {
  toggleLanguage: (code: string) => void;
  setCurrency: (code: string) => void;
  toggleCurrencyPosition: () => void;
  applyTemplate: (templateId: string, options?: { source?: "wizard" | "project" }) => Promise<void>;
  addBackground: () => void;
  setBackgroundDisplayMode: (mode: "carousel" | "section") => void;
  setCategoryBackgroundId: (category: MenuCategory, backgroundId: string) => void;
  setBackgroundCarouselSeconds: (seconds: number) => void;
  moveBackground: (id: string, direction: -1 | 1) => void;
  removeBackground: (id: string) => void;
  addSection: () => void;
  deleteSection: () => void;
  addDish: () => void;
  addWizardCategory: () => void;
  removeWizardCategory: (id: string) => void;
  addWizardDish: () => void;
  removeWizardDish: () => void;
  deleteDish: () => void;
  goPrevDish: () => void;
  goNextDish: () => void;
  handleDescriptionInput: (item: MenuItem, lang: string, event: Event) => void;
  handleLongDescriptionInput: (item: MenuItem, lang: string, event: Event) => void;
  isCommonAllergenChecked: (item: MenuItem, id: string) => boolean;
  getCommonAllergenLabel: (entry: { label: Record<string, string> }, lang?: string) => string;
  getCustomAllergensInput: (item: MenuItem, lang?: string) => string;
  toggleCommonAllergen: (item: MenuItem, allergenId: string, checked: boolean) => void;
  handleCommonAllergenToggle: (item: MenuItem, allergenId: string, event: Event) => void;
  handleCustomAllergensInput: (item: MenuItem, lang: string, event: Event) => void;
  handleLocalizedInput: (record: Record<string, string>, lang: string, event: Event) => void;
  cycleEditLang: () => void;
  handleCurrencyChange: (event: Event) => void;
  handleFontChoice: (value: string) => void;
  handleFontSelect: (event: Event) => void;
  handleCustomFontSourceInput: (event: Event) => void;
  setIdentityMode: (mode: "text" | "logo") => void;
  setLogoSrc: (src: string) => void;
  setFontRoleSource: (role: "identity" | "section" | "item", source: string) => void;
  setItemScrollAnimationMode: (item: MenuItem, mode: "hero360" | "alternate") => void;
  setItemScrollAnimationSrc: (item: MenuItem, source: string) => void;
  setItemPriceVisible: (item: MenuItem, visible: boolean) => void;
  setItemFontSource: (item: MenuItem, source: string) => void;
  getDishRotateDirection: (item: MenuItem | null) => 1 | -1;
  setItemRotationDirection: (item: MenuItem, direction: "cw" | "ccw") => void;
  handleVeganToggle: (item: MenuItem, event: Event) => void;
};

const createLocalized = (locales: string[]) =>
  locales.reduce<Record<string, string>>((acc, lang) => {
    acc[lang] = "";
    return acc;
  }, {});

const createEmptyDish = (locales: string[], currency: string, id: string): MenuItem => ({
  id,
  name: createLocalized(locales),
  description: createLocalized(locales),
  longDescription: createLocalized(locales),
  priceVisible: true,
  price: {
    amount: 0,
    currency
  },
  allergens: [],
  vegan: false,
  media: {
    hero360: "",
    originalHero360: "",
    rotationDirection: "ccw",
    scrollAnimationMode: "hero360",
    scrollAnimationSrc: ""
  },
  typography: {}
});

const ensureItemFontConfig = (item: MenuItem): ItemFontConfig => {
  if (!item.typography) item.typography = {};
  if (!item.typography.item) item.typography.item = {};
  return item.typography.item;
};

const resolveSelectedCategory = (
  draft: MenuProject | null,
  selectedCategoryId: string
) =>
  draft?.categories.find((category) => category.id === selectedCategoryId) ?? null;

const resolveWizardCategory = (draft: MenuProject | null, wizardCategoryId: string) =>
  draft?.categories.find((category) => category.id === wizardCategoryId) ?? null;

export const createEditorDraftController = (
  deps: EditorDraftControllerDeps
): EditorDraftController => {
  const setCurrency = (code: string) => {
    const state = deps.getState();
    if (!state.draft) return;
    state.draft.meta.currency = code;
  };

  const toggleCurrencyPosition = () => {
    const state = deps.getState();
    if (!state.draft) return;
    state.draft.meta.currencyPosition =
      state.draft.meta.currencyPosition === "right" ? "left" : "right";
  };

  const toggleLanguage = (code: string) => {
    const state = deps.getState();
    if (!state.draft) return;
    const draft = state.draft;
    const localeSet = new Set(draft.meta.locales);
    if (localeSet.has(code)) {
      localeSet.delete(code);
    } else {
      localeSet.add(code);
    }
    if (localeSet.size === 0) {
      localeSet.add(draft.meta.defaultLocale || "es");
    }
    draft.meta.locales = Array.from(localeSet);
    if (!draft.meta.locales.includes(draft.meta.defaultLocale)) {
      draft.meta.defaultLocale = draft.meta.locales[0];
    }
    draft.categories.forEach((category) => {
      category.items.forEach((item) => {
        (item.allergens ?? []).forEach((entry) => {
          if (!entry.label) {
            entry.label = {};
          }
          const common = entry.id
            ? deps.commonAllergenCatalog.find((catalogItem) => catalogItem.id === entry.id)
            : null;
          draft.meta.locales.forEach((lang) => {
            if (entry.label[lang] === undefined) {
              entry.label[lang] = common
                ? deps.getLocalizedValue(common.label, lang, draft.meta.defaultLocale)
                : "";
            }
          });
        });
      });
    });
    deps.touchDraft();
  };

  const applyTemplate = async (
    templateId: string,
    options: { source?: "wizard" | "project" } = {}
  ) => {
    const state = deps.getState();
    if (!state.draft) return;
    const draft = state.draft;
    const resolvedTemplateId = deps.resolveTemplateId(templateId);
    draft.meta.template = resolvedTemplateId;
    if (options.source === "wizard") {
      deps.resetTemplateDemoCache();
      const showcaseEligible = deps.isWizardShowcaseEligible(draft);
      deps.setState({
        wizardShowcaseProject: showcaseEligible
          ? await deps.buildWizardShowcaseProject(resolvedTemplateId)
          : null,
        ...(showcaseEligible ? {} : { wizardDemoPreview: false })
      });
      deps.syncWizardShowcaseVisibility();
    } else {
      deps.setState({
        wizardShowcaseProject: null,
        wizardDemoPreview: false
      });
    }
    deps.touchDraft();
    deps.initCarouselIndices(draft);
  };

  const addBackground = () => {
    const state = deps.getState();
    if (!state.draft) return;
    const draft = state.draft;
    const id = `bg-${Date.now()}`;
    draft.backgrounds = [
      ...draft.backgrounds,
      {
        id,
        label: `${deps.t("backgroundLabel")} ${draft.backgrounds.length + 1}`,
        src: "",
        type: "image"
      }
    ];
    if ((draft.meta.backgroundDisplayMode ?? "carousel") !== "section") {
      draft.categories = draft.categories.map((category) => ({
        ...category,
        backgroundId: category.backgroundId || id
      }));
    }
    deps.touchDraft();
  };

  const setBackgroundDisplayMode = (mode: "carousel" | "section") => {
    const state = deps.getState();
    if (!state.draft) return;
    const draft = state.draft;
    const nextMode = mode === "section" ? "section" : "carousel";
    if (draft.meta.backgroundDisplayMode === nextMode) return;
    draft.meta.backgroundDisplayMode = nextMode;
    if (nextMode === "section") {
      deps.autoAssignSectionBackgroundsByOrder(draft);
    }
    deps.touchDraft();
  };

  const setCategoryBackgroundId = (category: MenuCategory, backgroundId: string) => {
    const state = deps.getState();
    if (!state.draft) return;
    const draft = state.draft;
    const normalized = backgroundId.trim();
    if ((draft.meta.backgroundDisplayMode ?? "carousel") === "section") {
      if (
        normalized &&
        !deps.getSectionModeBackgroundEntries(draft).some((entry) => entry.id === normalized)
      ) {
        return;
      }
      if (
        normalized &&
        draft.categories.some(
          (entry) =>
            entry.id !== category.id &&
            deps.normalizeSectionBackgroundId(entry.backgroundId) === normalized
        )
      ) {
        return;
      }
    }
    category.backgroundId = normalized;
    deps.touchDraft();
  };

  const setBackgroundCarouselSeconds = (seconds: number) => {
    const state = deps.getState();
    if (!state.draft) return;
    const draft = state.draft;
    const normalized = deps.normalizeBackgroundCarouselSeconds(seconds);
    if (draft.meta.backgroundCarouselSeconds === normalized) return;
    draft.meta.backgroundCarouselSeconds = normalized;
    deps.touchDraft();
  };

  const moveBackground = (id: string, direction: -1 | 1) => {
    const state = deps.getState();
    if (!state.draft) return;
    const draft = state.draft;
    const index = draft.backgrounds.findIndex((item) => item.id === id);
    if (index < 0) return;
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= draft.backgrounds.length) return;
    const ordered = [...draft.backgrounds];
    const [moved] = ordered.splice(index, 1);
    ordered.splice(nextIndex, 0, moved);
    draft.backgrounds = ordered;
    deps.touchDraft();
  };

  const removeBackground = (id: string) => {
    const state = deps.getState();
    if (!state.draft) return;
    const draft = state.draft;
    draft.backgrounds = draft.backgrounds.filter((item) => item.id !== id);
    if ((draft.meta.backgroundDisplayMode ?? "carousel") === "section") {
      draft.categories = draft.categories.map((category) => ({
        ...category,
        backgroundId:
          deps.normalizeSectionBackgroundId(category.backgroundId) === id
            ? ""
            : deps.normalizeSectionBackgroundId(category.backgroundId)
      }));
    } else {
      const fallbackId = draft.backgrounds[0]?.id ?? "";
      draft.categories = draft.categories.map((category) => ({
        ...category,
        backgroundId:
          category.backgroundId === id || !category.backgroundId ? fallbackId : category.backgroundId
      }));
    }
    deps.touchDraft();
  };

  const addSection = () => {
    const state = deps.getState();
    if (!state.draft) return;
    const draft = state.draft;
    const id = `section-${Date.now()}`;
    draft.categories = [
      ...draft.categories,
      {
        id,
        name: createLocalized(draft.meta.locales),
        backgroundId:
          (draft.meta.backgroundDisplayMode ?? "carousel") === "section"
            ? deps.getNextUnusedSectionBackgroundId(draft)
            : (draft.backgrounds[0]?.id ?? ""),
        items: []
      }
    ];
    deps.setState({
      selectedCategoryId: id,
      selectedItemId: ""
    });
    deps.touchDraft();
  };

  const deleteSection = () => {
    const state = deps.getState();
    if (!state.draft || !state.selectedCategoryId) return;
    const draft = state.draft;
    draft.categories = draft.categories.filter((item) => item.id !== state.selectedCategoryId);
    deps.setState({
      selectedCategoryId: draft.categories[0]?.id ?? "",
      selectedItemId: ""
    });
    deps.touchDraft();
  };

  const addDish = () => {
    const state = deps.getState();
    if (!state.draft) return;
    const category = resolveSelectedCategory(state.draft, state.selectedCategoryId);
    if (!category) return;
    const id = `dish-${Date.now()}`;
    category.items = [
      ...category.items,
      createEmptyDish(state.draft.meta.locales, state.draft.meta.currency, id)
    ];
    deps.setState({ selectedItemId: id });
    deps.touchDraft();
  };

  const addWizardCategory = () => {
    const state = deps.getState();
    if (!state.draft) return;
    const draft = state.draft;
    const id = `section-${Date.now()}`;
    draft.categories = [
      ...draft.categories,
      {
        id,
        name: createLocalized(draft.meta.locales),
        backgroundId:
          (draft.meta.backgroundDisplayMode ?? "carousel") === "section"
            ? deps.getNextUnusedSectionBackgroundId(draft)
            : (draft.backgrounds[0]?.id ?? ""),
        items: []
      }
    ];
    deps.setState({
      wizardCategoryId: id,
      wizardItemId: ""
    });
    deps.touchDraft();
  };

  const removeWizardCategory = (id: string) => {
    const state = deps.getState();
    if (!state.draft) return;
    const draft = state.draft;
    draft.categories = draft.categories.filter((item) => item.id !== id);
    deps.setState({
      wizardCategoryId: draft.categories[0]?.id ?? "",
      wizardItemId: ""
    });
    deps.touchDraft();
  };

  const addWizardDish = () => {
    const state = deps.getState();
    if (!state.draft) return;
    const category = resolveWizardCategory(state.draft, state.wizardCategoryId);
    if (!category) return;
    const id = `dish-${Date.now()}`;
    category.items = [
      ...category.items,
      createEmptyDish(state.draft.meta.locales, state.draft.meta.currency, id)
    ];
    deps.setState({ wizardItemId: id });
    deps.touchDraft();
  };

  const removeWizardDish = () => {
    const state = deps.getState();
    if (!state.draft || !state.wizardItemId) return;
    const category = resolveWizardCategory(state.draft, state.wizardCategoryId);
    if (!category) return;
    category.items = category.items.filter((item) => item.id !== state.wizardItemId);
    deps.setState({ wizardItemId: category.items[0]?.id ?? "" });
    deps.touchDraft();
  };

  const deleteDish = () => {
    const state = deps.getState();
    if (!state.draft || !state.selectedItemId) return;
    const category = resolveSelectedCategory(state.draft, state.selectedCategoryId);
    if (!category) return;
    category.items = category.items.filter((item) => item.id !== state.selectedItemId);
    deps.setState({ selectedItemId: category.items[0]?.id ?? "" });
    deps.touchDraft();
  };

  const goPrevDish = () => {
    const state = deps.getState();
    const category = resolveSelectedCategory(state.draft, state.selectedCategoryId);
    if (!category) return;
    const index = category.items.findIndex((item) => item.id === state.selectedItemId);
    if (index > 0) {
      deps.setState({ selectedItemId: category.items[index - 1].id });
    }
  };

  const goNextDish = () => {
    const state = deps.getState();
    const category = resolveSelectedCategory(state.draft, state.selectedCategoryId);
    if (!category) return;
    const index = category.items.findIndex((item) => item.id === state.selectedItemId);
    if (index >= 0 && index < category.items.length - 1) {
      deps.setState({ selectedItemId: category.items[index + 1].id });
    }
  };

  const handleDescriptionInput = (item: MenuItem, lang: string, event: Event) => {
    const input = event.currentTarget as HTMLTextAreaElement;
    const desc = deps.ensureDescription(item);
    desc[lang] = input.value;
    deps.touchDraft();
  };

  const handleLongDescriptionInput = (item: MenuItem, lang: string, event: Event) => {
    const input = event.currentTarget as HTMLTextAreaElement;
    const desc = deps.ensureLongDescription(item);
    desc[lang] = input.value;
    deps.touchDraft();
  };

  const isCommonAllergenChecked = (item: MenuItem, id: string) =>
    (item.allergens ?? []).some((entry) => entry.id === id);

  const getCommonAllergenLabel = (
    entry: { label: Record<string, string> },
    lang?: string
  ) => {
    const state = deps.getState();
    const resolvedLang = lang ?? state.editLang;
    return deps.getLocalizedValue(
      entry.label,
      resolvedLang,
      state.activeProject?.meta.defaultLocale ?? "en"
    );
  };

  const getCustomAllergensInput = (item: MenuItem, lang?: string) => {
    const state = deps.getState();
    const resolvedLang = lang ?? state.editLang;
    return (item.allergens ?? [])
      .filter((entry) => !entry.id)
      .map((entry) => entry.label?.[resolvedLang] ?? "")
      .join(", ");
  };

  const toggleCommonAllergen = (item: MenuItem, allergenId: string, checked: boolean) => {
    const state = deps.getState();
    if (!state.draft) return;
    const list = deps.ensureAllergens(item);
    const index = list.findIndex((entry) => entry.id === allergenId);
    if (checked && index === -1) {
      const common = deps.commonAllergenCatalog.find((entry) => entry.id === allergenId);
      if (!common) return;
      list.push({
        id: common.id,
        label: state.draft.meta.locales.reduce<Record<string, string>>((acc, lang) => {
          acc[lang] = deps.getLocalizedValue(common.label, lang, state.draft?.meta.defaultLocale ?? "en");
          return acc;
        }, {})
      });
    }
    if (!checked && index >= 0) {
      list.splice(index, 1);
    }
    deps.touchDraft();
  };

  const handleCommonAllergenToggle = (item: MenuItem, allergenId: string, event: Event) => {
    const input = event.currentTarget as HTMLInputElement;
    toggleCommonAllergen(item, allergenId, input.checked);
  };

  const handleCustomAllergensInput = (item: MenuItem, lang: string, event: Event) => {
    const state = deps.getState();
    if (!state.draft) return;
    const input = event.currentTarget as HTMLInputElement;
    const values = input.value.split(",").map((value) => value.trim());
    const list = deps.ensureAllergens(item);
    const common = list.filter((entry) => entry.id);
    const custom = list.filter((entry) => !entry.id);
    const nextCount = Math.max(custom.length, values.length);
    const nextCustom: AllergenEntry[] = [];
    for (let index = 0; index < nextCount; index += 1) {
      const base = custom[index]?.label
        ? { ...custom[index].label }
        : state.draft.meta.locales.reduce<Record<string, string>>((acc, localeCode) => {
            acc[localeCode] = "";
            return acc;
          }, {});
      base[lang] = values[index] ?? "";
      const hasAny = state.draft.meta.locales.some((localeCode) => (base[localeCode] ?? "").trim());
      if (hasAny) {
        nextCustom.push({ label: base });
      }
    }
    item.allergens = [...common, ...nextCustom];
    deps.touchDraft();
  };

  const handleLocalizedInput = (record: Record<string, string>, lang: string, event: Event) => {
    const input = event.currentTarget as HTMLInputElement;
    record[lang] = input.value;
    deps.touchDraft();
  };

  const cycleEditLang = () => {
    const state = deps.getState();
    if (!state.draft) return;
    const locales = state.draft.meta.locales;
    if (!locales.length) return;
    const currentIndex = locales.indexOf(state.editLang);
    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % locales.length : 0;
    deps.setState({ editLang: locales[nextIndex] });
  };

  const handleCurrencyChange = (event: Event) => {
    const input = event.currentTarget as HTMLSelectElement;
    setCurrency(input.value);
  };

  const handleFontChoice = (value: string) => {
    const state = deps.getState();
    if (!state.draft) return;
    if (value === "custom") {
      if (
        !state.draft.meta.fontFamily ||
        deps.fontOptions.some((option) => option.value === state.draft?.meta.fontFamily)
      ) {
        state.draft.meta.fontFamily = "Custom Font";
      }
      if (state.draft.meta.fontSource === undefined) {
        state.draft.meta.fontSource = "";
      }
    } else {
      state.draft.meta.fontFamily = value;
      state.draft.meta.fontSource = "";
    }
    deps.touchDraft();
  };

  const handleFontSelect = (event: Event) => {
    const input = event.currentTarget as HTMLSelectElement;
    handleFontChoice(input.value);
  };

  const handleCustomFontSourceInput = (event: Event) => {
    const state = deps.getState();
    if (!state.draft) return;
    const target = event.currentTarget;
    if (!(target instanceof HTMLInputElement) && !(target instanceof HTMLSelectElement)) return;
    state.draft.meta.fontSource = target.value;
    deps.touchDraft();
  };

  const setIdentityMode = (mode: "text" | "logo") => {
    const state = deps.getState();
    if (!state.draft) return;
    state.draft.meta.identityMode = mode;
    deps.touchDraft();
  };

  const setLogoSrc = (src: string) => {
    const state = deps.getState();
    if (!state.draft) return;
    state.draft.meta.logoSrc = src;
    deps.touchDraft();
  };

  const setFontRoleSource = (role: "identity" | "section" | "item", source: string) => {
    const state = deps.getState();
    if (!state.draft) return;
    if (!state.draft.meta.fontRoles) {
      state.draft.meta.fontRoles = {};
    }
    const existing = state.draft.meta.fontRoles[role] ?? {};
    const next: RoleFontConfig = {
      ...existing,
      source: source.trim()
    };
    state.draft.meta.fontRoles[role] = next;
    deps.touchDraft();
  };

  const setItemScrollAnimationMode = (item: MenuItem, mode: "hero360" | "alternate") => {
    const normalized = mode === "alternate" ? "alternate" : "hero360";
    if (item.media.scrollAnimationMode === normalized) return;
    item.media.scrollAnimationMode = normalized;
    deps.touchDraft();
  };

  const setItemScrollAnimationSrc = (item: MenuItem, source: string) => {
    const normalized = source.trim();
    if (item.media.scrollAnimationSrc === normalized) return;
    item.media.scrollAnimationSrc = normalized;
    deps.touchDraft();
  };

  const setItemPriceVisible = (item: MenuItem, visible: boolean) => {
    if (item.priceVisible === visible) return;
    item.priceVisible = visible;
    deps.touchDraft();
  };

  const setItemFontSource = (item: MenuItem, source: string) => {
    const normalized = source.trim();
    const fontConfig = ensureItemFontConfig(item);
    if (fontConfig.source === normalized) return;
    fontConfig.source = normalized;
    deps.touchDraft();
  };

  const getDishRotateDirection = (item: MenuItem | null): 1 | -1 =>
    item?.media.rotationDirection === "cw" ? -1 : 1;

  const setItemRotationDirection = (item: MenuItem, direction: "cw" | "ccw") => {
    if (item.media.rotationDirection === direction) return;
    item.media.rotationDirection = direction;
    deps.touchDraft();
  };

  const handleVeganToggle = (item: MenuItem, event: Event) => {
    const input = event.currentTarget as HTMLInputElement;
    item.vegan = input.checked;
    deps.touchDraft();
  };

  return {
    toggleLanguage,
    setCurrency,
    toggleCurrencyPosition,
    applyTemplate,
    addBackground,
    setBackgroundDisplayMode,
    setCategoryBackgroundId,
    setBackgroundCarouselSeconds,
    moveBackground,
    removeBackground,
    addSection,
    deleteSection,
    addDish,
    addWizardCategory,
    removeWizardCategory,
    addWizardDish,
    removeWizardDish,
    deleteDish,
    goPrevDish,
    goNextDish,
    handleDescriptionInput,
    handleLongDescriptionInput,
    isCommonAllergenChecked,
    getCommonAllergenLabel,
    getCustomAllergensInput,
    toggleCommonAllergen,
    handleCommonAllergenToggle,
    handleCustomAllergensInput,
    handleLocalizedInput,
    cycleEditLang,
    handleCurrencyChange,
    handleFontChoice,
    handleFontSelect,
    handleCustomFontSourceInput,
    setIdentityMode,
    setLogoSrc,
    setFontRoleSource,
    setItemScrollAnimationMode,
    setItemScrollAnimationSrc,
    setItemPriceVisible,
    setItemFontSource,
    getDishRotateDirection,
    setItemRotationDirection,
    handleVeganToggle
  };
};
