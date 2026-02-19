import { describe, expect, it, vi } from "vitest";
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
    rewriteProjectAssetPaths: () => undefined,
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

const createControllerWithOverrides = (
  state: AssetWorkspaceState,
  overrides: Partial<Parameters<typeof createAssetWorkspaceController>[0]>
) =>
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
    rewriteProjectAssetPaths: () => undefined,
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
    },
    ...overrides
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

  it("prevents selection toggles for protected roots", () => {
    const state = createBaseState();
    state.fsEntries = [
      {
        id: "originals",
        name: "originals",
        path: "originals",
        kind: "directory",
        handle: null,
        parent: null,
        source: "bridge"
      }
    ] as AssetWorkspaceEntry[];

    const controller = createControllerWithOverrides(state, {
      isLockedManagedAssetRoot: (value) => value === "originals"
    });

    controller.toggleAssetSelection("originals");
    expect(state.selectedAssetIds).toEqual([]);
  });

  it("creates folders with explicit name and parent path", async () => {
    const state = createBaseState();
    const request = vi.fn(async () => undefined);
    const controller = createControllerWithOverrides(state, {
      bridgeClient: {
        ping: async () => true,
        list: async () => [],
        request,
        readFileBytes: async () => null,
        prepareProjectDerivedAssets: async () => ({}) as MenuProject
      }
    });

    await controller.createFolderNamed("seasonal", "originals/items");

    expect(request).toHaveBeenCalledWith("mkdir", "demo", {
      path: "originals/items/seasonal"
    });
  });

  it("renames entries through explicit inline API and protects roots", async () => {
    const state = createBaseState();
    state.fsEntries = [
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
    const request = vi.fn(async () => undefined);
    const rewriteProjectAssetPaths = vi.fn();
    const controller = createControllerWithOverrides(state, {
      bridgeClient: {
        ping: async () => true,
        list: async () => [],
        request,
        readFileBytes: async () => null,
        prepareProjectDerivedAssets: async () => ({}) as MenuProject
      },
      isLockedManagedAssetRoot: (value) => value === "originals",
      rewriteProjectAssetPaths
    });

    await controller.renameEntryNamed(
      {
        id: "originals/items/soup.webp",
        name: "soup.webp",
        path: "originals/items/soup.webp",
        kind: "file"
      },
      "soup-v2.webp"
    );
    expect(request).toHaveBeenCalledWith("move", "demo", {
      from: "originals/items/soup.webp",
      to: "originals/items/soup-v2.webp"
    });
    expect(rewriteProjectAssetPaths).toHaveBeenCalledWith(
      "originals/items/soup.webp",
      "originals/items/soup-v2.webp"
    );

    await controller.renameEntryNamed(
      {
        id: "originals",
        name: "originals",
        path: "originals",
        kind: "directory"
      },
      "assets"
    );
    expect(state.fsError).toBe("errAssetRootProtected");
    expect(rewriteProjectAssetPaths).toHaveBeenCalledTimes(1);
  });

  it("rewrites references after moving entries", async () => {
    const state = createBaseState();
    state.fsEntries = [
      {
        id: "originals/backgrounds/hero.webp",
        name: "hero.webp",
        path: "originals/backgrounds/hero.webp",
        kind: "file",
        handle: null,
        parent: null,
        source: "bridge"
      }
    ] as AssetWorkspaceEntry[];
    const request = vi.fn(async () => undefined);
    const rewriteProjectAssetPaths = vi.fn();
    const controller = createControllerWithOverrides(state, {
      bridgeClient: {
        ping: async () => true,
        list: async () => [],
        request,
        readFileBytes: async () => null,
        prepareProjectDerivedAssets: async () => ({}) as MenuProject
      },
      rewriteProjectAssetPaths,
      prompt: () => "originals/items/"
    });

    await controller.moveEntry({
      id: "originals/backgrounds/hero.webp",
      name: "hero.webp",
      path: "originals/backgrounds/hero.webp",
      kind: "file"
    });

    expect(request).toHaveBeenCalledWith("move", "demo", {
      from: "originals/backgrounds/hero.webp",
      to: "originals/items/hero.webp"
    });
    expect(rewriteProjectAssetPaths).toHaveBeenCalledWith(
      "originals/backgrounds/hero.webp",
      "originals/items/hero.webp"
    );
  });
});
