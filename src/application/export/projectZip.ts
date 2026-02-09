import type { DerivedMediaMap, DerivedMediaVariant, MenuProject } from "../../lib/types";

export type ZipBinaryEntry = {
  name: string;
  data: Uint8Array;
};

export type ProjectAssetPair = {
  sourcePath: string;
  relativePath: string;
  zipPath: string;
};

export const collectProjectAssetPaths = (
  project: MenuProject,
  normalizePath: (value: string) => string
) => {
  const assets = new Set<string>();
  if (project.meta.fontSource) {
    assets.add(project.meta.fontSource);
  }
  if (project.meta.logoSrc) {
    assets.add(project.meta.logoSrc);
  }
  project.backgrounds.forEach((bg) => {
    if (bg.src) assets.add(bg.src);
  });
  project.categories.forEach((category) => {
    category.items.forEach((item) => {
      if (item.media.hero360) assets.add(item.media.hero360);
    });
  });
  return Array.from(assets)
    .map((path) => normalizePath(path))
    .filter((path) => path && !path.startsWith("http"));
};

const collectDerivedVariantPaths = (assets: Set<string>, value?: DerivedMediaVariant) => {
  if (!value) return;
  if (typeof value === "string") {
    assets.add(value);
    return;
  }
  if (typeof value === "object") {
    Object.values(value).forEach((source) => {
      if (source) assets.add(source);
    });
  }
};

const collectDerivedPaths = (assets: Set<string>, derived?: DerivedMediaMap) => {
  if (!derived) return;
  collectDerivedVariantPaths(assets, derived.small);
  collectDerivedVariantPaths(assets, derived.medium);
  collectDerivedVariantPaths(assets, derived.large);
};

const normalizeCollectedAssetPaths = (
  assets: Set<string>,
  normalizePath: (value: string) => string
) =>
  Array.from(assets)
    .map((path) => normalizePath(path))
    .filter((path) => path && !path.startsWith("http"));

export const collectExportProjectAssetPaths = (
  project: MenuProject,
  normalizePath: (value: string) => string
) => {
  const assets = new Set<string>();
  if (project.meta.fontSource) assets.add(project.meta.fontSource);
  if (project.meta.logoSrc) assets.add(project.meta.logoSrc);

  project.backgrounds.forEach((bg) => {
    const derivedSources = new Set<string>();
    collectDerivedPaths(derivedSources, bg.derived);
    if (derivedSources.size > 0) {
      derivedSources.forEach((source) => assets.add(source));
      return;
    }
    if (bg.src) assets.add(bg.src);
  });

  project.categories.forEach((category) => {
    category.items.forEach((item) => {
      const derivedSources = new Set<string>();
      collectDerivedPaths(derivedSources, item.media.derived);
      if (derivedSources.size > 0) {
        derivedSources.forEach((source) => assets.add(source));
        return;
      }
      if (item.media.responsive?.small) assets.add(item.media.responsive.small);
      if (item.media.responsive?.medium) assets.add(item.media.responsive.medium);
      if (item.media.responsive?.large) assets.add(item.media.responsive.large);
      if (item.media.hero360) assets.add(item.media.hero360);
    });
  });

  return normalizeCollectedAssetPaths(assets, normalizePath);
};

export const collectSaveProjectAssetPaths = (
  project: MenuProject,
  normalizePath: (value: string) => string
) => {
  const assets = new Set<string>();
  if (project.meta.fontSource) assets.add(project.meta.fontSource);
  if (project.meta.logoSrc) assets.add(project.meta.logoSrc);

  project.backgrounds.forEach((bg) => {
    if (bg.src) assets.add(bg.src);
    if (bg.originalSrc) assets.add(bg.originalSrc);
    collectDerivedPaths(assets, bg.derived);
  });

  project.categories.forEach((category) => {
    category.items.forEach((item) => {
      if (item.media.hero360) assets.add(item.media.hero360);
      if (item.media.originalHero360) assets.add(item.media.originalHero360);
      item.media.gallery?.forEach((entry) => {
        if (entry) assets.add(entry);
      });
      if (item.media.responsive?.small) assets.add(item.media.responsive.small);
      if (item.media.responsive?.medium) assets.add(item.media.responsive.medium);
      if (item.media.responsive?.large) assets.add(item.media.responsive.large);
      collectDerivedPaths(assets, item.media.derived);
    });
  });

  return normalizeCollectedAssetPaths(assets, normalizePath);
};

