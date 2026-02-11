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
  export let assetOptions: Array<{ value: string; label: string }> = [];

  export let isWizardStepValid: (index: number) => boolean = () => false;
  export let goToStep: (index: number) => void = () => {};
  export let applyTemplate: (
    templateId: string,
    options?: { source?: "wizard" | "project" }
  ) => Promise<void> | void = () => {};
  export let addBackground: () => void = () => {};
  export let removeBackground: (id: string) => void = () => {};
  export let setBackgroundDisplayMode: (mode: "carousel" | "section") => void = () => {};
  export let setCategoryBackgroundId: (category: MenuCategory, backgroundId: string) => void = () =>
    {};
  export let addWizardCategory: () => void = () => {};
  export let removeWizardCategory: (id: string) => void = () => {};
  export let addWizardDish: () => void = () => {};
  export let removeWizardDish: () => void = () => {};
  export let setIdentityMode: (mode: "text" | "logo") => void = () => {};
  export let setLogoSrc: (src: string) => void = () => {};
  export let setItemRotationDirection: (
    item: MenuItem,
    direction: "cw" | "ccw"
  ) => void = () => {};
  export let setItemScrollAnimationMode: (
    item: MenuItem,
    mode: "hero360" | "alternate"
  ) => void = () => {};
  export let setItemScrollAnimationSrc: (item: MenuItem, src: string) => void = () => {};
  export let setFontRoleFamily: (
    role: "identity" | "section" | "item",
    family: string
  ) => void = () => {};
  export let setFontRoleSource: (
    role: "identity" | "section" | "item",
    source: string
  ) => void = () => {};
  export let setItemFontFamily: (item: MenuItem, family: string) => void = () => {};
  export let setItemFontSource: (item: MenuItem, source: string) => void = () => {};
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
  export let touchDraft: () => void = () => {};

  let mediaAssetOptions: Array<{ value: string; label: string }> = [];
  let fontAssetOptions: Array<{ value: string; label: string }> = [];
  $: mediaAssetOptions = assetOptions.filter((option) => !option.value.includes("/fonts/"));
  $: fontAssetOptions = assetOptions.filter((option) => option.value.includes("/fonts/"));

  const handleLogoSrcEvent = (event: Event) => {
    const target = event.currentTarget;
    if (!(target instanceof HTMLInputElement) && !(target instanceof HTMLSelectElement)) return;
    setLogoSrc(target.value);
  };

  const getItemRotationDirection = (item: MenuItem) =>
    item.media.rotationDirection === "cw" ? "cw" : "ccw";

  const toggleItemRotationDirection = (item: MenuItem) => {
    const current = getItemRotationDirection(item);
    setItemRotationDirection(item, current === "cw" ? "ccw" : "cw");
  };

  const handleBackgroundLabelInput = (bg: { label?: string }, event: Event) => {
    const target = event.currentTarget;
    if (!(target instanceof HTMLInputElement)) return;
    bg.label = target.value;
    touchDraft();
  };

  const handleBackgroundSourceInput = (bg: { src: string }, event: Event) => {
    const target = event.currentTarget;
    if (!(target instanceof HTMLInputElement) && !(target instanceof HTMLSelectElement)) return;
    bg.src = target.value;
    touchDraft();
  };

  const handleWizardItemPriceInput = (item: MenuItem, event: Event) => {
    const target = event.currentTarget;
    if (!(target instanceof HTMLInputElement)) return;
    const parsed = Number(target.value);
    item.price.amount = Number.isFinite(parsed) ? parsed : 0;
    touchDraft();
  };

  const handleWizardItemAssetInput = (item: MenuItem, event: Event) => {
    const target = event.currentTarget;
    if (!(target instanceof HTMLInputElement) && !(target instanceof HTMLSelectElement)) return;
    item.media.hero360 = target.value;
    touchDraft();
  };

  const handleWizardItemScrollSrcInput = (item: MenuItem, event: Event) => {
    const target = event.currentTarget;
    if (!(target instanceof HTMLInputElement) && !(target instanceof HTMLSelectElement)) return;
    setItemScrollAnimationSrc(item, target.value);
  };
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
        {#if draft}
          <div class="wizard-item">
            <label class="editor-field">
              <span>{t("identityMode")}</span>
              <div class="editor-radio-group editor-radio-group--inline">
                <label class="editor-radio">
                  <input
                    type="radio"
                    name="identity-mode-wizard"
                    checked={(draft.meta.identityMode ?? "text") === "text"}
                    on:change={() => setIdentityMode("text")}
                  />
                  <span>{t("identityModeText")}</span>
                </label>
                <label class="editor-radio">
                  <input
                    type="radio"
                    name="identity-mode-wizard"
                    checked={draft.meta.identityMode === "logo"}
                    on:change={() => setIdentityMode("logo")}
                  />
                  <span>{t("identityModeLogo")}</span>
                </label>
              </div>
            </label>
            {#if draft.meta.identityMode === "logo"}
              <label class="editor-field">
                <span>{t("logoAsset")}</span>
                {#if mediaAssetOptions.length}
                  <select
                    class="editor-select"
                    value={draft.meta.logoSrc ?? ""}
                    on:change={handleLogoSrcEvent}
                  >
                    <option value=""></option>
                    {#each mediaAssetOptions as option}
                      <option value={option.value}>{option.label}</option>
                    {/each}
                  </select>
                {:else}
                  <input
                    type="text"
                    class="editor-input"
                    value={draft.meta.logoSrc ?? ""}
                    list="asset-files"
                    on:input={handleLogoSrcEvent}
                  />
                {/if}
              </label>
            {/if}
            <label class="editor-field">
              <span>{t("backgroundDisplayMode")}</span>
              <select
                class="editor-select"
                value={draft.meta.backgroundDisplayMode ?? "carousel"}
                on:change={(event) => {
                  const target = event.currentTarget;
                  if (!(target instanceof HTMLSelectElement)) return;
                  setBackgroundDisplayMode(target.value === "section" ? "section" : "carousel");
                }}
              >
                <option value="carousel">{t("backgroundDisplayCarousel")}</option>
                <option value="section">{t("backgroundDisplaySection")}</option>
              </select>
            </label>
            <label class="editor-field">
              <span>{t("fontRoleIdentity")}</span>
              <input
                type="text"
                class="editor-input"
                value={draft.meta.fontRoles?.identity?.family ?? ""}
                on:input={(event) => {
                  const target = event.currentTarget;
                  if (!(target instanceof HTMLInputElement)) return;
                  setFontRoleFamily("identity", target.value);
                }}
              />
            </label>
            <label class="editor-field">
              <span>{t("fontRoleIdentitySrc")}</span>
              {#if fontAssetOptions.length}
                <select
                  class="editor-select"
                  value={draft.meta.fontRoles?.identity?.source ?? ""}
                  on:change={(event) => {
                    const target = event.currentTarget;
                    if (!(target instanceof HTMLSelectElement)) return;
                    setFontRoleSource("identity", target.value);
                  }}
                >
                  <option value=""></option>
                  {#each fontAssetOptions as option}
                    <option value={option.value}>{option.label}</option>
                  {/each}
                </select>
              {:else}
                <input
                  type="text"
                  class="editor-input"
                  value={draft.meta.fontRoles?.identity?.source ?? ""}
                  list="asset-files"
                  on:input={(event) => {
                    const target = event.currentTarget;
                    if (!(target instanceof HTMLInputElement)) return;
                    setFontRoleSource("identity", target.value);
                  }}
                />
              {/if}
            </label>
          </div>
        {/if}
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
                    value={bg.label ?? ""}
                    on:input={(event) => handleBackgroundLabelInput(bg, event)}
                  />
                </label>
                <label class="editor-field">
                  <span>{t("wizardSrc")}</span>
                  {#if mediaAssetOptions.length}
                    <select
                      class="editor-select"
                      value={bg.src}
                      on:change={(event) => handleBackgroundSourceInput(bg, event)}
                    >
                      <option value=""></option>
                      {#each mediaAssetOptions as option}
                        <option value={option.value}>{option.label}</option>
                      {/each}
                    </select>
                  {:else}
                    <input
                      type="text"
                      class="editor-input"
                      value={bg.src}
                      list="asset-files"
                      on:input={(event) => handleBackgroundSourceInput(bg, event)}
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
                {#if (draft.meta.backgroundDisplayMode ?? "carousel") === "section"}
                  <label class="editor-field">
                    <span>{t("sectionBackground")}</span>
                    <select
                      class="editor-select"
                      value={category.backgroundId ?? draft.backgrounds[0]?.id ?? ""}
                      on:change={(event) => {
                        const target = event.currentTarget;
                        if (!(target instanceof HTMLSelectElement)) return;
                        setCategoryBackgroundId(category, target.value);
                      }}
                    >
                      <option value=""></option>
                      {#each draft.backgrounds as background}
                        <option value={background.id}>
                          {background.label || `${t("backgroundLabel")} ${background.id}`}
                        </option>
                      {/each}
                    </select>
                  </label>
                {/if}
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
          <label class="editor-field">
            <span>{t("fontRoleItem")}</span>
            <input
              type="text"
              class="editor-input"
              value={draft.meta.fontRoles?.item?.family ?? ""}
              on:input={(event) => {
                const target = event.currentTarget;
                if (!(target instanceof HTMLInputElement)) return;
                setFontRoleFamily("item", target.value);
              }}
            />
          </label>
          <label class="editor-field">
            <span>{t("fontRoleItemSrc")}</span>
            {#if fontAssetOptions.length}
              <select
                class="editor-select"
                value={draft.meta.fontRoles?.item?.source ?? ""}
                on:change={(event) => {
                  const target = event.currentTarget;
                  if (!(target instanceof HTMLSelectElement)) return;
                  setFontRoleSource("item", target.value);
                }}
              >
                <option value=""></option>
                {#each fontAssetOptions as option}
                  <option value={option.value}>{option.label}</option>
                {/each}
              </select>
            {:else}
              <input
                type="text"
                class="editor-input"
                value={draft.meta.fontRoles?.item?.source ?? ""}
                list="asset-files"
                on:input={(event) => {
                  const target = event.currentTarget;
                  if (!(target instanceof HTMLInputElement)) return;
                  setFontRoleSource("item", target.value);
                }}
              />
            {/if}
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
                value={wizardItem.price.amount}
                on:input={(event) => handleWizardItemPriceInput(wizardItem, event)}
              />
            </label>
            <label class="editor-field">
              <span>{t("asset360")}</span>
              {#if mediaAssetOptions.length}
                <select
                  class="editor-select"
                  value={wizardItem.media.hero360}
                  on:change={(event) => handleWizardItemAssetInput(wizardItem, event)}
                >
                  <option value=""></option>
                  {#each mediaAssetOptions as option}
                    <option value={option.value}>{option.label}</option>
                  {/each}
                </select>
              {:else}
                <input
                  type="text"
                  class="editor-input"
                  value={wizardItem.media.hero360}
                  list="asset-files"
                  on:input={(event) => handleWizardItemAssetInput(wizardItem, event)}
                />
              {/if}
            </label>
            <label class="editor-field">
              <span>{t("itemScrollAnimationMode")}</span>
              <select
                class="editor-select"
                value={wizardItem.media.scrollAnimationMode ?? "hero360"}
                on:change={(event) => {
                  const target = event.currentTarget;
                  if (!(target instanceof HTMLSelectElement)) return;
                  setItemScrollAnimationMode(
                    wizardItem,
                    target.value === "alternate" ? "alternate" : "hero360"
                  );
                }}
              >
                <option value="hero360">{t("itemScrollAnimationModeHero")}</option>
                <option value="alternate">{t("itemScrollAnimationModeAlternate")}</option>
              </select>
            </label>
            {#if (wizardItem.media.scrollAnimationMode ?? "hero360") === "alternate"}
              <label class="editor-field">
                <span>{t("itemScrollAnimationSrc")}</span>
                {#if mediaAssetOptions.length}
                  <select
                    class="editor-select"
                    value={wizardItem.media.scrollAnimationSrc ?? ""}
                    on:change={(event) => handleWizardItemScrollSrcInput(wizardItem, event)}
                  >
                    <option value=""></option>
                    {#each mediaAssetOptions as option}
                      <option value={option.value}>{option.label}</option>
                    {/each}
                  </select>
                {:else}
                  <input
                    type="text"
                    class="editor-input"
                    value={wizardItem.media.scrollAnimationSrc ?? ""}
                    list="asset-files"
                    on:input={(event) => handleWizardItemScrollSrcInput(wizardItem, event)}
                  />
                {/if}
              </label>
            {/if}
            <label class="editor-field">
              <span>{t("itemFontOverrideName")}</span>
              <input
                type="text"
                class="editor-input"
                value={wizardItem.typography?.item?.family ?? ""}
                on:input={(event) => {
                  const target = event.currentTarget;
                  if (!(target instanceof HTMLInputElement)) return;
                  setItemFontFamily(wizardItem, target.value);
                }}
              />
            </label>
            <label class="editor-field">
              <span>{t("itemFontOverrideSrc")}</span>
              {#if fontAssetOptions.length}
                <select
                  class="editor-select"
                  value={wizardItem.typography?.item?.source ?? ""}
                  on:change={(event) => {
                    const target = event.currentTarget;
                    if (!(target instanceof HTMLSelectElement)) return;
                    setItemFontSource(wizardItem, target.value);
                  }}
                >
                  <option value=""></option>
                  {#each fontAssetOptions as option}
                    <option value={option.value}>{option.label}</option>
                  {/each}
                </select>
              {:else}
                <input
                  type="text"
                  class="editor-input"
                  value={wizardItem.typography?.item?.source ?? ""}
                  list="asset-files"
                  on:input={(event) => {
                    const target = event.currentTarget;
                    if (!(target instanceof HTMLInputElement)) return;
                    setItemFontSource(wizardItem, target.value);
                  }}
                />
              {/if}
            </label>
            <div class="editor-field">
              <div class="edit-item__rotation">
                <button
                  class="editor-outline editor-toggle-direction"
                  type="button"
                  on:click={() => toggleItemRotationDirection(wizardItem)}
                >
                  <span class="editor-radio__icon" aria-hidden="true">
                    {getItemRotationDirection(wizardItem) === "cw" ? "↻" : "↺"}
                  </span>
                  <span>
                    {getItemRotationDirection(wizardItem) === "cw"
                      ? t("rotationClockwise")
                      : t("rotationCounterclockwise")}
                  </span>
                </button>
                <small class="editor-hint">{t("rotationChooseHint")}</small>
              </div>
            </div>
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
