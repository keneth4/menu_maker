import { readFileSync } from "node:fs";
import path from "node:path";
import { get } from "svelte/store";
import { createAppController } from "./ui/controllers/createAppController";

describe("architecture guardrails", () => {
  it("keeps App.svelte as a thin composition shell", () => {
    const appPath = path.resolve(process.cwd(), "src", "App.svelte");
    const lineCount = readFileSync(appPath, "utf8").split(/\r?\n/).length;
    expect(lineCount).toBeLessThanOrEqual(900);
  });

  it("keeps AppRuntime.svelte as a thin composition shell", () => {
    const runtimePath = path.resolve(process.cwd(), "src", "ui", "components", "AppRuntime.svelte");
    const lineCount = readFileSync(runtimePath, "utf8").split(/\r?\n/).length;
    expect(lineCount).toBeLessThanOrEqual(900);
  });

  it("keeps buildRuntimeScript.ts as a thin orchestrator", () => {
    const runtimeBuilderPath = path.resolve(
      process.cwd(),
      "src",
      "export-runtime",
      "buildRuntimeScript.ts"
    );
    const lineCount = readFileSync(runtimeBuilderPath, "utf8").split(/\r?\n/).length;
    expect(lineCount).toBeLessThanOrEqual(900);
  });

  it("exposes real app actions through createAppController", async () => {
    const controller = createAppController();
    controller.mount();
    const before = get(controller.state.shell).editorOpen;
    controller.actions.shell.toggleEditor();
    const after = get(controller.state.shell).editorOpen;
    expect(after).toBe(!before);

    await controller.actions.project.createNewProject({ forWizard: true });
    const projectState = get(controller.state.project);
    expect(projectState.project).not.toBeNull();
    expect(projectState.draft).not.toBeNull();
    controller.destroy();
  });
});
