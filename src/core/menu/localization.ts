export const normalizeLocaleCode = (lang: string) => lang.toLowerCase().split("-")[0];

export const getLocalizedValue = (
  labels: Record<string, string> | undefined,
  lang: string,
  defaultLang = "en"
) => {
  if (!labels) return "";
  const normalized = normalizeLocaleCode(lang);
  const defaultNormalized = normalizeLocaleCode(defaultLang);
  return (
    labels[lang] ??
    labels[normalized] ??
    labels[defaultLang] ??
    labels[defaultNormalized] ??
    labels.en ??
    Object.values(labels).find((value) => value.trim().length > 0) ??
    ""
  );
};
