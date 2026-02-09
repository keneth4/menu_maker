import {
  DEFAULT_EXPORT_BUDGET_THRESHOLDS,
  evaluateExportBudgets
} from "./performanceBudget";

describe("performance budget evaluation", () => {
  it("marks checks as pass when under thresholds", () => {
    const result = evaluateExportBudgets({
      jsGzipBytes: 40 * 1024,
      cssGzipBytes: 8 * 1024,
      firstViewImageBytes: 400 * 1024
    });

    expect(result.passed).toBe(true);
    expect(result.checks.map((check) => check.status)).toEqual(["pass", "pass", "pass"]);
  });

  it("marks checks as fail when thresholds are exceeded", () => {
    const result = evaluateExportBudgets({
      jsGzipBytes: DEFAULT_EXPORT_BUDGET_THRESHOLDS.jsGzipBytes + 1,
      cssGzipBytes: DEFAULT_EXPORT_BUDGET_THRESHOLDS.cssGzipBytes + 1,
      firstViewImageBytes: DEFAULT_EXPORT_BUDGET_THRESHOLDS.firstViewImageBytes + 1
    });

    expect(result.passed).toBe(false);
    expect(result.checks.map((check) => check.status)).toEqual(["fail", "fail", "fail"]);
  });

  it("treats missing gzip measurements as not measured", () => {
    const result = evaluateExportBudgets({
      jsGzipBytes: null,
      cssGzipBytes: null,
      firstViewImageBytes: 120
    });

    expect(result.passed).toBe(true);
    expect(result.checks.map((check) => check.status)).toEqual(["not-measured", "not-measured", "pass"]);
  });
});

