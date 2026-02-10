import { fireEvent, render, screen } from "@testing-library/svelte";
import type { MenuItem } from "../../lib/types";
import DishModal from "./DishModal.svelte";

const dish: MenuItem = {
  id: "dish-1",
  name: { es: "Tostada", en: "Toast" },
  description: { es: "Crujiente", en: "Crunchy" },
  longDescription: { es: "Descripcion larga", en: "Long description" },
  price: { amount: 12, currency: "USD" },
  media: { hero360: "/projects/demo/assets/tostada.webp" },
  allergens: [{ label: { es: "Nueces", en: "Nuts" } }],
  vegan: true
};

describe("DishModal", () => {
  it("emits close event and renders allergens", async () => {
    const { component } = render(DishModal, {
      props: {
        dish,
        interactiveEnabled: true,
        detailRotateHint: "drag",
        textOf: (value: Record<string, string> | undefined) => value?.es ?? "",
        getDetailImageSource: () => "/projects/demo/assets/tostada.webp",
        getAllergenValues: () => ["Nueces"],
        getMenuTerm: (key: string) => key,
        formatPrice: (value: number) => `$${value}`
      }
    });

    const close = vi.fn();
    component.$on("close", close);

    await fireEvent.click(screen.getByRole("button", { name: "✕" }));

    expect(close).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/Nueces/)).toBeInTheDocument();
  });
});
