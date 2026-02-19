export const USER_MANAGED_ASSET_ROOTS = [
  "originals/backgrounds",
  "originals/items",
  "originals/fonts"
] as const;

export const normalizeAssetFolderPath = (value: string) =>
  value
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+/g, "/")
    .replace(/\/$/, "");

export const hasUnsafeAssetPathSegment = (value: string) =>
  normalizeAssetFolderPath(value)
    .split("/")
    .filter(Boolean)
    .some((segment) => segment === "." || segment === "..");

export const joinAssetFolderPath = (base: string, child: string) =>
  normalizeAssetFolderPath(`${normalizeAssetFolderPath(base)}/${normalizeAssetFolderPath(child)}`);

export const mapLegacyAssetRelativeToManaged = (value: string) => {
  const relative = normalizeAssetFolderPath(value);
  if (!relative) return "";
  if (
    relative.startsWith("originals/backgrounds/") ||
    relative === "originals/backgrounds" ||
    relative.startsWith("originals/items/") ||
    relative === "originals/items" ||
    relative.startsWith("originals/fonts/") ||
    relative === "originals/fonts" ||
    relative.startsWith("derived/")
  ) {
    return relative;
  }
  if (relative.startsWith("backgrounds/") || relative === "backgrounds") {
    return joinAssetFolderPath("originals/backgrounds", relative.slice("backgrounds".length));
  }
  if (relative.startsWith("items/") || relative === "items") {
    return joinAssetFolderPath("originals/items", relative.slice("items".length));
  }
  if (relative.startsWith("dishes/") || relative === "dishes") {
    return joinAssetFolderPath("originals/items", relative.slice("dishes".length));
  }
  if (relative.startsWith("fonts/") || relative === "fonts") {
    return joinAssetFolderPath("originals/fonts", relative.slice("fonts".length));
  }
  return relative;
};

export const isManagedAssetRelativePath = (value: string) => {
  const normalized = normalizeAssetFolderPath(value);
  if (!normalized || hasUnsafeAssetPathSegment(normalized)) return false;
  return USER_MANAGED_ASSET_ROOTS.some(
    (root) => normalized === root || normalized.startsWith(`${root}/`)
  );
};

export const isLockedManagedAssetRoot = (value: string) => {
  const normalized = normalizeAssetFolderPath(value);
  if (normalized === "originals") return true;
  return USER_MANAGED_ASSET_ROOTS.some((root) => normalized === root);
};

export const toAssetRelativeForUi = (value: string) => {
  const normalized = normalizeAssetFolderPath(value);
  const projectMatch = normalized.match(/^projects\/[^/]+\/assets\/(.+)$/);
  if (projectMatch) {
    return normalizeAssetFolderPath(projectMatch[1]);
  }
  if (normalized.startsWith("assets/")) {
    return normalizeAssetFolderPath(normalized.slice("assets/".length));
  }
  return normalized;
};

export const isManagedAssetSourcePath = (value: string) =>
  isManagedAssetRelativePath(mapLegacyAssetRelativeToManaged(toAssetRelativeForUi(value)));

export const getAssetDisplayName = (value: string) => {
  const normalized = normalizeAssetFolderPath(value);
  const name = normalized.split("/").filter(Boolean).pop();
  return name || normalized;
};

export const getAssetDisplayContext = (value: string) => {
  const relative = toAssetRelativeForUi(value);
  const parts = normalizeAssetFolderPath(relative).split("/").filter(Boolean);
  if (parts.length <= 1) return "";
  const dirParts = parts.slice(0, -1);
  if (dirParts.length <= 2) {
    return dirParts.join("/");
  }
  return dirParts.slice(-2).join("/");
};

export const buildAssetOptions = (sources: string[]) => {
  const unique = Array.from(
    new Set(
      sources
        .map((value) => value.trim())
        .filter((value) => value.length > 0)
    )
  );
  const names = unique.map((value) => getAssetDisplayName(value));
  const nameCounts = names.reduce<Map<string, number>>((acc, name) => {
    acc.set(name, (acc.get(name) ?? 0) + 1);
    return acc;
  }, new Map<string, number>());

  return unique
    .map((value) => {
      const name = getAssetDisplayName(value);
      const needsContext = (nameCounts.get(name) ?? 0) > 1;
      const context = needsContext ? getAssetDisplayContext(value) : "";
      return {
        value,
        label: context ? `${name} (${context})` : name
      };
    })
    .sort((left, right) => left.label.localeCompare(right.label));
};
