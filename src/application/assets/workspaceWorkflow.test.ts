import { describe, expect, it } from "vitest";
import {
  isLockedManagedAssetRoot,
  isManagedAssetRelativePath,
  mapLegacyAssetRelativeToManaged,
  toAssetRelativeForUi
} from "./workspaceWorkflow";

describe("workspaceWorkflow", () => {
  it("locks originals root and managed base roots", () => {
    expect(isLockedManagedAssetRoot("originals")).toBe(true);
    expect(isLockedManagedAssetRoot("originals/backgrounds")).toBe(true);
    expect(isLockedManagedAssetRoot("originals/items")).toBe(true);
    expect(isLockedManagedAssetRoot("originals/fonts")).toBe(true);
    expect(isLockedManagedAssetRoot("originals/logos")).toBe(true);
    expect(isLockedManagedAssetRoot("originals/items/custom")).toBe(false);
  });

  it("keeps managed path rules scoped to originals managed folders", () => {
    const normalized = mapLegacyAssetRelativeToManaged(
      toAssetRelativeForUi("/projects/demo/assets/items/photo.jpg")
    );
    expect(normalized).toBe("originals/items/photo.jpg");
    expect(isManagedAssetRelativePath(normalized)).toBe(true);
    expect(
      mapLegacyAssetRelativeToManaged(
        toAssetRelativeForUi("/projects/demo/assets/logo/brand.webp")
      )
    ).toBe("originals/logos/brand.webp");
    expect(
      mapLegacyAssetRelativeToManaged(
        toAssetRelativeForUi("/projects/demo/assets/logos/brand.webp")
      )
    ).toBe("originals/logos/brand.webp");
    expect(isManagedAssetRelativePath("originals")).toBe(false);
  });
});
