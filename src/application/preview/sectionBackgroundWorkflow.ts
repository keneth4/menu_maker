import type { MenuCategory, MenuProject } from "../../lib/types";

export type SectionBackgroundEntry = {
  id: string;
  label: string;
};

export type SectionBackgroundState = {
  optionsByCategory: Record<string, { value: string; label: string }[]>;
  hasInsufficientBackgrounds: boolean;
  hasMissingAssignments: boolean;
  hasInvalidAssignments: boolean;
  hasDuplicateAssignments: boolean;
  isComplete: boolean;
};

export const normalizeSectionBackgroundId = (value?: string) => (value ?? "").trim();

const extractFilenameFromPath = (value: string) => {
  const normalized = value.trim();
  if (!normalized || normalized.startsWith("data:")) return "";
  const [withoutHash] = normalized.split("#");
  const [withoutQuery] = withoutHash.split("?");
  const filename = withoutQuery.split(/[\\/]/).filter(Boolean).pop() ?? "";
  if (!filename) return "";
  try {
    return decodeURIComponent(filename);
  } catch {
    return filename;
  }
};

const resolveBackgroundReference = (background: { src?: string; originalSrc?: string }) =>
  (background.src ?? "").trim() || (background.originalSrc ?? "").trim();

export const getBackgroundDisplayLabel = (
  background: { src?: string; originalSrc?: string },
  index: number,
  backgroundLabel: string
) =>
  extractFilenameFromPath(background.originalSrc ?? "") ||
  extractFilenameFromPath(background.src ?? "") ||
  `${backgroundLabel} ${index + 1}`;

export const getSectionModeBackgroundEntries = (
  project: MenuProject,
  backgroundLabel: string
): SectionBackgroundEntry[] =>
  project.backgrounds
    .filter((background) => background.id && resolveBackgroundReference(background).length > 0)
    .map((background, index) => ({
      id: background.id,
      label: getBackgroundDisplayLabel(background, index, backgroundLabel)
    }));

export const buildSectionBackgroundUsage = (categories: MenuCategory[]) =>
  categories.reduce<Map<string, number>>((usage, category) => {
    const id = normalizeSectionBackgroundId(category.backgroundId);
    if (!id) return usage;
    usage.set(id, (usage.get(id) ?? 0) + 1);
    return usage;
  }, new Map<string, number>());

export const buildSectionBackgroundState = (
  project: MenuProject,
  backgroundLabel: string
): SectionBackgroundState => {
  const entries = getSectionModeBackgroundEntries(project, backgroundLabel);
  const entryIds = new Set(entries.map((entry) => entry.id));
  const usage = buildSectionBackgroundUsage(project.categories);
  const optionsByCategory = project.categories.reduce<
    Record<string, { value: string; label: string }[]>
  >((acc, category) => {
    const currentId = normalizeSectionBackgroundId(category.backgroundId);
    const options = entries
      .filter((entry) => entry.id === currentId || (usage.get(entry.id) ?? 0) === 0)
      .map((entry) => ({ value: entry.id, label: entry.label }));
    acc[category.id] = options;
    return acc;
  }, {});
  const hasInsufficientBackgrounds = entries.length < project.categories.length;
  const hasMissingAssignments = project.categories.some(
    (category) => !normalizeSectionBackgroundId(category.backgroundId)
  );
  const hasInvalidAssignments = project.categories.some((category) => {
    const id = normalizeSectionBackgroundId(category.backgroundId);
    return Boolean(id) && !entryIds.has(id);
  });
  const hasDuplicateAssignments = project.categories.some((category) => {
    const id = normalizeSectionBackgroundId(category.backgroundId);
    return Boolean(id) && (usage.get(id) ?? 0) > 1;
  });
  return {
    optionsByCategory,
    hasInsufficientBackgrounds,
    hasMissingAssignments,
    hasInvalidAssignments,
    hasDuplicateAssignments,
    isComplete:
      !hasInsufficientBackgrounds &&
      !hasMissingAssignments &&
      !hasInvalidAssignments &&
      !hasDuplicateAssignments
  };
};

export const autoAssignSectionBackgroundsByOrder = (
  project: MenuProject,
  backgroundLabel: string
) => {
  const entries = getSectionModeBackgroundEntries(project, backgroundLabel);
  project.categories = project.categories.map((category, index) => ({
    ...category,
    backgroundId: entries[index]?.id ?? ""
  }));
};

export const getNextUnusedSectionBackgroundId = (
  project: MenuProject,
  currentCategoryId = "",
  backgroundLabel = "Background"
) => {
  const entries = getSectionModeBackgroundEntries(project, backgroundLabel);
  const used = new Set(
    project.categories
      .filter((category) => category.id !== currentCategoryId)
      .map((category) => normalizeSectionBackgroundId(category.backgroundId))
      .filter(Boolean)
  );
  return entries.find((entry) => !used.has(entry.id))?.id ?? "";
};

export const buildSectionBackgroundIndexByCategory = (
  project: MenuProject | null,
  previewBackgrounds: { id: string }[]
) => {
  const lookup = new Map(previewBackgrounds.map((background, index) => [background.id, index]));
  const usage = new Map<string, number>();
  (project?.categories ?? []).forEach((category) => {
    const id = normalizeSectionBackgroundId(category.backgroundId);
    if (!id) return;
    usage.set(id, (usage.get(id) ?? 0) + 1);
  });
  const next: Record<string, number> = {};
  (project?.categories ?? []).forEach((category) => {
    const id = normalizeSectionBackgroundId(category.backgroundId);
    const mapped = lookup.get(id);
    next[category.id] = id && typeof mapped === "number" && (usage.get(id) ?? 0) === 1 ? mapped : -1;
  });
  return next;
};
