import { fireEvent, render, screen } from "@testing-library/svelte";
import RuntimeSurfaceHost from "./RuntimeSurfaceHost.svelte";

describe("RuntimeSurfaceHost", () => {
  it("renders dish modal and delegates close/media actions", async () => {
    const dish = {
      id: "dish-1",
      name: { es: "Sopa" },
      description: { es: "Caliente" },
      longDescription: { es: "" },
      priceVisible: true,
      price: { amount: 12, currency: "USD" },
      allergens: [],
      vegan: false,
      media: { hero360: "", originalHero360: "", rotationDirection: "ccw" }
    } as any;

    const actions = {
      closeDish: vi.fn(),
      setModalMediaHost: vi.fn(),
      setModalMediaImage: vi.fn()
    };

    const { container } = render(RuntimeSurfaceHost, {
      props: {
        model: {
          activeItem: { category: "soups", itemId: "dish-1" },
          dish,
          interactiveEnabled: false,
          itemFontStyle: "",
          modalMediaHost: null,
          modalMediaImage: null,
          textOf: (value: Record<string, string> | undefined) => value?.es ?? "",
          getDetailImageSource: () => "/projects/demo/assets/originals/items/soup.webp",
          getAllergenValues: () => [],
          getMenuTerm: (key: string) => key,
          formatPrice: (value: number) => String(value),
          assetOptions: [{ value: "a.png", label: "a.png" }],
          fontAssetOptions: [{ value: "font.woff2", label: "font.woff2" }]
        },
        actions
      }
    });

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Sopa")).toBeInTheDocument();
    expect(container.querySelector("#asset-files option[value='a.png']")).not.toBeNull();
    expect(container.querySelector("#font-asset-files option[value='font.woff2']")).not.toBeNull();

    await fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(actions.closeDish).toHaveBeenCalledTimes(1);
  });
});
