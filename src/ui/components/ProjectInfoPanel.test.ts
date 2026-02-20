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
      setDefaultLocale: vi.fn(),
      handleCurrencyChange: vi.fn(),
      toggleCurrencyPosition: vi.fn(),
      setItemScrollSensitivity: vi.fn(),
      setSectionScrollSensitivity: vi.fn()
    };

    const { container } = render(ProjectInfoPanel, {
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
      setDefaultLocale: vi.fn(),
      handleCurrencyChange: vi.fn(),
      toggleCurrencyPosition: vi.fn(),
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

  it("renders explicit empty-language state when locales are not selected", async () => {
    const draft = {
      meta: {
        name: "Menu",
        template: "focus-rows",
        locales: [],
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
      setDefaultLocale: vi.fn(),
      handleCurrencyChange: vi.fn(),
      toggleCurrencyPosition: vi.fn(),
      setItemScrollSensitivity: vi.fn(),
      setSectionScrollSensitivity: vi.fn()
    };

    render(ProjectInfoPanel, {
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
          scrollSensitivity: {
            item: 5,
            section: 5
          }
        },
        actions
      }
    });

    expect(screen.getByText("languagesNoneSelected")).toBeInTheDocument();
    expect(screen.queryByText("languageRequiredHint")).not.toBeInTheDocument();
    expect(screen.queryByText("font")).not.toBeInTheDocument();
    const defaultLangLabel = screen.getByText("defaultLang").closest("label");
    const defaultSelect = defaultLangLabel?.querySelector("select");
    expect(defaultSelect).not.toBeNull();
    const defaultOptions = Array.from(defaultSelect?.querySelectorAll("option") ?? []).map(
      (option) => option.textContent
    );
    expect(defaultOptions).toEqual(["EN"]);
    expect(defaultSelect).toHaveValue("en");
    const currencyPositionButton = screen.getByRole("button", { name: "currencyLeft" });
    expect(currencyPositionButton).toBeInTheDocument();
    await fireEvent.click(currencyPositionButton);
    expect(actions.toggleCurrencyPosition).toHaveBeenCalledTimes(1);
  });

  it("limits default language options to selected locales", async () => {
    const draft = {
      meta: {
        name: "Menu",
        template: "focus-rows",
        locales: ["fr", "pt"],
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
      setDefaultLocale: vi.fn(),
      handleCurrencyChange: vi.fn(),
      toggleCurrencyPosition: vi.fn(),
      setItemScrollSensitivity: vi.fn(),
      setSectionScrollSensitivity: vi.fn()
    };

    render(ProjectInfoPanel, {
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
          scrollSensitivity: {
            item: 5,
            section: 5
          }
        },
        actions
      }
    });

    const defaultLangLabel = screen.getByText("defaultLang").closest("label");
    const defaultSelect = defaultLangLabel?.querySelector("select");
    expect(defaultSelect).not.toBeNull();
    const defaultOptions = Array.from(defaultSelect?.querySelectorAll("option") ?? []).map(
      (option) => option.textContent
    );
    expect(defaultOptions).toEqual(["FR", "PT"]);
    expect(defaultSelect).toHaveValue("fr");
  });

  it("auto-syncs invalid default locale to the first available selected locale", () => {
    const draft = {
      meta: {
        name: "Menu",
        template: "focus-rows",
        locales: ["fr", "pt"],
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
      setDefaultLocale: vi.fn(),
      handleCurrencyChange: vi.fn(),
      toggleCurrencyPosition: vi.fn(),
      setItemScrollSensitivity: vi.fn(),
      setSectionScrollSensitivity: vi.fn()
    };

    render(ProjectInfoPanel, {
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
          scrollSensitivity: {
            item: 5,
            section: 5
          }
        },
        actions
      }
    });

    expect(actions.setDefaultLocale).toHaveBeenCalledWith("fr");
  });

  it("normalizes selected locales for default language options", () => {
    const draft = {
      meta: {
        name: "Menu",
        template: "focus-rows",
        locales: ["EN", " Fr ", "EN"],
        defaultLocale: "ES",
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
      setDefaultLocale: vi.fn(),
      handleCurrencyChange: vi.fn(),
      toggleCurrencyPosition: vi.fn(),
      setItemScrollSensitivity: vi.fn(),
      setSectionScrollSensitivity: vi.fn()
    };

    render(ProjectInfoPanel, {
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
          scrollSensitivity: {
            item: 5,
            section: 5
          }
        },
        actions
      }
    });

    const defaultLangLabel = screen.getByText("defaultLang").closest("label");
    const defaultSelect = defaultLangLabel?.querySelector("select");
    expect(defaultSelect).not.toBeNull();
    const defaultOptions = Array.from(defaultSelect?.querySelectorAll("option") ?? []).map(
      (option) => option.textContent
    );
    expect(defaultOptions).toEqual(["EN", "FR"]);
    expect(defaultSelect).toHaveValue("en");
  });

  it("calls setDefaultLocale explicitly when default language changes", async () => {
    const draft = {
      meta: {
        name: "Menu",
        template: "focus-rows",
        locales: ["fr", "pt"],
        defaultLocale: "fr",
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
      setDefaultLocale: vi.fn(),
      handleCurrencyChange: vi.fn(),
      toggleCurrencyPosition: vi.fn(),
      setItemScrollSensitivity: vi.fn(),
      setSectionScrollSensitivity: vi.fn()
    };

    render(ProjectInfoPanel, {
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
          scrollSensitivity: {
            item: 5,
            section: 5
          }
        },
        actions
      }
    });

    const defaultLangLabel = screen.getByText("defaultLang").closest("label");
    const defaultSelect = defaultLangLabel?.querySelector("select");
    expect(defaultSelect).not.toBeNull();
    await fireEvent.change(defaultSelect!, { target: { value: "pt" } });
    expect(actions.setDefaultLocale).toHaveBeenCalledWith("pt");
  });

  it("updates default language options when selected locales change", async () => {
    const draft = {
      meta: {
        name: "Menu",
        template: "focus-rows",
        locales: [],
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
      setDefaultLocale: vi.fn(),
      handleCurrencyChange: vi.fn(),
      toggleCurrencyPosition: vi.fn(),
      setItemScrollSensitivity: vi.fn(),
      setSectionScrollSensitivity: vi.fn()
    };

    const model = {
      t: (key: string) => key,
      draft,
      uiLang: "es" as const,
      templateOptions: [{ id: "focus-rows", label: { es: "Focus", en: "Focus" } }],
      workflowMode: null,
      openError: "",
      exportStatus: "",
      exportError: "",
      workflowStep: "",
      workflowProgress: 0,
      scrollSensitivity: {
        item: 5,
        section: 5
      }
    };

    const view = render(ProjectInfoPanel, {
      props: {
        model,
        actions
      }
    });

    const defaultLangLabel = screen.getByText("defaultLang").closest("label");
    const defaultSelect = defaultLangLabel?.querySelector("select");
    expect(defaultSelect).not.toBeNull();
    expect(Array.from(defaultSelect?.querySelectorAll("option") ?? []).map((option) => option.textContent)).toEqual([
      "ES"
    ]);

    draft.meta.locales = ["fr", "pt"];
    await view.component.$set({
      model: {
        ...model
      }
    });

    const refreshedLabel = screen.getByText("defaultLang").closest("label");
    const refreshedSelect = refreshedLabel?.querySelector("select");
    expect(Array.from(refreshedSelect?.querySelectorAll("option") ?? []).map((option) => option.textContent)).toEqual([
      "FR",
      "PT"
    ]);
  });
});
