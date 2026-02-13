import { describe, expect, it } from "vitest";
import type { MenuProject } from "../../lib/types";
import {
  createAssetWorkspaceController,
  type AssetWorkspaceEntry,
  type AssetWorkspaceState
} from "./assetWorkspaceController";

const createBaseState = (): AssetWorkspaceState => ({
  rootHandle: null,
  bridgeAvailable: true,
  assetMode: "bridge",
  bridgeProjectSlug: "",
  fsEntries: [],
  rootFiles: [],
  fsError: "",
  uploadTargetPath: "",
  uploadFolderOptions: [],
  expandedPaths: {},
  treeRows: [],
  selectedAssetIds: [],
  assetProjectReadOnly: false
});

const createController = (state: AssetWorkspaceState) =>
  createAssetWorkspaceController({
    t: (key) => key,
    userManagedRoots: ["originals/backgrounds", "originals/items", "originals/fonts"],
    bridgeClient: {
      ping: async () => true,
      list: async () => [],
      request: async () => undefined,
      readFileBytes: async () => null,
      prepareProjectDerivedAssets: async () => ({}) as MenuProject
    },
    getProjectSlug: () => "demo",
    mapLegacyAssetRelativeToManaged: (value) => value,
    isManagedAssetRelativePath: (value) => value.startsWith("originals/"),
    isLockedManagedAssetRoot: () => false,
    joinAssetFolderPath: (base, child) => `${base}/${child}`.replace(/\/+/g, "/"),
    planEntryMove: (kind, name, targetPath) => ({
      destinationPath: `${targetPath}/${name}`.replace(/\/+/g, "/"),
      destinationDirPath: targetPath,
      destinationName: name
    }),
    planEntryRename: (path, newName) => {
      const parts = path.split("/");
      parts[parts.length - 1] = newName;
      return parts.join("/");
    },
    getDirectoryHandleByPath: async () => ({}) as FileSystemDirectoryHandle,
    listFilesystemEntries: async () => [],
    copyFileHandleTo: async () => undefined,
    copyDirectoryHandleTo: async () => undefined,
    writeFileToDirectory: async () => undefined,
    ensureAssetProjectWritable: () => true,
    getDraftProject: () => null,
    cloneProject: (value) => value,
    isProtectedAssetProjectSlug: () => false,
    queueBridgeDerivedPreparation: async () => undefined,
    startAssetTask: () => undefined,
    updateAssetTask: () => undefined,
    finishAssetTask: () => undefined,
    failAssetTask: () => undefined,
    pulseAssetTask: () => undefined,
    clearAssetTaskPulse: () => undefined,
    prompt: () => null,
    showDirectoryPicker: undefined,
    getState: () => state,
    setState: (next) => {
      Object.assign(state, next);
    }
  });

describe("createAssetWorkspaceController", () => {
  it("derives tree rows and upload folder options from entries", () => {
    let state = createBaseState();
    state.fsEntries = [
      {
        id: "originals/items",
        name: "items",
        path: "originals/items",
        kind: "directory",
        handle: null,
        parent: null,
        source: "bridge"
      },
      {
        id: "originals/items/soup.webp",
        name: "soup.webp",
        path: "originals/items/soup.webp",
        kind: "file",
        handle: null,
        parent: null,
        source: "bridge"
      }
    ] as AssetWorkspaceEntry[];

    const controller = createController(state);
    controller.syncDerivedState();

    expect(state.treeRows.length).toBeGreaterThan(0);
    expect(state.uploadFolderOptions.some((entry) => entry.value === "originals/items")).toBe(true);
    expect(state.uploadTargetPath).toBe("originals/backgrounds");
  });

  it("toggles selection and expansion state", () => {
    let state = createBaseState();
    state.fsEntries = [
      {
        id: "originals/items",
        name: "items",
        path: "originals/items",
        kind: "directory",
        handle: null,
        parent: null,
        source: "bridge"
      }
    ] as AssetWorkspaceEntry[];

    const controller = createController(state);
    controller.toggleAssetSelection("originals/items");
    expect(state.selectedAssetIds).toEqual(["originals/items"]);
    controller.toggleAssetSelection("originals/items");
    expect(state.selectedAssetIds).toEqual([]);

    controller.toggleExpandPath("originals/items");
    expect(state.expandedPaths["originals/items"]).toBe(true);
  });

  it("sets mode from available bridge/root state", () => {
    let state = createBaseState();
    const controller = createController(state);
    controller.updateAssetMode();
    expect(state.assetMode).toBe("bridge");

    state = { ...state, bridgeAvailable: false };
    const controllerWithoutBridge = createController(state);
    controllerWithoutBridge.updateAssetMode();
    expect(state.assetMode).toBe("none");
  });
});
