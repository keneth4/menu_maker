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
          handleMenuWheel: vi.fn(),
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

  it("keeps already-ready carousel media loaded when unrelated media source changes", async () => {
    const project = buildProject();
    project.categories.push({
      id: "cat-2",
      name: { es: "Dos", en: "Two" },
      items: [
        {
          id: "dish-2",
          name: { es: "B", en: "B" },
          description: { es: "", en: "" },
          longDescription: { es: "", en: "" },
          priceVisible: true,
          price: { amount: 12, currency: "USD" },
          allergens: [],
          vegan: false,
          media: {
            hero360: "/projects/demo/assets/originals/items/dish-2.webp",
            originalHero360: "/projects/demo/assets/originals/items/dish-2.webp",
            rotationDirection: "cw",
            scrollAnimationMode: "hero360",
            scrollAnimationSrc: ""
          },
          typography: {}
        }
      ]
    } as any);
    project.categories[0].items[0].media.hero360 = "/projects/demo/assets/originals/items/dish-1.webp";
    project.categories[0].items[0].media.originalHero360 =
      "/projects/demo/assets/originals/items/dish-1.webp";

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
      carouselActive: { "cat-1": 0, "cat-2": 0 },
      deviceMode: "desktop" as const,
      previewFontStack: "",
      previewFontVars: "",
      t: (key: string) => key,
      textOf: (value: Record<string, string> | undefined, fallback = "") => value?.es ?? fallback,
      getLoadingLabel: () => "loading",
      getTemplateScrollHint: () => "hint",
      getCarouselImageSource: (item: any) => item.media.hero360 ?? "",
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
          handleMenuWheel: vi.fn(),
          handleMenuScroll: vi.fn(),
          shiftCarousel: vi.fn(),
          handleCarouselWheel: vi.fn(),
          handleCarouselTouchStart: vi.fn(),
          handleCarouselTouchMove: vi.fn(),
          handleCarouselTouchEnd: vi.fn(),
          openDish: vi.fn(),
          prefetchDishDetail: vi.fn(),
          setLocale: vi.fn()
        }
      }
    });

    const mediaNodes = container.querySelectorAll(".carousel-media");
    const firstMedia = mediaNodes[0] as HTMLDivElement | undefined;
    const firstImage = firstMedia?.querySelector("img") as HTMLImageElement | null;
    expect(firstMedia).toBeDefined();
    expect(firstImage).not.toBeNull();

    await fireEvent.load(firstImage as HTMLImageElement);
    await tick();
    expect(firstMedia?.classList.contains("is-loaded")).toBe(true);
    expect(firstMedia?.classList.contains("is-loading")).toBe(false);

    const nextProject = structuredClone(project) as MenuProject;
    nextProject.categories[1].items[0].media.hero360 = "/projects/demo/assets/originals/items/dish-2b.webp";
    nextProject.categories[1].items[0].media.originalHero360 =
      "/projects/demo/assets/originals/items/dish-2b.webp";
    await component.$set({
      model: {
        ...model,
        activeProject: nextProject
      }
    });
    await tick();

    const refreshedFirstMedia = container.querySelectorAll(".carousel-media")[0] as
      | HTMLDivElement
      | undefined;
    expect(refreshedFirstMedia?.classList.contains("is-loaded")).toBe(true);
    expect(refreshedFirstMedia?.classList.contains("is-loading")).toBe(false);
  });
});
