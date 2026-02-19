import { fireEvent, render, screen } from "@testing-library/svelte";
import EditorShell from "./EditorShell.svelte";

describe("EditorShell", () => {
  it("renders close and language controls in the top-right chrome area", async () => {
    const setUiLang = vi.fn();
    const toggleEditor = vi.fn();

    const { container } = render(EditorShell, {
      props: {
        t: (key: string) => key,
        editorVisible: true,
        editorPresentation: "desktop-card",
        uiLang: "es",
        editorTab: "info",
        setUiLang,
        setEditorTab: vi.fn(),
        toggleEditor
      }
    });

    const header = container.querySelector(".editor-panel__header");
    const chrome = container.querySelector(".editor-chrome");
    const actions = chrome?.querySelector(".editor-actions");
    const langToggle = chrome?.querySelector(".lang-toggle");
    const closeButton = screen.getByRole("button", { name: "closeEditor" });

    expect(header).not.toBeNull();
    expect(chrome).not.toBeNull();
    expect(actions).not.toBeNull();
    expect(langToggle).not.toBeNull();
    expect(closeButton).toHaveClass("editor-close");

    await fireEvent.click(screen.getByRole("button", { name: "EN" }));
    await fireEvent.click(closeButton);

    expect(setUiLang).toHaveBeenCalledWith("en");
    expect(toggleEditor).toHaveBeenCalledTimes(1);
  });
});
