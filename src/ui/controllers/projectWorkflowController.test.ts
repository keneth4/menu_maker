import { describe, expect, it, vi } from "vitest";
import {
  createProjectWorkflowController,
  type ProjectWorkflowState
} from "./projectWorkflowController";
import type { MenuProject } from "../../lib/types";

const makeProject = (slug = "demo"): MenuProject => ({
  meta: {
    slug,
    name: "Demo",
    restaurantName: { es: "Demo", en: "Demo" },
    title: { es: "Titulo", en: "Title" },
    identityMode: "text",
    logoSrc: "",
    fontFamily: "Fraunces",
    fontSource: "",
    fontRoles: {},
    template: "focus-rows",
    locales: ["es", "en"],
    defaultLocale: "es",
    currency: "MXN",
    currencyPosition: "left",
    backgroundCarouselSeconds: 9,
    backgroundDisplayMode: "carousel"
  },
  backgrounds: [
    {
      id: "bg-1",
      label: "BG 1",
      src: `/projects/${slug}/assets/originals/backgrounds/bg.jpg`,
      type: "image"
    }
  ],
  categories: [
    {
      id: "cat-1",
      name: { es: "Entradas", en: "Starters" },
      backgroundId: "bg-1",
      items: [
        {
          id: "dish-1",
          name: { es: "Taco", en: "Taco" },
          description: { es: "Desc", en: "Desc" },
          longDescription: { es: "Long", en: "Long" },
          priceVisible: true,
          price: { amount: 10, currency: "MXN" },
          allergens: [],
          vegan: false,
          media: {
            hero360: `/projects/${slug}/assets/originals/items/hero.jpg`,
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
});

const cloneProject = (value: MenuProject): MenuProject => JSON.parse(JSON.stringify(value));

const createState = (): ProjectWorkflowState => ({
  project: null,
  draft: null,
  rootFiles: [],
  projects: [],
  activeSlug: "nuevo-proyecto",
  locale: "es",
  uiLang: "es",
  editLang: "es",
  editPanel: "identity",
  wizardLang: "es",
  wizardCategoryId: "",
  wizardItemId: "",
  wizardStep: 0,
  wizardDemoPreview: false,
  wizardShowcaseProject: null,
  lastSaveName: "",
  needsAssets: false,
  openError: "",
  exportError: "",
  exportStatus: "",
  workflowMode: null,
  assetMode: "none",
  editorTab: "info",
  editorOpen: false,
  showLanding: true
});

const createHarness = (
  stateOverrides: Partial<ProjectWorkflowState> = {},
  overrides: Partial<Parameters<typeof createProjectWorkflowController>[0]> = {}
) => {
  let state: ProjectWorkflowState = {
    ...createState(),
    ...stateOverrides
  };
  const setState = vi.fn((next: Partial<ProjectWorkflowState>) => {
    state = { ...state, ...next };
  });
  const initCarouselIndices = vi.fn();
  const applyTemplate = vi.fn(async () => {});
  const syncWizardShowcaseVisibility = vi.fn();
  const refreshBridgeEntries = vi.fn(async () => {});
  const prepareProjectDerivedAssets = vi.fn(async (_slug: string, project: MenuProject) => project);

  const deps = {
    t: (key: string) => key,
    getState: () => state,
    setState,
    bridgeClient: {
      request: vi.fn(async () => {}),
      prepareProjectDerivedAssets
    },
    getProjectSlug: () => state.draft?.meta.slug || state.activeSlug || "nuevo-proyecto",
    refreshBridgeEntries,
    initCarouselIndices,
    cloneProject,
    createEmptyProject: () => makeProject("nuevo-proyecto"),
    applyTemplate,
    syncWizardShowcaseVisibility,
    normalizePath: (value: string) => value,
    readAssetBytes: vi.fn(async () => null),
    buildExportStyles: () => "",
    buildRuntimeScript: () => "",
    getCarouselImageSource: () => "",
    mapLegacyAssetRelativeToManaged: (value: string) => value,
    isManagedAssetRelativePath: () => true,
    slugifyName: (value: string) => value,
    normalizeZipName: (value: string) => value,
    getSuggestedZipName: () => "menu.zip",
    prompt: vi.fn(() => null),
    startWorkflow: vi.fn(),
    updateWorkflow: vi.fn(),
    pulseWorkflow: vi.fn(),
    clearWorkflowPulse: vi.fn(),
    updateWorkflowAssetStep: vi.fn(),
    finishWorkflow: vi.fn(),
    failWorkflow: vi.fn(),
    onOpenProjectDialog: vi.fn(),
    onPromptAssetUpload: vi.fn(async () => {}),
    ...overrides
  };

  const controller = createProjectWorkflowController(deps as Parameters<typeof createProjectWorkflowController>[0]);
  return {
    controller,
    deps,
    getState: () => state,
    setState,
    initCarouselIndices,
    applyTemplate,
    syncWizardShowcaseVisibility,
    refreshBridgeEntries,
    prepareProjectDerivedAssets
  };
};

describe("projectWorkflowController", () => {
  it("deduplicates concurrent bridge derive requests by slug and signature", async () => {
    const source = makeProject("demo");
    const resolved = makeProject("demo");
    const prepareProjectDerivedAssets = vi.fn(async () => resolved);
    const { controller } = createHarness(
      {
        project: source,
        draft: cloneProject(source),
        activeSlug: "demo",
        assetMode: "bridge"
      },
      {
        bridgeClient: {
          request: vi.fn(async () => {}),
          prepareProjectDerivedAssets
        }
      }
    );

    const first = controller.queueBridgeDerivedPreparation("demo", cloneProject(source), {
      applyIfUnchanged: false
    });
    const second = controller.queueBridgeDerivedPreparation("demo", cloneProject(source), {
      applyIfUnchanged: false
    });
    const [a, b] = await Promise.all([first, second]);

    expect(prepareProjectDerivedAssets).toHaveBeenCalledTimes(1);
    expect(a.meta.slug).toBe("demo");
    expect(b.meta.slug).toBe("demo");
  });

  it("applies loaded project and updates existing summary", async () => {
    const loaded = makeProject("importado");
    const { controller, getState, initCarouselIndices } = createHarness({
      projects: [
        {
          slug: "importado",
          name: "Old",
          template: "focus-rows",
          cover: ""
        }
      ],
      showLanding: true
    });

    await controller.applyLoadedProject(loaded, "importado.zip");

    const state = getState();
    expect(state.project?.meta.slug).toBe("importado");
    expect(state.draft?.meta.slug).toBe("importado");
    expect(state.lastSaveName).toBe("importado.zip");
    expect(state.showLanding).toBe(false);
    expect(state.projects).toHaveLength(1);
    expect(state.projects[0].name).toBe("Demo");
    expect(initCarouselIndices).toHaveBeenCalledTimes(1);
  });

  it("creates wizard project with seeded background and template sync", async () => {
    const { controller, getState, applyTemplate } = createHarness({
      uiLang: "en"
    });

    await controller.createNewProject({ forWizard: true });

    const state = getState();
    expect(state.project?.meta.name).toBe("New project");
    expect(state.project?.meta.slug).toBe("new-project");
    expect(state.wizardStep).toBe(0);
    expect(state.draft?.backgrounds.length).toBe(1);
    expect(applyTemplate).toHaveBeenCalledTimes(1);
  });

  it("starts wizard with showcase visibility sync after tab switch", async () => {
    const { controller, getState, syncWizardShowcaseVisibility } = createHarness({
      uiLang: "es"
    });

    await controller.startWizard();

    const state = getState();
    expect(state.editorTab).toBe("wizard");
    expect(state.editorOpen).toBe(true);
    expect(state.showLanding).toBe(false);
    expect(syncWizardShowcaseVisibility).toHaveBeenCalledTimes(1);
  });
});
