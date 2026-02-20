import { buildExportSiteWorkflow } from "../../application/export/exportSiteWorkflow";
import { buildProjectZipEntries } from "../../application/export/projectZip";
import {
  findMenuJsonEntry,
  getZipAssetEntries,
  getZipFolderName
} from "../../application/projects/importZip";
import { applyImportedPaths as applyImportedPathsWorkflow } from "../../application/projects/importWorkflow";
import {
  createResponsiveImageVariants,
  fromBase64,
  getMimeType,
  isResponsiveImageMime,
  toBase64
} from "../../application/assets/mediaWorkflow";
import {
  mapLegacyAssetRelativeToManaged as mapLegacyAssetRelativeToManagedWorkflow,
  toAssetRelativeForUi as toAssetRelativeForUiWorkflow
} from "../../application/assets/workspaceWorkflow";
import { mapProjectAssetPaths } from "../../core/menu/assetPathMapping";
import { normalizeProject } from "../../core/menu/normalization";
import type { BridgeAssetClient } from "../../infrastructure/bridge/client";
import { createZipBlob, readZip } from "../../lib/zip";
import type { MenuItem, MenuProject } from "../../lib/types";
import type { ProjectSummary } from "../../lib/loadProjects";
import type { UiKey } from "../config/uiCopy";

const FAVICON_ICO_BASE64 =
  "AAABAAIAEBAAAAAAIACGAgAAJgAAACAgAAAAACAAGwEAAKwCAACJUE5HDQoaCgAAAA1JSERSAAAAEAAAABAIBgAAAB/z/2EAAAJNSURBVHicpZM9aFRBFIW/O++92eRtyA9BYwr/sNAIsVJUDFgHxRQqmDbYiJtWUBBiBBXbpE4nCqIQFHshoJIyEMUmEhuDiu66+9x982auxZoYAyLiaYZ7OXPuHeYcsemgsgVxDEUBrmjXSfyrtxVmcyHSPrOaUnjY3kfY3kcofLu3mbMxbEPJgHOQJDB90daODBk3vMcUAEvvQrz4OiS3HrjudU4IP4fadFBF2usZ4Ont0uedO8Rfmc27X7wOFuD4kMnvVmzt/QeNTl9t9Yefz1QFKaWDqkAaE+5Plb48fO475+ZdioDtFIyBZkNBYWIsyc6fjL6PT7X6sgIjgIkjyDOlcjZp7B0QPzfv0lJZKHcLeROadaWzLHR0CXPzLt07IL5yNmnkmRJHYJyHcoqODJt8cjbvMbEQR9CoKqPHIm5eKhECBA9RIkzO5D0jwyYvp6jzEDsPvT2iB3eJX3wTbGThe6aMnoh5fLuDjn7h0G5hfLqFj2DxbbAHd4kvd4l+rCKGLTACoYCRYUNHv5CvKaeOxqSpEDwIv/+jSSJo1FWWVzU6csDkRQ5pl3DnnmP+SUHTwJnrTarflAg4vF/y5VWNGnWVJFoXyJCFpWBnKrbqnRKAZgHnbzTZdy7j2SuPSaBwykzFVheWgm1ktAUKDzYVZh+58sqaRhNjSdasK64FQeFTTSFAq65MjCXZyppGs49c2aZC4f9ipJdv1AIcG5L87uU/GGk9TJutfO1C8m9W3hwm1baxTEnY1ksA+PgVE1qKTWWDs3Hnf+P8AxXTLWCAumbQAAAAAElFTkSuQmCCiVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAA4klEQVR4nO1WQQ7DIAxLp2qH8YK+qe/tm/oCzttpE9ri4KQg1mk+tRXYBkya6Xpb7jIQl5HifwMiInNkUt7Srn1Pa168XBMbQiSKwJqhDLyLI3J2nMtAScquyjPHNPAkipwtOx/egqPi5VwrP6oBb+AYIE6zDhxZPcsxvBB9hNBz9nlLr+e05tpYlTe8A6W49s4iZACJRUwMz8A5DaDA1YJIGWCqlyZmiVs3K9QPMKIszCNoUZJrHKqBFiWY5YQ7wGbBAlNVv7sh0Qgt0i4tGSKvoWlTyprp2pb3wjn/BT9l4AFrDIU9CgVSeAAAAABJRU5ErkJggg==";

