<script lang="ts">
  export let t: (key: string) => string = (key) => key;
  export let editorVisible = false;
  export let editorPresentation: "desktop-card" | "mobile-sheet" = "desktop-card";
  export let uiLang: "es" | "en" = "es";
  export let editorTab: "info" | "assets" | "edit" | "wizard" = "info";

  export let setUiLang: (lang: "es" | "en") => void = () => {};
  export let setEditorTab: (tab: "info" | "assets" | "edit" | "wizard") => void = () => {};
  export let togglePreviewMode: () => void = () => {};
  export let toggleEditor: () => void = () => {};
</script>

<aside class="editor-panel {editorVisible ? 'open' : ''} {editorPresentation}">
  <div class="editor-panel__header">
    <div>
      <p class="editor-eyebrow">{t("studioTitle")}</p>
      <p class="mt-1 text-xs text-slate-400">{t("studioSubtitle")}</p>
    </div>
    <div class="editor-actions">
      <button
        class="icon-btn"
        type="button"
        aria-label={t("toggleView")}
        title={t("toggleView")}
        on:click={togglePreviewMode}
      >
        <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
          <rect x="2.5" y="4.5" width="13" height="9" rx="1.5"></rect>
          <rect x="18" y="6" width="3.5" height="10" rx="1"></rect>
          <path d="M6 18h6"></path>
        </svg>
      </button>
      <div class="lang-toggle" aria-label={t("toggleLang")}>
        <button
          class="lang-btn {uiLang === 'es' ? 'active' : ''}"
          type="button"
          on:click={() => setUiLang("es")}
        >
          ES
        </button>
        <button
          class="lang-btn {uiLang === 'en' ? 'active' : ''}"
          type="button"
          on:click={() => setUiLang("en")}
        >
          EN
        </button>
      </div>
      <button
        class="editor-close"
        type="button"
        aria-label={t("closeEditor")}
        on:click={toggleEditor}
      >
        ✕
      </button>
    </div>
  </div>

  <div class="editor-tabs">
    <button
      class="editor-tab {editorTab === 'info' ? 'active' : ''}"
      type="button"
      on:click={() => setEditorTab("info")}
    >
      <span class="editor-tab__icon">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 7h6l2 2h10v8a2 2 0 0 1-2 2H3z"></path>
          <path d="M3 7v-2a2 2 0 0 1 2-2h4l2 2"></path>
        </svg>
      </span>
      <span>{t("tabProject")}</span>
    </button>
    <button
      class="editor-tab {editorTab === 'assets' ? 'active' : ''}"
      type="button"
      on:click={() => setEditorTab("assets")}
    >
      <span class="editor-tab__icon">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 6h16v12H4z"></path>
          <path d="M8 10h8"></path>
          <path d="M8 14h6"></path>
        </svg>
      </span>
      <span>{t("tabAssets")}</span>
    </button>
    <button
      class="editor-tab {editorTab === 'edit' ? 'active' : ''}"
      type="button"
      on:click={() => setEditorTab("edit")}
    >
      <span class="editor-tab__icon">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 20h6"></path>
          <path d="M14 4l6 6"></path>
          <path d="M5 19l4-1 9-9-3-3-9 9z"></path>
        </svg>
      </span>
      <span>{t("tabEdit")}</span>
    </button>
    <button
      class="editor-tab {editorTab === 'wizard' ? 'active' : ''}"
      type="button"
      on:click={() => setEditorTab("wizard")}
    >
      <span class="editor-tab__icon">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 20l10-10"></path>
          <path d="M14 10l6-6"></path>
          <path d="M18 4l2 2"></path>
          <path d="M6 14l4 4"></path>
        </svg>
      </span>
      <span>{t("tabWizard")}</span>
    </button>
  </div>

  <div class="editor-content">
    <slot />
  </div>
</aside>
