import type { MenuCategory, MenuItem, MenuProject } from "../../lib/types";

type FontOption = {
  value: string;
};

export type DraftSelectionNormalizationParams = {
  draft: MenuProject;
  selectedCategoryId: string;
  selectedItemId: string;
  wizardCategoryId: string;
  wizardItemId: string;
  editLang: string;
  wizardLang: string;
  fontOptions: FontOption[];
  defaultFontChoice?: string;
};

export type DraftSelectionNormalizationResult = {
  selectedCategoryId: string;
  selectedItemId: string;
  selectedCategory: MenuCategory | null;
  selectedItem: MenuItem | null;
  wizardCategoryId: string;
  wizardItemId: string;
  wizardCategory: MenuCategory | null;
  wizardItem: MenuItem | null;
  editLang: string;
  wizardLang: string;
  fontChoice: string;
};

export const normalizeDraftSelectionState = (
  params: DraftSelectionNormalizationParams
): DraftSelectionNormalizationResult => {
  const {
    draft,
    fontOptions,
    defaultFontChoice = "Fraunces"
  } = params;

  let {
    selectedCategoryId,
    selectedItemId,
    wizardCategoryId,
    wizardItemId,
    editLang,
    wizardLang
  } = params;

  const validCategory = draft.categories.some((category) => category.id === selectedCategoryId);
  if (!selectedCategoryId || !validCategory) {
    selectedCategoryId = draft.categories[0]?.id ?? "";
  }
  const selectedCategory =
    draft.categories.find((category) => category.id === selectedCategoryId) ?? null;

  const validItem = selectedCategory?.items.some((item) => item.id === selectedItemId);
  if (!selectedItemId || !validItem) {
    selectedItemId = selectedCategory?.items[0]?.id ?? "";
  }
  const selectedItem =
    selectedCategory?.items.find((item) => item.id === selectedItemId) ?? null;

  if (!draft.meta.locales.includes(editLang)) {
    editLang = draft.meta.defaultLocale;
  }
  if (!draft.meta.locales.includes(wizardLang)) {
    wizardLang = draft.meta.defaultLocale;
  }
  if (!draft.meta.currencyPosition) {
    draft.meta.currencyPosition = "left";
  }

  const matchesFont = fontOptions.some((option) => option.value === draft.meta.fontFamily);
  const fontChoice = matchesFont ? draft.meta.fontFamily ?? defaultFontChoice : "custom";

  const validWizardCategory = draft.categories.some((category) => category.id === wizardCategoryId);
  if (!wizardCategoryId || !validWizardCategory) {
    wizardCategoryId = draft.categories[0]?.id ?? "";
  }
  const wizardCategory =
    draft.categories.find((category) => category.id === wizardCategoryId) ?? null;

  const validWizardItem = wizardCategory?.items.some((item) => item.id === wizardItemId);
  if (!wizardItemId || !validWizardItem) {
    wizardItemId = wizardCategory?.items[0]?.id ?? "";
  }
  const wizardItem =
    wizardCategory?.items.find((item) => item.id === wizardItemId) ?? null;

  return {
    selectedCategoryId,
    selectedItemId,
    selectedCategory,
    selectedItem,
    wizardCategoryId,
    wizardItemId,
    wizardCategory,
    wizardItem,
    editLang,
    wizardLang,
    fontChoice
  };
};