type WorkflowMode = "save" | "export" | "upload";

export type ProjectWorkflowState = {
  project: MenuProject | null;
  draft: MenuProject | null;
  rootFiles: string[];
  projects: ProjectSummary[];
  activeSlug: string;
  locale: string;
  uiLang: "es" | "en";
  editLang: string;
  editPanel: "identity" | "background" | "section" | "dish";
  wizardLang: string;
  wizardCategoryId: string;
  wizardItemId: string;
  wizardStep: number;
  wizardDemoPreview: boolean;
  wizardShowcaseProject: MenuProject | null;
  lastSaveName: string;
  needsAssets: boolean;
  openError: string;
  exportError: string;
  exportStatus: string;
  workflowMode: WorkflowMode | null;
  assetMode: "filesystem" | "bridge" | "none";
  editorTab: "info" | "assets" | "edit" | "wizard";
  editorOpen: boolean;
  showLanding: boolean;
};

type ProjectWorkflowControllerDeps = {
  t: (key: UiKey) => string;
  getState: () => ProjectWorkflowState;
  setState: (next: Partial<ProjectWorkflowState>) => void;
  bridgeClient: Pick<BridgeAssetClient, "request" | "prepareProjectDerivedAssets">;
  getProjectSlug: () => string;
  refreshBridgeEntries: () => Promise<void>;
  initCarouselIndices: (value: MenuProject) => void;
  cloneProject: (value: MenuProject) => MenuProject;
  createEmptyProject: () => MenuProject;
  applyTemplate: (templateId: string, options?: { source?: "wizard" | "project" }) => Promise<void>;
  syncWizardShowcaseVisibility: () => void;
  normalizePath: (value: string) => string;
  readAssetBytes: (slug: string, sourcePath: string) => Promise<Uint8Array | null>;
  buildExportStyles: () => string;
  buildRuntimeScript: (project: MenuProject) => string;
  getCarouselImageSource: (item: MenuItem) => string;
  mapLegacyAssetRelativeToManaged: (value: string) => string;
  isManagedAssetRelativePath: (value: string) => boolean;
  slugifyName: (value: string) => string;
  normalizeZipName: (value: string) => string;
  getSuggestedZipName: () => string;
  prompt: (message: string, defaultValue?: string) => string | null;
  startWorkflow: (mode: WorkflowMode, stepKey: UiKey, percent?: number) => void;
  updateWorkflow: (stepKey: UiKey, percent: number) => void;
  pulseWorkflow: (
    targetPercent: number,
    stepKey: UiKey,
    options?: { cadenceMs?: number; tickIncrement?: number }
  ) => void;
  clearWorkflowPulse: () => void;
  updateWorkflowAssetStep: (
    mode: WorkflowMode,
    current: number,
    total: number,
    startPercent: number,
    endPercent: number
  ) => void;
  finishWorkflow: (stepKey: UiKey) => void;
  failWorkflow: () => void;
  onOpenProjectDialog: () => void;
  onPromptAssetUpload: () => Promise<void>;
};

export type ProjectWorkflowController = {
  queueBridgeDerivedPreparation: (
    slug: string,
    sourceProject: MenuProject,
    options: { applyIfUnchanged: boolean }
  ) => Promise<MenuProject>;
  saveProject: () => Promise<void>;
  exportStaticSite: () => Promise<void>;
  applyLoadedProject: (data: MenuProject, sourceName?: string) => Promise<void>;
  createNewProject: (options?: { forWizard?: boolean }) => Promise<void>;
  startCreateProject: () => Promise<void>;
  startWizard: () => Promise<void>;
  startOpenProject: () => void;
  openProjectDialog: () => void;
  handleProjectFile: (event: Event) => Promise<void>;
};

