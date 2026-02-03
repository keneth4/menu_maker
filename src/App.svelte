<svelte:head>
  <title>Menú Interactivo</title>
</svelte:head>

<script lang="ts">
  import { onMount } from "svelte";
  import { loadProject } from "./lib/loadProject";
  import { loadProjects, type ProjectSummary } from "./lib/loadProjects";
  import type { MenuProject } from "./lib/types";

  let project: MenuProject | null = null;
  let draft: MenuProject | null = null;
  let projects: ProjectSummary[] = [];
  let activeSlug = "demo";
  let locale = "es";
  let loadError = "";
  let activeProject: MenuProject | null = null;

  onMount(async () => {
    try {
      projects = await loadProjects();
      activeSlug = projects[0]?.slug ?? activeSlug;
      project = await loadProject(activeSlug);
      draft = cloneProject(project);
      locale = project.meta.defaultLocale;
    } catch (error) {
      loadError = error instanceof Error ? error.message : "Error desconocido";
    }
  });

  $: activeProject = draft ?? project;

  const textOf = (entry: Record<string, string> | undefined, fallback = "") => {
    if (!entry) return fallback;
    return entry[locale] ?? entry[activeProject?.meta.defaultLocale ?? "es"] ?? fallback;
  };

  const changeProject = async (slug: string) => {
    try {
      activeSlug = slug;
      project = await loadProject(slug);
      draft = cloneProject(project);
      locale = project.meta.defaultLocale;
      loadError = "";
    } catch (error) {
      loadError = error instanceof Error ? error.message : "Error desconocido";
    }
  };

  const cloneProject = (value: MenuProject) => {
    if (typeof structuredClone === "function") {
      return structuredClone(value);
    }
    return JSON.parse(JSON.stringify(value)) as MenuProject;
  };

  const updateLocales = (value: string) => {
    if (!draft) return;
    const parsed = value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
    draft.meta.locales = parsed.length ? parsed : draft.meta.locales;
  };

  const handleLocalesInput = (event: Event) => {
    const input = event.currentTarget as HTMLInputElement;
    updateLocales(input.value);
  };

  const downloadProject = () => {
    if (!draft) return;
    const blob = new Blob([JSON.stringify(draft, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${draft.meta.slug}-menu.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };
</script>

<main class="min-h-screen px-5 py-8">
  {#if loadError}
    <div class="rounded-2xl border border-red-500/30 bg-red-950/40 p-5 text-sm text-red-100">
      {loadError}
    </div>
  {:else if !project}
    <div class="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-200">
      Cargando proyecto...
    </div>
  {:else if activeProject}
    <nav class="mb-5 flex gap-3 overflow-x-auto pb-2">
      {#each projects as item}
        <button
          class="project-pill {item.slug === activeSlug ? 'active' : ''}"
          type="button"
          on:click={() => changeProject(item.slug)}
        >
          <span class="text-[0.6rem] uppercase tracking-[0.35em] text-amber-200/80">
            {item.template}
          </span>
          <span class="text-sm text-slate-100">{item.name}</span>
        </button>
      {/each}
    </nav>

    <section class="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4">
      <div class="flex items-center justify-between gap-4">
        <div>
          <p class="text-xs uppercase tracking-[0.35em] text-slate-300">Editor minimo</p>
          <p class="mt-1 text-xs text-slate-400">
            Cambios locales con exportacion manual de JSON.
          </p>
        </div>
        <button class="editor-cta" type="button" on:click={downloadProject}>Descargar JSON</button>
      </div>

      {#if draft}
        <div class="mt-4 grid gap-3">
          <label class="editor-field">
            <span>Nombre del proyecto</span>
            <input
              type="text"
              bind:value={draft.meta.name}
              class="editor-input"
              placeholder="Nombre"
            />
          </label>
          <label class="editor-field">
            <span>Template</span>
            <input
              type="text"
              bind:value={draft.meta.template}
              class="editor-input"
              placeholder="bar-pub"
            />
          </label>
          <label class="editor-field">
            <span>Locales (comma)</span>
            <input
              type="text"
              value={draft.meta.locales.join(", ")}
              class="editor-input"
              placeholder="es, en"
              on:input={handleLocalesInput}
            />
          </label>
          <label class="editor-field">
            <span>Locale default</span>
            <input
              type="text"
              bind:value={draft.meta.defaultLocale}
              class="editor-input"
              placeholder="es"
            />
          </label>
          <label class="editor-field">
            <span>Moneda</span>
            <input
              type="text"
              bind:value={draft.meta.currency}
              class="editor-input"
              placeholder="MXN"
            />
          </label>
        </div>
      {/if}
    </section>

    <section class="relative overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/70 p-5">
      <div
        class="absolute inset-0 bg-cover bg-center opacity-60"
        style={`background-image: url('${activeProject.backgrounds[0]?.src}');`}
      ></div>
      <div class="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/70 to-slate-950"></div>

      <div class="relative z-10">
        <header class="flex items-start justify-between gap-4">
          <div>
            <p class="text-[0.6rem] uppercase tracking-[0.5em] text-amber-300/90">
              {activeProject.meta.name}
            </p>
            <h1 class="mt-3 text-2xl font-semibold text-slate-100">Menú elegante</h1>
            <p class="mt-2 text-sm text-slate-300">
              MVP base con fondo animado y platillo 360°.
            </p>
          </div>
          <div class="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.65rem] text-slate-200">
            {activeProject.meta.locales.join(" / ").toUpperCase()}
          </div>
        </header>

        <section class="mt-8 grid gap-5">
          {#each activeProject.categories as category}
            <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p class="text-xs uppercase tracking-[0.35em] text-slate-300">
                {textOf(category.name)}
              </p>
              <div class="mt-4 grid gap-4">
                {#each category.items as item}
                  <div class="flex items-center gap-4">
                    <div class="dish-frame">
                      <img
                        src={item.media.hero360 ?? ""}
                        alt={textOf(item.name)}
                        class="dish-media"
                      />
                      <div class="dish-glow"></div>
                    </div>
                    <div>
                      <p class="text-sm text-slate-100">{textOf(item.name)}</p>
                      <p class="mt-1 text-xs text-slate-400">{textOf(item.description)}</p>
                    </div>
                    <p class="ml-auto text-sm text-amber-200">
                      {item.price.display ?? `${item.price.amount} ${item.price.currency}`}
                    </p>
                  </div>
                {/each}
              </div>
            </div>
          {/each}
        </section>
      </div>
    </section>
  {/if}
</main>
