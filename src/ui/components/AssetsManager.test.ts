import { fireEvent, render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import AssetsManager from "./AssetsManager.svelte";

const createModel = (overrides: Record<string, unknown> = {}) => ({
  t: (key: string) => key,
  rootLabel: "demo",
  assetProjectReadOnly: false,
  assetUploadInput: null,
  uploadTargetPath: "originals/backgrounds",
  uploadFolderOptions: [
    { value: "originals/backgrounds", label: "Backgrounds" },
    { value: "originals/items", label: "Items" },
    { value: "originals/fonts", label: "Fonts" }
  ],
  needsAssets: false,
  fsError: "",
  assetTaskVisible: false,
  assetTaskStep: "",
  assetTaskProgress: 0,
  assetMode: "bridge",
  fsEntries: [],
  treeRows: [],
  selectedAssetIds: [],
  ...overrides
});

const createActions = () => ({
  createFolder: vi.fn(),
  createFolderNamed: vi.fn(),
  handleAssetUpload: vi.fn(),
  handleAssetDragOver: vi.fn(),
  handleAssetDrop: vi.fn(),
  selectAllAssets: vi.fn(),
  clearAssetSelection: vi.fn(),
  bulkMove: vi.fn(),
  bulkDelete: vi.fn(),
  toggleAssetSelection: vi.fn(),
  toggleExpandPath: vi.fn(),
  renameEntry: vi.fn(),
  renameEntryNamed: vi.fn(),
  moveEntry: vi.fn(),
  deleteEntry: vi.fn(),
  setUploadTargetPath: vi.fn(),
  setAssetUploadInput: vi.fn()
});

describe("AssetsManager", () => {
  it("propagates upload-target selection to items/fonts without snapping back", async () => {
    const model = createModel();
    const actions = createActions();

    const { component } = render(AssetsManager, {
      props: { model, actions }
    });

    const selector = screen.getByRole("combobox");

    await fireEvent.change(selector, { target: { value: "originals/items" } });
    expect(actions.setUploadTargetPath).toHaveBeenLastCalledWith("originals/items");

    const nextModelItems = {
      ...model,
      uploadTargetPath: "originals/items"
    };
    component.$set({ model: nextModelItems });
    await tick();
    await fireEvent.change(selector, { target: { value: "originals/fonts" } });
    expect(actions.setUploadTargetPath).toHaveBeenLastCalledWith("originals/fonts");

    const nextModelFonts = {
      ...nextModelItems,
      uploadTargetPath: "originals/fonts"
    };
    component.$set({ model: nextModelFonts });
    await tick();
    expect((selector as HTMLSelectElement).value).toBe("originals/fonts");
  });

  it("opens file picker when clicking upload button", async () => {
    const model = createModel();
    const actions = createActions();

    const { container } = render(AssetsManager, {
      props: { model, actions }
    });

    const fileInput = container.querySelector<HTMLInputElement>('input[type="file"]');
    expect(fileInput).not.toBeNull();
    if (!fileInput) return;
    const clickSpy = vi.spyOn(fileInput, "click");

    const uploadTriggers = screen.getAllByRole("button", { name: "uploadAssets" });
    const uploadButton = uploadTriggers.find(
      (entry) => entry instanceof HTMLButtonElement
    ) as HTMLButtonElement | undefined;
    expect(uploadButton).toBeDefined();
    if (!uploadButton) return;
    await fireEvent.click(uploadButton);
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it("renames an asset inline with Enter", async () => {
    const entry = {
      id: "originals/items/soup.webp",
      name: "soup.webp",
      path: "originals/items/soup.webp",
      kind: "file"
    } as const;
    const model = createModel({
      uploadTargetPath: "originals/items",
      fsEntries: [entry],
      treeRows: [
        {
          entry,
          depth: 2,
          hasChildren: false,
          expanded: false
        }
      ]
    });
    const actions = createActions();

    render(AssetsManager, { props: { model, actions } });

    await fireEvent.click(screen.getByRole("button", { name: "rename" }));
    const renameInput = screen.getByRole("textbox", { name: "rename" }) as HTMLInputElement;
    await fireEvent.input(renameInput, { target: { value: "soup-renamed.webp" } });
    await fireEvent.keyDown(renameInput, { key: "Enter" });

    expect(actions.renameEntryNamed).toHaveBeenCalledWith(entry, "soup-renamed.webp");
  });

  it("creates a folder inline under upload target with Enter", async () => {
    const folderRow = {
      id: "originals/items",
      name: "items",
      path: "originals/items",
      kind: "directory"
    } as const;
    const model = createModel({
      uploadTargetPath: "originals/items",
      fsEntries: [folderRow],
      treeRows: [
        {
          entry: folderRow,
          depth: 1,
          hasChildren: true,
          expanded: true
        }
      ]
    });
    const actions = createActions();

    render(AssetsManager, { props: { model, actions } });

    await fireEvent.click(screen.getByRole("button", { name: "newFolder" }));
    const newFolderInput = screen.getByRole("textbox", { name: "newFolder" }) as HTMLInputElement;
    await fireEvent.input(newFolderInput, { target: { value: "seasonal" } });
    await fireEvent.keyDown(newFolderInput, { key: "Enter" });

    expect(actions.createFolderNamed).toHaveBeenCalledWith("seasonal", "originals/items");
  });

  it("disables editing controls for protected roots including originals", () => {
    const lockedOriginals = {
      id: "originals",
      name: "originals",
      path: "originals",
      kind: "directory"
    } as const;
    const lockedItems = {
      id: "originals/items",
      name: "items",
      path: "originals/items",
      kind: "directory"
    } as const;
    const editable = {
      id: "originals/items/custom",
      name: "custom",
      path: "originals/items/custom",
      kind: "directory"
    } as const;
    const model = createModel({
      fsEntries: [lockedOriginals, lockedItems, editable],
      treeRows: [
        { entry: lockedOriginals, depth: 0, hasChildren: true, expanded: true },
        { entry: lockedItems, depth: 1, hasChildren: true, expanded: true },
        { entry: editable, depth: 2, hasChildren: false, expanded: false }
      ]
    });
    const actions = createActions();

    render(AssetsManager, { props: { model, actions } });

    const renameButtons = screen.getAllByRole("button", { name: "rename" }) as HTMLButtonElement[];
    expect(renameButtons[0]).toBeDisabled();
    expect(renameButtons[1]).toBeDisabled();
    expect(renameButtons[2]).not.toBeDisabled();

    const checkboxes = screen.getAllByRole("checkbox") as HTMLInputElement[];
    expect(checkboxes[0]).toBeDisabled();
    expect(checkboxes[1]).toBeDisabled();
    expect(checkboxes[2]).not.toBeDisabled();
  });
});
