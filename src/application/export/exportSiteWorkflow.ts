import { buildStartupAssetPlan, collectItemPrioritySources } from "../../core/menu/startupAssets";
import type { DerivedMediaMap, DerivedMediaVariant, MenuItem, MenuProject } from "../../lib/types";
import {
  type ExportAssetManifestEntry,
  buildExportDiagnostics,
  buildExportDiagnosticsEntries
} from "./diagnostics";
import { evaluateExportBudgets, measureGzipBytes } from "./performanceBudget";
import { buildProjectAssetPairs, collectExportProjectAssetPaths } from "./projectZip";
import { buildStaticShellEntries } from "./staticShell";

export type ResponsiveMediaPaths = {
  small: string;
  medium: string;
  large: string;
};

type ExportZipEntry = {
  name: string;
  data: Uint8Array;
};

type ExportSiteWorkflowProgress = {
  onCollectStart?: () => void;
  onAssetProgress?: (current: number, total: number) => void;
  onBundleProgress?: (percent: number) => void;
  onReportProgress?: (percent: number) => void;
};

type BuildResponsiveVariants = (
  basePath: string,
  sourceData: Uint8Array,
  mime: string
) => Promise<{ paths: ResponsiveMediaPaths; entries: ExportZipEntry[] } | null>;

export type ExportSiteWorkflowParams = {
  slug: string;
  project: MenuProject;
  normalizePath: (value: string) => string;
  readAssetBytes: (slug: string, sourcePath: string) => Promise<Uint8Array | null>;
  getMimeType: (path: string) => string;
  isResponsiveImageMime: (mime: string) => boolean;
  createResponsiveImageVariants: BuildResponsiveVariants;
  buildExportStyles: () => string;
  buildRuntimeScript: (project: MenuProject) => string;
  getCarouselImageSource: (item: MenuItem) => string;
  faviconIco: Uint8Array;
  progress?: ExportSiteWorkflowProgress;
  onMissingAsset?: (sourcePath: string, error?: unknown) => void;
};

export type ExportSiteWorkflowResult = {
  entries: ExportZipEntry[];
  project: MenuProject;
  diagnostics: ReturnType<typeof buildExportDiagnostics>;
  manifestEntries: ExportAssetManifestEntry[];
  missingSourcePaths: string[];
};

