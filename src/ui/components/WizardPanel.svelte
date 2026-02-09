<script lang="ts">
  import type { TemplateOption } from "../../core/templates/templateOptions";
  import type { MenuCategory, MenuItem, MenuProject } from "../../lib/types";

  type WizardStatus = {
    structure: boolean;
    identity: boolean;
    categories: boolean;
    dishes: boolean;
    preview: boolean;
  };

  export let t: (key: string) => string = (key) => key;
  export let draft: MenuProject | null = null;
  export let uiLang: "es" | "en" = "es";
  export let templateOptions: TemplateOption[] = [];
  export let wizardStep = 0;
  export let wizardSteps: string[] = [];
  export let wizardProgress = 0;
  export let wizardStatus: WizardStatus = {
    structure: false,
    identity: false,
    categories: false,
    dishes: false,
    preview: false
  };
  export let wizardLang = "es";
  export let wizardCategoryId = "";
  export let wizardItemId = "";
  export let wizardCategory: MenuCategory | null = null;
  export let wizardItem: MenuItem | null = null;
  export let wizardDemoPreview = false;
  export let wizardNeedsRootBackground = false;
  export let assetOptions: string[] = [];

  export let isWizardStepValid: (index: number) => boolean = () => false;
  export let goToStep: (index: number) => void = () => {};
  export let applyTemplate: (
    templateId: string,
    options?: { source?: "wizard" | "project" }
  ) => Promise<void> | void = () => {};
  export let addBackground: () => void = () => {};
  export let removeBackground: (id: string) => void = () => {};
  export let addWizardCategory: () => void = () => {};
  export let removeWizardCategory: (id: string) => void = () => {};
  export let addWizardDish: () => void = () => {};
  export let removeWizardDish: () => void = () => {};
  export let handleLocalizedInput: (
    localized: Record<string, string>,
    lang: string,
    event: Event
  ) => void = () => {};
  export let handleDescriptionInput: (item: MenuItem, lang: string, event: Event) => void =
    () => {};
  export let getLocalizedValue: (
    value: Record<string, string> | undefined,
    locale: string,
    fallback?: string
  ) => string = () => "";
  export let goPrevStep: () => void = () => {};
  export let goNextStep: () => void = () => {};
  export let exportStaticSite: () => Promise<void> | void = () => {};
</script>