const buildDeriveSignature = (value: MenuProject) => {
  const normalize = (path?: string) => String(path || "").trim();
  const backgrounds = value.backgrounds.map((bg) => [
    normalize(bg.src),
    normalize(bg.originalSrc),
    normalize(bg.derived?.profileId)
  ]);
  const items = value.categories.flatMap((category) =>
    category.items.map((item) => [
      normalize(item.media.hero360),
      normalize(item.media.originalHero360),
      normalize(item.media.derived?.profileId)
    ])
  );
  return JSON.stringify({ backgrounds, items });
};

const updateAssetPathsForSlug = (draft: MenuProject, fromSlug: string, toSlug: string) => {
  if (!fromSlug || !toSlug || fromSlug === toSlug) return draft;
  const fromPrefix = `/projects/${fromSlug}/assets/`;
  const toPrefix = `/projects/${toSlug}/assets/`;
  const updatePath = (value: string) =>
    value.startsWith(fromPrefix) ? `${toPrefix}${value.slice(fromPrefix.length)}` : value;
  return mapProjectAssetPaths(draft, updatePath);
};

const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
};

const applyImportedPaths = (
  data: MenuProject,
  slug: string,
  mapLegacyAssetRelativeToManaged: (value: string) => string
) => applyImportedPathsWorkflow(data, slug, mapLegacyAssetRelativeToManaged);

type ImportedZipAsset = {
  sourcePath: string;
  dataUrl: string;
};

const buildImportedZipAssets = (
  entries: ReturnType<typeof getZipAssetEntries>,
  slug: string,
  mapLegacyAssetRelativeToManaged: (value: string) => string
): ImportedZipAsset[] => {
  const bySourcePath = new Map<string, ImportedZipAsset>();
  entries.forEach((assetEntry) => {
    const mappedRelative = mapLegacyAssetRelativeToManaged(assetEntry.relative);
    if (!mappedRelative) return;
    const normalizedRelative = mappedRelative.replace(/^\/+/, "");
    const sourcePath = `/projects/${slug}/assets/${normalizedRelative}`;
    const mime = getMimeType(assetEntry.name || normalizedRelative);
    bySourcePath.set(sourcePath, {
      sourcePath,
      dataUrl: `data:${mime};base64,${toBase64(assetEntry.entry.data)}`
    });
  });
  return Array.from(bySourcePath.values());
};

const hydrateImportedProjectAssetSources = (
  project: MenuProject,
  importedAssets: ImportedZipAsset[]
) => {
  if (importedAssets.length === 0) return project;
  const sourceMap = new Map(importedAssets.map((entry) => [entry.sourcePath, entry.dataUrl]));
  const hydratePath = (value: string) => {
    const normalized = value.startsWith("/") ? value : `/${value.replace(/^\/+/, "")}`;
    return sourceMap.get(normalized) ?? value;
  };
  const hydrated = mapProjectAssetPaths(project, hydratePath);
  const resolveImportedSourcePath = (value: string | undefined) => {
    if (!value) return "";
    const normalized = value.startsWith("/") ? value : `/${value.replace(/^\/+/, "")}`;
    return sourceMap.has(normalized) ? normalized : "";
  };
  return {
    ...hydrated,
    backgrounds: hydrated.backgrounds.map((background, index) => {
      const original = project.backgrounds[index];
      const canonicalSourcePath =
        resolveImportedSourcePath(original?.originalSrc) || resolveImportedSourcePath(original?.src);
      if (!canonicalSourcePath) {
        return background;
      }
      return {
        ...background,
        originalSrc: canonicalSourcePath
      };
    })
  };
};

