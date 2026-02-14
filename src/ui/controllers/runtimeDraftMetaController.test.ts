import { describe, expect, it } from "vitest";
import type { MenuProject } from "../../lib/types";
import { ensureDraftMetaLocalizedField } from "./runtimeDraftMetaController";

const buildDraft = (): MenuProject =>
  ({
    meta: {
      name: "",
      slug: "demo",
      locales: ["es", "en"],
      defaultLocale: "es",
      currency: "$",
      currencyPosition: "left",
      fontFamily: "Fraunces"
    },
    backgrounds: [],
    categories: []
  }) as MenuProject;

describe("ensureDraftMetaLocalizedField", () => {
  it("creates missing localized field entries for each locale", () => {
    const draft = buildDraft();

    const title = ensureDraftMetaLocalizedField(draft, "title");

    expect(title).toEqual({ es: "", en: "" });
    expect(draft.meta.title).toEqual({ es: "", en: "" });
  });

  it("returns null for missing draft", () => {
    expect(ensureDraftMetaLocalizedField(null, "restaurantName")).toBeNull();
  });
});
