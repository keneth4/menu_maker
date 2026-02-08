<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let uiLang: "es" | "en" = "es";
  export let t: (key: string) => string = (key) => key;

  const dispatch = createEventDispatcher<{
    switchLang: "es" | "en";
    createProject: void;
    openProject: void;
    startWizard: void;
  }>();
</script>

<section class="landing-screen">
  <div class="landing-lang">
    <div class="lang-toggle" aria-label={t("toggleLang")}>
      <button
        class="lang-btn {uiLang === 'es' ? 'active' : ''}"
        type="button"
        on:click={() => dispatch("switchLang", "es")}
      >
        ES
      </button>
      <button
        class="lang-btn {uiLang === 'en' ? 'active' : ''}"
        type="button"
        on:click={() => dispatch("switchLang", "en")}
      >
        EN
      </button>
    </div>
  </div>
  <header class="landing-header">
    <h1>{t("landingTitle")}</h1>
    <p>{t("landingBy")}</p>
  </header>
  <div class="landing-actions">
    <button type="button" class="landing-action" on:click={() => dispatch("createProject")}>
      <span class="landing-icon">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 5v14"></path>
          <path d="M5 12h14"></path>
        </svg>
      </span>
      <span>{t("landingCreate")}</span>
    </button>
    <button type="button" class="landing-action" on:click={() => dispatch("openProject")}>
      <span class="landing-icon">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 7h6l2 2h10v8a2 2 0 0 1-2 2H3z"></path>
          <path d="M3 7v-2a2 2 0 0 1 2-2h4l2 2"></path>
        </svg>
      </span>
      <span>{t("landingOpen")}</span>
    </button>
    <button type="button" class="landing-action" on:click={() => dispatch("startWizard")}>
      <span class="landing-icon">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 20l10-10"></path>
          <path d="M14 10l6-6"></path>
          <path d="M18 4l2 2"></path>
          <path d="M6 14l4 4"></path>
          <path d="M16 6l2 2"></path>
        </svg>
      </span>
      <span>{t("landingWizard")}</span>
    </button>
  </div>
</section>
