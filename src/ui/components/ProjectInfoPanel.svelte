<script lang="ts">
  import { currencyOptions, fontOptions, languageOptions } from "../config/staticOptions";
  import type { ProjectInfoPanelActions, ProjectInfoPanelModel } from "../contracts/components";

  export let model: ProjectInfoPanelModel;
  export let actions: ProjectInfoPanelActions;

  let languageMenuOpen = false;
  let templateValue = "";

  const selectedLabel = (count: number) =>
    model.uiLang === "es" ? `${count} seleccionados` : `${count} selected`;

  $: {
    const nextTemplate = model.draft?.meta.template ?? "";
    if (nextTemplate !== templateValue) {
      templateValue = nextTemplate;
    }
  }

  const handleTemplateChange = async (event: Event) => {
    const target = event.currentTarget;
    if (!(target instanceof HTMLSelectElement)) return;
    templateValue = target.value;
    await actions.setTemplate(templateValue);
  };

  const handleItemSensitivityInput = (event: Event) => {
    const target = event.currentTarget;
    if (!(target instanceof HTMLInputElement)) return;
    actions.setItemScrollSensitivity(Number(target.value));
  };

  const handleSectionSensitivityInput = (event: Event) => {
    const target = event.currentTarget;
    if (!(target instanceof HTMLInputElement)) return;
    actions.setSectionScrollSensitivity(Number(target.value));
  };
</script>

<div class="editor-toolbar">
  <button
    class="icon-btn"
    type="button"
    aria-label={model.t("newProject")}
    title={model.t("newProject")}
    disabled={model.workflowMode !== null}
    on:click={actions.createNewProject}
  >
    <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5v14"></path>
      <path d="M5 12h14"></path>
    </svg>
  </button>
  <button
    class="icon-btn"
    type="button"
    aria-label={model.t("open")}
    title={model.t("open")}
    disabled={model.workflowMode !== null}
    on:click={actions.openProjectDialog}
  >
    <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 7h6l2 2h10v8a2 2 0 0 1-2 2H3z"></path>
      <path d="M3 7v-2a2 2 0 0 1 2-2h4l2 2"></path>
    </svg>
  </button>
  <button
    class="icon-btn"
    type="button"
    aria-label={model.t("save")}
    title={model.t("save")}
    disabled={model.workflowMode !== null}
    on:click={actions.saveProject}
  >
    <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 4h12l2 2v14H5z"></path>
      <path d="M7 4v6h10V4"></path>
      <rect x="8" y="14" width="8" height="5" rx="1"></rect>
    </svg>
  </button>
  <button
    class="icon-btn"
    type="button"
    aria-label={model.t("export")}
    title={model.t("export")}
    disabled={model.workflowMode !== null}
    on:click={actions.exportStaticSite}
  >
    <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3v10"></path>
      <path d="M8 7l4-4 4 4"></path>
      <rect x="4" y="13" width="16" height="8" rx="2"></rect>
    </svg>
  </button>
</div>

