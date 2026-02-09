import type { AssetEntryKind } from "./pathing";

export type BridgeAssetEntry = {
  path: string;
  kind: AssetEntryKind;
};

export type BridgeAssetClient = {
  ping: () => Promise<boolean>;
  list: (slug: string) => Promise<BridgeAssetEntry[]>;
  request: (endpoint: string, slug: string, payload?: Record<string, unknown>) => Promise<void>;
  readFileBytes: (slug: string, assetPath: string) => Promise<Uint8Array | null>;
};

const readErrorMessage = async (response: Response) => {
  const data = await response.json().catch(() => ({}));
  return data?.error || "Bridge error";
};

export const createBridgeAssetClient = (
  fetchImpl: typeof fetch,
  baseUrl = "/api/assets"
): BridgeAssetClient => {
  const ping = async () => {
    const response = await fetchImpl(`${baseUrl}/ping`);
    return response.ok;
  };

  const list = async (slug: string) => {
    const response = await fetchImpl(`${baseUrl}/list?project=${encodeURIComponent(slug)}`);
    if (!response.ok) {
      throw new Error(await readErrorMessage(response));
    }
    const data = (await response.json()) as { entries?: BridgeAssetEntry[] };
    return data.entries ?? [];
  };

  const request = async (endpoint: string, slug: string, payload?: Record<string, unknown>) => {
    const response = await fetchImpl(`${baseUrl}/${endpoint}?project=${encodeURIComponent(slug)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload ? JSON.stringify(payload) : undefined
    });
    if (!response.ok) {
      throw new Error(await readErrorMessage(response));
    }
  };

  const readFileBytes = async (slug: string, assetPath: string) => {
    const response = await fetchImpl(
      `${baseUrl}/file?project=${encodeURIComponent(slug)}&path=${encodeURIComponent(assetPath)}`
    );
    if (!response.ok) return null;
    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer);
  };

  return {
    ping,
    list,
    request,
    readFileBytes
  };
};
