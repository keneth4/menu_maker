import { describe, expect, it, vi } from "vitest";
import type { MenuProject } from "../../lib/types";
import { createWizardShowcaseController } from "./wizardShowcaseController";

const createProject = (): MenuProject => ({
    meta: {
      name: "Demo",
      slug: "demo",
      locales: ["es", "en"],
      defaultLocale: "es",
      currency: "USD",
      currencyPosition: "left",
      backgroundDisplayMode: "carousel",
      template: "focus-rows"
    },
    backgrounds: [],
    categories: []
  } as MenuProject);

describe("createWizardShowcaseController", () => {
  it("builds showcase project from cached demo with draft meta parity", async () => {
    const loadProject = vi.fn(async () => createProject());
    const controller = createWizardShowcaseController({
      templateDemoProjectSlug: "sample",
      cacheBust: "v1",
      loadProject,
      normalizeProject: (project) => project,
      applyWizardDemoRotationDirections: (project) => project,
      cloneProject: (project) => structuredClone(project),
      warn: vi.fn()
    });
    const draft = createProject();
    draft.meta.currency = "EUR";
    draft.meta.backgroundDisplayMode = "section";
    const showcase = await controller.buildWizardShowcaseProject(draft, "jukebox");
    expect(showcase?.meta.template).toBe("jukebox");
    expect(showcase?.meta.currency).toBe("EUR");
    expect(showcase?.meta.backgroundDisplayMode).toBe("section");
    await controller.loadTemplateDemoProject();
    expect(loadProject).toHaveBeenCalledTimes(1);
  });
});