{#if model.openError}
  <p class="mt-2 text-xs text-red-300">{model.openError}</p>
{/if}
{#if model.exportStatus}
  <p class="mt-2 text-xs text-emerald-200">{model.exportStatus}</p>
{/if}
{#if model.exportError}
  <p class="mt-2 text-xs text-red-300">{model.exportError}</p>
{/if}
{#if model.workflowMode}
  <div class="mt-3 rounded-lg border border-emerald-400/25 bg-emerald-950/30 p-2">
    <p class="text-[11px] font-medium text-emerald-100">
      {model.workflowMode === "save"
        ? model.t("progressSaveLabel")
        : model.workflowMode === "upload"
          ? model.t("progressUploadLabel")
          : model.t("progressExportLabel")}
    </p>
    <p class="mt-0.5 text-[11px] text-emerald-200">{model.workflowStep}</p>
    <div class="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-emerald-500/25">
      <div
        class="h-full rounded-full bg-emerald-300 transition-all duration-300 ease-out"
        style={`width:${Math.max(3, Math.min(100, model.workflowProgress))}%`}
      ></div>
    </div>
    <p class="mt-1 text-[10px] text-emerald-200/90">{model.workflowProgress.toFixed(1)}%</p>
  </div>
{/if}

{#if model.draft}
  <div class="mt-5 grid gap-4">
    <label class="editor-field">
      <span>{model.t("projectName")}</span>
      <input
        type="text"
        bind:value={model.draft.meta.name}
        class="editor-input"
        placeholder={model.t("projectName")}
      />
    </label>
    <label class="editor-field">
      <span>{model.t("template")}</span>
      <select value={templateValue} class="editor-select" on:change={handleTemplateChange}>
        {#each model.templateOptions as template}
          <option value={template.id}>
            {template.label[model.uiLang] ?? template.label.es ?? template.id}
          </option>
        {/each}
      </select>
    </label>
    <div class="editor-field">
      <span>{model.t("languages")}</span>
      <button
        class="editor-select"
        type="button"
        on:click={() => (languageMenuOpen = !languageMenuOpen)}
      >
        {selectedLabel(model.draft.meta.locales.length)}
      </button>
      {#if languageMenuOpen}
        <div class="dropdown-panel">
          {#each languageOptions as lang}
            <label class="dropdown-item">
              <input
                type="checkbox"
                checked={model.draft.meta.locales.includes(lang.code)}
                on:change={() => actions.toggleLanguage(lang.code)}
              />
              <span>{lang.label}</span>
            </label>
          {/each}
        </div>
      {/if}
    </div>
    <label class="editor-field">
      <span>{model.t("defaultLang")}</span>
      <select bind:value={model.draft.meta.defaultLocale} class="editor-select">
        {#each model.draft.meta.locales as lang}
          <option value={lang}>{lang.toUpperCase()}</option>
        {/each}
      </select>
    </label>
    <label class="editor-field">
      <span>{model.t("currency")}</span>
      <select
        class="editor-select"
        bind:value={model.draft.meta.currency}
        on:change={actions.handleCurrencyChange}
      >
        {#each currencyOptions as currency}
          <option value={currency.code}>{currency.label}</option>
        {/each}
      </select>
    </label>
    <div class="editor-field">
      <span>{model.t("currencyPos")}</span>
      <button class="editor-outline" type="button" on:click={actions.toggleCurrencyPosition}>
        {model.draft.meta.currencyPosition === "right"
          ? model.t("currencyRight")
          : model.t("currencyLeft")}
      </button>
    </div>
    <label class="editor-field">
      <span>{model.t("font")}</span>
      <select
        class="editor-select"
        value={model.fontChoice}
        on:change={actions.handleFontSelect}
      >
        {#each fontOptions as font}
          <option value={font.value}>{font.label}</option>
        {/each}
        <option value="custom">{model.t("fontCustom")}</option>
      </select>
    </label>
    {#if model.fontChoice === "custom"}
      <label class="editor-field">
        <span>{model.t("fontCustomSrc")}</span>
        {#if model.fontAssetOptions.length}
          <select
            class="editor-select"
            value={model.draft.meta.fontSource ?? ""}
            on:change={actions.handleCustomFontSourceInput}
          >
            <option value=""></option>
            {#each model.fontAssetOptions as option}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
        {:else}
          <input
            type="text"
            class="editor-input"
            value={model.draft.meta.fontSource ?? ""}
            list="font-asset-files"
            on:input={actions.handleCustomFontSourceInput}
          />
        {/if}
      </label>
    {/if}
    <div class="editor-field">
      <span>{model.t("scrollSensitivityItem")}: {model.scrollSensitivity.item}</span>
      <input
        type="range"
        min="1"
        max="10"
        step="1"
        class="editor-range"
        value={model.scrollSensitivity.item}
        on:input={handleItemSensitivityInput}
      />
    </div>
    <div class="editor-field">
      <span>{model.t("scrollSensitivitySection")}: {model.scrollSensitivity.section}</span>
      <input
        type="range"
        min="1"
        max="10"
        step="1"
        class="editor-range"
        value={model.scrollSensitivity.section}
        on:input={handleSectionSensitivityInput}
      />
    </div>
    <p class="text-[10px] text-emerald-200/80">{model.t("scrollSensitivityHint")}</p>
  </div>
{/if}
