import { get } from "svelte/store";
import { describe, expect, it } from "vitest";
import { createAssetStore } from "./assetStore";
import { createProjectStore } from "./projectStore";
import { createShellStore } from "./shellStore";
import { createWorkflowStore } from "./workflowStore";

describe("ui store slices", () => {
  it("creates shell store with defaults and respects overrides", () => {
    const shell = createShellStore({ uiLang: "en", editorOpen: true });
    const value = get(shell);
    expect(value.uiLang).toBe("en");
    expect(value.editorOpen).toBe(true);
    expect(value.languageMenuOpen).toBe(false);
  });

  it("creates project store with complete wizard defaults", () => {
    const project = createProjectStore();
    const value = get(project);
    expect(value.activeTemplateId).toBe("focus-rows");
    expect(value.wizardStep).toBe(0);
    expect(value.wizardStatus.preview).toBe(false);
    expect(value.projects).toEqual([]);
  });

  it("creates asset and workflow stores with deterministic initial state", () => {
    const asset = createAssetStore();
    const workflow = createWorkflowStore();
    expect(get(asset).bridgeAvailable).toBe(false);
    expect(get(asset).expandedPaths).toEqual({});
    expect(get(workflow).workflowMode).toBeNull();
    expect(get(workflow).assetTaskVisible).toBe(false);
  });
});
