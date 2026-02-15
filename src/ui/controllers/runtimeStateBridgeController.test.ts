import { describe, expect, it } from "vitest";
import type { MenuProject } from "../../lib/types";
import { createRuntimeStateBridge } from "./runtimeStateBridgeController";

describe("createRuntimeStateBridge", () => {
  it("reads a full snapshot and applies partial patches", () => {
    let project: MenuProject | null = null;
    let locale = "es";
    let loadError = "";
    let wizardStep = 0;

    const bridge = createRuntimeStateBridge({
      project: { get: () => project, set: (value) => (project = value) },
      draft: { get: () => null, set: () => undefined },
      projects: { get: () => [], set: () => undefined },
      activeSlug: { get: () => "demo", set: () => undefined },
      locale: { get: () => locale, set: (value) => (locale = value) },
      loadError: { get: () => loadError, set: (value) => (loadError = value) },
      uiLang: { get: () => "es", set: () => undefined },
      editLang: { get: () => "es", set: () => undefined },
      editPanel: { get: () => "identity", set: () => undefined },
      wizardLang: { get: () => "es", set: () => undefined },
      wizardCategoryId: { get: () => "", set: () => undefined },
      wizardItemId: { get: () => "", set: () => undefined },
      wizardStep: { get: () => wizardStep, set: (value) => (wizardStep = value) },
      wizardDemoPreview: { get: () => false, set: () => undefined },
      wizardShowcaseProject: { get: () => null, set: () => undefined },
      wizardCategory: { get: () => null, set: () => undefined },
      wizardItem: { get: () => null, set: () => undefined },
      lastSaveName: { get: () => "", set: () => undefined },
      needsAssets: { get: () => false, set: () => undefined },
      openError: { get: () => "", set: () => undefined },
      exportError: { get: () => "", set: () => undefined },
      exportStatus: { get: () => "", set: () => undefined },
      workflowMode: { get: () => null, set: () => undefined },
      workflowStep: { get: () => "", set: () => undefined },
      workflowProgress: { get: () => 0, set: () => undefined },
      assetTaskVisible: { get: () => false, set: () => undefined },
      assetTaskStep: { get: () => "", set: () => undefined },
      assetTaskProgress: { get: () => 0, set: () => undefined },
      assetMode: { get: () => "none", set: () => undefined },
      editorTab: { get: () => "info", set: () => undefined },
      editorOpen: { get: () => false, set: () => undefined },
      showLanding: { get: () => true, set: () => undefined },
      activeProject: { get: () => null, set: () => undefined },
      selectedCategoryId: { get: () => "", set: () => undefined },
      selectedItemId: { get: () => "", set: () => undefined },
      rootHandle: { get: () => null, set: () => undefined },
      bridgeAvailable: { get: () => false, set: () => undefined },
      bridgeProjectSlug: { get: () => "", set: () => undefined },
      fsEntries: { get: () => [], set: () => undefined },
      rootFiles: { get: () => [], set: () => undefined },
      fsError: { get: () => "", set: () => undefined },
      uploadTargetPath: { get: () => "", set: () => undefined },
      uploadFolderOptions: { get: () => [], set: () => undefined },
      expandedPaths: { get: () => ({}), set: () => undefined },
      treeRows: { get: () => [], set: () => undefined },
      selectedAssetIds: { get: () => [], set: () => undefined },
      assetProjectReadOnly: { get: () => false, set: () => undefined },
      activeItem: { get: () => null, set: () => undefined },
      previewStartupLoading: { get: () => false, set: () => undefined },
      previewStartupProgress: { get: () => 0, set: () => undefined },
      previewStartupBlockingSources: { get: () => new Set<string>(), set: () => undefined }
    });

    const initialState = bridge.getState();
    expect(initialState.locale).toBe("es");
    expect(initialState.wizardStep).toBe(0);

    bridge.setState({ locale: "en", wizardStep: 2, loadError: "boom" });

    expect(locale).toBe("en");
    expect(wizardStep).toBe(2);
    expect(loadError).toBe("boom");
  });
});
