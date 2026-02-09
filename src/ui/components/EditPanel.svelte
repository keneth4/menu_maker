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
  export let editPanel: "identity" | "section" | "dish" = "identity";
  export let editLang = "es";
  export let selectedCategoryId = "";
  export let selectedItemId = "";
  export let selectedCategory: MenuCategory | null = null;
  export let selectedItem: MenuItem | null = null;
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
    <p class="edit-hierarchy">{t("editHierarchyHint")}</p>

    {#if editPanel === "identity"}
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
                <label class="editor-field edit-item__source">
                  <span>{t("asset360")}</span>
                  <input
                    type="text"
                    class="editor-input"
                    bind:value={selectedItem.media.hero360}
                    list="asset-files"
                  />
                </label>
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
                <label class="editor-field">
                  <span>{t("price")}</span>
                  <input
                    type="number"
                    class="editor-input"
                    bind:value={selectedItem.price.amount}
                  />
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
