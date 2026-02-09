import {
  normalizeProjectSlug,
  normalizeAssetPath,
  planEntryMove,
  planEntryRename,
  resolveBridgeAssetLookup
} from "./pathing";

describe("bridge pathing contract", () => {
  it("normalizes leading slash and whitespace", () => {
    expect(normalizeAssetPath(" /projects/demo/assets/a.gif ")).toBe("projects/demo/assets/a.gif");
    expect(normalizeAssetPath("assets/a.gif")).toBe("assets/a.gif");
  });

  it("normalizes project slugs with bridge-compatible rules", () => {
    expect(normalizeProjectSlug(" My Project ")).toBe("my-project");
    expect(normalizeProjectSlug("alpha_beta-2026")).toBe("alpha_beta-2026");
  });

  it("resolves bridge lookup from canonical project asset path", () => {
    expect(resolveBridgeAssetLookup("/projects/alpha/assets/dishes/pie.gif", "fallback")).toEqual({
      slug: "alpha",
      path: "dishes/pie.gif"
    });
  });

  it("resolves bridge lookup from generic assets path with fallback slug", () => {
    expect(resolveBridgeAssetLookup("assets/dishes/pie.gif", "alpha")).toEqual({
      slug: "alpha",
      path: "dishes/pie.gif"
    });
    expect(resolveBridgeAssetLookup("dishes/pie.gif", "alpha")).toEqual({
      slug: "alpha",
      path: "dishes/pie.gif"
    });
  });

  it("plans safe rename inside same parent folder", () => {
    expect(planEntryRename("dishes/pie.gif", "cake.gif")).toBe("dishes/cake.gif");
    expect(planEntryRename("pie.gif", "cake.gif")).toBe("cake.gif");
  });

  it("plans file move semantics compatible with existing app behavior", () => {
    expect(planEntryMove("file", "pie.gif", "archive/")).toEqual({
      destinationPath: "archive/pie.gif",
      destinationDirPath: "archive",
      destinationName: "pie.gif"
    });
    expect(planEntryMove("file", "pie.gif", "archive/cake.gif")).toEqual({
      destinationPath: "archive/cake.gif",
      destinationDirPath: "archive",
      destinationName: "cake.gif"
    });
  });

  it("plans directory move semantics compatible with existing app behavior", () => {
    expect(planEntryMove("directory", "dishes", "archive/")).toEqual({
      destinationPath: "archive/dishes",
      destinationDirPath: "archive",
      destinationName: "dishes"
    });
    expect(planEntryMove("directory", "dishes", "archive/menu-items")).toEqual({
      destinationPath: "archive/menu-items",
      destinationDirPath: "archive",
      destinationName: "menu-items"
    });
  });
});
