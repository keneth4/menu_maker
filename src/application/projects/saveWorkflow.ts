export const normalizeZipName = (value: string) => {
  const sanitized = value.replace(/[\\/:*?"<>|]/g, "").trim();
  if (!sanitized) return "";
  const lower = sanitized.toLowerCase();
  if (lower.endsWith(".zip")) return sanitized;
  if (lower.endsWith(".json")) return `${sanitized.slice(0, -5)}.zip`;
  return `${sanitized}.zip`;
};

export const slugifyName = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

export const getSuggestedZipName = (slug: string, fallback = "menu") => {
  const base = slugifyName(slug || "") || fallback;
  return `${base}.zip`;
};