export const buildProjectAssetPairs = (
  slug: string,
  assetPaths: string[],
  normalizePath: (value: string) => string
): ProjectAssetPair[] =>
  assetPaths.map((assetPath) => {
    const normalized = normalizePath(assetPath);
    const prefix = `projects/${slug}/assets/`;
    let relativePath = normalized;
    if (normalized.startsWith(prefix)) {
      relativePath = normalized.slice(prefix.length);
    } else if (normalized.includes("assets/")) {
      relativePath = normalized.slice(normalized.lastIndexOf("assets/") + "assets/".length);
    } else {
      relativePath = normalized.split("/").filter(Boolean).pop() ?? "asset";
    }
    return {
      sourcePath: normalized,
      relativePath,
      zipPath: `${slug}/assets/${relativePath}`
    };
  });

export const rewriteProjectForSaveZip = (
  project: MenuProject,
  assetPairs: ProjectAssetPair[],
  normalizePath: (value: string) => string
): MenuProject => {
  const exportProject = JSON.parse(JSON.stringify(project)) as MenuProject;
  const sourceToRelative = new Map<string, string>(
    assetPairs.map((pair) => [pair.sourcePath, `assets/${pair.relativePath}`])
  );
  const rewriteSource = (value?: string) => {
    if (!value) return value;
    const normalized = normalizePath(value);
    return sourceToRelative.get(normalized) ?? value;
  };
  const rewriteDerivedVariant = (value?: DerivedMediaVariant) => {
    if (!value) return value;
    if (typeof value === "string") {
      return rewriteSource(value) ?? value;
    }
    const next: Record<string, string> = {};
    Object.entries(value).forEach(([format, source]) => {
      if (!source) return;
      next[format] = rewriteSource(source) ?? source;
    });
    return Object.keys(next).length ? next : value;
  };
  const rewriteDerived = (value?: DerivedMediaMap) => {
    if (!value) return value;
    return {
      ...(value.profileId ? { profileId: value.profileId } : {}),
      ...(value.small ? { small: rewriteDerivedVariant(value.small) } : {}),
      ...(value.medium ? { medium: rewriteDerivedVariant(value.medium) } : {}),
      ...(value.large ? { large: rewriteDerivedVariant(value.large) } : {})
    };
  };
  const rewriteResponsive = (value?: { small?: string; medium?: string; large?: string }) => {
    if (!value) return value;
    return {
      ...(value.small ? { small: rewriteSource(value.small) ?? value.small } : {}),
      ...(value.medium ? { medium: rewriteSource(value.medium) ?? value.medium } : {}),
      ...(value.large ? { large: rewriteSource(value.large) ?? value.large } : {})
    };
  };

  if (exportProject.meta.fontSource) {
    exportProject.meta.fontSource =
      rewriteSource(exportProject.meta.fontSource) ?? exportProject.meta.fontSource;
  }
  if (exportProject.meta.logoSrc) {
    exportProject.meta.logoSrc = rewriteSource(exportProject.meta.logoSrc) ?? exportProject.meta.logoSrc;
  }

  exportProject.backgrounds = exportProject.backgrounds.map((bg) => {
    return {
      ...bg,
      src: rewriteSource(bg.src) ?? bg.src,
      originalSrc: rewriteSource(bg.originalSrc) ?? bg.originalSrc,
      derived: rewriteDerived(bg.derived)
    };
  });
  exportProject.categories = exportProject.categories.map((category) => ({
    ...category,
    items: category.items.map((item) => {
      const media = {
        ...item.media,
        hero360: rewriteSource(item.media.hero360) ?? item.media.hero360,
        originalHero360:
          rewriteSource(item.media.originalHero360) ?? item.media.originalHero360,
        gallery: item.media.gallery?.map((entry) => rewriteSource(entry) ?? entry),
        responsive: rewriteResponsive(item.media.responsive),
        derived: rewriteDerived(item.media.derived)
      };
      return {
        ...item,
        media
      };
    })
  }));

  return exportProject;
};

export const buildProjectZipEntries = async (options: {
  project: MenuProject;
  slug: string;
  normalizePath: (value: string) => string;
  readAssetBytes: (slug: string, sourcePath: string) => Promise<Uint8Array | null>;
  onMissingAsset?: (sourcePath: string, error: unknown) => void;
}) => {
  const { project, slug, normalizePath, readAssetBytes, onMissingAsset } = options;
  const encoder = new TextEncoder();
  const assets = collectSaveProjectAssetPaths(project, normalizePath);
  const assetPairs = buildProjectAssetPairs(slug, assets, normalizePath);
  const exportProject = rewriteProjectForSaveZip(project, assetPairs, normalizePath);
  const entries: ZipBinaryEntry[] = [];
  const menuData = JSON.stringify(exportProject, null, 2);
  entries.push({ name: `${slug}/menu.json`, data: encoder.encode(menuData) });

  for (const pair of assetPairs) {
    try {
      const data = await readAssetBytes(slug, pair.sourcePath);
      if (!data) continue;
      entries.push({ name: pair.zipPath, data });
    } catch (error) {
      onMissingAsset?.(pair.sourcePath, error);
    }
  }
  return entries;
};
