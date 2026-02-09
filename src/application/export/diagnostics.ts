import type { ExportBudgetEvaluation } from "./performanceBudget";
import type { ZipBinaryEntry } from "./projectZip";

export type ExportAssetRole = "background" | "hero" | "font" | "other" | "shell";

export type ExportAssetManifestEntry = {
  outputPath: string;
  sourcePath: string | null;
  role: ExportAssetRole;
  mime: string;
  bytes: number;
  responsiveVariant: "small" | "medium" | "large" | null;
  firstView: boolean;
};

export type ExportDiagnosticsManifest = {
  schemaVersion: 1;
  slug: string;
  generatedAt: string;
  assets: ExportAssetManifestEntry[];
};

export type ExportDiagnosticsReport = {
  schemaVersion: 1;
  slug: string;
  generatedAt: string;
  totals: {
    files: number;
    assetFiles: number;
    shellFiles: number;
    totalBytes: number;
    assetBytes: number;
    shellBytes: number;
    firstViewAssetFiles: number;
    firstViewImageBytes: number;
    missingAssets: number;
  };
  responsiveCoverage: {
    heroSources: number;
    heroWithResponsiveVariants: number;
    ratio: number;
  };
  references: {
    referencedAssets: number;
    unresolvedAssets: number;
  };
  budgets: ExportBudgetEvaluation;
  missingAssets: string[];
};

export type BuildExportDiagnosticsInput = {
  slug: string;
  generatedAt?: string;
  manifestEntries: ExportAssetManifestEntry[];
  referencedSourcePaths: string[];
  missingSourcePaths: string[];
  heroSourceCount: number;
  responsiveHeroSourceCount: number;
  budgets: ExportBudgetEvaluation;
};

const normalizePath = (value: string) => value.trim();

const normalizeManifestEntries = (entries: ExportAssetManifestEntry[]) =>
  entries
    .map((entry) => ({
      ...entry,
      outputPath: normalizePath(entry.outputPath),
      sourcePath: entry.sourcePath ? normalizePath(entry.sourcePath) : null
    }))
    .filter((entry) => entry.outputPath.length > 0)
    .sort((a, b) => {
      if (a.outputPath !== b.outputPath) return a.outputPath.localeCompare(b.outputPath);
      const sourceA = a.sourcePath ?? "";
      const sourceB = b.sourcePath ?? "";
      if (sourceA !== sourceB) return sourceA.localeCompare(sourceB);
      return a.role.localeCompare(b.role);
    });

const uniqueSorted = (values: string[]) =>
  Array.from(new Set(values.map(normalizePath).filter((value) => value.length > 0))).sort((a, b) =>
    a.localeCompare(b)
  );

export const buildExportDiagnostics = (input: BuildExportDiagnosticsInput) => {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const manifestEntries = normalizeManifestEntries(input.manifestEntries);
  const missingAssets = uniqueSorted(input.missingSourcePaths);
  const referencedAssets = uniqueSorted(input.referencedSourcePaths);

  const shellFiles = manifestEntries.filter((entry) => entry.role === "shell");
  const assetFiles = manifestEntries.filter((entry) => entry.role !== "shell");

  const shellBytes = shellFiles.reduce((sum, entry) => sum + entry.bytes, 0);
  const assetBytes = assetFiles.reduce((sum, entry) => sum + entry.bytes, 0);
  const firstViewAssetFiles = manifestEntries.filter((entry) => entry.firstView);
  const firstViewImageBytes = firstViewAssetFiles
    .filter((entry) => entry.mime.startsWith("image/"))
    .reduce((sum, entry) => sum + entry.bytes, 0);

  const manifest: ExportDiagnosticsManifest = {
    schemaVersion: 1,
    slug: input.slug,
    generatedAt,
    assets: manifestEntries
  };

  const report: ExportDiagnosticsReport = {
    schemaVersion: 1,
    slug: input.slug,
    generatedAt,
    totals: {
      files: manifestEntries.length,
      assetFiles: assetFiles.length,
      shellFiles: shellFiles.length,
      totalBytes: shellBytes + assetBytes,
      assetBytes,
      shellBytes,
      firstViewAssetFiles: firstViewAssetFiles.length,
      firstViewImageBytes,
      missingAssets: missingAssets.length
    },
    responsiveCoverage: {
      heroSources: input.heroSourceCount,
      heroWithResponsiveVariants: input.responsiveHeroSourceCount,
      ratio:
        input.heroSourceCount > 0
          ? Number((input.responsiveHeroSourceCount / input.heroSourceCount).toFixed(3))
          : 1
    },
    references: {
      referencedAssets: referencedAssets.length,
      unresolvedAssets: missingAssets.length
    },
    budgets: input.budgets,
    missingAssets
  };

  return { manifest, report };
};

export const buildExportDiagnosticsEntries = (diagnostics: {
  manifest: ExportDiagnosticsManifest;
  report: ExportDiagnosticsReport;
}): ZipBinaryEntry[] => {
  const encoder = new TextEncoder();
  return [
    {
      name: "asset-manifest.json",
      data: encoder.encode(JSON.stringify(diagnostics.manifest, null, 2))
    },
    {
      name: "export-report.json",
      data: encoder.encode(JSON.stringify(diagnostics.report, null, 2))
    }
  ];
};

