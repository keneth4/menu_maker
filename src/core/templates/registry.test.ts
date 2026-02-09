import { templateOptions } from "./templateOptions";
import {
  TEMPLATE_IDS,
  getTemplateCapabilities,
  getTemplateStrategy,
  resolveTemplateId
} from "./registry";

describe("template registry", () => {
  it("resolves unknown template ids to focus-rows", () => {
    expect(resolveTemplateId("unknown-template")).toBe("focus-rows");
  });

  it("exposes capabilities and strategies for every known template", () => {
    TEMPLATE_IDS.forEach((id) => {
      const capabilities = getTemplateCapabilities(id);
      const strategy = getTemplateStrategy(id);
      expect(capabilities.id).toBe(id);
      expect(strategy.id).toBe(id);
      expect(capabilities.smokeFixturePath.startsWith("/projects/")).toBe(true);
    });
  });

  it("derives template options from capability matrix", () => {
    expect(templateOptions.map((option) => option.id)).toEqual(Array.from(TEMPLATE_IDS));
    expect(templateOptions.every((option) => option.smokeFixturePath.length > 0)).toBe(true);
  });
});

