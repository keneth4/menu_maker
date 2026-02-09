export type ExportBudgetThresholds = {
  jsGzipBytes: number;
  cssGzipBytes: number;
  firstViewImageBytes: number;
};

export type ExportBudgetMetrics = {
  jsGzipBytes: number | null;
  cssGzipBytes: number | null;
  firstViewImageBytes: number;
};

export type ExportBudgetStatus = "pass" | "fail" | "not-measured";

export type ExportBudgetCheck = {
  key: keyof ExportBudgetThresholds;
  label: string;
  threshold: number;
  actual: number | null;
  status: ExportBudgetStatus;
};

export type ExportBudgetEvaluation = {
  passed: boolean;
  checks: ExportBudgetCheck[];
};

export const DEFAULT_EXPORT_BUDGET_THRESHOLDS: ExportBudgetThresholds = {
  jsGzipBytes: 95 * 1024,
  cssGzipBytes: 12 * 1024,
  firstViewImageBytes: Math.round(1.2 * 1024 * 1024)
};

const createBudgetCheck = (
  key: keyof ExportBudgetThresholds,
  label: string,
  threshold: number,
  actual: number | null
): ExportBudgetCheck => {
  if (actual == null) {
    return {
      key,
      label,
      threshold,
      actual: null,
      status: "not-measured"
    };
  }
  return {
    key,
    label,
    threshold,
    actual,
    status: actual <= threshold ? "pass" : "fail"
  };
};

export const evaluateExportBudgets = (
  metrics: ExportBudgetMetrics,
  thresholds: ExportBudgetThresholds = DEFAULT_EXPORT_BUDGET_THRESHOLDS
): ExportBudgetEvaluation => {
  const checks: ExportBudgetCheck[] = [
    createBudgetCheck("jsGzipBytes", "Export JS (gzip)", thresholds.jsGzipBytes, metrics.jsGzipBytes),
    createBudgetCheck("cssGzipBytes", "Export CSS (gzip)", thresholds.cssGzipBytes, metrics.cssGzipBytes),
    createBudgetCheck(
      "firstViewImageBytes",
      "First-view images",
      thresholds.firstViewImageBytes,
      metrics.firstViewImageBytes
    )
  ];
  return {
    passed: checks.every((check) => check.status !== "fail"),
    checks
  };
};

export const measureGzipBytes = async (value: Uint8Array | string): Promise<number | null> => {
  if (typeof CompressionStream === "undefined" || typeof Blob === "undefined") {
    return null;
  }
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value;
  try {
    const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream("gzip"));
    const reader = stream.getReader();
    let total = 0;
    while (true) {
      const { done, value: chunk } = await reader.read();
      if (done) break;
      total += chunk?.byteLength ?? 0;
    }
    return total;
  } catch {
    return null;
  }
};

