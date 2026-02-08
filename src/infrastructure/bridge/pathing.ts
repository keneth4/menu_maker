export type AssetEntryKind = "file" | "directory";

export type BridgeAssetLookup = {
  slug: string;
  path: string;
};

export type AssetMovePlan = {
  destinationPath: string;
  destinationDirPath: string;
  destinationName: string;
};

export const normalizeProjectSlug = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9-_]+/g, "-").replace(/^-+|-+$/g, "");

export const normalizeAssetPath = (value: string) => value.trim().replace(/^\/+/, "");

export const resolveBridgeAssetLookup = (
  sourcePath: string,
  fallbackSlug: string
): BridgeAssetLookup => {
  const normalized = normalizeAssetPath(sourcePath);
  const match = normalized.match(/^projects\/([^/]+)\/assets\/(.+)$/);
  if (match) {
    return { slug: match[1], path: match[2] };
  }
  if (normalized.includes("assets/")) {
    return {
      slug: fallbackSlug,
      path: normalized.slice(normalized.lastIndexOf("assets/") + "assets/".length)
    };
  }
  return { slug: fallbackSlug, path: normalized };
};

export const planEntryRename = (currentPath: string, newName: string) => {
  const parts = normalizeAssetPath(currentPath).split("/").filter(Boolean);
  if (parts.length === 0) return normalizeAssetPath(newName);
  parts.pop();
  return [...parts, newName].join("/");
};

export const planEntryMove = (
  entryKind: AssetEntryKind,
  entryName: string,
  targetPath: string
): AssetMovePlan => {
  const raw = normalizeAssetPath(targetPath);
  const endsWithSlash = targetPath.trim().endsWith("/");
  const parts = raw.split("/").filter(Boolean);

  let destinationName = entryName;
  let destinationParts = parts;
  if (!endsWithSlash && parts.length > 0) {
    destinationName = parts[parts.length - 1];
    destinationParts = parts.slice(0, -1);
  }
  if (entryKind === "directory" && destinationName === "") {
    destinationName = entryName;
  }

  const destinationDirPath = destinationParts.join("/");
  const destinationPath = [...destinationParts, destinationName].filter(Boolean).join("/");
  return {
    destinationPath,
    destinationDirPath,
    destinationName
  };
};
