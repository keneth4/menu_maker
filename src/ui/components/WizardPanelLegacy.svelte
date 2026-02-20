<script lang="ts">
  import { deriveFontFamilyFromSource } from "../../application/typography/fontWorkflow";
  import { mapLegacyAssetRelativeToManaged, toAssetRelativeForUi } from "../../application/assets/workspaceWorkflow";
  import { fontOptions } from "../config/staticOptions";
  import type { TemplateOption } from "../../core/templates/templateOptions";
  import type { MenuCategory, MenuItem, MenuProject, ProjectFontRole } from "../../lib/types";

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
  export let sectionBackgroundOptionsByCategory: Record<
    string,
    Array<{ value: string; label: string }>
  > = {};
  export let sectionBackgroundNeedsCoverage = false;
  export let sectionBackgroundHasDuplicates = false;

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
  export let setFontRoleSelection: (
    role: ProjectFontRole,
    selection: string
  ) => void = () => {};
  export let setItemFontSelection: (item: MenuItem, selection: string) => void = () => {};
  export let setItemPriceVisible: (item: MenuItem, visible: boolean) => void = () => {};
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

  let backgroundAssetOptions: Array<{ value: string; label: string }> = [];
  let itemAssetOptions: Array<{ value: string; label: string }> = [];
  let fontAssetOptions: Array<{ value: string; label: string }> = [];
  let logoAssetOptions: Array<{ value: string; label: string }> = [];
  const BACKGROUND_ROOT = "originals/backgrounds";
  const ITEM_ROOT = "originals/items";
  const FONT_ROOT = "originals/fonts";
  const LOGO_ROOT = "originals/logos";
  let rolePreviewSelections: Partial<Record<ProjectFontRole, string>> = {};
  let itemPreviewSelections: Record<string, string> = {};
  const isOptionWithinRoot = (optionValue: string, root: string) => {
    const normalized = mapLegacyAssetRelativeToManaged(toAssetRelativeForUi(optionValue));
    return normalized === root || normalized.startsWith(`${root}/`);
  };
  $: backgroundAssetOptions = assetOptions.filter((option) =>
    isOptionWithinRoot(option.value, BACKGROUND_ROOT)
  );
  $: itemAssetOptions = assetOptions.filter((option) =>
    isOptionWithinRoot(option.value, ITEM_ROOT)
  );
  $: fontAssetOptions = assetOptions.filter((option) =>
    isOptionWithinRoot(option.value, FONT_ROOT)
  );
  $: logoAssetOptions = assetOptions.filter((option) => {
    const normalized = mapLegacyAssetRelativeToManaged(toAssetRelativeForUi(option.value));
    return normalized === LOGO_ROOT || normalized.startsWith(`${LOGO_ROOT}/`);
  });

  const FONT_SELECTION_DEFAULT = "default";
  const FONT_SELECTION_BUILTIN_PREFIX = "builtin:";
  const FONT_SELECTION_ASSET_PREFIX = "asset:";

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

  const extractFilenameFromPath = (value: string) => {
    const normalized = value.trim();
    if (!normalized || normalized.startsWith("data:")) return "";
    const [withoutHash] = normalized.split("#");
    const [withoutQuery] = withoutHash.split("?");
    const filename = withoutQuery.split(/[\\/]/).filter(Boolean).pop() ?? "";
    if (!filename) return "";
    try {
      return decodeURIComponent(filename);
    } catch {
      return filename;
    }
  };

  const getBackgroundDisplayLabel = (
    bg: { src: string; originalSrc?: string },
    index: number
  ) =>
    extractFilenameFromPath(bg.originalSrc ?? "") ||
    extractFilenameFromPath(bg.src ?? "") ||
    `${t("backgroundLabel")} ${index + 1}`;

  const handleBackgroundSourceInput = (bg: { src: string; originalSrc?: string }, event: Event) => {
    const target = event.currentTarget;
    if (!(target instanceof HTMLInputElement) && !(target instanceof HTMLSelectElement)) return;
    const nextValue = target.value;
    bg.src = nextValue;
    if (nextValue && !nextValue.startsWith("data:")) {
      bg.originalSrc = nextValue;
    }
    touchDraft();
  };

  const hasOptionValue = (options: Array<{ value: string; label: string }>, value: string) =>
    options.some((option) => option.value === value);

  const encodeBuiltInSelection = (family: string) => `${FONT_SELECTION_BUILTIN_PREFIX}${family}`;
  const encodeAssetSelection = (source: string) => `${FONT_SELECTION_ASSET_PREFIX}${source}`;

  const resolveRoleFontSelection = (role: ProjectFontRole) => {
    const roleConfig = draft?.meta.fontRoles?.[role];
    const source = roleConfig?.source?.trim() ?? "";
    if (source) return encodeAssetSelection(source);
    const family = roleConfig?.family?.trim() ?? "";
    if (family) return encodeBuiltInSelection(family);
    return FONT_SELECTION_DEFAULT;
  };

  const resolveItemFontSelection = (item: MenuItem) => {
    const itemConfig = item.typography?.item;
    const source = itemConfig?.source?.trim() ?? "";
    if (source) return encodeAssetSelection(source);
    const family = itemConfig?.family?.trim() ?? "";
    if (family) return encodeBuiltInSelection(family);
    return FONT_SELECTION_DEFAULT;
  };

  const resolveAssetSelectionSource = (selection: string) =>
    selection.startsWith(FONT_SELECTION_ASSET_PREFIX)
      ? selection.slice(FONT_SELECTION_ASSET_PREFIX.length).trim()
      : "";

  const hasFontAssetSource = (source: string) => hasOptionValue(fontAssetOptions, source);

  type WizardRole = Exclude<ProjectFontRole, "identity">;
  const roleFieldLabel: Record<WizardRole, string> = {
    restaurant: "fontRoleRestaurant",
    title: "fontRoleTitle",
    section: "fontRoleSection",
    item: "fontRoleItem"
  };
  const wizardIdentityRoleOrder: WizardRole[] = ["restaurant", "title"];

  const handleRoleFontSelectionInput = (role: WizardRole, event: Event) => {
    const target = event.currentTarget;
    if (!(target instanceof HTMLSelectElement)) return;
    rolePreviewSelections = {
      ...rolePreviewSelections,
      [role]: target.value
    };
    setFontRoleSelection(role, target.value);
  };

  const getRoleFontSelectionForUi = (
    role: WizardRole,
    previewSelections: Partial<Record<ProjectFontRole, string>>
  ) => previewSelections[role] ?? resolveRoleFontSelection(role);

  const handleItemFontSelectionInput = (item: MenuItem, event: Event) => {
    const target = event.currentTarget;
    if (!(target instanceof HTMLSelectElement)) return;
    itemPreviewSelections = {
      ...itemPreviewSelections,
      [item.id]: target.value
    };
    setItemFontSelection(item, target.value);
  };

  const getItemFontSelectionForUi = (
    item: MenuItem,
    previewSelections: Record<string, string>
  ) => previewSelections[item.id] ?? resolveItemFontSelection(item);

  const resolveBackgroundSourceSelection = (bg: { src: string; originalSrc?: string }) => {
    const direct = bg.src?.trim() ?? "";
    if (direct && hasOptionValue(backgroundAssetOptions, direct)) {
      return direct;
    }
    const canonical = bg.originalSrc?.trim() ?? "";
    if (canonical && hasOptionValue(backgroundAssetOptions, canonical)) {
      return canonical;
    }
    return direct;
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
    const nextValue = target.value;
    item.media.hero360 = nextValue;
    if (!nextValue || nextValue.startsWith("data:")) {
      item.media.originalHero360 = "";
    } else {
      item.media.originalHero360 = nextValue;
    }
    touchDraft();
  };

  const handleWizardItemScrollSrcInput = (item: MenuItem, event: Event) => {
    const target = event.currentTarget;
    if (!(target instanceof HTMLInputElement) && !(target instanceof HTMLSelectElement)) return;
    setItemScrollAnimationSrc(item, target.value);
  };

  const handleWizardShowPriceToggle = (item: MenuItem, event: Event) => {
    const target = event.currentTarget;
    if (!(target instanceof HTMLInputElement)) return;
    setItemPriceVisible(item, target.checked);
  };

  const resolveWizardItemAssetSelection = (item: MenuItem) => {
    const direct = item.media.hero360?.trim() ?? "";
    if (direct && hasOptionValue(itemAssetOptions, direct)) {
      return direct;
    }
    const canonical = item.media.originalHero360?.trim() ?? "";
    if (canonical && hasOptionValue(itemAssetOptions, canonical)) {
      return canonical;
    }
    return canonical || direct;
  };

  const resolveWizardItemScrollAnimationSelection = (item: MenuItem) => {
    const source = item.media.scrollAnimationSrc?.trim() ?? "";
    if (!source) return "";
    if (hasOptionValue(itemAssetOptions, source)) {
      return source;
    }
    return source;
  };

  const resolveBuiltInFamilyFromSelection = (selection: string) =>
    selection.startsWith(FONT_SELECTION_BUILTIN_PREFIX)
      ? selection.slice(FONT_SELECTION_BUILTIN_PREFIX.length).trim()
      : "";

  const buildFontPreviewStyle = (selection: string) => {
    const builtInFamily = resolveBuiltInFamilyFromSelection(selection);
    const assetSource = resolveAssetSelectionSource(selection);
    const family =
      builtInFamily ||
      (assetSource ? deriveFontFamilyFromSource(assetSource) : "") ||
      "Fraunces";
    const escaped = family.replace(/"/g, '\\"');
    return `font-family:"${escaped}","Fraunces","Georgia",serif;`;
  };

  $: {
    let changed = false;
    const next = { ...rolePreviewSelections };
    const allRoles: WizardRole[] = ["restaurant", "title", "section", "item"];
    for (const role of allRoles) {
      if (next[role] !== undefined && next[role] === resolveRoleFontSelection(role)) {
        delete next[role];
        changed = true;
      }
    }
    if (changed) {
      rolePreviewSelections = next;
    }
  }

  $: if (wizardItem) {
    const optimistic = itemPreviewSelections[wizardItem.id];
    const resolved = resolveItemFontSelection(wizardItem);
    if (optimistic !== undefined && optimistic === resolved) {
      const next = { ...itemPreviewSelections };
      delete next[wizardItem.id];
      itemPreviewSelections = next;
    }
  }

  const ensureDraftMetaLocalizedField = (key: "restaurantName" | "title") => {
    if (!draft) return null;
    const meta = draft.meta as Record<string, unknown>;
    const current = meta[key];
    if (current && typeof current === "object") {
      const localized = current as Record<string, unknown>;
      if (typeof localized.es !== "string") localized.es = "";
      if (typeof localized.en !== "string") localized.en = "";
      return localized as Record<string, string>;
    }
    const created: Record<string, string> = { es: "", en: "" };
    meta[key] = created;
    touchDraft();
    return created;
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
            {#if (draft.meta.identityMode ?? "text") === "text"}
              <label class="editor-field">
                <span>{t("restaurantName")}</span>
                <input
                  type="text"
                  class="editor-input"
                  value={getLocalizedValue(draft.meta.restaurantName, wizardLang)}
                  on:input={(event) => {
                    const localized = ensureDraftMetaLocalizedField("restaurantName");
                    if (!localized) return;
                    handleLocalizedInput(localized, wizardLang, event);
                  }}
                />
              </label>
              <label class="editor-field">
                <span>{t("menuTitle")}</span>
                <input
                  type="text"
                  class="editor-input"
                  value={getLocalizedValue(draft.meta.title, wizardLang)}
                  on:input={(event) => {
                    const localized = ensureDraftMetaLocalizedField("title");
                    if (!localized) return;
                    handleLocalizedInput(localized, wizardLang, event);
                  }}
                />
              </label>
            {:else if draft.meta.identityMode === "logo"}
              <label class="editor-field">
                <span>{t("logoAsset")}</span>
                {#if logoAssetOptions.length}
                  <select
                    class="editor-select"
                    value={draft.meta.logoSrc ?? ""}
                    on:change={handleLogoSrcEvent}
                  >
                    <option value="" disabled hidden>{t("selectImagePlaceholder")}</option>
                    {#each logoAssetOptions as option}
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
            {#each wizardIdentityRoleOrder as role}
              <label class="editor-field">
                <span>{t("textStyle")} · {t(roleFieldLabel[role])}</span>
                <select
                  class="editor-select"
                  value={getRoleFontSelectionForUi(role, rolePreviewSelections)}
                  on:change={(event) => handleRoleFontSelectionInput(role, event)}
                >
                  <option value={FONT_SELECTION_DEFAULT}>{t("textStyleDefault")}</option>
                  {#each fontOptions as font}
                    <option value={encodeBuiltInSelection(font.value)}>{font.label}</option>
                  {/each}
                  {#if resolveAssetSelectionSource(getRoleFontSelectionForUi(role, rolePreviewSelections)) &&
                  !hasFontAssetSource(resolveAssetSelectionSource(getRoleFontSelectionForUi(role, rolePreviewSelections)))}
                    <option value={encodeAssetSelection(resolveAssetSelectionSource(getRoleFontSelectionForUi(role, rolePreviewSelections)))}>
                      {resolveAssetSelectionSource(getRoleFontSelectionForUi(role, rolePreviewSelections))}
                    </option>
                  {/if}
                  {#each fontAssetOptions as option}
                    <option value={encodeAssetSelection(option.value)}>{option.label}</option>
                  {/each}
                </select>
                <p
                  class="editor-font-preview"
                  style={buildFontPreviewStyle(getRoleFontSelectionForUi(role, rolePreviewSelections))}
                >
                  {t("fontPreviewSample")}
                </p>
              </label>
            {/each}
          </div>
        {/if}
        <button class="editor-outline" type="button" on:click={addBackground}>
          {t("wizardAddBg")}
        </button>
        {#if draft}
          <div class="wizard-list">
            {#each draft.backgrounds as bg, index}
              <div class="wizard-item">
                <p class="edit-hint">{getBackgroundDisplayLabel(bg, index)}</p>
                <label class="editor-field">
                  <span>{t("wizardSrc")}</span>
                  {#if backgroundAssetOptions.length}
                    <select
                      class="editor-select"
                      value={resolveBackgroundSourceSelection(bg)}
                      on:change={(event) => handleBackgroundSourceInput(bg, event)}
                    >
                      <option value="" disabled hidden>{t("selectImagePlaceholder")}</option>
                      {#if resolveBackgroundSourceSelection(bg) &&
                      !hasOptionValue(backgroundAssetOptions, resolveBackgroundSourceSelection(bg))}
                        <option value={resolveBackgroundSourceSelection(bg)}>
                          {getBackgroundDisplayLabel(bg, index)}
                        </option>
                      {/if}
                      {#each backgroundAssetOptions as option}
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
      {#if draft?.meta.backgroundDisplayMode === "section" && sectionBackgroundNeedsCoverage}
        <p class="wizard-warning">{t("sectionBackgroundNeedsCoverage")}</p>
      {/if}
      {#if draft?.meta.backgroundDisplayMode === "section" && sectionBackgroundHasDuplicates}
        <p class="wizard-warning">{t("sectionBackgroundNeedsUnique")}</p>
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
            <span class="editor-action-icon" aria-hidden="true">＋</span>
            <span>{t("wizardAddCategory")}</span>
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
                      value={category.backgroundId ?? ""}
                      on:change={(event) => {
                        const target = event.currentTarget;
                        if (!(target instanceof HTMLSelectElement)) return;
                        setCategoryBackgroundId(category, target.value);
                      }}
                    >
                      <option value=""></option>
                      {#each sectionBackgroundOptionsByCategory[category.id] ?? [] as background}
                        <option value={background.value}>
                          {background.label}
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
            <span>{t("textStyle")} · {t("fontRoleItem")}</span>
            <select
              class="editor-select"
              value={getRoleFontSelectionForUi("item", rolePreviewSelections)}
              on:change={(event) => handleRoleFontSelectionInput("item", event)}
            >
              <option value={FONT_SELECTION_DEFAULT}>{t("textStyleDefault")}</option>
              {#each fontOptions as font}
                <option value={encodeBuiltInSelection(font.value)}>{font.label}</option>
              {/each}
              {#if resolveAssetSelectionSource(getRoleFontSelectionForUi("item", rolePreviewSelections)) &&
              !hasFontAssetSource(resolveAssetSelectionSource(getRoleFontSelectionForUi("item", rolePreviewSelections)))}
                <option value={encodeAssetSelection(resolveAssetSelectionSource(getRoleFontSelectionForUi("item", rolePreviewSelections)))}>
                  {resolveAssetSelectionSource(getRoleFontSelectionForUi("item", rolePreviewSelections))}
                </option>
              {/if}
              {#each fontAssetOptions as option}
                <option value={encodeAssetSelection(option.value)}>{option.label}</option>
              {/each}
            </select>
            <p
              class="editor-font-preview"
              style={buildFontPreviewStyle(getRoleFontSelectionForUi("item", rolePreviewSelections))}
            >
              {t("fontPreviewSample")}
            </p>
          </label>
          <div class="edit-actions">
            <button
              class="editor-outline editor-icon-btn"
              type="button"
              aria-label={t("wizardAddDish")}
              title={t("wizardAddDish")}
              on:click={addWizardDish}
            >
              <span class="editor-action-icon" aria-hidden="true">＋</span>
            </button>
            <button
              class="editor-outline danger editor-icon-btn"
              type="button"
              aria-label={t("delete")}
              title={t("delete")}
              on:click={removeWizardDish}
            >
              <span class="editor-action-icon" aria-hidden="true">✕</span>
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
            <label class="editor-field editor-inline editor-inline--spaced">
              <span>{t("showPrice")}</span>
              <input
                type="checkbox"
                checked={wizardItem.priceVisible !== false}
                on:change={(event) => handleWizardShowPriceToggle(wizardItem, event)}
              />
            </label>
            {#if wizardItem.priceVisible !== false}
              <label class="editor-field">
                <span>{t("price")}</span>
                <input
                  type="number"
                  class="editor-input"
                  value={wizardItem.price.amount}
                  on:input={(event) => handleWizardItemPriceInput(wizardItem, event)}
                />
              </label>
            {/if}
            <label class="editor-field">
              <span>{t("asset360")}</span>
              {#if itemAssetOptions.length}
                <select
                  class="editor-select"
                  value={resolveWizardItemAssetSelection(wizardItem)}
                  on:change={(event) => handleWizardItemAssetInput(wizardItem, event)}
                >
                  <option value="" disabled hidden>{t("selectImagePlaceholder")}</option>
                  {#if resolveWizardItemAssetSelection(wizardItem) &&
                  !hasOptionValue(itemAssetOptions, resolveWizardItemAssetSelection(wizardItem))}
                    <option value={resolveWizardItemAssetSelection(wizardItem)}>
                      {extractFilenameFromPath(resolveWizardItemAssetSelection(wizardItem))}
                    </option>
                  {/if}
                  {#each itemAssetOptions as option}
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
                {#if itemAssetOptions.length}
                  <select
                    class="editor-select"
                    value={resolveWizardItemScrollAnimationSelection(wizardItem)}
                    on:change={(event) => handleWizardItemScrollSrcInput(wizardItem, event)}
                  >
                    <option value="" disabled hidden>{t("selectImagePlaceholder")}</option>
                    {#if resolveWizardItemScrollAnimationSelection(wizardItem) &&
                    !hasOptionValue(itemAssetOptions, resolveWizardItemScrollAnimationSelection(wizardItem))}
                      <option value={resolveWizardItemScrollAnimationSelection(wizardItem)}>
                        {extractFilenameFromPath(resolveWizardItemScrollAnimationSelection(wizardItem))}
                      </option>
                    {/if}
                    {#each itemAssetOptions as option}
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
              <span>{t("textStyle")}</span>
              <select
                class="editor-select"
                value={getItemFontSelectionForUi(wizardItem, itemPreviewSelections)}
                on:change={(event) => handleItemFontSelectionInput(wizardItem, event)}
              >
                <option value={FONT_SELECTION_DEFAULT}>{t("textStyleDefault")}</option>
                {#each fontOptions as font}
                  <option value={encodeBuiltInSelection(font.value)}>{font.label}</option>
                {/each}
                {#if resolveAssetSelectionSource(getItemFontSelectionForUi(wizardItem, itemPreviewSelections)) &&
                !hasFontAssetSource(resolveAssetSelectionSource(getItemFontSelectionForUi(wizardItem, itemPreviewSelections)))}
                  <option
                    value={encodeAssetSelection(resolveAssetSelectionSource(getItemFontSelectionForUi(wizardItem, itemPreviewSelections)))}
                  >
                    {resolveAssetSelectionSource(getItemFontSelectionForUi(wizardItem, itemPreviewSelections))}
                  </option>
                {/if}
                {#each fontAssetOptions as option}
                  <option value={encodeAssetSelection(option.value)}>{option.label}</option>
                {/each}
              </select>
              <p
                class="editor-font-preview"
                style={buildFontPreviewStyle(getItemFontSelectionForUi(wizardItem, itemPreviewSelections))}
              >
                {t("fontPreviewSample")}
              </p>
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
      <span class="editor-action-icon" aria-hidden="true">◀</span>
      <span>{t("wizardBack")}</span>
    </button>
    {#if wizardStep < wizardSteps.length - 1}
      <button
        class="editor-cta"
        type="button"
        on:click={goNextStep}
        disabled={!isWizardStepValid(wizardStep)}
      >
        <span>{t("wizardNext")}</span>
        <span class="editor-action-icon" aria-hidden="true">▶</span>
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
