import { buildExportDiagnostics, buildExportDiagnosticsEntries } from "./diagnostics";
import { evaluateExportBudgets } from "./performanceBudget";

describe("export diagnostics", () => {
  it("builds deterministic manifest and report totals", () => {
    const diagnostics = buildExportDiagnostics({
      slug: "demo-menu",
      generatedAt: "2026-02-09T00:00:00.000Z",
      manifestEntries: [
        {
          outputPath: "styles.css",
          sourcePath: null,
          role: "shell",
          mime: "text/css",
          bytes: 1200,
          responsiveVariant: null,
          firstView: false
        },
        {
          outputPath: "assets/items/a-md.webp",
          sourcePath: "projects/demo/assets/items/a.webp",
          role: "hero",
          mime: "image/webp",
          bytes: 8000,
          responsiveVariant: "medium",
          firstView: true
        },
        {
          outputPath: "assets/bg-1.webp",
          sourcePath: "projects/demo/assets/bg-1.webp",
          role: "background",
          mime: "image/webp",
          bytes: 4000,
          responsiveVariant: null,
          firstView: true
        }
      ],
      referencedSourcePaths: [
        "projects/demo/assets/items/a.webp",
        "projects/demo/assets/bg-1.webp"
      ],
      missingSourcePaths: [
        "projects/demo/assets/items/missing.webp",
        "projects/demo/assets/items/missing.webp"
      ],
      heroSourceCount: 2,
      responsiveHeroSourceCount: 1,
      budgets: evaluateExportBudgets({
        jsGzipBytes: 20 * 1024,
        cssGzipBytes: 6 * 1024,
        firstViewImageBytes: 12 * 1024
      })
    });

    expect(diagnostics.manifest.assets.map((entry) => entry.outputPath)).toEqual([
      "assets/bg-1.webp",
      "assets/items/a-md.webp",
      "styles.css"
    ]);
    expect(diagnostics.report.totals.files).toBe(3);
    expect(diagnostics.report.totals.assetFiles).toBe(2);
    expect(diagnostics.report.totals.shellFiles).toBe(1);
    expect(diagnostics.report.totals.totalBytes).toBe(13200);
    expect(diagnostics.report.totals.firstViewImageBytes).toBe(12000);
    expect(diagnostics.report.totals.missingAssets).toBe(1);
    expect(diagnostics.report.responsiveCoverage.ratio).toBe(0.5);
    expect(diagnostics.report.missingAssets).toEqual(["projects/demo/assets/items/missing.webp"]);
  });

  it("builds expected json entries", () => {
    const diagnostics = buildExportDiagnostics({
      slug: "demo",
      generatedAt: "2026-02-09T00:00:00.000Z",
      manifestEntries: [],
      referencedSourcePaths: [],
      missingSourcePaths: [],
      heroSourceCount: 0,
      responsiveHeroSourceCount: 0,
      budgets: evaluateExportBudgets({
        jsGzipBytes: null,
        cssGzipBytes: null,
        firstViewImageBytes: 0
      })
    });
    const entries = buildExportDiagnosticsEntries(diagnostics);
    expect(entries.map((entry) => entry.name)).toEqual([
      "asset-manifest.json",
      "export-report.json"
    ]);
    const report = JSON.parse(new TextDecoder().decode(entries[1]!.data));
    expect(report.slug).toBe("demo");
  });
});

