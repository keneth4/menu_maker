import type { MenuItem, MenuProject } from "../../lib/types";
import type { InstructionKey } from "../config/instructionCopy";

type MenuTerm = "allergens" | "vegan";

type RuntimePresentationControllerDeps = {
  getLocale: () => string;
  getDefaultLocale: () => string;
  getTemplateId: () => string;
  getActiveProject: () => MenuProject | null;
  textOfLocalized: (
    value: Record<string, string> | undefined,
    locale: string,
    fallbackLocale: string,
    fallback: string
  ) => string;
  getMenuTermLocalized: (
    terms: Record<string, Record<string, string>>,
    term: MenuTerm,
    lang: string,
    fallbackLang: string
  ) => string;
  getInstructionCopyLocalized: (
    copy: Record<string, Record<string, string>>,
    key: InstructionKey,
    lang: string,
    fallbackLang: string
  ) => string;
  getTemplateInstructionKey: (templateId: string) => InstructionKey;
  getLocalizedAllergenValues: (
    allergens: Array<{ id?: string; label: Record<string, string> }>,
    lang: string,
    fallbackLocale: string
  ) => string[];
  formatProjectPrice: (amount: number, currency: string, position: "left" | "right") => string;
  menuTerms: Record<string, Record<string, string>>;
  instructionCopy: Record<string, Record<string, string>>;
};

export type RuntimePresentationController = {
  textOf: (entry: Record<string, string> | undefined, fallback?: string) => string;
  getMenuTerm: (term: MenuTerm, lang?: string) => string;
  getInstructionCopy: (key: InstructionKey, lang?: string) => string;
  getLoadingLabel: (lang?: string) => string;
  getDishTapHint: (lang?: string) => string;
  getAssetOwnershipDisclaimer: (lang?: string) => string;
  getTemplateScrollHint: (lang?: string, templateId?: string) => string;
  getAllergenValues: (item: MenuItem, lang?: string) => string[];
  formatPrice: (amount: number) => string;
};

export const createRuntimePresentationController = (
  deps: RuntimePresentationControllerDeps
): RuntimePresentationController => {
  const textOf = (entry: Record<string, string> | undefined, fallback = "") => {
    return deps.textOfLocalized(entry, deps.getLocale(), deps.getDefaultLocale(), fallback);
  };

  const getMenuTerm = (term: MenuTerm, lang = deps.getLocale()) => {
    return deps.getMenuTermLocalized(deps.menuTerms, term, lang, "en");
  };

  const getInstructionCopy = (key: InstructionKey, lang = deps.getLocale()) => {
    return deps.getInstructionCopyLocalized(deps.instructionCopy, key, lang, "en");
  };

  const getLoadingLabel = (lang = deps.getLocale()) => getInstructionCopy("loadingLabel", lang);
  const getDishTapHint = (lang = deps.getLocale()) => getInstructionCopy("tapHint", lang);
  const getAssetOwnershipDisclaimer = (lang = deps.getLocale()) =>
    getInstructionCopy("assetDisclaimer", lang);

  const getTemplateScrollHint = (lang = deps.getLocale(), templateId = deps.getTemplateId()) =>
    getInstructionCopy(deps.getTemplateInstructionKey(templateId), lang);

  const getAllergenValues = (item: MenuItem, lang = deps.getLocale()) =>
    deps.getLocalizedAllergenValues(item.allergens, lang, deps.getDefaultLocale());

  const formatPrice = (amount: number) => {
    const currency = deps.getActiveProject()?.meta.currency ?? "USD";
    const position = deps.getActiveProject()?.meta.currencyPosition ?? "left";
    return deps.formatProjectPrice(amount, currency, position);
  };

  return {
    textOf,
    getMenuTerm,
    getInstructionCopy,
    getLoadingLabel,
    getDishTapHint,
    getAssetOwnershipDisclaimer,
    getTemplateScrollHint,
    getAllergenValues,
    formatPrice
  };
};
