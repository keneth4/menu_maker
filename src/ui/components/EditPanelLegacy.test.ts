import { fireEvent, render, screen } from "@testing-library/svelte";
import EditPanelLegacy from "./EditPanelLegacy.svelte";

const makeDraft = () => {
  const item = {
    id: "dish-1",
    name: { es: "Sopa", en: "Soup" },
    description: { es: "Caliente", en: "Hot" },
    longDescription: { es: "", en: "" },
    priceVisible: true,
    price: { amount: 12, currency: "USD" },
    allergens: [],
    vegan: false,
    media: {
      hero360: "/projects/demo/assets/derived/items/dish-md.webp",
      originalHero360: "/projects/demo/assets/originals/items/dish.gif",
      rotationDirection: "cw",
      scrollAnimationMode: "hero360",
      scrollAnimationSrc: ""
    },
    typography: {}
  } as any;

  const category = {
    id: "cat-1",
    name: { es: "Entradas", en: "Starters" },
    backgroundId: "",
    items: [item]
  } as any;

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
      locales: ["es"],
      defaultLocale: "es",
      currency: "USD",
      currencyPosition: "left",
      backgroundCarouselSeconds: 10,
      backgroundDisplayMode: "carousel"
    },
    backgrounds: [],
    categories: [category],
    sound: {
      enabled: false,
      theme: "bar-amber",
      volume: 0.6,
      map: {}
    }
  } as any;

  return { draft, category, item };
};

describe("EditPanelLegacy", () => {
  it("uses originalHero360 as selected value when hero360 is derived", () => {
    const { draft, category, item } = makeDraft();

    render(EditPanelLegacy, {
      props: {
        t: (key: string) => key,
        draft,
        editPanel: "dish",
        editLang: "es",
        selectedCategoryId: "cat-1",
        selectedItemId: "dish-1",
        selectedCategory: category,
        selectedItem: item,
        assetOptions: [{
          value: "/projects/demo/assets/originals/items/dish.gif",
          label: "dish.gif"
        }],
        getLocalizedValue: (value: Record<string, string> | undefined) => value?.es ?? "",
        textOf: (value: Record<string, string> | undefined) => value?.es ?? ""
      }
    });

    const assetField = screen.getByText("asset360").closest(".edit-item__source");
    const select = assetField?.querySelector("select") as HTMLSelectElement | null;

    expect(select).not.toBeNull();
    expect(select?.value).toBe("/projects/demo/assets/originals/items/dish.gif");
  });

  it("renders section list rows with edit/delete controls", async () => {
    const { draft, category, item } = makeDraft();
    draft.categories.push({
      id: "cat-2",
      name: { es: "Postres", en: "Desserts" },
      backgroundId: "",
      items: []
    });

    const deleteSectionById = vi.fn();
    render(EditPanelLegacy, {
      props: {
        t: (key: string) => key,
        draft,
        editPanel: "section",
        editLang: "es",
        selectedCategoryId: "cat-1",
        selectedItemId: "dish-1",
        selectedCategory: category,
        selectedItem: item,
        getLocalizedValue: (value: Record<string, string> | undefined) => value?.es ?? "",
        deleteSectionById
      }
    });

    expect(document.querySelectorAll(".edit-sections .edit-section")).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "editSection" })).toHaveLength(2);
    expect(screen.queryByText("sectionHint")).not.toBeInTheDocument();

    await fireEvent.click(screen.getAllByRole("button", { name: "deleteSection" })[1]);
    expect(deleteSectionById).toHaveBeenCalledWith("cat-2");
  });

  it("edits section name inline and saves with Enter", async () => {
    const { draft, category, item } = makeDraft();
    const setSectionNameById = vi.fn();

    render(EditPanelLegacy, {
      props: {
        t: (key: string) => key,
        draft,
        editPanel: "section",
        editLang: "es",
        selectedCategoryId: "cat-1",
        selectedItemId: "dish-1",
        selectedCategory: category,
        selectedItem: item,
        getLocalizedValue: (value: Record<string, string> | undefined) => value?.es ?? "",
        setSectionNameById
      }
    });

    await fireEvent.click(screen.getByRole("button", { name: "editSection" }));
    const sectionInput = screen.getByRole("textbox", { name: "sectionName" }) as HTMLInputElement;
    await fireEvent.input(sectionInput, { target: { value: "Entradas premium" } });
    await fireEvent.keyDown(sectionInput, { key: "Enter" });

    expect(setSectionNameById).toHaveBeenCalledWith("cat-1", "es", "Entradas premium");
    expect(screen.queryByRole("button", { name: "clear" })).not.toBeInTheDocument();
  });

  it("starts inline edit immediately for newly added section", async () => {
    const { draft, category, item } = makeDraft();
    const addSection = vi.fn(() => {
      draft.categories.push({
        id: "cat-2",
        name: { es: "", en: "" },
        backgroundId: "",
        items: []
      });
    });

    render(EditPanelLegacy, {
      props: {
        t: (key: string) => key,
        draft,
        editPanel: "section",
        editLang: "es",
        selectedCategoryId: "cat-1",
        selectedItemId: "dish-1",
        selectedCategory: category,
        selectedItem: item,
        addSection,
        getLocalizedValue: (value: Record<string, string> | undefined) => value?.es ?? ""
      }
    });

    await fireEvent.click(screen.getByRole("button", { name: "addSection" }));

    expect(addSection).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("textbox", { name: "sectionName" })).toBeInTheDocument();
  });

  it("updates identity font preview immediately when selection changes", async () => {
    const { draft, category, item } = makeDraft();
    const setFontRoleSelection = vi.fn();

    render(EditPanelLegacy, {
      props: {
        t: (key: string) => key,
        draft,
        editPanel: "identity",
        editLang: "es",
        selectedCategoryId: "cat-1",
        selectedItemId: "dish-1",
        selectedCategory: category,
        selectedItem: item,
        getLocalizedValue: (value: Record<string, string> | undefined) => value?.es ?? "",
        setFontRoleSelection
      }
    });

    const textStyleLabel = screen.getAllByText("textStyle")[0].closest("label");
    const select = textStyleLabel?.querySelector("select") as HTMLSelectElement | null;
    const preview = textStyleLabel?.querySelector(".editor-font-preview") as HTMLParagraphElement | null;
    expect(select).not.toBeNull();
    expect(preview).not.toBeNull();
    expect(preview?.getAttribute("style") ?? "").toContain("Fraunces");

    await fireEvent.change(select!, { target: { value: "builtin:Poppins" } });

    expect(setFontRoleSelection).toHaveBeenCalled();
    const refreshedLabel = screen.getAllByText("textStyle")[0].closest("label");
    const refreshedPreview = refreshedLabel?.querySelector(".editor-font-preview");
    expect(refreshedPreview?.getAttribute("style") ?? "").toContain("Poppins");
  });
});
