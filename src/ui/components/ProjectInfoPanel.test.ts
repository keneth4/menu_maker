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
      setTemplate: vi.fn(),
      toggleLanguage: vi.fn(),
      handleCurrencyChange: vi.fn(),
      toggleCurrencyPosition: vi.fn(),
      handleFontSelect: vi.fn(),
      handleCustomFontSourceInput: vi.fn(),
      setItemScrollSensitivity: vi.fn(),
      setSectionScrollSensitivity: vi.fn()
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
          fontAssetOptions: [],
          scrollSensitivity: {
            item: 5,
            section: 5
          }
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

  it("dispatches sensitivity slider changes", async () => {
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
      setTemplate: vi.fn(),
      toggleLanguage: vi.fn(),
      handleCurrencyChange: vi.fn(),
      toggleCurrencyPosition: vi.fn(),
      handleFontSelect: vi.fn(),
      handleCustomFontSourceInput: vi.fn(),
      setItemScrollSensitivity: vi.fn(),
      setSectionScrollSensitivity: vi.fn()
    };

    const { container } = render(ProjectInfoPanel, {
      props: {
        model: {
          t: (key: string) => key,
          draft,
          uiLang: "en",
          templateOptions: [{ id: "focus-rows", label: { es: "Focus", en: "Focus" } }],
          workflowMode: null,
          openError: "",
          exportStatus: "",
          exportError: "",
          workflowStep: "",
          workflowProgress: 0,
          fontChoice: "Fraunces",
          fontAssetOptions: [],
          scrollSensitivity: {
            item: 5,
            section: 5
          }
        },
        actions
      }
    });

    const sliders = container.querySelectorAll<HTMLInputElement>('input[type="range"]');
    expect(sliders).toHaveLength(2);
    sliders[0].value = "7";
    await fireEvent.input(sliders[0]);
    sliders[1].value = "3";
    await fireEvent.input(sliders[1]);

    expect(actions.setItemScrollSensitivity).toHaveBeenCalledWith(7);
    expect(actions.setSectionScrollSensitivity).toHaveBeenCalledWith(3);
  });
});
