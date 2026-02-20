import { fireEvent, render, screen } from "@testing-library/svelte";
import WizardPanelLegacy from "./WizardPanelLegacy.svelte";

describe("WizardPanelLegacy", () => {
  it("updates role font preview immediately when role selection changes", async () => {
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
    expect(screen.queryByText("textStyle · fontRoleIdentity")).not.toBeInTheDocument();
  });

  it("shows only logo-root assets for wizard identity logo selector", () => {
    const draft = {
      meta: {
        slug: "demo",
        name: "Demo",
        restaurantName: { es: "Demo", en: "Demo" },
        title: { es: "Menu", en: "Menu" },
        identityMode: "logo",
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
        assetOptions: [
          { value: "/projects/demo/assets/originals/backgrounds/bg.webp", label: "bg.webp" },
          { value: "/projects/demo/assets/originals/items/dish.gif", label: "dish.gif" },
          { value: "/projects/demo/assets/originals/logos/brand.webp", label: "brand.webp" }
        ]
      }
    });

    const logoField = screen.getByText("logoAsset").closest("label");
    const select = logoField?.querySelector("select") as HTMLSelectElement | null;
    expect(select).not.toBeNull();
    const options = Array.from(select?.querySelectorAll("option") ?? []).map((option) => option.textContent);
    expect(options).toEqual(["selectImagePlaceholder", "brand.webp"]);
  });

  it("filters background/item selectors by managed folder", () => {
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
      backgrounds: [{ id: "bg-1", src: "", originalSrc: "", type: "image" }],
      categories: [
        {
          id: "cat-1",
          name: { es: "Entradas", en: "Starters" },
          items: [
            {
              id: "dish-1",
              name: { es: "Sopa", en: "Soup" },
              description: { es: "", en: "" },
              longDescription: { es: "", en: "" },
              priceVisible: true,
              price: { amount: 10, currency: "USD" },
              allergens: [],
              vegan: false,
              media: {
                hero360: "/projects/demo/assets/originals/items/dish.gif",
                originalHero360: "/projects/demo/assets/originals/items/dish.gif",
                rotationDirection: "cw",
                scrollAnimationMode: "hero360",
                scrollAnimationSrc: ""
              },
              typography: {}
            }
          ]
        }
      ],
      sound: {
        enabled: false,
        theme: "bar-amber",
        volume: 0.6,
        map: {}
      }
    } as any;

    const props = {
      t: (key: string) => key,
      draft,
      wizardSteps: ["a", "b", "c", "d"],
      wizardStatus: {
        structure: true,
        identity: false,
        categories: false,
        dishes: false,
        preview: false
      },
      assetOptions: [
        { value: "/projects/demo/assets/originals/backgrounds/bg.webp", label: "bg.webp" },
        { value: "/projects/demo/assets/originals/items/dish.gif", label: "dish.gif" },
        { value: "/projects/demo/assets/originals/fonts/menu.woff2", label: "menu.woff2" }
      ],
      wizardCategory: draft.categories[0],
      wizardItem: draft.categories[0].items[0],
      wizardCategoryId: "cat-1",
      wizardItemId: "dish-1"
    };

    const stepIdentityView = render(WizardPanelLegacy, {
      props: {
        ...props,
        wizardStep: 1
      }
    });
    const backgroundSourceField = screen.getByText("wizardSrc").closest("label");
    const backgroundOptions = Array.from(
      backgroundSourceField?.querySelectorAll("option") ?? []
    ).map((option) => option.textContent);
    expect(backgroundOptions).toEqual(["selectImagePlaceholder", "bg.webp"]);
    stepIdentityView.unmount();

    render(WizardPanelLegacy, {
      props: {
        ...props,
        wizardStep: 3
      }
    });
    const itemSourceField = screen.getByText("asset360").closest("label");
    const itemOptions = Array.from(itemSourceField?.querySelectorAll("option") ?? []).map(
      (option) => option.textContent
    );
    expect(itemOptions).toEqual(["selectImagePlaceholder", "dish.gif"]);
  });
});
