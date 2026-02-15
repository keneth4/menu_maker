import { mapProjectAssetPaths } from "../../core/menu/assetPathMapping";
import type { MenuProject } from "../../lib/types";

export const mapImportedAssetPath = (
  value: string,
  slug: string,
  mapLegacyAssetRelativeToManaged: (value: string) => string
) => {
  if (!value) return value;
  const normalized = value.replace(/^\/+/, "");
  if (normalized.startsWith("assets/")) {
    const relative = mapLegacyAssetRelativeToManaged(normalized.slice("assets/".length));
    return `/projects/${slug}/assets/${relative}`;
  }
  const match = normalized.match(/^projects\/([^/]+)\/(assets\/.*)$/);
  if (match) {
    const relative = mapLegacyAssetRelativeToManaged(match[2].slice("assets/".length));
    return `/projects/${slug}/assets/${relative}`;
  }
  return value;
};

export const applyImportedPaths = (
  data: MenuProject,
  slug: string,
  mapLegacyAssetRelativeToManaged: (value: string) => string
) => mapProjectAssetPaths(data, (value) => mapImportedAssetPath(value, slug, mapLegacyAssetRelativeToManaged));
