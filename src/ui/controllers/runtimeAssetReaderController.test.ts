import { describe, expect, it, vi } from "vitest";
import { createRuntimeAssetReader } from "./runtimeAssetReaderController";

describe("createRuntimeAssetReader", () => {
  it("reads bytes from bridge mode using resolved lookup", async () => {
    const readFileBytes = vi.fn(async () => new Uint8Array([1, 2, 3]));
    const reader = createRuntimeAssetReader({
      getAssetMode: () => "bridge",
      getRootHandle: () => null,
      getFileHandleByPath: vi.fn(async () => {
        throw new Error("not-used");
      }),
      bridgeClient: { readFileBytes } as never,
      resolveBridgeLookup: () => ({ slug: "demo", path: "assets/item.webp" }),
      normalizeAssetSource: (value) => value,
      fetchAsset: vi.fn()
    });

    const bytes = await reader.readAssetBytes("demo", "assets/item.webp");

    expect(Array.from(bytes ?? [])).toEqual([1, 2, 3]);
    expect(readFileBytes).toHaveBeenCalledWith("demo", "assets/item.webp");
  });

  it("falls back to static /projects fetch outside bridge/filesystem", async () => {
    const fetchAsset = vi.fn(async () => ({
      ok: true,
      arrayBuffer: async () => new Uint8Array([4, 5]).buffer
    }));
    const reader = createRuntimeAssetReader({
      getAssetMode: () => "none",
      getRootHandle: () => null,
      getFileHandleByPath: vi.fn(async () => {
        throw new Error("not-used");
      }),
      bridgeClient: { readFileBytes: vi.fn(async () => null) } as never,
      resolveBridgeLookup: () => ({ slug: "demo", path: "unused" }),
      normalizeAssetSource: (value) => value,
      fetchAsset: fetchAsset as never
    });

    const bytes = await reader.readAssetBytes("demo", "/projects/demo/assets/bg.webp");

    expect(Array.from(bytes ?? [])).toEqual([4, 5]);
    expect(fetchAsset).toHaveBeenCalledWith("/projects/demo/assets/bg.webp");
  });
});
