import type { MenuProject } from "../../lib/types";

const hasNonEmptySource = (value: string | undefined) => Boolean(value?.trim().length);

export const isWizardShowcaseEligible = (project: MenuProject | null): boolean => {
  if (!project) return false;
  const hasItems = project.categories.some((category) => category.items.length > 0);
  const hasBackgroundSource = project.backgrounds.some((background) =>
    hasNonEmptySource(background.src)
  );
  return !hasItems && !hasBackgroundSource;
};
