import { describe, expect, it } from "vitest";
import {
  DEFAULT_SCROLL_SENSITIVITY_LEVEL,
  getProjectScrollSensitivity,
  getThresholdMultiplier,
  getTouchScaleMultiplier,
  normalizeProjectScrollSensitivity,
  normalizeSensitivityLevel,
  resolveMaxStepPerInput,
  resolveCarouselConfigWithSensitivity,
  resolveJukeboxSectionThresholdPx
} from "./scrollSensitivityWorkflow";

describe("scrollSensitivityWorkflow", () => {
  it("normalizes scalar levels to the supported range", () => {
    expect(normalizeSensitivityLevel(undefined)).toBe(DEFAULT_SCROLL_SENSITIVITY_LEVEL);
    expect(normalizeSensitivityLevel(-99)).toBe(1);
    expect(normalizeSensitivityLevel(99)).toBe(10);
    expect(normalizeSensitivityLevel(7.6)).toBe(8);
  });

  it("normalizes project sensitivity payloads with defaults", () => {
    expect(normalizeProjectScrollSensitivity(undefined)).toEqual({ item: 5, section: 5 });
    expect(normalizeProjectScrollSensitivity({ item: 2 })).toEqual({ item: 2, section: 5 });
    expect(normalizeProjectScrollSensitivity({ item: 12, section: -4 })).toEqual({
      item: 10,
      section: 1
    });
  });

  it("resolves project sensitivity from menu project meta", () => {
    expect(getProjectScrollSensitivity(null)).toEqual({ item: 5, section: 5 });
    expect(
      getProjectScrollSensitivity({
        meta: { scrollSensitivity: { item: 9, section: 3 } }
      } as any)
    ).toEqual({ item: 9, section: 3 });
  });

  it("applies threshold and touch multipliers with level 5 as baseline", () => {
    expect(getThresholdMultiplier(5)).toBe(1);
    expect(getThresholdMultiplier(10)).toBeCloseTo(0.18, 6);
    expect(getThresholdMultiplier(1)).toBeCloseTo(3.8, 6);
    expect(getTouchScaleMultiplier(5)).toBe(1);
    expect(getTouchScaleMultiplier(10)).toBeCloseTo(2.6, 6);
    expect(getTouchScaleMultiplier(1)).toBeCloseTo(0.28, 6);
  });

  it("derives effective carousel sensitivity values", () => {
    const base = {
      primaryAxis: "vertical" as const,
      wheelStepThreshold: 260,
      wheelSettleMs: 240,
      touchIntentThreshold: 10,
      touchDeltaScale: 2.1,
      nearDistanceThreshold: 1.25
    };
    expect(resolveCarouselConfigWithSensitivity(base, 5)).toEqual(base);
    expect(resolveCarouselConfigWithSensitivity(base, 10)).toMatchObject({
      wheelStepThreshold: 47,
      touchDeltaScale: 5.46
    });
    expect(resolveCarouselConfigWithSensitivity(base, 1)).toMatchObject({
      wheelStepThreshold: 988,
      touchDeltaScale: 0.588,
      maxStepPerInput: 1
    });
  });

  it("derives horizontal section threshold from section sensitivity", () => {
    expect(resolveJukeboxSectionThresholdPx(300, 5)).toBe(300);
    expect(resolveJukeboxSectionThresholdPx(300, 10)).toBe(54);
    expect(resolveJukeboxSectionThresholdPx(300, 1)).toBe(1140);
  });

  it("limits step progression at minimum sensitivity", () => {
    expect(resolveMaxStepPerInput(1)).toBe(1);
    expect(resolveMaxStepPerInput(2)).toBeUndefined();
  });
});
