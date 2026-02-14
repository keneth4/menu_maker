import type { MenuProject } from "../../lib/types";

type DraftMetaLocalizedField = "title" | "restaurantName";

const createLocalizedMap = (locales: string[]) =>
  locales.reduce<Record<string, string>>((acc, lang) => {
    acc[lang] = "";
    return acc;
  }, {});

export const ensureDraftMetaLocalizedField = (
  draft: MenuProject | null,
  field: DraftMetaLocalizedField
): Record<string, string> | null => {
  if (!draft) return null;
  if (!draft.meta[field]) {
    draft.meta[field] = createLocalizedMap(draft.meta.locales);
  }
  return draft.meta[field] ?? null;
};
