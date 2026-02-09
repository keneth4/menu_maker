import type { DerivedMediaMap, DerivedMediaVariant, MenuProject } from "../../lib/types";

const mapPathValue = (value: string | undefined, mapPath: (value: string) => string) =>
  value ? mapPath(value) : value;

const mapDerivedVariant = (
  value: DerivedMediaVariant | undefined,
  mapPath: (value: string) => string
): DerivedMediaVariant | undefined => {
  if (!value) return value;
  if (typeof value === "string") {
    return mapPath(value);
  }
  const next = Object.entries(value).reduce<Record<string, string>>((acc, [format, source]) => {
    if (!source) return acc;
    acc[format] = mapPath(source);
    return acc;
  }, {});
  return Object.keys(next).length ? next : value;
};

const mapDerivedMap = (
  value: DerivedMediaMap | undefined,
  mapPath: (value: string) => string
): DerivedMediaMap | undefined => {
  if (!value) return value;
  return {
    ...(value.profileId ? { profileId: value.profileId } : {}),
    ...(value.small ? { small: mapDerivedVariant(value.small, mapPath) } : {}),
    ...(value.medium ? { medium: mapDerivedVariant(value.medium, mapPath) } : {}),
    ...(value.large ? { large: mapDerivedVariant(value.large, mapPath) } : {})
  };
};

export const mapProjectAssetPaths = (
  project: MenuProject,
  mapPath: (value: string) => string
): MenuProject => ({
  ...project,
  meta: {
    ...project.meta,
    ...(project.meta.fontSource
      ? { fontSource: mapPathValue(project.meta.fontSource, mapPath) ?? project.meta.fontSource }
      : {}),
    ...(project.meta.logoSrc
      ? { logoSrc: mapPathValue(project.meta.logoSrc, mapPath) ?? project.meta.logoSrc }
      : {})
  },
  backgrounds: project.backgrounds.map((bg) => ({
    ...bg,
    src: mapPathValue(bg.src, mapPath) ?? bg.src,
    originalSrc: mapPathValue(bg.originalSrc, mapPath),
    derived: mapDerivedMap(bg.derived, mapPath)
  })),
  categories: project.categories.map((category) => ({
    ...category,
    items: category.items.map((item) => ({
      ...item,
      media: {
        ...item.media,
        hero360: mapPathValue(item.media.hero360, mapPath),
        originalHero360: mapPathValue(item.media.originalHero360, mapPath),
        gallery: item.media.gallery?.map((entry) => mapPathValue(entry, mapPath) ?? entry),
        responsive: item.media.responsive
          ? {
              ...(item.media.responsive.small
                ? { small: mapPathValue(item.media.responsive.small, mapPath) }
                : {}),
              ...(item.media.responsive.medium
                ? { medium: mapPathValue(item.media.responsive.medium, mapPath) }
                : {}),
              ...(item.media.responsive.large
                ? { large: mapPathValue(item.media.responsive.large, mapPath) }
                : {})
            }
          : item.media.responsive,
        derived: mapDerivedMap(item.media.derived, mapPath)
      }
    }))
  }))
});