<section class="wizard">
  <div class="wizard-header">
    <p class="text-[0.6rem] uppercase tracking-[0.35em] text-slate-300">
      {t("tabWizard")}
    </p>
    <span class="text-xs text-slate-400">
      {t("step")} {wizardStep + 1} / {wizardSteps.length}
    </span>
  </div>
  <div class="wizard-progress">
    <span>{t("wizardProgress")} {Math.round(wizardProgress * 100)}%</span>
    <div class="wizard-progress__bar">
      <span style={`width:${wizardProgress * 100}%`}></span>
    </div>
  </div>
  <div class="wizard-steps">
    {#each wizardSteps as step, index}
      <button
        class="wizard-step {index === wizardStep ? 'active' : ''} {isWizardStepValid(index) ? 'done' : ''}"
        type="button"
        on:click={() => goToStep(index)}
      >
        <span>{step}</span>
        <span class="wizard-step__status">
          {isWizardStepValid(index) ? "●" : "○"}
        </span>
      </button>
    {/each}
  </div>
  <div class="wizard-body">
    {#if wizardStep === 0}
      <p class="text-sm text-slate-200">{t("wizardPick")}</p>
      <div class="wizard-card-grid">
        {#each templateOptions as template}
          <button
            class="wizard-card {draft?.meta.template === template.id ? 'active' : ''}"
            type="button"
            on:click={() => applyTemplate(template.id, { source: "wizard" })}
          >
            <p class="wizard-card__title">
              {template.label[uiLang] ?? template.label.es ?? template.id}
            </p>
            <p class="wizard-card__meta">
              {(template.categories[uiLang] ?? template.categories.es ?? []).join(" • ")}
            </p>
          </button>
        {/each}
      </div>
      <p class="text-xs text-slate-400">
        {t("wizardTip")}
      </p>
      {#if wizardDemoPreview}
        <p class="text-xs text-amber-200">{t("wizardDemoPreviewHint")}</p>
      {/if}
    {:else if wizardStep === 1}
      <p class="text-sm text-slate-200">{t("wizardIdentity")}</p>
      {#if wizardNeedsRootBackground}
        <p class="wizard-warning">{t("wizardRequireRootBackground")}</p>
      {:else if !wizardStatus.identity}
        <p class="wizard-warning">{t("wizardMissingBackground")}</p>
      {/if}
      {#if assetOptions.length === 0}
        <p class="text-xs text-slate-400">{t("wizardAssetsHint")}</p>
      {/if}
      <div class="wizard-block">
        <button class="editor-outline" type="button" on:click={addBackground}>
          {t("wizardAddBg")}
        </button>
        {#if draft}
          <div class="wizard-list">
            {#each draft.backgrounds as bg}
              <div class="wizard-item">
                <label class="editor-field">
                  <span>{t("wizardLabel")}</span>
                  <input
                    type="text"
                    class="editor-input"
                    bind:value={bg.label}
                  />
                </label>
                <label class="editor-field">
                  <span>{t("wizardSrc")}</span>
                  {#if assetOptions.length}
                    <select bind:value={bg.src} class="editor-select">
                      <option value=""></option>
                      {#each assetOptions as path}
                        <option value={path}>{path}</option>
                      {/each}
                    </select>
                  {:else}
                    <input
                      type="text"
                      class="editor-input"
                      bind:value={bg.src}
                      list="asset-files"
                    />
                  {/if}
                </label>
                <button
                  class="editor-outline danger"
                  type="button"
                  on:click={() => removeBackground(bg.id)}
                >
                  {t("delete")}
                </button>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {:else if wizardStep === 2}
      <p class="text-sm text-slate-200">{t("wizardCategories")}</p>
      {#if !wizardStatus.categories}
        <p class="wizard-warning">{t("wizardMissingCategories")}</p>
      {/if}
      {#if draft}
        <div class="wizard-block">
          <label class="editor-field">
            <span>{t("wizardLanguage")}</span>
            <select bind:value={wizardLang} class="editor-select">
              {#each draft.meta.locales as lang}
                <option value={lang}>{lang.toUpperCase()}</option>
              {/each}
            </select>
          </label>
          <button class="editor-outline" type="button" on:click={addWizardCategory}>
            {t("wizardAddCategory")}
          </button>
          <div class="wizard-list">
            {#each draft.categories as category}
              <div class="wizard-item">
                <label class="editor-field">
                  <span>{t("name")} ({wizardLang.toUpperCase()})</span>
                  <input
                    type="text"
                    class="editor-input"
                    value={category.name?.[wizardLang] ?? ""}
                    on:input={(event) =>
                      handleLocalizedInput(category.name, wizardLang, event)}
                  />
                </label>
                <button
                  class="editor-outline danger"
                  type="button"
                  on:click={() => removeWizardCategory(category.id)}
                >
                  {t("delete")}
                </button>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    {:else if wizardStep === 3}
      <p class="text-sm text-slate-200">{t("wizardDishes")}</p>
      {#if !wizardStatus.dishes}
        <p class="wizard-warning">{t("wizardMissingDishes")}</p>
      {/if}
      {#if draft}
        <div class="wizard-block">
          <label class="editor-field">
            <span>{t("wizardLanguage")}</span>
            <select bind:value={wizardLang} class="editor-select">
              {#each draft.meta.locales as lang}
                <option value={lang}>{lang.toUpperCase()}</option>
              {/each}
            </select>
          </label>
          <label class="editor-field">
            <span>{t("wizardCategory")}</span>
            <select bind:value={wizardCategoryId} class="editor-select">
              {#each draft.categories as category}
                <option value={category.id}>
                  {getLocalizedValue(category.name, wizardLang, draft.meta.defaultLocale)}
                </option>
              {/each}
            </select>
          </label>
          <div class="edit-actions">
            <button class="editor-outline" type="button" on:click={addWizardDish}>
              {t("wizardAddDish")}
            </button>
            <button class="editor-outline danger" type="button" on:click={removeWizardDish}>
              {t("delete")}
            </button>
          </div>
          {#if wizardCategory}
            <label class="editor-field">
              <span>{t("dish")}</span>
              <select bind:value={wizardItemId} class="editor-select">
                {#each wizardCategory.items as item}
                  <option value={item.id}>
                    {getLocalizedValue(item.name, wizardLang, draft.meta.defaultLocale)}
                  </option>
                {/each}
              </select>
            </label>
          {/if}
          {#if wizardItem}
            <label class="editor-field">
              <span>{t("name")} ({wizardLang.toUpperCase()})</span>
              <input
                type="text"
                class="editor-input"
                value={wizardItem.name?.[wizardLang] ?? ""}
                on:input={(event) =>
                  handleLocalizedInput(wizardItem.name, wizardLang, event)}
              />
            </label>
            <label class="editor-field">
              <span>{t("description")} ({wizardLang.toUpperCase()})</span>
              <textarea
                class="editor-input"
                rows="2"
                value={wizardItem.description?.[wizardLang] ?? ""}
                on:input={(event) => handleDescriptionInput(wizardItem, wizardLang, event)}
              ></textarea>
            </label>
            <label class="editor-field">
              <span>{t("price")}</span>
              <input
                type="number"
                class="editor-input"
                bind:value={wizardItem.price.amount}
              />
            </label>
            <label class="editor-field">
              <span>{t("asset360")}</span>
              <input
                type="text"
                class="editor-input"
                bind:value={wizardItem.media.hero360}
                list="asset-files"
              />
            </label>
          {/if}
        </div>
      {/if}
    {:else}
      <p class="text-sm text-slate-200">{t("wizardPreview")}</p>
      <p class="text-xs text-slate-400">
        {t("wizardExportNote")}
      </p>
    {/if}
  </div>
  <div class="wizard-nav">
    <button
      class="editor-outline"
      type="button"
      on:click={goPrevStep}
      disabled={wizardStep === 0}
    >
      {t("wizardBack")}
    </button>
    {#if wizardStep < wizardSteps.length - 1}
      <button
        class="editor-cta"
        type="button"
        on:click={goNextStep}
        disabled={!isWizardStepValid(wizardStep)}
      >
        {t("wizardNext")}
      </button>
    {:else}
      <button
        class="editor-cta"
        type="button"
        on:click={exportStaticSite}
        disabled={!wizardStatus.preview}
      >
        {t("export")}
      </button>
    {/if}
  </div>
</section>
