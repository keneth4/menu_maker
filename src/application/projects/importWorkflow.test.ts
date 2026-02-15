import { describe, expect, it } from "vitest";
import { mapLegacyAssetRelativeToManaged } from "../assets/workspaceWorkflow";
import { mapImportedAssetPath } from "./importWorkflow";

describe("mapImportedAssetPath", () => {
  it("maps relative asset paths into managed project roots", () => {
    const result = mapImportedAssetPath(
      "assets/dishes/pie.gif",
      "demo",
      mapLegacyAssetRelativeToManaged
    );
    expect(result).toBe("/projects/demo/assets/originals/items/pie.gif");
  });

  it("rewrites same-slug project legacy asset paths into managed roots", () => {
    const result = mapImportedAssetPath(
      "/projects/demo/assets/dishes/pie.gif",
      "demo",
      mapLegacyAssetRelativeToManaged
    );
    expect(result).toBe("/projects/demo/assets/originals/items/pie.gif");
  });

  it("rewrites cross-slug project asset paths into managed roots", () => {
    const result = mapImportedAssetPath(
      "/projects/legacy/assets/dishes/pie.gif",
      "demo",
      mapLegacyAssetRelativeToManaged
    );
    expect(result).toBe("/projects/demo/assets/originals/items/pie.gif");
  });
});
