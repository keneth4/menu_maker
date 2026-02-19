import { describe, expect, it } from "vitest";
import type { MenuProject } from "../../lib/types";
import {
  autoAssignSectionBackgroundsByOrder,
  buildSectionBackgroundIndexByCategory,
  buildSectionBackgroundState,
  getSectionModeBackgroundEntries,
  getNextUnusedSectionBackgroundId
} from "./sectionBackgroundWorkflow";

const makeProject = (): MenuProject => ({
  meta: {
    slug: "demo",
    name: "Demo",
    restaurantName: { es: "Demo", en: "Demo" },
    title: { es: "Titulo", en: "Title" },
    identityMode: "text",
    logoSrc: "",
    fontFamily: "Fraunces",
    fontSource: "",
    fontRoles: {},
    template: "focus-rows",
    locales: ["es", "en"],
    defaultLocale: "es",
    currency: "MXN",
    currencyPosition: "left",
    backgroundCarouselSeconds: 9,
    backgroundDisplayMode: "section"
  },
  backgrounds: [
    { id: "bg-1", label: "BG 1", src: "/bg-1.jpg", type: "image" },
    { id: "bg-2", label: "BG 2", src: "/bg-2.jpg", type: "image" },
    { id: "bg-3", label: "BG 3", src: "/bg-3.jpg", type: "image" }
  ],
  categories: [
    { id: "cat-1", name: { es: "A", en: "A" }, backgroundId: "bg-1", items: [] },
    { id: "cat-2", name: { es: "B", en: "B" }, backgroundId: "bg-1", items: [] }
  ],
  sound: {
    enabled: false,
    theme: "bar-amber",
    volume: 0.6,
    map: {}
  }
});

describe("sectionBackgroundWorkflow", () => {
  it("detects duplicate section background assignments", () => {
    const state = buildSectionBackgroundState(makeProject(), "Background");
    expect(state.hasDuplicateAssignments).toBe(true);
    expect(state.isComplete).toBe(false);
    expect(state.optionsByCategory["cat-2"].map((entry) => entry.value)).toContain("bg-2");
  });

  it("auto-assigns backgrounds by order and reports next unused id", () => {
    const project = makeProject();
    autoAssignSectionBackgroundsByOrder(project, "Background");
    expect(project.categories[0].backgroundId).toBe("bg-1");
    expect(project.categories[1].backgroundId).toBe("bg-2");
    expect(getNextUnusedSectionBackgroundId(project, "cat-1", "Background")).toBe("bg-1");
  });

  it("builds background index map only for unique assignments", () => {
    const project = makeProject();
    project.categories[1].backgroundId = "bg-2";
    const map = buildSectionBackgroundIndexByCategory(project, [
      { id: "bg-1" },
      { id: "bg-2" }
    ]);
    expect(map["cat-1"]).toBe(0);
    expect(map["cat-2"]).toBe(1);
  });

  it("derives section background labels from filenames with fallback", () => {
    const project = makeProject();
    project.backgrounds = [
      { id: "bg-1", label: "Manual Name", src: "/assets/backgrounds/cover-one.jpg", type: "image" },
      { id: "bg-2", label: "", src: "", originalSrc: "/assets/backgrounds/cover-two.png", type: "image" },
      { id: "bg-3", label: "", src: "data:image/png;base64,AAAA", type: "image" }
    ];

    const entries = getSectionModeBackgroundEntries(project, "Background");
    expect(entries.map((entry) => entry.label)).toEqual([
      "cover-one.jpg",
      "cover-two.png",
      "Background 3"
    ]);
  });
});