export const createProjectWorkflowController = (
  deps: ProjectWorkflowControllerDeps
): ProjectWorkflowController => {
  let bridgeDeriveTask: Promise<MenuProject> | null = null;
  let bridgeDeriveTaskSlug = "";
  let bridgeDeriveTaskSignature = "";

  const normalizeUiLocale = (value: string): "es" | "en" => (value === "en" ? "en" : "es");
  const normalizeLocaleCode = (value: string) => value.trim().toLowerCase();
  const LOGO_ASSET_ROOT = "originals/logos";
  const sanitizeLogoSource = (value: string | undefined) => {
    const trimmed = (value ?? "").trim();
    if (!trimmed) return "";
    const normalized = mapLegacyAssetRelativeToManagedWorkflow(toAssetRelativeForUiWorkflow(trimmed));
    const valid =
      normalized === LOGO_ASSET_ROOT || normalized.startsWith(`${LOGO_ASSET_ROOT}/`);
    return valid ? trimmed : "";
  };

  const ensureWorkflowLocales = (
    project: MenuProject,
    uiLang: "es" | "en"
  ): "es" | "en" | null => {
    const locales = Array.from(
      new Set(
        (project.meta.locales ?? [])
          .map((locale) => normalizeLocaleCode(locale))
          .filter((locale) => locale.length > 0)
      )
    );
    if (locales.length > 0) {
      project.meta.locales = locales;
      const normalizedDefault = normalizeLocaleCode(project.meta.defaultLocale ?? "");
      if (!normalizedDefault || !locales.includes(normalizedDefault)) {
        project.meta.defaultLocale = locales[0];
      } else {
        project.meta.defaultLocale = normalizedDefault;
      }
      return null;
    }
    const fallback = normalizeUiLocale(uiLang);
    project.meta.locales = [fallback];
    project.meta.defaultLocale = fallback;
    return fallback;
  };

  const bridgeRequest = async (
    endpoint: string,
    payload?: Record<string, unknown>,
    overrideSlug?: string
  ) => {
    const slug = overrideSlug ?? deps.getProjectSlug();
    await deps.bridgeClient.request(endpoint, slug, payload);
  };

  const queueBridgeDerivedPreparation = async (
    slug: string,
    sourceProject: MenuProject,
    options: { applyIfUnchanged: boolean }
  ) => {
    const signature = buildDeriveSignature(sourceProject);
    if (
      bridgeDeriveTask &&
      bridgeDeriveTaskSlug === slug &&
      bridgeDeriveTaskSignature === signature
    ) {
      return await bridgeDeriveTask;
    }

    const startedSignature = signature;
    bridgeDeriveTaskSlug = slug;
    bridgeDeriveTaskSignature = signature;

    const task = deps.bridgeClient
      .prepareProjectDerivedAssets(slug, sourceProject)
      .then((prepared) => normalizeProject(prepared))
      .then((prepared) => {
        const state = deps.getState();
        if (options.applyIfUnchanged && state.draft) {
          const currentSlug = state.draft.meta.slug || state.activeSlug || "nuevo-proyecto";
          if (currentSlug === slug && buildDeriveSignature(state.draft) === startedSignature) {
            deps.setState({
              draft: prepared,
              project: prepared
            });
          }
        }
        return prepared;
      })
      .finally(() => {
        if (bridgeDeriveTask === task) {
          bridgeDeriveTask = null;
          bridgeDeriveTaskSlug = "";
          bridgeDeriveTaskSignature = "";
        }
      });

    bridgeDeriveTask = task;
    return await task;
  };

  const saveProject = async () => {
    const state = deps.getState();
    if (!state.draft || state.workflowMode) return;
    const ensuredLocale = ensureWorkflowLocales(state.draft, state.uiLang);
    if (ensuredLocale) {
      deps.setState({
        draft: state.draft,
        locale: ensuredLocale,
        editLang: ensuredLocale,
        wizardLang: ensuredLocale
      });
    }
    const suggested = deps.getSuggestedZipName();
    const response = deps.prompt(deps.t("promptSaveName"), suggested);
    if (!response) return;
    deps.setState({
      openError: "",
      exportError: "",
      exportStatus: ""
    });

    const fileName = deps.normalizeZipName(response) || suggested;
    deps.setState({ lastSaveName: fileName });
    const base = fileName.replace(/\.zip$/i, "");
    const nextSlug = deps.slugifyName(base) || state.draft.meta.slug || "menu";
    const previousSlug = deps.getProjectSlug();

    deps.startWorkflow("save", "progressSaveStart", 4);

    let draft = deps.getState().draft;
    if (!draft) return;
    if (previousSlug && nextSlug && previousSlug !== nextSlug) {
      if (deps.getState().assetMode === "bridge") {
        try {
          await bridgeRequest("rename-project", { from: previousSlug, to: nextSlug });
        } catch (error) {
          console.warn("Unable to rename project folder", error);
        }
      }
      draft = updateAssetPathsForSlug(draft, previousSlug, nextSlug);
      draft.meta.slug = nextSlug;
      deps.setState({ draft, activeSlug: nextSlug });
    } else if (!draft.meta.slug) {
      draft.meta.slug = nextSlug;
      deps.setState({ draft, activeSlug: nextSlug });
    }

    let projectToPersist = draft;
    if (deps.getState().assetMode === "bridge") {
      deps.pulseWorkflow(92, "progressSaveDerive", { tickIncrement: 0.06 });
      try {
        projectToPersist = await queueBridgeDerivedPreparation(
          draft.meta.slug || nextSlug,
          projectToPersist,
          { applyIfUnchanged: false }
        );
        deps.setState({ draft: projectToPersist });
      } catch (error) {
        deps.failWorkflow();
        deps.setState({
          openError: error instanceof Error ? error.message : deps.t("errOpenProject")
        });
        return;
      } finally {
        deps.clearWorkflowPulse();
      }
    }

    if (deps.getState().assetMode === "bridge") {
      deps.pulseWorkflow(92, "progressSaveSync", { tickIncrement: 0.12 });
      try {
        const slug = projectToPersist.meta.slug || nextSlug;
        await bridgeRequest("save-project", {
          slug,
          name: projectToPersist.meta.name,
          template: projectToPersist.meta.template,
          cover: projectToPersist.backgrounds?.[0]?.src ?? "",
          project: projectToPersist
        });

        const currentProjects = deps.getState().projects;
        const existingIndex = currentProjects.findIndex(
          (item) => item.slug === slug || item.slug === previousSlug
        );
        const summary = {
          slug,
          name: projectToPersist.meta.name,
          template: projectToPersist.meta.template,
          cover: projectToPersist.backgrounds?.[0]?.src
        };
        const projects =
          existingIndex >= 0
            ? [
                ...currentProjects.slice(0, existingIndex),
                summary,
                ...currentProjects.slice(existingIndex + 1)
              ]
            : [...currentProjects, summary];
        deps.setState({ projects });
        await deps.refreshBridgeEntries();
      } catch (error) {
        deps.failWorkflow();
        deps.setState({
          openError: error instanceof Error ? error.message : deps.t("errOpenProject")
        });
        return;
      } finally {
        deps.clearWorkflowPulse();
      }
    }

    try {
      deps.pulseWorkflow(96, "progressSaveZip", { tickIncrement: 0.16 });
      const zipEntries = await buildProjectZipEntries({
        project: projectToPersist,
        slug: projectToPersist.meta.slug || nextSlug,
        normalizePath: deps.normalizePath,
        readAssetBytes: deps.readAssetBytes,
        onMissingAsset: (sourcePath, error) => {
          console.warn("Missing asset", sourcePath, error);
        }
      });
      deps.clearWorkflowPulse();
      if (zipEntries.length === 0) {
        deps.failWorkflow();
        deps.setState({ openError: deps.t("errOpenProject") });
        return;
      }
      deps.updateWorkflow("progressSaveDownload", 95);
      downloadBlob(createZipBlob(zipEntries), fileName);
      deps.finishWorkflow("progressSaveDone");
    } catch (error) {
      deps.failWorkflow();
      deps.setState({
        openError: error instanceof Error ? error.message : deps.t("errOpenProject")
      });
    }
  };

  const exportStaticSite = async () => {
    const state = deps.getState();
    if (!state.draft || state.workflowMode) return;
    const ensuredLocale = ensureWorkflowLocales(state.draft, state.uiLang);
    if (ensuredLocale) {
      deps.setState({
        draft: state.draft,
        locale: ensuredLocale,
        editLang: ensuredLocale,
        wizardLang: ensuredLocale
      });
    }
    deps.setState({
      openError: "",
      exportError: "",
      exportStatus: deps.t("exporting")
    });
    deps.startWorkflow("export", "progressExportStart", 4);
    try {
      const slug = deps.getProjectSlug();
      let exportProject = JSON.parse(JSON.stringify(state.draft)) as MenuProject;
      if (deps.getState().assetMode === "bridge") {
        deps.pulseWorkflow(95, "progressExportDerive", { tickIncrement: 0.05 });
        try {
          exportProject = await queueBridgeDerivedPreparation(slug, exportProject, {
            applyIfUnchanged: false
          });
          deps.setState({ draft: exportProject });
        } finally {
          deps.clearWorkflowPulse();
        }
      }

      const workflowResult = await buildExportSiteWorkflow({
        slug,
        project: exportProject,
        normalizePath: deps.normalizePath,
        readAssetBytes: deps.readAssetBytes,
        getMimeType,
        isResponsiveImageMime,
        createResponsiveImageVariants,
        buildExportStyles: deps.buildExportStyles,
        buildRuntimeScript: deps.buildRuntimeScript,
        getCarouselImageSource: deps.getCarouselImageSource,
        faviconIco: fromBase64(FAVICON_ICO_BASE64),
        progress: {
          onCollectStart: () => {
            deps.updateWorkflow("progressExportCollect", 46);
          },
          onAssetProgress: (current, total) => {
            deps.updateWorkflowAssetStep("export", current, total, 46, 76);
          },
          onBundleProgress: (percent) => {
            deps.updateWorkflow("progressExportBundle", percent);
          },
          onReportProgress: (percent) => {
            deps.updateWorkflow("progressExportReport", percent);
          }
        },
        onMissingAsset: (sourcePath, error) => {
          console.warn("Missing asset", sourcePath, error);
        }
      });

      deps.setState({ draft: workflowResult.project });
      deps.updateWorkflow("progressExportDownload", 95);
      downloadBlob(
        createZipBlob(workflowResult.entries),
        `${workflowResult.project.meta.slug || "menu"}-export.zip`
      );
      deps.setState({ exportStatus: deps.t("exportReady") });
      deps.finishWorkflow("progressExportDone");
    } catch (error) {
      deps.failWorkflow();
      deps.setState({
        exportStatus: "",
        exportError: error instanceof Error ? error.message : deps.t("exportFailed")
      });
    }
  };

  const applyLoadedProject = async (
    data: MenuProject,
    sourceName = "",
    options: { rootFiles?: string[] } = {}
  ) => {
    const normalizedLocales = Array.from(
      new Set(
        (data.meta.locales ?? [])
          .map((locale) => normalizeLocaleCode(locale))
          .filter((locale) => locale.length > 0)
      )
    );
    data.meta.locales = normalizedLocales;
    const normalizedDefaultLocale = normalizeLocaleCode(data.meta.defaultLocale ?? "");
    if (normalizedDefaultLocale) {
      data.meta.defaultLocale = normalizedDefaultLocale;
    } else if (normalizedLocales.length > 0) {
      data.meta.defaultLocale = normalizedLocales[0];
    }
    if (
      normalizedLocales.length > 0 &&
      (!data.meta.defaultLocale || !normalizedLocales.includes(data.meta.defaultLocale))
    ) {
      data.meta.defaultLocale = normalizedLocales[0];
    }
    data.meta.logoSrc = sanitizeLogoSource(data.meta.logoSrc);

    const activeSlug = data.meta.slug || "importado";
    const summary = {
      slug: activeSlug,
      name: data.meta.name,
      template: data.meta.template,
      cover: data.backgrounds?.[0]?.src
    };
    const state = deps.getState();
    const existing = state.projects.find((item) => item.slug === activeSlug);
    const projects = existing
      ? state.projects.map((item) => (item.slug === activeSlug ? { ...item, ...summary } : item))
      : [...state.projects, summary];

    deps.setState({
      project: data,
      draft: deps.cloneProject(data),
      wizardDemoPreview: false,
      wizardShowcaseProject: null,
      activeSlug,
      lastSaveName: sourceName || `${activeSlug}.zip`,
      rootFiles: options.rootFiles ?? [],
      locale: data.meta.defaultLocale || "es",
      editPanel: "identity",
      projects,
      openError: "",
      showLanding: false
    });

    deps.initCarouselIndices(data);
  };

  const createNewProject = async (options: { forWizard?: boolean } = {}) => {
    const state = deps.getState();
    const empty = deps.createEmptyProject();
    empty.meta.name = state.uiLang === "en" ? "New project" : "Nuevo proyecto";
    empty.meta.slug = "new-project";
    empty.meta.defaultLocale = state.uiLang;

    const draft = deps.cloneProject(empty);
    deps.setState({
      project: empty,
      draft,
      activeSlug: empty.meta.slug,
      locale: state.uiLang,
      editLang: state.uiLang,
      editPanel: "identity",
      wizardLang: state.uiLang,
      wizardCategoryId: "",
      wizardItemId: "",
      wizardDemoPreview: false,
      wizardShowcaseProject: null,
      lastSaveName: "",
      rootFiles: [],
      needsAssets: false,
      openError: "",
      exportStatus: "",
      exportError: "",
      wizardStep: 0
    });

    if (options.forWizard) {
      const nextDraft = deps.getState().draft;
      if (nextDraft) {
        nextDraft.backgrounds = [
          {
            id: `bg-${Date.now()}`,
            label: `${deps.t("backgroundLabel")} 1`,
            src: "",
            type: "image"
          }
        ];
        deps.setState({ draft: nextDraft });
      }
      await deps.applyTemplate(empty.meta.template || "focus-rows", { source: "wizard" });
    } else {
      deps.initCarouselIndices(empty);
    }

    if (deps.getState().assetMode === "bridge") {
      await deps.refreshBridgeEntries();
    }
  };

  const startCreateProject = async () => {
    await createNewProject();
    deps.setState({
      editorTab: "info",
      editorOpen: true,
      showLanding: false
    });
  };

  const startWizard = async () => {
    await createNewProject({ forWizard: true });
    deps.setState({
      editorTab: "wizard",
      editorOpen: true,
      showLanding: false
    });
    deps.syncWizardShowcaseVisibility();
  };

  const openProjectDialog = () => {
    deps.onOpenProjectDialog();
  };

  const startOpenProject = () => {
    deps.setState({
      editorTab: "info",
      editorOpen: true,
      showLanding: false
    });
    openProjectDialog();
  };

  const handleProjectFile = async (event: Event) => {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || deps.getState().workflowMode) return;
    const isZipFile = file.name.toLowerCase().endsWith(".zip");
    try {
      deps.setState({
        openError: "",
        exportError: "",
        exportStatus: ""
      });
      if (isZipFile) {
        const showUploadWorkflow = deps.getState().assetMode === "bridge";
        if (showUploadWorkflow) {
          deps.startWorkflow("upload", "progressUploadStart", 5);
          deps.pulseWorkflow(18, "progressUploadStart", { tickIncrement: 0.12 });
        }
        const buffer = await file.arrayBuffer();
        if (showUploadWorkflow) {
          deps.clearWorkflowPulse();
        }

        let entries: { name: string; data: Uint8Array }[] = [];
        try {
          entries = readZip(buffer);
        } catch (error) {
          if (showUploadWorkflow) {
            deps.failWorkflow();
          }
          const message = error instanceof Error ? error.message : "";
          deps.setState({
            openError: message.includes("compression") ? deps.t("errZipCompression") : message
          });
          return;
        }

        const menuEntry = findMenuJsonEntry(entries);
        if (!menuEntry) {
          if (showUploadWorkflow) {
            deps.failWorkflow();
          }
          deps.setState({ openError: deps.t("errZipMissing") });
          return;
        }

        const menuText = new TextDecoder().decode(menuEntry.data);
        const data = normalizeProject(JSON.parse(menuText) as MenuProject);
        const folderName = getZipFolderName(menuEntry.name);
        const slug =
          deps.slugifyName(data.meta.slug || folderName || data.meta.name || "menu") || "menu";
        data.meta.slug = slug;
        let preparedProject = applyImportedPaths(data, slug, deps.mapLegacyAssetRelativeToManaged);
        const assetEntries = getZipAssetEntries(entries, menuEntry.name);
        const importedZipAssets = buildImportedZipAssets(
          assetEntries,
          slug,
          deps.mapLegacyAssetRelativeToManaged
        );
        const importedRootFiles = Array.from(
          new Set([
            ...importedZipAssets.map((asset) => asset.sourcePath),
            ...importedZipAssets.map((asset) => asset.dataUrl)
          ])
        );

        if (deps.getState().assetMode === "bridge") {
          const totalAssets = Math.max(1, assetEntries.length);
          for (let assetIndex = 0; assetIndex < assetEntries.length; assetIndex += 1) {
            const assetEntry = assetEntries[assetIndex];
            deps.updateWorkflowAssetStep("upload", assetIndex, totalAssets, 22, 86);
            const { entry } = assetEntry;
            const mappedRelative = deps.mapLegacyAssetRelativeToManaged(assetEntry.relative);
            if (!mappedRelative || mappedRelative.startsWith("derived/")) {
              deps.updateWorkflowAssetStep("upload", assetIndex + 1, totalAssets, 22, 86);
              continue;
            }
            if (!deps.isManagedAssetRelativePath(mappedRelative)) {
              deps.updateWorkflowAssetStep("upload", assetIndex + 1, totalAssets, 22, 86);
              continue;
            }
            const mappedParts = mappedRelative.split("/").filter(Boolean);
            const name = mappedParts.pop() ?? "";
            const targetPath = mappedParts.join("/");
            if (!name) {
              deps.updateWorkflowAssetStep("upload", assetIndex + 1, totalAssets, 22, 86);
              continue;
            }
            const mime = getMimeType(name);
            const dataUrl = `data:${mime};base64,${toBase64(entry.data)}`;
            const assetTargetProgress =
              22 + ((86 - 22) * Math.max(assetIndex, 0.5)) / Math.max(totalAssets, 1);
            deps.pulseWorkflow(assetTargetProgress, "progressUploadAssets", { tickIncrement: 0.1 });
            await bridgeRequest("upload", { path: targetPath, name, data: dataUrl }, slug);
            deps.clearWorkflowPulse();
            deps.updateWorkflowAssetStep("upload", assetIndex + 1, totalAssets, 22, 86);
          }

          deps.pulseWorkflow(95, "progressUploadDerive", { tickIncrement: 0.08 });
          preparedProject = await queueBridgeDerivedPreparation(slug, preparedProject, {
            applyIfUnchanged: false
          });
          deps.clearWorkflowPulse();
          deps.updateWorkflow("progressUploadApply", 96);
          deps.setState({ needsAssets: false });
        } else {
          deps.setState({
            needsAssets: importedZipAssets.length === 0,
            openError: importedZipAssets.length === 0 ? deps.t("errZipNoBridge") : ""
          });
          preparedProject = hydrateImportedProjectAssetSources(preparedProject, importedZipAssets);
        }

        await applyLoadedProject(preparedProject, file.name, { rootFiles: importedRootFiles });

        if (deps.getState().assetMode === "bridge") {
          await deps.refreshBridgeEntries();
          deps.finishWorkflow("progressUploadDone");
        }
      } else {
        const text = await file.text();
        const data = normalizeProject(JSON.parse(text) as MenuProject);
        const slug = deps.slugifyName(data.meta.slug || data.meta.name || "importado") || "importado";
        data.meta.slug = slug;
        const prepared = applyImportedPaths(data, slug, deps.mapLegacyAssetRelativeToManaged);
        await applyLoadedProject(prepared, file.name, { rootFiles: [] });
        if (deps.getState().assetMode === "bridge") {
          deps.setState({
            needsAssets: true,
            editorTab: "assets"
          });
          await deps.onPromptAssetUpload();
        }
      }
    } catch (error) {
      if (isZipFile && deps.getState().assetMode === "bridge") {
        deps.failWorkflow();
      }
      deps.setState({
        openError: error instanceof Error ? error.message : deps.t("errOpenProject")
      });
    } finally {
      input.value = "";
    }
  };

  return {
    queueBridgeDerivedPreparation,
    saveProject,
    exportStaticSite,
    applyLoadedProject,
    createNewProject,
    startCreateProject,
    startWizard,
    startOpenProject,
    openProjectDialog,
    handleProjectFile
  };
};
