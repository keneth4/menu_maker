import type { BridgeAssetClient } from "../../infrastructure/bridge/client";

type AssetMode = "filesystem" | "bridge" | "none";

type BridgeLookup = {
  slug: string;
  path: string;
};

export type RuntimeAssetReaderDeps = {
  getAssetMode: () => AssetMode;
  getRootHandle: () => FileSystemDirectoryHandle | null;
  getFileHandleByPath: (
    rootHandle: FileSystemDirectoryHandle,
    path: string
  ) => Promise<FileSystemFileHandle>;
  bridgeClient: BridgeAssetClient;
  resolveBridgeLookup: (sourcePath: string, slug: string) => BridgeLookup;
  normalizeAssetSource: (sourcePath: string) => string;
  fetchAsset?: typeof fetch;
};

export type RuntimeAssetReader = {
  readAssetBytes: (slug: string, sourcePath: string) => Promise<Uint8Array | null>;
};

export const createRuntimeAssetReader = (
  deps: RuntimeAssetReaderDeps
): RuntimeAssetReader => {
  const fetchAsset = deps.fetchAsset ?? fetch;

  const readAssetBytes = async (
    slug: string,
    sourcePath: string
  ): Promise<Uint8Array | null> => {
    const assetMode = deps.getAssetMode();
    const rootHandle = deps.getRootHandle();

    if (assetMode === "filesystem" && rootHandle) {
      try {
        const fileHandle = await deps.getFileHandleByPath(rootHandle, sourcePath);
        const file = await fileHandle.getFile();
        const buffer = await file.arrayBuffer();
        return new Uint8Array(buffer);
      } catch {
        // Fall back to static fetch for demo assets referenced from /projects/*.
      }
    }

    if (assetMode === "bridge") {
      const lookup = deps.resolveBridgeLookup(sourcePath, slug);
      return await deps.bridgeClient.readFileBytes(lookup.slug, lookup.path);
    }

    const publicPath = deps.normalizeAssetSource(sourcePath);
    if (publicPath.startsWith("data:")) {
      const response = await fetchAsset(publicPath);
      if (!response.ok) return null;
      const buffer = await response.arrayBuffer();
      return new Uint8Array(buffer);
    }

    if (publicPath.startsWith("/projects/")) {
      const response = await fetchAsset(publicPath);
      if (!response.ok) return null;
      const buffer = await response.arrayBuffer();
      return new Uint8Array(buffer);
    }

    return null;
  };

  return { readAssetBytes };
};
