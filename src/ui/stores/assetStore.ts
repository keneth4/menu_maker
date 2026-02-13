import { writable } from "svelte/store";
import type { AssetState } from "../contracts/state";

export const createAssetStore = (initial?: Partial<AssetState>) =>
  writable<AssetState>({
    assetMode: "none",
    assetProjectReadOnly: false,
    bridgeAvailable: false,
    bridgeProjectSlug: "",
    rootLabel: "",
    fsError: "",
    fsEntries: [],
    selectedAssetIds: [],
    uploadTargetPath: "",
    uploadFolderOptions: [],
    expandedPaths: {},
    rootFiles: [],
    assetOptions: [],
    fontAssetOptions: [],
    ...initial
  });
