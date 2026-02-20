import { fireEvent, render, screen } from "@testing-library/svelte";
import EditPanelLegacy from "./EditPanelLegacy.svelte";

const getVisibleOptionTexts = (select: HTMLSelectElement | null) =>
  Array.from(select?.querySelectorAll("option") ?? [])
    .filter((option) => !option.hidden)
    .map((option) => option.textContent);

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

  it("shows only logo-root assets in identity logo selector", () => {
    const { draft, category, item } = makeDraft();
    draft.meta.identityMode = "logo";

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
        assetOptions: [
          { value: "/projects/demo/assets/originals/backgrounds/bg.webp", label: "bg.webp" },
          { value: "/projects/demo/assets/originals/items/dish.gif", label: "dish.gif" },
          { value: "/projects/demo/assets/originals/logos/brand.webp", label: "brand.webp" }
        ]
      }
    });

    const logoField = screen.getByText("wizardSrc").closest("label");
    const select = logoField?.querySelector("select") as HTMLSelectElement | null;
    expect(select).not.toBeNull();
    expect(select?.value).toBe("");
    const placeholder = select?.querySelector('option[value=""]');
    expect(placeholder).not.toBeNull();
    expect(placeholder?.hidden).toBe(true);
    expect(placeholder?.disabled).toBe(true);
    expect(getVisibleOptionTexts(select)).toEqual(["brand.webp"]);
  });

  it("renders identity fields and inline font rows by mode", () => {
    const { draft, category, item } = makeDraft();
    draft.meta.identityMode = "logo";

    const logoView = render(EditPanelLegacy, {
      props: {
        t: (key: string) => key,
        draft,
        editPanel: "identity",
        editLang: "es",
        selectedCategoryId: "cat-1",
        selectedItemId: "dish-1",
        selectedCategory: category,
        selectedItem: item,
        getLocalizedValue: (value: Record<string, string> | undefined) => value?.es ?? ""
      }
    });

    expect(screen.getByText("logoAsset")).toBeInTheDocument();
    expect(screen.queryByText(/restaurantName/)).not.toBeInTheDocument();
    expect(screen.getByText(/menuTitle/)).toBeInTheDocument();
    expect(screen.queryByText("fontRoleRestaurant")).not.toBeInTheDocument();
    expect(screen.getByText("fontRoleTitle")).toBeInTheDocument();
    expect(screen.getByText("fontRoleSection")).toBeInTheDocument();
    expect(screen.getByText("fontRoleItem")).toBeInTheDocument();
    const logoRows = logoView.container.querySelectorAll(".identity-inline-row");
    expect(logoRows).toHaveLength(1);
    const logoRowControls = logoRows[0].querySelectorAll("input.editor-input, select.editor-select");
    expect(logoRowControls).toHaveLength(2);
    expect(logoRowControls[0]?.tagName).toBe("INPUT");
    expect(logoRowControls[1]?.tagName).toBe("SELECT");
    logoView.unmount();

    draft.meta.identityMode = "text";
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
        getLocalizedValue: (value: Record<string, string> | undefined) => value?.es ?? ""
      }
    });

    expect(screen.queryByText("logoAsset")).not.toBeInTheDocument();
    expect(screen.getByText(/restaurantName/)).toBeInTheDocument();
    expect(screen.getByText(/menuTitle/)).toBeInTheDocument();
    expect(screen.getByText("fontRoleRestaurant")).toBeInTheDocument();
    expect(screen.getByText("fontRoleTitle")).toBeInTheDocument();
    expect(screen.getByText("fontRoleSection")).toBeInTheDocument();
    expect(screen.getByText("fontRoleItem")).toBeInTheDocument();
    const textRows = document.querySelectorAll(".identity-inline-row");
    expect(textRows).toHaveLength(2);
    expect(textRows[0]?.textContent).toContain("restaurantName");
    expect(textRows[0]?.textContent).toContain("fontRoleRestaurant");
    expect(textRows[1]?.textContent).toContain("menuTitle");
    expect(textRows[1]?.textContent).toContain("fontRoleTitle");
    for (const row of textRows) {
      const controls = row.querySelectorAll("input.editor-input, select.editor-select");
      expect(controls).toHaveLength(2);
      expect(controls[0]?.tagName).toBe("INPUT");
      expect(controls[1]?.tagName).toBe("SELECT");
    }
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

  it("creates section only after explicit inline save", async () => {
    const { draft, category, item } = makeDraft();
    const addSection = vi.fn(() => {
      draft.categories.push({
        id: "cat-2",
        name: { es: "", en: "" },
        backgroundId: "",
        items: []
      });
    });
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
        addSection,
        setSectionNameById,
        getLocalizedValue: (value: Record<string, string> | undefined) => value?.es ?? ""
      }
    });

    await fireEvent.click(screen.getByRole("button", { name: "addSection" }));
    expect(addSection).toHaveBeenCalledTimes(0);
    const sectionInput = screen.getByRole("textbox", { name: "sectionName" }) as HTMLInputElement;
    const saveButton = screen.getByRole("button", { name: "save" }) as HTMLButtonElement;
    expect(saveButton.disabled).toBe(true);

    await fireEvent.input(sectionInput, { target: { value: "Nuevos platos" } });
    expect(saveButton.disabled).toBe(false);
    await fireEvent.click(saveButton);

    expect(addSection).toHaveBeenCalledTimes(1);
    expect(setSectionNameById).toHaveBeenCalledWith("cat-2", "es", "Nuevos platos");
  });

  it("keeps pending section inline edit when switching subtabs", async () => {
    const { draft, category, item } = makeDraft();
    const addSection = vi.fn();

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
    expect(screen.getByRole("textbox", { name: "sectionName" })).toBeInTheDocument();

    await fireEvent.click(screen.getByRole("button", { name: "editDishes" }));
    await fireEvent.click(screen.getByRole("button", { name: "editSections" }));

    expect(screen.getByRole("textbox", { name: "sectionName" })).toBeInTheDocument();
    expect(addSection).not.toHaveBeenCalled();
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

  it("filters background/item asset selectors by managed folder", () => {
    const { draft, category, item } = makeDraft();
    draft.backgrounds = [
      {
        id: "bg-1",
        src: "",
        originalSrc: "",
        type: "image"
      }
    ];

    const commonProps = {
      t: (key: string) => key,
      draft,
      editLang: "es",
      selectedCategoryId: "cat-1",
      selectedItemId: "dish-1",
      selectedCategory: category,
      selectedItem: item,
      assetOptions: [
        { value: "/projects/demo/assets/originals/backgrounds/bg.webp", label: "bg.webp" },
        { value: "/projects/demo/assets/originals/items/dish.gif", label: "dish.gif" },
        { value: "/projects/demo/assets/originals/fonts/menu.woff2", label: "menu.woff2" }
      ],
      getLocalizedValue: (value: Record<string, string> | undefined) => value?.es ?? "",
      textOf: (value: Record<string, string> | undefined) => value?.es ?? ""
    };

    const backgroundView = render(EditPanelLegacy, {
      props: {
        ...commonProps,
        editPanel: "background"
      }
    });
    const bgSourceField = screen.getByText("wizardSrc").closest("label");
    const bgSelect = bgSourceField?.querySelector("select") as HTMLSelectElement | null;
    expect(bgSelect?.value).toBe("");
    const bgPlaceholder = bgSelect?.querySelector('option[value=""]');
    expect(bgPlaceholder?.hidden).toBe(true);
    expect(bgPlaceholder?.disabled).toBe(true);
    expect(getVisibleOptionTexts(bgSelect)).toEqual(["bg.webp"]);
    backgroundView.unmount();

    render(EditPanelLegacy, {
      props: {
        ...commonProps,
        editPanel: "dish"
      }
    });
    const itemSourceField = screen.getByText("asset360").closest(".edit-item__source");
    const itemSelect = itemSourceField?.querySelector("select") as HTMLSelectElement | null;
    const itemPlaceholder = itemSelect?.querySelector('option[value=""]');
    expect(itemPlaceholder?.hidden).toBe(true);
    expect(itemPlaceholder?.disabled).toBe(true);
    expect(getVisibleOptionTexts(itemSelect)).toEqual(["dish.gif"]);
  });
});
