import { describe, expect, it, vi } from "vitest";
import {
  buildExportStyles,
  extractSharedExportStyles
} from "./exportStylesWorkflow";

describe("exportStylesWorkflow", () => {
  it("extracts shared export styles between markers", () => {
    const appCssRaw = `
before
/* EXPORT_SHARED_STYLES_START */
.shared-a { color: red; }
.shared-b { color: blue; }
/* EXPORT_SHARED_STYLES_END */
after
`;
    expect(extractSharedExportStyles(appCssRaw)).toBe(
      ".shared-a { color: red; }\n.shared-b { color: blue; }"
    );
  });

  it("returns empty shared styles and warns when markers are missing", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(extractSharedExportStyles("body { margin: 0; }")).toBe("");
    expect(warnSpy).toHaveBeenCalledTimes(1);
    warnSpy.mockRestore();
  });

  it("builds export stylesheet with shared and modal sections", () => {
    const appCssRaw = `
/* EXPORT_SHARED_STYLES_START */
.shared-export { opacity: 1; }
/* EXPORT_SHARED_STYLES_END */
`;
    const css = buildExportStyles(appCssRaw);
    expect(css).toContain(".shared-export { opacity: 1; }");
    expect(css).toContain(".dish-modal.open");
  });
});
