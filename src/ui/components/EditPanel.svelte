<script lang="ts">
  import type { MenuCategory, MenuItem, MenuProject } from "../../lib/types";

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
  export let setFontRoleSource: (
    role: "identity" | "section" | "item",
    source: string
  ) => void = () => {};
  export let setItemFontSource: (item: MenuItem, source: string) => void = () => {};
  export let setItemPriceVisible: (item: MenuItem, visible: boolean) => void = () => {};
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

  const handleDishAssetInput = (item: MenuItem, event: Event) => {
    const target = event.currentTarget;
    if (!(target instanceof HTMLInputElement) && !(target instanceof HTMLSelectElement)) return;
    item.media.hero360 = target.value;
    touchDraft();
  };

  const handleItemScrollAnimationSourceInput = (item: MenuItem, event: Event) => {
    const target = event.currentTarget;
    if (!(target instanceof HTMLInputElement) && !(target instanceof HTMLSelectElement)) return;
    setItemScrollAnimationSrc(item, target.value);
  };

  const handleRoleFontSourceInput = (
    role: "identity" | "section" | "item",
    event: Event
  ) => {
    const target = event.currentTarget;
    if (!(target instanceof HTMLInputElement) && !(target instanceof HTMLSelectElement)) return;
    setFontRoleSource(role, target.value);
  };

  const handleItemFontSourceInput = (item: MenuItem, event: Event) => {
    const target = event.currentTarget;
    if (!(target instanceof HTMLInputElement) && !(target instanceof HTMLSelectElement)) return;
    setItemFontSource(item, target.value);
  };

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
        class="edit-subtab {editPanel === 'dish' ? 'active' : ''}"
        type="button"
        on:click={() => (editPanel = 'dish')}
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
      <div class="edit-block">
        <p class="edit-block__title">{t("fontRoleIdentity")}</p>
        <label class="editor-field">
          <span>{t("fontCustomSrc")}</span>
          {#if fontAssetOptions.length}
            <select
              class="editor-select"
              value={draft.meta.fontRoles?.identity?.source ?? ""}
              on:change={(event) => handleRoleFontSourceInput("identity", event)}
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
              list="font-asset-files"
              on:input={(event) => handleRoleFontSourceInput("identity", event)}
            />
          {/if}
        </label>
      </div>
      <div class="edit-block">
        <p class="edit-block__title">{t("fontRoleSection")}</p>
        <label class="editor-field">
          <span>{t("fontCustomSrc")}</span>
          {#if fontAssetOptions.length}
            <select
              class="editor-select"
              value={draft.meta.fontRoles?.section?.source ?? ""}
              on:change={(event) => handleRoleFontSourceInput("section", event)}
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
              value={draft.meta.fontRoles?.section?.source ?? ""}
              list="font-asset-files"
              on:input={(event) => handleRoleFontSourceInput("section", event)}
            />
          {/if}
        </label>
      </div>
      <div class="edit-block">
        <p class="edit-block__title">{t("fontRoleItem")}</p>
        <label class="editor-field">
          <span>{t("fontCustomSrc")}</span>
          {#if fontAssetOptions.length}
            <select
              class="editor-select"
              value={draft.meta.fontRoles?.item?.source ?? ""}
              on:change={(event) => handleRoleFontSourceInput("item", event)}
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
              list="font-asset-files"
              on:input={(event) => handleRoleFontSourceInput("item", event)}
            />
          {/if}
        </label>
      </div>
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
                    {t("backgroundLabel")} {index + 1}
                  </p>
                  <div class="background-carousel-item__actions">
                    <button
                      class="editor-outline"
                      type="button"
                      disabled={index === 0}
                      aria-label={t("moveBackgroundUp")}
                      title={t("moveBackgroundUp")}
                      on:click={() => moveBackground(bg.id, -1)}
                    >
                      ↑
                    </button>
                    <button
                      class="editor-outline"
                      type="button"
                      disabled={index === draft.backgrounds.length - 1}
                      aria-label={t("moveBackgroundDown")}
                      title={t("moveBackgroundDown")}
                      on:click={() => moveBackground(bg.id, 1)}
                    >
                      ↓
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
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {:else}
      <div class="edit-row">
        <label class="editor-field">
          <span>{t("section")}</span>
          <select bind:value={selectedCategoryId} class="editor-select">
            {#each draft.categories as category}
              <option value={category.id}>
                {getLocalizedValue(category.name, editLang, draft.meta.defaultLocale)}
              </option>
            {/each}
          </select>
        </label>
        <div class="edit-actions">
          <button
            class="editor-outline"
            type="button"
            aria-label={t("addSection")}
            title={t("addSection")}
            on:click={addSection}
          >
            <span class="btn-icon">＋</span>
          </button>
          <button class="editor-outline danger" type="button" on:click={deleteSection}>
            {t("deleteSection")}
          </button>
        </div>
      </div>

      {#if editPanel === "section" && selectedCategory}
        <p class="edit-hint">{t("sectionHint")}</p>
        <div class="edit-block">
          <p class="edit-block__title">{t("sectionName")}</p>
          <label class="editor-field">
            <span>{editLang.toUpperCase()}</span>
            <input
              type="text"
              class="editor-input"
              value={selectedCategory.name?.[editLang] ?? ""}
              on:input={(event) =>
                handleLocalizedInput(selectedCategory.name, editLang, event)}
            />
          </label>
          {#if (draft.meta.backgroundDisplayMode ?? "carousel") === "section"}
            {#if sectionBackgroundNeedsCoverage}
              <p class="edit-hint">{t("sectionBackgroundNeedsCoverage")}</p>
            {/if}
            {#if sectionBackgroundHasDuplicates}
              <p class="edit-hint">{t("sectionBackgroundNeedsUnique")}</p>
            {/if}
            <label class="editor-field">
              <span>{t("sectionBackground")}</span>
              <select
                class="editor-select"
                value={selectedCategory.backgroundId ?? ""}
                on:change={(event) => {
                  const target = event.currentTarget;
                  if (!(target instanceof HTMLSelectElement)) return;
                  setCategoryBackgroundId(selectedCategory, target.value);
                }}
              >
                <option value=""></option>
                {#each sectionBackgroundOptionsByCategory[selectedCategory.id] ?? [] as background}
                  <option value={background.value}>
                    {background.label}
                  </option>
                {/each}
              </select>
            </label>
          {/if}
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
              class="editor-outline"
              type="button"
              aria-label={t("prevDish")}
              title={t("prevDish")}
              on:click={goPrevDish}
            >
              <span class="btn-icon">◀</span>
            </button>
            <button
              class="editor-outline"
              type="button"
              aria-label={t("nextDish")}
              title={t("nextDish")}
              on:click={goNextDish}
            >
              <span class="btn-icon">▶</span>
            </button>
            <button
              class="editor-outline"
              type="button"
              aria-label={t("addDish")}
              title={t("addDish")}
              on:click={addDish}
            >
              <span class="btn-icon">＋</span>
            </button>
            <button class="editor-outline danger" type="button" on:click={deleteDish}>
              {t("delete")}
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
                      value={selectedItem.media.hero360}
                      on:change={(event) => handleDishAssetInput(selectedItem, event)}
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
                <label class="editor-field editor-inline">
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
                  <span>{t("itemFontOverrideSrc")}</span>
                  {#if fontAssetOptions.length}
                    <select
                      class="editor-select"
                      value={selectedItem.typography?.item?.source ?? ""}
                      on:change={(event) => handleItemFontSourceInput(selectedItem, event)}
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
                      value={selectedItem.typography?.item?.source ?? ""}
                      list="font-asset-files"
                      on:input={(event) => handleItemFontSourceInput(selectedItem, event)}
                    />
                  {/if}
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
                <label class="editor-field editor-inline">
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
