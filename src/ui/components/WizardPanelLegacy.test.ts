import { fireEvent, render, screen } from "@testing-library/svelte";
import WizardPanelLegacy from "./WizardPanelLegacy.svelte";

describe("WizardPanelLegacy", () => {
  it("updates identity font preview immediately when role selection changes", async () => {
    const draft = {
      meta: {
        slug: "demo",
        name: "Demo",
        restaurantName: { es: "Demo", en: "Demo" },
        title: { es: "Menu", en: "Menu" },
        identityMode: "text",
        logoSrc: "",
        fontFamily: "Fraunces",
        fontSource: "",
        fontRoles: {},
        template: "focus-rows",
        locales: ["es", "en"],
        defaultLocale: "es",
        currency: "USD",
        currencyPosition: "left",
        backgroundCarouselSeconds: 10,
        backgroundDisplayMode: "carousel"
      },
      backgrounds: [],
      categories: [],
      sound: {
        enabled: false,
        theme: "bar-amber",
        volume: 0.6,
        map: {}
      }
    } as any;

    const setFontRoleSelection = vi.fn();

    render(WizardPanelLegacy, {
      props: {
        t: (key: string) => key,
        draft,
        wizardStep: 1,
        wizardSteps: ["a", "b", "c"],
        wizardStatus: {
          structure: true,
          identity: false,
          categories: false,
          dishes: false,
          preview: false
        },
        setFontRoleSelection
      }
    });

    const roleLabel = screen
      .getByText("textStyle · fontRoleRestaurant")
      .closest("label") as HTMLLabelElement | null;
    expect(roleLabel).not.toBeNull();
    const select = roleLabel?.querySelector("select") as HTMLSelectElement | null;
    const preview = roleLabel?.querySelector(".editor-font-preview") as HTMLParagraphElement | null;
    expect(select).not.toBeNull();
    expect(preview).not.toBeNull();
    expect(preview?.getAttribute("style") ?? "").toContain("Fraunces");

    await fireEvent.change(select!, { target: { value: "builtin:Poppins" } });

    expect(setFontRoleSelection).toHaveBeenCalledWith("restaurant", "builtin:Poppins");
    const refreshedLabel = screen.getByText("textStyle · fontRoleRestaurant").closest("label");
    const refreshedPreview = refreshedLabel?.querySelector(".editor-font-preview");
    expect(refreshedPreview?.getAttribute("style") ?? "").toContain("Poppins");
  });
});
