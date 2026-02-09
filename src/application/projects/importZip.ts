import type { ZipBinaryEntry } from "../export/projectZip";

export const findMenuJsonEntry = (entries: ZipBinaryEntry[]) =>
  entries.find((entry) => entry.name.endsWith("menu.json")) ?? null;

export const getZipPrefix = (menuEntryName: string) => menuEntryName.replace(/menu\.json$/i, "");

export const getZipFolderName = (menuEntryName: string) => {
  const folder = getZipPrefix(menuEntryName).replace(/\/$/, "");
  return folder.split("/").filter(Boolean).pop() ?? "";
};

export const getZipAssetEntries = (entries: ZipBinaryEntry[], menuEntryName: string) => {
  const prefix = getZipPrefix(menuEntryName);
  const assetsPrefix = prefix ? `${prefix}assets/` : "assets/";
  return entries
    .filter((entry) => entry.name.startsWith(assetsPrefix))
    .filter((entry) => !entry.name.endsWith("/"))
    .map((entry) => {
      const relative = entry.name.slice(assetsPrefix.length);
      const parts = relative.split("/").filter(Boolean);
      const name = parts.pop() ?? "";
      return {
        entry,
        relative,
        name,
        targetPath: parts.join("/")
      };
    })
    .filter((item) => Boolean(item.relative));
};
