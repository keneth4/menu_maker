import type { MenuProject } from "../../lib/types";

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

  if (exportProject.meta.fontSource) {
    const normalized = normalizePath(exportProject.meta.fontSource);
    const pair = assetPairs.find((item) => item.sourcePath === normalized);
    if (pair) {
      exportProject.meta.fontSource = `assets/${pair.relativePath}`;
    }
  }

  exportProject.backgrounds = exportProject.backgrounds.map((bg) => {
    const normalized = normalizePath(bg.src || "");
    const pair = assetPairs.find((item) => item.sourcePath === normalized);
    return { ...bg, src: pair ? `assets/${pair.relativePath}` : bg.src };
  });
  exportProject.categories = exportProject.categories.map((category) => ({
    ...category,
    items: category.items.map((item) => {
      const hero = normalizePath(item.media.hero360 || "");
      const pair = assetPairs.find((p) => p.sourcePath === hero);
      const media = {
        ...item.media,
        hero360: pair ? `assets/${pair.relativePath}` : item.media.hero360
      };
      delete (media as { responsive?: unknown }).responsive;
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
  const assets = collectProjectAssetPaths(project, normalizePath);
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
