import { fireEvent, render, screen } from "@testing-library/svelte";
import ProjectInfoPanel from "./ProjectInfoPanel.svelte";

describe("ProjectInfoPanel", () => {
  it("dispatches toolbar actions and renders workflow status", async () => {
    const draft = {
      meta: {
        name: "Menu",
        template: "focus-rows",
        locales: ["es", "en"],
        defaultLocale: "es",
        currency: "USD",
        currencyPosition: "left",
        fontSource: ""
      }
    } as any;

    const actions = {
      createNewProject: vi.fn(),
      openProjectDialog: vi.fn(),
      saveProject: vi.fn(),
      exportStaticSite: vi.fn(),
      toggleLanguage: vi.fn(),
      handleCurrencyChange: vi.fn(),
      toggleCurrencyPosition: vi.fn(),
      handleFontSelect: vi.fn(),
      handleCustomFontSourceInput: vi.fn()
    };

    render(ProjectInfoPanel, {
      props: {
        model: {
          t: (key: string) => key,
          draft,
          uiLang: "es",
          templateOptions: [{ id: "focus-rows", label: { es: "Focus", en: "Focus" } }],
          workflowMode: "save",
          openError: "",
          exportStatus: "done",
          exportError: "",
          workflowStep: "saving",
          workflowProgress: 42,
          fontChoice: "Fraunces",
          fontAssetOptions: []
        },
        actions
      }
    });

    await fireEvent.click(screen.getByRole("button", { name: "newProject" }));
    await fireEvent.click(screen.getByRole("button", { name: "open" }));
    await fireEvent.click(screen.getByRole("button", { name: "save" }));
    await fireEvent.click(screen.getByRole("button", { name: "export" }));

    expect(actions.createNewProject).toHaveBeenCalledTimes(1);
    expect(actions.openProjectDialog).toHaveBeenCalledTimes(1);
    expect(actions.saveProject).toHaveBeenCalledTimes(1);
    expect(actions.exportStaticSite).toHaveBeenCalledTimes(1);
    expect(screen.getByText("saving")).toBeInTheDocument();
    expect(screen.getByText("42.0%")).toBeInTheDocument();
  });
});
