import type { MenuProject } from "../../lib/types";
import { mapLegacyAssetRelativeToManaged, toAssetRelativeForUi } from "./workspaceWorkflow";

export type ProjectAssetEntry = {
  id: string;
  label: string;
  src: string;
  group: string;
};

const LOGO_ROOT = "originals/logos";

const isManagedLogoSource = (source: string) => {
  const normalized = mapLegacyAssetRelativeToManaged(toAssetRelativeForUi(source));
  return normalized === LOGO_ROOT || normalized.startsWith(`${LOGO_ROOT}/`);
};

export const buildProjectAssetEntries = (
  draft: MenuProject,
  editLang: string,
  getLocalizedValue: (entry: Record<string, string> | undefined, lang: string, fallback: string) => string
): ProjectAssetEntry[] => {
  const backgrounds =
    draft.backgrounds?.map((asset) => ({
      id: `bg-${asset.id}`,
      label: asset.label,
      src: asset.src,
      group: "Fondos"
    })) ?? [];

  const items = draft.categories.flatMap((category) =>
    category.items.flatMap((item) =>
      [item.media.hero360 ?? "", item.media.scrollAnimationSrc ?? ""]
        .filter(Boolean)
        .map((source, index) => ({
          id: `item-${item.id}-${index}`,
          label: getLocalizedValue(item.name, editLang, draft.meta.defaultLocale),
          src: source,
          group: "Items"
        }))
    )
  );

  const fontCandidates = [
    {
      id: "font-interface",
      label: "Interface",
      src: draft.meta.fontSource ?? ""
    },
    {
      id: "font-identity",
      label: "Identity",
      src: draft.meta.fontRoles?.identity?.source ?? ""
    },
    {
      id: "font-restaurant",
      label: "Restaurant",
      src: draft.meta.fontRoles?.restaurant?.source ?? ""
    },
    {
      id: "font-title",
      label: "Menu title",
      src: draft.meta.fontRoles?.title?.source ?? ""
    },
    {
      id: "font-section",
      label: "Section",
      src: draft.meta.fontRoles?.section?.source ?? ""
    },
    {
      id: "font-item-default",
      label: "Item",
      src: draft.meta.fontRoles?.item?.source ?? ""
    },
    ...draft.categories.flatMap((category) =>
      category.items
        .map((item) => ({
          id: `font-item-${item.id}`,
          label: getLocalizedValue(item.name, editLang, draft.meta.defaultLocale) || item.id,
          src: item.typography?.item?.source ?? ""
        }))
        .filter((entry) => entry.src)
    )
  ].filter((entry) => entry.src);

  const fonts = fontCandidates.map((entry) => ({
    ...entry,
    group: "Fonts"
  }));

  const logos =
    draft.meta.logoSrc && isManagedLogoSource(draft.meta.logoSrc)
      ? [
          {
            id: "logo-main",
            label: "Logo",
            src: draft.meta.logoSrc,
            group: "Logos"
          }
        ]
      : [];

  return [...backgrounds, ...items, ...fonts, ...logos];
};

export const buildAssetOptionSourcePaths = (params: {
  rootFiles: string[];
  editorTab: "info" | "assets" | "edit" | "wizard";
  wizardDemoPreview: boolean;
  projectAssets: ProjectAssetEntry[];
  isManagedAssetSourcePath: (path: string) => boolean;
}) => {
  const { rootFiles, editorTab, wizardDemoPreview, projectAssets, isManagedAssetSourcePath } = params;
  const sourceCandidates =
    rootFiles.length > 0
      ? rootFiles
      : editorTab === "wizard" && wizardDemoPreview
        ? []
        : projectAssets.map((asset) => asset.src).filter(Boolean);
  return sourceCandidates.filter((path) => isManagedAssetSourcePath(path));
};

export const buildFontAssetOptions = (
  assetOptions: { value: string; label: string }[],
  toAssetRelativeForUi: (value: string) => string,
  mapLegacyAssetRelativeToManaged: (value: string) => string
) =>
  assetOptions.filter((option) =>
    mapLegacyAssetRelativeToManaged(toAssetRelativeForUi(option.value)).startsWith("originals/fonts/")
  );
