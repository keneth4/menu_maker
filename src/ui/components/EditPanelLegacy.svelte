<script lang="ts">
  import { deriveFontFamilyFromSource } from "../../application/typography/fontWorkflow";
  import { fontOptions } from "../config/staticOptions";
  import type { MenuCategory, MenuItem, MenuProject, ProjectFontRole } from "../../lib/types";

  type CommonAllergen = {
    id: string;
    label: Record<string, string>;
  };

  export let t: (key: string) => string = (key) => key;
  export let draft: MenuProject | null = null;
  export let deviceMode: "mobile" | "desktop" = "desktop";
  export let previewMode: "device" | "mobile" | "full" = "device";
  export let editPanel: "identity" | "background" | "section" | "dish" = "identity";
  export let editLang = "es";
  export let selectedCategoryId = "";
  export let selectedItemId = "";
  export let selectedCategory: MenuCategory | null = null;
  export let selectedItem: MenuItem | null = null;
  export let assetOptions: Array<{ value: string; label: string }> = [];
  export let sectionBackgroundOptionsByCategory: Record<
    string,
    Array<{ value: string; label: string }>
  > = {};
  export let sectionBackgroundNeedsCoverage = false;
  export let sectionBackgroundHasDuplicates = false;
  export let commonAllergenCatalog: CommonAllergen[] = [];

  export let cycleEditLang: () => void = () => {};
  export let ensureRestaurantName: () => Record<string, string> | null = () => null;
  export let ensureMetaTitle: () => Record<string, string> | null = () => null;
  export let handleLocalizedInput: (
    localized: Record<string, string>,
    lang: string,
    event: Event
  ) => void = () => {};
  export let getLocalizedValue: (
    value: Record<string, string> | undefined,
    locale: string,
    fallback?: string
  ) => string = () => "";
  export let addSection: () => void = () => {};
  export let deleteSection: () => void = () => {};
  export let deleteSectionById: (sectionId: string) => void = () => {};
  export let setSectionNameById: (sectionId: string, lang: string, value: string) => void = () => {};
  export let addBackground: () => void = () => {};
  export let moveBackground: (id: string, direction: -1 | 1) => void = () => {};
  export let removeBackground: (id: string) => void = () => {};
  export let setBackgroundDisplayMode: (mode: "carousel" | "section") => void = () => {};
  export let setCategoryBackgroundId: (category: MenuCategory, backgroundId: string) => void = () =>
    {};
  export let backgroundCarouselSeconds = 9;
  export let setBackgroundCarouselSeconds: (seconds: number) => void = () => {};
  export let goPrevDish: () => void = () => {};
  export let goNextDish: () => void = () => {};
  export let addDish: () => void = () => {};
  export let deleteDish: () => void = () => {};
  export let textOf: (value: Record<string, string> | undefined, fallback?: string) => string =
    () => "";
  export let handleDescriptionInput: (item: MenuItem, lang: string, event: Event) => void =
    () => {};
  export let handleLongDescriptionInput: (item: MenuItem, lang: string, event: Event) => void =
    () => {};
  export let isCommonAllergenChecked: (item: MenuItem, id: string) => boolean = () => false;
  export let handleCommonAllergenToggle: (
    item: MenuItem,
    allergenId: string,
    event: Event
  ) => void = () => {};
  export let getCommonAllergenLabel: (allergen: CommonAllergen, lang?: string) => string =
    () => "";
  export let getCustomAllergensInput: (item: MenuItem, lang?: string) => string = () => "";
  export let handleCustomAllergensInput: (item: MenuItem, lang: string, event: Event) => void =
    () => {};
  export let handleVeganToggle: (item: MenuItem, event: Event) => void = () => {};
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
  export let touchDraft: () => void = () => {};
  let itemsTabDisabled = false;
  let editingSectionId = "";
  let editingSectionValue = "";
  let sectionNameInput: HTMLInputElement | null = null;
  let rolePreviewSelections: Partial<Record<ProjectFontRole, string>> = {};
  let itemPreviewSelections: Record<string, string> = {};

  let mediaAssetOptions: Array<{ value: string; label: string }> = [];
  let fontAssetOptions: Array<{ value: string; label: string }> = [];
  $: mediaAssetOptions = assetOptions.filter((option) => !option.value.includes("/fonts/"));
  $: fontAssetOptions = assetOptions.filter((option) => option.value.includes("/fonts/"));
  $: itemsTabDisabled = (draft?.categories.length ?? 0) === 0;
  $: if (itemsTabDisabled && editPanel === "dish") {
    editPanel = "section";
  }
  $: if (editingSectionId && sectionNameInput) {
    sectionNameInput.focus();
    sectionNameInput.select();
  }
  $: if (editingSectionId && draft && !draft.categories.some((category) => category.id === editingSectionId)) {
    editingSectionId = "";
    editingSectionValue = "";
  }

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

  const handleDishAssetInput = (item: MenuItem, event: Event) => {
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

  const handleItemScrollAnimationSourceInput = (item: MenuItem, event: Event) => {
    const target = event.currentTarget;
    if (!(target instanceof HTMLInputElement) && !(target instanceof HTMLSelectElement)) return;
    setItemScrollAnimationSrc(item, target.value);
  };

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

  const roleFieldLabel: Record<ProjectFontRole, string> = {
    restaurant: "fontRoleRestaurant",
    title: "fontRoleTitle",
    identity: "fontRoleIdentity",
    section: "fontRoleSection",
    item: "fontRoleItem"
  };

  const roleFieldOrder: ProjectFontRole[] = [
    "restaurant",
    "title",
    "identity",
    "section",
    "item"
  ];

  const handleRoleFontSelectionInput = (role: ProjectFontRole, event: Event) => {
    const target = event.currentTarget;
    if (!(target instanceof HTMLInputElement) && !(target instanceof HTMLSelectElement)) return;
    rolePreviewSelections = {
      ...rolePreviewSelections,
      [role]: target.value
    };
    setFontRoleSelection(role, target.value);
  };

  const getRoleFontSelectionForUi = (
    role: ProjectFontRole,
    previewSelections: Partial<Record<ProjectFontRole, string>>
  ) => previewSelections[role] ?? resolveRoleFontSelection(role);

  const hasOptionValue = (options: Array<{ value: string; label: string }>, value: string) =>
    options.some((option) => option.value === value);

  const resolveBackgroundSourceSelection = (bg: { src: string; originalSrc?: string }) => {
    const direct = bg.src?.trim() ?? "";
    if (direct && hasOptionValue(mediaAssetOptions, direct)) {
      return direct;
    }
    const canonical = bg.originalSrc?.trim() ?? "";
    if (canonical && hasOptionValue(mediaAssetOptions, canonical)) {
      return canonical;
    }
    return direct;
  };

  const resolveDishAssetSelection = (item: MenuItem) => {
    const direct = item.media.hero360?.trim() ?? "";
    if (direct && hasOptionValue(mediaAssetOptions, direct)) {
      return direct;
    }
    const canonical = item.media.originalHero360?.trim() ?? "";
    if (canonical && hasOptionValue(mediaAssetOptions, canonical)) {
      return canonical;
    }
    return canonical || direct;
  };

  const handleItemFontSelectionInput = (item: MenuItem, event: Event) => {
    const target = event.currentTarget;
    if (!(target instanceof HTMLInputElement) && !(target instanceof HTMLSelectElement)) return;
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

  const handleDishPriceInput = (item: MenuItem, event: Event) => {
    const target = event.currentTarget;
    if (!(target instanceof HTMLInputElement)) return;
    const parsed = Number(target.value);
    item.price.amount = Number.isFinite(parsed) ? parsed : 0;
    touchDraft();
  };

  const handleShowPriceToggle = (item: MenuItem, event: Event) => {
    const target = event.currentTarget;
    if (!(target instanceof HTMLInputElement)) return;
    setItemPriceVisible(item, target.checked);
  };

  const handleBackgroundCarouselSecondsInput = (event: Event) => {
    const target = event.currentTarget;
    if (!(target instanceof HTMLInputElement)) return;
    setBackgroundCarouselSeconds(Number(target.value));
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

  const startInlineSectionEdit = (category: MenuCategory) => {
    selectedCategoryId = category.id;
    editingSectionId = category.id;
    editingSectionValue = category.name?.[editLang] ?? "";
  };

  const cancelInlineSectionEdit = () => {
    editingSectionId = "";
    editingSectionValue = "";
  };

  const commitInlineSectionEdit = (category: MenuCategory) => {
    setSectionNameById(category.id, editLang, editingSectionValue.trim());
    cancelInlineSectionEdit();
  };

  const handleInlineSectionKeydown = (category: MenuCategory, event: KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commitInlineSectionEdit(category);
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      cancelInlineSectionEdit();
    }
  };

  const handleAddSectionClick = () => {
    const previousCategoryIds = new Set((draft?.categories ?? []).map((category) => category.id));
    addSection();
    if (!draft) return;
    const createdCategory = draft.categories.find((category) => !previousCategoryIds.has(category.id));
    if (!createdCategory) return;
    startInlineSectionEdit(createdCategory);
  };

  $: {
    let changed = false;
    const next = { ...rolePreviewSelections };
    for (const role of roleFieldOrder) {
      if (next[role] !== undefined && next[role] === resolveRoleFontSelection(role)) {
        delete next[role];
        changed = true;
      }
    }
    if (changed) {
      rolePreviewSelections = next;
    }
  }

  $: if (selectedItem) {
    const optimistic = itemPreviewSelections[selectedItem.id];
    const resolved = resolveItemFontSelection(selectedItem);
    if (optimistic !== undefined && optimistic === resolved) {
      const next = { ...itemPreviewSelections };
      delete next[selectedItem.id];
      itemPreviewSelections = next;
    }
  }
</script>

{#if deviceMode === "mobile" && previewMode === "full"}
  <p class="mt-2 text-xs text-amber-200">
    {t("tipRotate")}
  </p>
{/if}

{#if draft}
  <div class="edit-shell">
    <div class="edit-subtabs">
      <button
        class="edit-subtab {editPanel === 'identity' ? 'active' : ''}"
        type="button"
        on:click={() => (editPanel = 'identity')}
      >
        {t("editIdentity")}
      </button>
      <button
        class="edit-subtab {editPanel === 'background' ? 'active' : ''}"
        type="button"
        on:click={() => (editPanel = 'background')}
      >
        {t("editBackgrounds")}
      </button>
      <button
        class="edit-subtab {editPanel === 'section' ? 'active' : ''}"
        type="button"
        on:click={() => (editPanel = 'section')}
      >
        {t("editSections")}
      </button>
      <button
        class="edit-subtab {editPanel === 'dish' ? 'active' : ''} {itemsTabDisabled ? 'disabled' : ''}"
        type="button"
        disabled={itemsTabDisabled}
        on:click={() => {
          if (itemsTabDisabled) return;
          editPanel = "dish";
        }}
      >
        {t("editDishes")}
      </button>
      <button
        class="edit-lang-chip"
        type="button"
        aria-label={t("editLang")}
        title={t("editLang")}
        on:click={cycleEditLang}
      >
        <span aria-hidden="true">🌐</span>
        <span>{editLang.toUpperCase()}</span>
      </button>
    </div>
    <p class="edit-hierarchy">
      {editPanel === "background" ? t("backgroundHint") : t("editHierarchyHint")}
    </p>
    {#if itemsTabDisabled}
      <p class="edit-hint">{t("editItemsNeedsSections")}</p>
    {/if}

    {#if editPanel === "identity"}
      <div class="edit-block">
        <p class="edit-block__title">{t("identityMode")}</p>
        <div class="editor-radio-group editor-radio-group--inline">
          <label class="editor-radio">
            <input
              type="radio"
              name="identity-mode-edit"
              checked={(draft.meta.identityMode ?? "text") === "text"}
              on:change={() => setIdentityMode("text")}
            />
            <span>{t("identityModeText")}</span>
          </label>
          <label class="editor-radio">
            <input
              type="radio"
              name="identity-mode-edit"
              checked={draft.meta.identityMode === "logo"}
              on:change={() => setIdentityMode("logo")}
            />
            <span>{t("identityModeLogo")}</span>
          </label>
        </div>
      </div>
      {#if draft.meta.identityMode === "logo"}
        <div class="edit-block">
          <p class="edit-block__title">{t("logoAsset")}</p>
          <label class="editor-field">
            <span>{t("wizardSrc")}</span>
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
        </div>
      {/if}
      <div class="edit-block">
        <p class="edit-block__title">{t("restaurantName")}</p>
        <label class="editor-field">
          <span>{editLang.toUpperCase()}</span>
          <input
            type="text"
            class="editor-input"
            value={draft.meta.restaurantName?.[editLang] ?? ""}
            on:input={(event) => {
              const name = ensureRestaurantName();
              if (!name) return;
              handleLocalizedInput(name, editLang, event);
            }}
          />
        </label>
      </div>
      <div class="edit-block">
        <p class="edit-block__title">{t("menuTitle")}</p>
        <label class="editor-field">
          <span>{editLang.toUpperCase()}</span>
          <input
            type="text"
            class="editor-input"
            value={draft.meta.title?.[editLang] ?? ""}
            on:input={(event) => {
              const title = ensureMetaTitle();
              if (!title) return;
              handleLocalizedInput(title, editLang, event);
            }}
          />
        </label>
      </div>
      {#each roleFieldOrder as role}
        <div class="edit-block">
          <p class="edit-block__title">{t(roleFieldLabel[role])}</p>
          <label class="editor-field">
            <span>{t("textStyle")}</span>
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
            {#if role === "identity"}
              <small class="editor-hint">{t("fontRoleIdentityHint")}</small>
            {/if}
            <p
              class="editor-font-preview"
              style={buildFontPreviewStyle(getRoleFontSelectionForUi(role, rolePreviewSelections))}
            >
              {t("fontPreviewSample")}
            </p>
          </label>
        </div>
      {/each}
    {:else if editPanel === "background"}
      <div class="edit-block">
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
      </div>
      <div class="edit-block">
        {#if (draft.meta.backgroundDisplayMode ?? "carousel") === "carousel"}
        <label class="editor-field">
          <span>{t("backgroundCarouselDuration")}</span>
          <div class="background-duration-field">
            <input
              type="number"
              min="2"
              max="60"
              step="1"
              class="editor-input"
              value={backgroundCarouselSeconds}
              on:input={handleBackgroundCarouselSecondsInput}
            />
            <span class="background-duration-unit">{t("secondsShort")}</span>
          </div>
          <small class="editor-hint">{t("backgroundCarouselDurationHint")}</small>
        </label>
        {/if}
        <div class="edit-actions">
          <button class="editor-outline" type="button" on:click={addBackground}>
            {t("wizardAddBg")}
          </button>
        </div>
        <p class="edit-block__title">{t("backgroundOrder")}</p>
        {#if draft.backgrounds.length === 0}
          <p class="edit-hint">{t("wizardMissingBackground")}</p>
        {:else}
          <div class="background-carousel-list">
            {#each draft.backgrounds as bg, index}
              <div class="background-carousel-item">
                <div class="background-carousel-item__header">
                  <p class="background-carousel-item__index">
                    {getBackgroundDisplayLabel(bg, index)}
                  </p>
                  <div class="background-carousel-item__actions">
                    <button
                      class="editor-outline editor-icon-btn"
                      type="button"
                      disabled={index === 0}
                      aria-label={t("moveBackgroundUp")}
                      title={t("moveBackgroundUp")}
                      on:click={() => moveBackground(bg.id, -1)}
                    >
                      <span class="editor-action-icon" aria-hidden="true">↑</span>
                    </button>
                    <button
                      class="editor-outline editor-icon-btn"
                      type="button"
                      disabled={index === draft.backgrounds.length - 1}
                      aria-label={t("moveBackgroundDown")}
                      title={t("moveBackgroundDown")}
                      on:click={() => moveBackground(bg.id, 1)}
                    >
                      <span class="editor-action-icon" aria-hidden="true">↓</span>
                    </button>
                    <button
                      class="editor-outline danger"
                      type="button"
                      on:click={() => removeBackground(bg.id)}
                    >
                      {t("delete")}
                    </button>
                  </div>
                </div>
                <label class="editor-field">
                  <span>{t("wizardSrc")}</span>
                  {#if mediaAssetOptions.length}
                    <select
                      class="editor-select"
                      value={resolveBackgroundSourceSelection(bg)}
                      on:change={(event) => handleBackgroundSourceInput(bg, event)}
                    >
                      <option value=""></option>
                      {#if resolveBackgroundSourceSelection(bg) &&
                      !hasOptionValue(mediaAssetOptions, resolveBackgroundSourceSelection(bg))}
                        <option value={resolveBackgroundSourceSelection(bg)}>
                          {getBackgroundDisplayLabel(bg, index)}
                        </option>
                      {/if}
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
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {:else}
      {#if editPanel === "section"}
        <div class="edit-row">
          <button
            class="editor-outline editor-icon-btn"
            type="button"
            aria-label={t("addSection")}
            title={t("addSection")}
            on:click={handleAddSectionClick}
          >
            <span class="editor-action-icon" aria-hidden="true">＋</span>
          </button>
        </div>
        {#if draft.categories.length > 0}
          <div class="edit-sections">
            {#each draft.categories as category}
              <div class="edit-section">
                <div class="edit-section__head">
                  {#if editingSectionId === category.id}
                    <input
                      bind:this={sectionNameInput}
                      class="editor-input edit-section__name-input"
                      type="text"
                      bind:value={editingSectionValue}
                      aria-label={t("sectionName")}
                      on:keydown={(event) => handleInlineSectionKeydown(category, event)}
                    />
                  {:else}
                    <p class="edit-section__name">
                      {getLocalizedValue(category.name, editLang, draft.meta.defaultLocale) || category.id}
                    </p>
                  {/if}
                  <div class="edit-actions">
                    {#if editingSectionId === category.id}
                      <button
                        class="editor-outline editor-icon-btn"
                        type="button"
                        aria-label={t("save")}
                        title={t("save")}
                        on:click={() => commitInlineSectionEdit(category)}
                      >
                        <span class="editor-action-icon" aria-hidden="true">💾</span>
                      </button>
                    {:else}
                      <button
                        class="editor-outline editor-icon-btn"
                        type="button"
                        aria-label={t("editSection")}
                        title={t("editSection")}
                        on:click={() => startInlineSectionEdit(category)}
                      >
                        <span class="editor-action-icon" aria-hidden="true">✎</span>
                      </button>
                    {/if}
                    <button
                      class="editor-outline danger editor-icon-btn"
                      type="button"
                      aria-label={t("deleteSection")}
                      title={t("deleteSection")}
                      on:click={() => deleteSectionById(category.id)}
                    >
                      <span class="editor-action-icon" aria-hidden="true">✕</span>
                    </button>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      {/if}

      {#if editPanel === "dish"}
        <div class="edit-row">
          <label class="editor-field">
            <span>{t("section")}</span>
            <select bind:value={selectedCategoryId} class="editor-select" disabled={itemsTabDisabled}>
              {#if draft.categories.length === 0}
                <option value="">{t("editItemsNeedsSections")}</option>
              {:else}
                {#each draft.categories as category}
                  <option value={category.id}>
                    {getLocalizedValue(category.name, editLang, draft.meta.defaultLocale)}
                  </option>
                {/each}
              {/if}
            </select>
          </label>
        </div>
      {/if}

      {#if editPanel === "dish" && selectedCategory}
        <p class="edit-hint">{t("dishHint")}</p>
        <div class="edit-row">
          <label class="editor-field">
            <span>{t("dish")}</span>
            <select bind:value={selectedItemId} class="editor-select">
              {#each selectedCategory.items as item}
                <option value={item.id}>
                  {getLocalizedValue(item.name, editLang, draft.meta.defaultLocale)}
                </option>
              {/each}
            </select>
          </label>
          <div class="edit-actions">
            <button
              class="editor-outline editor-icon-btn"
              type="button"
              aria-label={t("prevDish")}
              title={t("prevDish")}
              on:click={goPrevDish}
            >
              <span class="editor-action-icon" aria-hidden="true">◀</span>
            </button>
            <button
              class="editor-outline editor-icon-btn"
              type="button"
              aria-label={t("nextDish")}
              title={t("nextDish")}
              on:click={goNextDish}
            >
              <span class="editor-action-icon" aria-hidden="true">▶</span>
            </button>
            <button
              class="editor-outline editor-icon-btn"
              type="button"
              aria-label={t("addDish")}
              title={t("addDish")}
              on:click={addDish}
            >
              <span class="editor-action-icon" aria-hidden="true">＋</span>
            </button>
            <button
              class="editor-outline danger editor-icon-btn"
              type="button"
              aria-label={t("delete")}
              title={t("delete")}
              on:click={deleteDish}
            >
              <span class="editor-action-icon" aria-hidden="true">✕</span>
            </button>
          </div>
        </div>

        {#if selectedItem}
          <div class="edit-block">
            <p class="edit-block__title">{t("dishData")}</p>
            <div class="edit-item">
              <div class="edit-item__media-row">
                <div class="edit-item__media">
                  <img
                    src={selectedItem.media.hero360 ?? ""}
                    alt={textOf(selectedItem.name)}
                  />
                </div>
                <div class="editor-field edit-item__source">
                  <span>{t("asset360")}</span>
                  {#if mediaAssetOptions.length}
                    <select
                      class="editor-select"
                      value={resolveDishAssetSelection(selectedItem)}
                      on:change={(event) => handleDishAssetInput(selectedItem, event)}
                    >
                      <option value=""></option>
                      {#if resolveDishAssetSelection(selectedItem) &&
                      !hasOptionValue(mediaAssetOptions, resolveDishAssetSelection(selectedItem))}
                        <option value={resolveDishAssetSelection(selectedItem)}>
                          {extractFilenameFromPath(resolveDishAssetSelection(selectedItem))}
                        </option>
                      {/if}
                      {#each mediaAssetOptions as option}
                        <option value={option.value}>{option.label}</option>
                      {/each}
                    </select>
                  {:else}
                    <input
                      type="text"
                      class="editor-input"
                      value={selectedItem.media.hero360}
                      list="asset-files"
                      on:input={(event) => handleDishAssetInput(selectedItem, event)}
                    />
                  {/if}
                  <label class="editor-field">
                    <span>{t("itemScrollAnimationMode")}</span>
                    <select
                      class="editor-select"
                      value={selectedItem.media.scrollAnimationMode ?? "hero360"}
                      on:change={(event) => {
                        const target = event.currentTarget;
                        if (!(target instanceof HTMLSelectElement)) return;
                        setItemScrollAnimationMode(
                          selectedItem,
                          target.value === "alternate" ? "alternate" : "hero360"
                        );
                      }}
                    >
                      <option value="hero360">{t("itemScrollAnimationModeHero")}</option>
                      <option value="alternate">{t("itemScrollAnimationModeAlternate")}</option>
                    </select>
                  </label>
                  {#if (selectedItem.media.scrollAnimationMode ?? "hero360") === "alternate"}
                    <label class="editor-field">
                      <span>{t("itemScrollAnimationSrc")}</span>
                      {#if mediaAssetOptions.length}
                        <select
                          class="editor-select"
                          value={selectedItem.media.scrollAnimationSrc ?? ""}
                          on:change={(event) =>
                            handleItemScrollAnimationSourceInput(selectedItem, event)}
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
                          value={selectedItem.media.scrollAnimationSrc ?? ""}
                          list="asset-files"
                          on:input={(event) =>
                            handleItemScrollAnimationSourceInput(selectedItem, event)}
                        />
                      {/if}
                    </label>
                  {/if}
                  <div class="edit-item__rotation">
                    <button
                      class="editor-outline editor-toggle-direction"
                      type="button"
                      on:click={() => toggleItemRotationDirection(selectedItem)}
                    >
                      <span class="editor-radio__icon" aria-hidden="true">
                        {getItemRotationDirection(selectedItem) === "cw" ? "↻" : "↺"}
                      </span>
                      <span>
                        {getItemRotationDirection(selectedItem) === "cw"
                          ? t("rotationClockwise")
                          : t("rotationCounterclockwise")}
                      </span>
                    </button>
                    <small class="editor-hint">{t("rotationChooseHint")}</small>
                  </div>
                </div>
              </div>
              <div class="edit-item__content">
                <label class="editor-field">
                  <span>{t("name")} ({editLang.toUpperCase()})</span>
                  <input
                    type="text"
                    class="editor-input"
                    value={selectedItem.name?.[editLang] ?? ""}
                    on:input={(event) =>
                      handleLocalizedInput(selectedItem.name, editLang, event)}
                  />
                </label>
                <label class="editor-field">
                  <span>{t("description")} ({editLang.toUpperCase()})</span>
                  <textarea
                    class="editor-input"
                    rows="2"
                    value={selectedItem.description?.[editLang] ?? ""}
                    on:input={(event) =>
                      handleDescriptionInput(selectedItem, editLang, event)}
                  ></textarea>
                </label>
                <label class="editor-field">
                  <span>{t("longDescription")} ({editLang.toUpperCase()})</span>
                  <textarea
                    class="editor-input"
                    rows="3"
                    value={selectedItem.longDescription?.[editLang] ?? ""}
                    on:input={(event) =>
                      handleLongDescriptionInput(selectedItem, editLang, event)}
                  ></textarea>
                </label>
                <label class="editor-field editor-inline editor-inline--spaced">
                  <span>{t("showPrice")}</span>
                  <input
                    type="checkbox"
                    checked={selectedItem.priceVisible !== false}
                    on:change={(event) => handleShowPriceToggle(selectedItem, event)}
                  />
                </label>
                {#if selectedItem.priceVisible !== false}
                  <label class="editor-field">
                    <span>{t("price")}</span>
                    <input
                      type="number"
                      class="editor-input"
                      value={selectedItem.price.amount}
                      on:input={(event) => handleDishPriceInput(selectedItem, event)}
                    />
                  </label>
                {/if}
                <label class="editor-field">
                  <span>{t("textStyle")}</span>
                    <select
                      class="editor-select"
                      value={getItemFontSelectionForUi(selectedItem, itemPreviewSelections)}
                      on:change={(event) => handleItemFontSelectionInput(selectedItem, event)}
                    >
                      <option value={FONT_SELECTION_DEFAULT}>{t("textStyleDefault")}</option>
                      {#each fontOptions as font}
                        <option value={encodeBuiltInSelection(font.value)}>{font.label}</option>
                      {/each}
                      {#if resolveAssetSelectionSource(getItemFontSelectionForUi(selectedItem, itemPreviewSelections)) &&
                      !hasFontAssetSource(resolveAssetSelectionSource(getItemFontSelectionForUi(selectedItem, itemPreviewSelections)))}
                      <option
                        value={encodeAssetSelection(resolveAssetSelectionSource(getItemFontSelectionForUi(selectedItem, itemPreviewSelections)))}
                      >
                        {resolveAssetSelectionSource(getItemFontSelectionForUi(selectedItem, itemPreviewSelections))}
                      </option>
                      {/if}
                      {#each fontAssetOptions as option}
                        <option value={encodeAssetSelection(option.value)}>{option.label}</option>
                      {/each}
                    </select>
                    <p
                      class="editor-font-preview"
                      style={buildFontPreviewStyle(getItemFontSelectionForUi(selectedItem, itemPreviewSelections))}
                    >
                      {t("fontPreviewSample")}
                    </p>
                </label>
                <div class="editor-field">
                  <span>{t("commonAllergens")}</span>
                  <div class="allergen-checklist">
                    {#each commonAllergenCatalog as allergen}
                      <label class="allergen-option">
                        <input
                          type="checkbox"
                          checked={isCommonAllergenChecked(selectedItem, allergen.id)}
                          on:change={(event) =>
                            handleCommonAllergenToggle(selectedItem, allergen.id, event)}
                        />
                        <span>{getCommonAllergenLabel(allergen, editLang)}</span>
                      </label>
                    {/each}
                  </div>
                </div>
                <label class="editor-field">
                  <span>{t("customAllergens")} ({editLang.toUpperCase()})</span>
                  <input
                    type="text"
                    class="editor-input"
                    value={getCustomAllergensInput(selectedItem, editLang)}
                    on:input={(event) =>
                      handleCustomAllergensInput(selectedItem, editLang, event)}
                  />
                  <small class="editor-hint">{t("customAllergensHint")}</small>
                </label>
                <label class="editor-field editor-inline editor-inline--spaced">
                  <span>{t("veganLabel")}</span>
                  <input
                    type="checkbox"
                    checked={selectedItem.vegan ?? false}
                    on:change={(event) => handleVeganToggle(selectedItem, event)}
                  />
                </label>
              </div>
            </div>
          </div>
        {/if}
      {/if}
    {/if}
  </div>
{/if}
