import { builtInFontSources } from "../../ui/config/staticOptions";
import type { MenuItem, MenuProject, ProjectFontRole } from "../../lib/types";

export type FontConfigInput = { family?: string; source?: string } | null | undefined;
export type ResolvedFontConfig = { family: string; source: string };

export const getFontFormat = (value: string) => {
  const ext = value.split(".").pop()?.toLowerCase();
  if (!ext) return "";
  if (ext === "woff2") return "woff2";
  if (ext === "woff") return "woff";
  if (ext === "otf") return "opentype";
  if (ext === "ttf") return "truetype";
  return "";
};

export const buildFontStack = (family?: string) => {
  const cleaned = (family || "").replace(/"/g, "").trim();
  const primary = cleaned ? `"${cleaned}", ` : "";
  return `${primary}"Fraunces", "Georgia", serif`;
};

export const slugifyFontTokenPart = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const hashFontSourceToken = (value: string) => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36).slice(0, 6);
};

export const deriveFontFamilyFromSource = (source: string) => {
  const normalized = source.trim();
  if (!normalized) return "";
  const filename = normalized.split("/").filter(Boolean).pop() ?? "font";
  const base = filename.replace(/\.[a-z0-9]+$/i, "");
  const slug = slugifyFontTokenPart(base).slice(0, 24) || "font";
  return `menu-font-${slug}-${hashFontSourceToken(normalized.toLowerCase())}`;
};

export const normalizeFontConfigInput = (value?: FontConfigInput): ResolvedFontConfig => ({
  family: (value?.family ?? "").trim(),
  source: (value?.source ?? "").trim()
});

export const withResolvedFontFamily = (value: ResolvedFontConfig): ResolvedFontConfig =>
  value.source
    ? {
        family: deriveFontFamilyFromSource(value.source),
        source: value.source
      }
    : value;

export const getProjectInterfaceFontConfig = (value: MenuProject) =>
  withResolvedFontFamily(
    normalizeFontConfigInput({
      family: value.meta.fontFamily,
      source: value.meta.fontSource
    })
  );

export const getProjectRoleFontConfig = (
  value: MenuProject,
  role: ProjectFontRole
) => normalizeFontConfigInput(value.meta.fontRoles?.[role]);

export const resolveProjectRoleFontConfig = (
  value: MenuProject,
  role: ProjectFontRole
) => {
  const interfaceFont = getProjectInterfaceFontConfig(value);
  const roleFont = getProjectRoleFontConfig(value, role);
  return withResolvedFontFamily({
    family: roleFont.family || interfaceFont.family,
    source: roleFont.source || interfaceFont.source
  });
};

export const collectProjectFontConfigs = (value: MenuProject) => {
  const configs: ResolvedFontConfig[] = [];
  const pushConfig = (config?: FontConfigInput) => {
    const normalized = withResolvedFontFamily(normalizeFontConfigInput(config));
    if (!normalized.family) return;
    const signature = `${normalized.family}::${normalized.source}`;
    if (configs.some((entry) => `${entry.family}::${entry.source}` === signature)) return;
    configs.push(normalized);
  };

  pushConfig(getProjectInterfaceFontConfig(value));
  pushConfig(resolveProjectRoleFontConfig(value, "restaurant"));
  pushConfig(resolveProjectRoleFontConfig(value, "title"));
  pushConfig(resolveProjectRoleFontConfig(value, "section"));
  pushConfig(resolveProjectRoleFontConfig(value, "item"));
  value.categories.forEach((category) => {
    category.items.forEach((item) => {
      const itemFont = normalizeFontConfigInput(item.typography?.item);
      const fallbackItem = resolveProjectRoleFontConfig(value, "item");
      pushConfig({
        family: itemFont.family || fallbackItem.family,
        source: itemFont.source || fallbackItem.source
      });
    });
  });

  return configs;
};

export const collectProjectBuiltinFontHrefs = (value: MenuProject) => {
  const hrefSet = new Set<string>();
  collectProjectFontConfigs(value).forEach((config) => {
    if (config.source) return;
    const href = builtInFontSources[config.family];
    if (!href) return;
    hrefSet.add(href);
  });
  return Array.from(hrefSet);
};

export const buildProjectFontFaceCss = (value: MenuProject) =>
  collectProjectFontConfigs(value)
    .map((config) => {
      if (!config.family || !config.source) return "";
      const format = getFontFormat(config.source);
      const formatLine = format ? ` format("${format}")` : "";
      return `@font-face { font-family: "${config.family}"; src: url("${config.source}")${formatLine}; font-display: swap; }`;
    })
    .filter(Boolean)
    .join("\n");

export const buildPreviewFontVarStyle = (value: MenuProject) => {
  const interfaceFont = getProjectInterfaceFontConfig(value);
  const restaurantFont = resolveProjectRoleFontConfig(value, "restaurant");
  const titleFont = resolveProjectRoleFontConfig(value, "title");
  const sectionFont = resolveProjectRoleFontConfig(value, "section");
  const itemFont = resolveProjectRoleFontConfig(value, "item");
  return [
    `--menu-font:${buildFontStack(interfaceFont.family)};`,
    `--menu-font-ui:${buildFontStack(interfaceFont.family)};`,
    `--menu-font-identity:${buildFontStack(interfaceFont.family)};`,
    `--menu-font-restaurant:${buildFontStack(restaurantFont.family)};`,
    `--menu-font-title:${buildFontStack(titleFont.family)};`,
    `--menu-font-section:${buildFontStack(sectionFont.family)};`,
    `--menu-font-item:${buildFontStack(itemFont.family)};`
  ].join("");
};

export const getItemFontStyle = (project: MenuProject | null, item: MenuItem) => {
  if (!project) return "";
  const itemConfig = normalizeFontConfigInput(item.typography?.item);
  const fallback = resolveProjectRoleFontConfig(project, "item");
  const resolved = withResolvedFontFamily({
    family: itemConfig.family || fallback.family,
    source: itemConfig.source || fallback.source
  });
  const family = resolved.family;
  if (!family) return "";
  return `--item-font:${buildFontStack(family)};`;
};
