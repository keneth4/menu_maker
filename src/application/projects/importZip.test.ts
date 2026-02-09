import { findMenuJsonEntry, getZipAssetEntries, getZipFolderName, getZipPrefix } from "./importZip";

describe("import zip helpers", () => {
  it("finds menu.json and derives prefix/folder", () => {
    const entries = [
      { name: "demo/menu.json", data: new Uint8Array([1]) },
      { name: "demo/assets/items/a.webp", data: new Uint8Array([2]) }
    ];
    const menuEntry = findMenuJsonEntry(entries);

    expect(menuEntry?.name).toBe("demo/menu.json");
    expect(getZipPrefix(menuEntry!.name)).toBe("demo/");
    expect(getZipFolderName(menuEntry!.name)).toBe("demo");
  });

  it("parses prefixed asset entries", () => {
    const entries = [
      { name: "demo/menu.json", data: new Uint8Array([1]) },
      { name: "demo/assets/originals/backgrounds/", data: new Uint8Array() },
      { name: "demo/assets/items/a.webp", data: new Uint8Array([2]) },
      { name: "demo/assets/fonts/menu.woff2", data: new Uint8Array([3]) },
      { name: "menu.json", data: new Uint8Array([4]) }
    ];

    expect(getZipAssetEntries(entries, "demo/menu.json")).toEqual([
      {
        entry: entries[2],
        relative: "items/a.webp",
        name: "a.webp",
        targetPath: "items"
      },
      {
        entry: entries[3],
        relative: "fonts/menu.woff2",
        name: "menu.woff2",
        targetPath: "fonts"
      }
    ]);
  });

  it("parses root-level asset entries when menu.json has no folder prefix", () => {
    const entries = [
      { name: "menu.json", data: new Uint8Array([1]) },
      { name: "assets/backgrounds/main.jpg", data: new Uint8Array([2]) }
    ];

    expect(getZipAssetEntries(entries, "menu.json")).toEqual([
      {
        entry: entries[1],
        relative: "backgrounds/main.jpg",
        name: "main.jpg",
        targetPath: "backgrounds"
      }
    ]);
  });
});
