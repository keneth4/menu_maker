import { describe, expect, it, vi } from "vitest";
import { isTargetWithinEditorPanel, tryLockLandscape } from "./runtimeShellDomController";

describe("runtimeShellDomController", () => {
  it("checks whether an event target is inside the editor panel", () => {
    const target = document.createElement("button");
    const panel = document.createElement("div");
    panel.append(target);

    expect(isTargetWithinEditorPanel(target, () => panel)).toBe(true);
    expect(isTargetWithinEditorPanel(document.createElement("span"), () => panel)).toBe(false);
    expect(isTargetWithinEditorPanel(null, () => panel)).toBe(false);
  });

  it("attempts landscape orientation lock when available", async () => {
    const lock = vi.fn(async () => undefined);
    await tryLockLandscape({
      orientation: {
        lock
      }
    });
    expect(lock).toHaveBeenCalledWith("landscape");
  });
});
