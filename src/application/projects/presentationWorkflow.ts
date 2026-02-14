import { formatMenuPrice } from "../../core/menu/pricing";
import { normalizeLocaleCode } from "../../core/menu/localization";

type LocalizedMap = Record<string, string> | undefined;

type MenuTermsShape = Record<string, { allergens: string; vegan: string }>;

type InstructionCopyShape = Record<string, Record<string, string>>;

export const textOfLocalized = (
  entry: LocalizedMap,
  locale: string,
  defaultLocale: string,
  fallback = ""
) => {
  if (!entry) return fallback;
  return entry[locale] ?? entry[defaultLocale] ?? fallback;
};

export const getMenuTermLocalized = (
  terms: MenuTermsShape,
  term: "allergens" | "vegan",
  locale: string,
  fallbackLocale = "en"
) => {
  const localeKey = normalizeLocaleCode(locale);
  return terms[localeKey]?.[term] ?? terms[fallbackLocale]?.[term] ?? term;
};

export const getInstructionCopyLocalized = (
  copy: InstructionCopyShape,
  key: string,
  locale: string,
  fallbackLocale = "en"
) => {
  const localeKey = normalizeLocaleCode(locale);
  return copy[localeKey]?.[key] ?? copy[fallbackLocale]?.[key] ?? key;
};

export const normalizeAssetSource = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed.replace(/^\/+/, "")}`;
};

export const formatProjectPrice = (
  amount: number,
  currency: string,
  position: "left" | "right"
) => formatMenuPrice(amount, currency, position);
