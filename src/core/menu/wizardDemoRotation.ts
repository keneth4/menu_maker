import type { MenuProject } from "../../lib/types";

const getAssetBasename = (value: string | undefined): string => {
  if (!value) return "";
  const [withoutQuery] = value.split(/[?#]/, 1);
  const parts = withoutQuery.split("/").filter(Boolean);
  return (parts[parts.length - 1] ?? "").toLowerCase();
};

export const WIZARD_DEMO_ROTATION_BY_ASSET = new Map<string, "cw" | "ccw">([
  ["sample360food.gif", "cw"],
  ["b&w-cookies.gif", "cw"],
  ["all-berry-donut.gif", "cw"],
  ["blue-berry-pancakes.gif", "cw"],
  ["caramel-pie.gif", "cw"],
  ["full-cheescake.gif", "cw"],
  ["raspberry-cheesecake-pie.gif", "cw"],
  ["ice-cream-sandwich.webp", "ccw"],
  ["sandwich-bacon.gif", "ccw"],
  ["jerk-chicken-sandwich.webp", "ccw"],
  ["sandwich-filete-de-pollo-empanizado.gif", "cw"],
  ["torta-de-jamon-de-pavo.gif", "cw"]
]);

export const getWizardDemoRotationDirection = (
  hero360: string | undefined
): "cw" | "ccw" | null => {
  const basename = getAssetBasename(hero360);
  if (!basename) return null;
  return WIZARD_DEMO_ROTATION_BY_ASSET.get(basename) ?? null;
};

export const applyWizardDemoRotationDirections = (project: MenuProject): MenuProject => {
  project.categories.forEach((category) => {
    category.items.forEach((item) => {
      const direction = getWizardDemoRotationDirection(item.media?.hero360);
      if (!direction) return;
      item.media.rotationDirection = direction;
    });
  });
  return project;
};
