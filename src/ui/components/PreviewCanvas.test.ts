import { fireEvent, render } from "@testing-library/svelte";
import { tick } from "svelte";
import type { MenuProject } from "../../lib/types";
import PreviewCanvas from "./PreviewCanvas.svelte";

const buildProject = (): MenuProject =>
  ({
    meta: {
      slug: "preview-canvas-locale",
      name: "Preview Canvas Locale",
      restaurantName: { es: "Bistro", en: "Bistro" },
      title: { es: "Menu", en: "Menu" },
      identityMode: "text",
      logoSrc: "",
      fontFamily: "Fraunces",
      fontSource: "",
      fontRoles: {},
      template: "jukebox",
      locales: ["es", "en"],
      defaultLocale: "es",
      currency: "USD",
      currencyPosition: "left",
      backgroundCarouselSeconds: 9,
      backgroundDisplayMode: "carousel"
    },
    backgrounds: [],
    categories: [
      {
        id: "cat-1",
        name: { es: "Uno", en: "One" },
        items: [
          {
            id: "dish-1",
            name: { es: "A", en: "A" },
            description: { es: "", en: "" },
            longDescription: { es: "", en: "" },
            priceVisible: true,
            price: { amount: 10, currency: "USD" },
            allergens: [],
            vegan: false,
            media: {
              hero360: "",
              originalHero360: "",
              rotationDirection: "ccw",
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
  }) as MenuProject;

describe("PreviewCanvas locale bridge", () => {
  it("commits selected locale upstream without immediate overwrite", async () => {
    const setLocale = vi.fn();
    const project = buildProject();

    const model = {
      effectivePreview: "full",
      activeProject: project,
      previewStartupLoading: false,
      previewStartupProgress: 100,
      startupBlockingSources: new Set<string>(),
      previewBackgrounds: [],
      loadedBackgroundIndexes: [],
      activeBackgroundIndex: 0,
      isBlankMenu: false,
      locale: "es",
      carouselActive: { "cat-1": 0 },
      deviceMode: "desktop" as const,
      previewFontStack: "",
      previewFontVars: "",
      t: (key: string) => key,
      textOf: (value: Record<string, string> | undefined, fallback = "") => value?.es ?? fallback,
      getLoadingLabel: () => "loading",
      getTemplateScrollHint: () => "hint",
      getCarouselImageSource: () => "",
      buildResponsiveSrcSetFromMedia: () => undefined,
      getMenuTerm: (key: string) => key,
      formatPrice: (amount: number) => String(amount),
      getDishTapHint: () => "tap",
      getAssetOwnershipDisclaimer: () => "disclaimer",
      getItemFontStyle: () => ""
    };

    const { component, container } = render(PreviewCanvas, {
      props: {
        model,
        actions: {
          shiftSection: vi.fn(),
          handleMenuScroll: vi.fn(),
          shiftCarousel: vi.fn(),
          handleCarouselWheel: vi.fn(),
          handleCarouselTouchStart: vi.fn(),
          handleCarouselTouchMove: vi.fn(),
          handleCarouselTouchEnd: vi.fn(),
          openDish: vi.fn(),
          prefetchDishDetail: vi.fn(),
          setLocale
        }
      }
    });

    const localeSelect = container.querySelector(".menu-select") as HTMLSelectElement | null;
    expect(localeSelect).not.toBeNull();
    expect(localeSelect?.value).toBe("es");

    (localeSelect as HTMLSelectElement).value = "en";
    await fireEvent.input(localeSelect as HTMLSelectElement);
    await fireEvent.change(localeSelect as HTMLSelectElement);
    await tick();
    expect((localeSelect as HTMLSelectElement).value).toBe("en");

    expect(setLocale).toHaveBeenCalledTimes(1);
    expect(setLocale).toHaveBeenLastCalledWith("en");

    await component.$set({
      model: {
        ...model,
        locale: "en"
      }
    });
    await tick();
    expect((localeSelect as HTMLSelectElement).value).toBe("en");
  });
});