export const buildExportSiteWorkflow = async (
  params: ExportSiteWorkflowParams
): Promise<ExportSiteWorkflowResult> => {
  const {
    slug,
    project,
    normalizePath,
    readAssetBytes,
    getMimeType,
    isResponsiveImageMime,
    createResponsiveImageVariants,
    buildExportStyles,
    buildRuntimeScript,
    getCarouselImageSource,
    faviconIco,
    progress,
    onMissingAsset
  } = params;

  let exportProject = JSON.parse(JSON.stringify(project)) as MenuProject;
  progress?.onCollectStart?.();
  const assets = collectExportProjectAssetPaths(exportProject, normalizePath);
  const assetPairs = buildProjectAssetPairs(slug, assets, normalizePath);
  const entries: ExportZipEntry[] = [];
  const manifestEntries: ExportAssetManifestEntry[] = [];
  const missingSourcePaths = new Set<string>();
  const heroSources = new Set<string>();
  const backgroundSources = new Set(
    exportProject.backgrounds
      .map((bg) => normalizePath(bg.src || ""))
      .filter((source) => source.length > 0)
  );
  const fontSources = new Set<string>();
  const collectFontSource = (value?: string) => {
    const normalized = normalizePath(value || "");
    if (normalized) fontSources.add(normalized);
  };
  collectFontSource(exportProject.meta.fontSource);
  collectFontSource(exportProject.meta.fontRoles?.identity?.source);
  collectFontSource(exportProject.meta.fontRoles?.restaurant?.source);
  collectFontSource(exportProject.meta.fontRoles?.title?.source);
  collectFontSource(exportProject.meta.fontRoles?.section?.source);
  collectFontSource(exportProject.meta.fontRoles?.item?.source);
  exportProject.categories.forEach((category) => {
    category.items.forEach((item) => {
      collectFontSource(item.typography?.item?.source);
    });
  });
  exportProject.categories.forEach((category) => {
    category.items.forEach((item) => {
      const hero = normalizePath(item.media.hero360 || "");
      if (hero) heroSources.add(hero);
    });
  });

  const sourceToExportPath = new Map<string, string>();
  const sourceToResponsive = new Map<string, ResponsiveMediaPaths>();

  const getMappedSource = (source?: string) => {
    if (!source) return null;
    return sourceToExportPath.get(normalizePath(source)) ?? null;
  };

  const pickMappedVariantSource = (value?: DerivedMediaVariant): string | null => {
    if (!value) return null;
    if (typeof value === "string") {
      return getMappedSource(value);
    }
    const preferredFormats = ["webp", "gif", "png", "jpg", "jpeg", "webm", "mp4"] as const;
    for (const format of preferredFormats) {
      const mapped = getMappedSource(value[format]);
      if (mapped) return mapped;
    }
    for (const source of Object.values(value)) {
      const mapped = getMappedSource(source);
      if (mapped) return mapped;
    }
    return null;
  };

  const pickMappedDerivedSource = (derived?: DerivedMediaMap): string | null =>
    pickMappedVariantSource(derived?.large) ??
    pickMappedVariantSource(derived?.medium) ??
    pickMappedVariantSource(derived?.small);

  const pickMappedResponsiveSource = (responsive?: {
    small?: string;
    medium?: string;
    large?: string;
  }): string | null =>
    getMappedSource(responsive?.large) ??
    getMappedSource(responsive?.medium) ??
    getMappedSource(responsive?.small);

  const rewriteDerivedVariant = (
    value?: DerivedMediaVariant
  ): DerivedMediaVariant | undefined => {
    if (!value) return undefined;
    if (typeof value === "string") {
      return getMappedSource(value) ?? undefined;
    }
    const next: Record<string, string> = {};
    Object.entries(value).forEach(([format, source]) => {
      const mapped = getMappedSource(source);
      if (mapped) {
        next[format] = mapped;
      }
    });
    return Object.keys(next).length > 0 ? next : undefined;
  };

  const rewriteDerived = (value?: DerivedMediaMap): DerivedMediaMap | undefined => {
    if (!value) return undefined;
    const small = rewriteDerivedVariant(value.small);
    const medium = rewriteDerivedVariant(value.medium);
    const large = rewriteDerivedVariant(value.large);
    if (!small && !medium && !large && !value.profileId) {
      return undefined;
    }
    return {
      ...(value.profileId ? { profileId: value.profileId } : {}),
      ...(small ? { small } : {}),
      ...(medium ? { medium } : {}),
      ...(large ? { large } : {})
    };
  };

  const rewriteResponsive = (value?: { small?: string; medium?: string; large?: string }) => {
    if (!value) return undefined;
    const small = getMappedSource(value.small);
    const medium = getMappedSource(value.medium);
    const large = getMappedSource(value.large);
    if (!small && !medium && !large) {
      return undefined;
    }
    return {
      ...(small ? { small } : {}),
      ...(medium ? { medium } : {}),
      ...(large ? { large } : {})
    };
  };

  const rewriteFontConfig = (value?: { family?: string; source?: string }) => {
    if (!value) return value;
    return {
      ...(value.family !== undefined ? { family: value.family } : {}),
      ...(value.source !== undefined
        ? { source: getMappedSource(value.source) ?? value.source }
        : {})
    };
  };

  const getSourceRole = (sourcePath: string): ExportAssetManifestEntry["role"] => {
    if (fontSources.has(sourcePath)) return "font";
    if (backgroundSources.has(sourcePath)) return "background";
    if (heroSources.has(sourcePath)) return "hero";
    return "other";
  };

  const totalAssetPairs = Math.max(1, assetPairs.length);
  for (let assetIndex = 0; assetIndex < assetPairs.length; assetIndex += 1) {
    const pair = assetPairs[assetIndex];
    progress?.onAssetProgress?.(assetIndex, totalAssetPairs);
    try {
      const exportPath = `assets/${pair.relativePath}`;
      const data = await readAssetBytes(slug, pair.sourcePath);
      if (!data) {
        missingSourcePaths.add(pair.sourcePath);
        continue;
      }
      const mime = getMimeType(exportPath).toLowerCase();
      const shouldResize = heroSources.has(pair.sourcePath) && isResponsiveImageMime(mime);
      if (shouldResize) {
        const responsive = await createResponsiveImageVariants(exportPath, data, mime);
        if (responsive) {
          const responsiveVariantByPath = new Map<string, "small" | "medium" | "large">([
            [responsive.paths.small, "small"],
            [responsive.paths.medium, "medium"],
            [responsive.paths.large, "large"]
          ]);
          responsive.entries.forEach((entry) => {
            entries.push(entry);
            manifestEntries.push({
              outputPath: entry.name,
              sourcePath: pair.sourcePath,
              role: getSourceRole(pair.sourcePath),
              mime,
              bytes: entry.data.byteLength,
              responsiveVariant: responsiveVariantByPath.get(entry.name) ?? null,
              firstView: false
            });
          });
          sourceToExportPath.set(pair.sourcePath, responsive.paths.large);
          sourceToResponsive.set(pair.sourcePath, responsive.paths);
          continue;
        }
      }

      entries.push({ name: exportPath, data });
      manifestEntries.push({
        outputPath: exportPath,
        sourcePath: pair.sourcePath,
        role: getSourceRole(pair.sourcePath),
        mime,
        bytes: data.byteLength,
        responsiveVariant: null,
        firstView: false
      });
      sourceToExportPath.set(pair.sourcePath, exportPath);
    } catch (error) {
      missingSourcePaths.add(pair.sourcePath);
      onMissingAsset?.(pair.sourcePath, error);
    } finally {
      progress?.onAssetProgress?.(assetIndex + 1, totalAssetPairs);
    }
  }

  progress?.onBundleProgress?.(80);

  exportProject.backgrounds = exportProject.backgrounds.map((bg) => {
    const { derived: _derived, ...bgBase } = bg;
    const mappedOriginalSrc = getMappedSource(bg.originalSrc) ?? getMappedSource(bg.src);
    const mappedPreviewSrc =
      pickMappedDerivedSource(bg.derived) ?? getMappedSource(bg.src) ?? mappedOriginalSrc;
    const rewrittenDerived = rewriteDerived(bg.derived);
    return {
      ...bgBase,
      src: mappedPreviewSrc ?? bg.src,
      ...(mappedOriginalSrc ? { originalSrc: mappedOriginalSrc } : {}),
      ...(rewrittenDerived ? { derived: rewrittenDerived } : {})
    };
  });

  if (exportProject.meta.fontSource) {
    const normalized = normalizePath(exportProject.meta.fontSource);
    const mapped = sourceToExportPath.get(normalized);
    if (mapped) {
      exportProject.meta.fontSource = mapped;
    }
  }
  if (exportProject.meta.fontRoles) {
    exportProject.meta.fontRoles = {
      ...exportProject.meta.fontRoles,
      ...(exportProject.meta.fontRoles.identity
        ? { identity: rewriteFontConfig(exportProject.meta.fontRoles.identity) }
        : {}),
      ...(exportProject.meta.fontRoles.restaurant
        ? { restaurant: rewriteFontConfig(exportProject.meta.fontRoles.restaurant) }
        : {}),
      ...(exportProject.meta.fontRoles.title
        ? { title: rewriteFontConfig(exportProject.meta.fontRoles.title) }
        : {}),
      ...(exportProject.meta.fontRoles.section
        ? { section: rewriteFontConfig(exportProject.meta.fontRoles.section) }
        : {}),
      ...(exportProject.meta.fontRoles.item
        ? { item: rewriteFontConfig(exportProject.meta.fontRoles.item) }
        : {})
    };
  }
  if (exportProject.meta.logoSrc) {
    const normalized = normalizePath(exportProject.meta.logoSrc);
    const mapped = sourceToExportPath.get(normalized);
    if (mapped) {
      exportProject.meta.logoSrc = mapped;
    }
  }

  exportProject.categories = exportProject.categories.map((category) => ({
    ...category,
    items: category.items.map((item) => {
      const hero = normalizePath(item.media.hero360 || "");
      const mappedHero = sourceToExportPath.get(hero);
      const responsive = sourceToResponsive.get(hero);
      const mappedOriginalHero = getMappedSource(item.media.originalHero360);
      const { responsive: _responsive, derived: _derived, ...mediaBase } = item.media;
      const mappedFromDerived = pickMappedDerivedSource(item.media.derived);
      const rewrittenDerived = rewriteDerived(item.media.derived);
      const rewrittenResponsive = responsive ?? rewriteResponsive(item.media.responsive);
      const nextMedia = {
        ...mediaBase,
        hero360:
          mappedFromDerived ??
          pickMappedResponsiveSource(rewrittenResponsive) ??
          mappedHero ??
          mappedOriginalHero ??
          item.media.hero360
      };
      if (mappedOriginalHero) {
        nextMedia.originalHero360 = mappedOriginalHero;
      }
      if (rewrittenResponsive) nextMedia.responsive = rewrittenResponsive;
      if (rewrittenDerived) nextMedia.derived = rewrittenDerived;

      const nextTypography = item.typography?.item
        ? {
            ...item.typography,
            item: rewriteFontConfig(item.typography.item)
          }
        : item.typography;

      return {
        ...item,
        media: nextMedia,
        ...(nextTypography ? { typography: nextTypography } : {})
      };
    })
  }));

  progress?.onBundleProgress?.(84);

  const exportVersion = String(Date.now());
  const menuData = JSON.stringify(exportProject, null, 2);
  const stylesCss = buildExportStyles();
  const appJs = buildRuntimeScript(exportProject);
  const shellEntries = buildStaticShellEntries({
    menuJson: menuData,
    stylesCss,
    appJs,
    exportVersion,
    faviconIco
  });
  entries.push(...shellEntries);
  shellEntries.forEach((entry) => {
    manifestEntries.push({
      outputPath: entry.name,
      sourcePath: null,
      role: "shell",
      mime: getMimeType(entry.name),
      bytes: entry.data.byteLength,
      responsiveVariant: null,
      firstView: false
    });
  });

  const startupWeightMap = manifestEntries.reduce<Record<string, number>>((acc, entry) => {
    if (!entry.outputPath || !entry.bytes) return acc;
    acc[entry.outputPath] = entry.bytes;
    return acc;
  }, {});
  const startupPlan = buildStartupAssetPlan({
    backgroundSources: exportProject.backgrounds.map((bg) => bg.src || ""),
    itemSources: collectItemPrioritySources(exportProject, getCarouselImageSource),
    blockingBackgroundLimit: 1,
    blockingItemLimit: 3,
    sourceWeights: startupWeightMap,
    prioritizeSmallerFirst: true
  });
  const firstViewSources = new Set(startupPlan.blocking);
  manifestEntries.forEach((entry) => {
    if (firstViewSources.has(entry.outputPath)) {
      entry.firstView = true;
    }
  });

  const firstViewImageBytes = manifestEntries
    .filter((entry) => entry.firstView && entry.mime.startsWith("image/"))
    .reduce((sum, entry) => sum + entry.bytes, 0);

  progress?.onReportProgress?.(89);

  const budgets = evaluateExportBudgets({
    jsGzipBytes: await measureGzipBytes(appJs),
    cssGzipBytes: await measureGzipBytes(stylesCss),
    firstViewImageBytes
  });
  const diagnostics = buildExportDiagnostics({
    slug,
    generatedAt: new Date().toISOString(),
    manifestEntries,
    referencedSourcePaths: assetPairs.map((pair) => pair.sourcePath),
    missingSourcePaths: Array.from(missingSourcePaths),
    heroSourceCount: heroSources.size,
    responsiveHeroSourceCount: sourceToResponsive.size,
    budgets
  });
  entries.push(...buildExportDiagnosticsEntries(diagnostics));
  if (!budgets.passed) {
    console.warn("Export performance budgets exceeded", diagnostics.report.budgets.checks);
  }

  return {
    entries,
    project: exportProject,
    diagnostics,
    manifestEntries,
    missingSourcePaths: Array.from(missingSourcePaths)
  };
};
