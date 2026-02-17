import { get } from "svelte/store";
import { describe, expect, it } from "vitest";
import { createAppController } from "./createAppController";

describe("createAppController", () => {
  it("hydrates project state on mount and toggles shell state", async () => {
    const controller = createAppController();

    controller.mount();
    const afterMountProject = get(controller.state.project);
    expect(afterMountProject.project).not.toBeNull();
    expect(afterMountProject.draft).not.toBeNull();

    const before = get(controller.state.shell).editorOpen;
    controller.actions.shell.toggleEditor();
    const after = get(controller.state.shell).editorOpen;
    expect(after).toBe(!before);

    controller.destroy();
  });

  it("runs real project flow actions that mutate stores", async () => {
    const controller = createAppController();

    await controller.actions.shell.startCreateProject();
    let shell = get(controller.state.shell);
    let project = get(controller.state.project);
    expect(shell.showLanding).toBe(false);
    expect(shell.editorTab).toBe("info");
    expect(project.project?.meta.name).toBeDefined();

    await controller.actions.project.createNewProject({ forWizard: true });
    shell = get(controller.state.shell);
    expect(shell.editorTab).toBe("wizard");

    await controller.actions.project.saveProject();
    const workflow = get(controller.state.workflow);
    expect(workflow.workflowMode).toBeNull();
  });

  it("updates modal state through preview and modal action groups", () => {
    const controller = createAppController();

    controller.actions.preview.openDish("cat-1", "dish-1");
    expect(get(controller.state.modal).activeItem).toEqual({
      category: "cat-1",
      itemId: "dish-1"
    });

    controller.actions.modal.closeDish();
    expect(get(controller.state.modal).activeItem).toBeNull();
  });
});
