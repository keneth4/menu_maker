<script lang="ts">
  import {
    getTemplateCapabilities,
    getTemplateStrategy,
    resolveTemplateId,
    type TemplateCapabilities,
    type TemplateStrategy
  } from "../../core/templates/registry";
  import type { MenuItem, MenuProject } from "../../lib/types";

  type PreviewBackground = {
    id: string;
    src: string;
  };

  export let layoutMode = "desktop";
  export let effectivePreview = "device";
  export let activeProject: MenuProject;
  export let previewStartupLoading = false;
  export let previewStartupProgress = 100;
  export let previewBackgrounds: PreviewBackground[] = [];
  export let activeBackgroundIndex = 0;
  export let isBlankMenu = false;
  export let locale = "es";
  export let carouselActive: Record<string, number> = {};
  export let deviceMode: "mobile" | "desktop" = "desktop";
  export let previewFontStack = "";

  export let t: (key: string) => string = (key) => key;
  export let textOf: (value: Record<string, string> | undefined, fallback?: string) => string =
    () => "";
  export let getLoadingLabel: (locale: string) => string = () => "";
  export let getTemplateScrollHint: (locale: string, templateId: string) => string = () => "";
  export let getCarouselImageSource: (item: MenuItem) => string = () => "";
  export let buildResponsiveSrcSetFromMedia: (item: MenuItem) => string | undefined = () =>
    undefined;
  export let getMenuTerm: (key: string) => string = (key) => key;
  export let formatPrice: (amount: number) => string = (amount) => String(amount);
  export let getDishTapHint: (locale: string) => string = () => "";
  export let getAssetOwnershipDisclaimer: (locale: string) => string = () => "";

  export let shiftSection: (direction: number) => void = () => {};
  export let handleMenuScroll: (event: Event) => void = () => {};
  export let shiftCarousel: (categoryId: string, direction: number) => void = () => {};
  export let handleCarouselWheel: (categoryId: string, event: WheelEvent) => void = () => {};
  export let handleCarouselTouchStart: (categoryId: string, event: TouchEvent) => void = () => {};
  export let handleCarouselTouchMove: (categoryId: string, event: TouchEvent) => void = () => {};
  export let handleCarouselTouchEnd: (categoryId: string, event: TouchEvent) => void = () => {};
  export let openDish: (categoryId: string, itemId: string) => void = () => {};

  let activeTemplateCapabilities: TemplateCapabilities = getTemplateCapabilities("focus-rows");
  let activeTemplateStrategy: TemplateStrategy = getTemplateStrategy("focus-rows");

  $: {
    const templateId = resolveTemplateId(activeProject?.meta.template);
    activeTemplateCapabilities = getTemplateCapabilities(templateId);
    activeTemplateStrategy = getTemplateStrategy(templateId);
  }
</script>

<section class="preview-panel {layoutMode}">
  <section class="preview-shell {effectivePreview}">
    <section
      class={`menu-preview template-${activeTemplateCapabilities.id} ${
        previewStartupLoading ? "is-loading" : ""
      }`}
      style={`--menu-font:${previewFontStack};`}
    >
      <div class={`menu-startup-loader ${previewStartupLoading ? "active" : ""}`}>
        <div class="menu-startup-loader__card">
          <p class="menu-startup-loader__label">{getLoadingLabel(locale)}</p>
          <div class="menu-startup-loader__track">
            <span
              class="menu-startup-loader__fill"
              style={`width:${previewStartupProgress}%`}
            ></span>
          </div>
          <p class="menu-startup-loader__value">{previewStartupProgress}%</p>
        </div>
      </div>
      {#if previewBackgrounds.length}
        {#each previewBackgrounds as background, index (`${background.id}-${index}`)}
          <div
            class={`menu-background ${index === activeBackgroundIndex ? "active" : ""}`}
            style={`background-image: url('${background.src}');`}
          ></div>
        {/each}
      {/if}
      <div class="menu-overlay"></div>

      {#if isBlankMenu}
        <div class="menu-blank">
          <p>{t("blankMenu")}</p>
        </div>
      {:else}
        <header class="menu-topbar">
          <div class="menu-title-block">
            {#if activeProject.meta.identityMode === "logo" && activeProject.meta.logoSrc}
              <img
                class="menu-logo"
                src={activeProject.meta.logoSrc}
                alt={textOf(activeProject.meta.restaurantName, t("restaurantFallback"))}
                decoding="async"
              />
            {:else if textOf(activeProject.meta.restaurantName)}
              <p class="menu-eyebrow">{textOf(activeProject.meta.restaurantName)}</p>
            {/if}
            <h1 class="menu-title">
              {textOf(activeProject.meta.title, t("menuTitleFallback"))}
            </h1>
          </div>
          <div class="menu-lang">
            <select bind:value={locale} class="menu-select">
              {#each activeProject.meta.locales as lang}
                <option value={lang}>{lang.toUpperCase()}</option>
              {/each}
            </select>
          </div>
        </header>

        {#if activeTemplateCapabilities.showFocusRowsHint}
          <div class="focus-rows-hint" aria-hidden="true">
            <span class="focus-rows-hint__label">
              {getTemplateScrollHint(locale, activeTemplateCapabilities.id)}
            </span>
          </div>
        {/if}

        {#if activeTemplateCapabilities.showSectionNav && activeProject.categories.length > 1}
          <div class="section-nav">
            <button
              class="section-nav__btn prev"
              type="button"
              aria-label={t("prevDish")}
              on:click={() => shiftSection(-1)}
            >
              <span aria-hidden="true">‹</span>
            </button>
            <span class="section-nav__label">
              {getTemplateScrollHint(locale, activeTemplateCapabilities.id)}
            </span>
            <button
              class="section-nav__btn next"
              type="button"
              aria-label={t("nextDish")}
              on:click={() => shiftSection(1)}
            >
              <span aria-hidden="true">›</span>
            </button>
          </div>
        {/if}

        <div class="menu-scroll" on:scroll={(event) => handleMenuScroll(event)}>
          {#each activeProject.categories as category}
            {@const renderItems = activeTemplateStrategy.getRenderItems(category.items)}
            {@const activeIndex = carouselActive[category.id] ?? 0}
            <section class="menu-section">
              <div class="menu-section__head">
                <p class="menu-section__title">{textOf(category.name)}</p>
                <span class="menu-section__count">{category.items.length} items</span>
              </div>
              {#if deviceMode === "desktop" &&
              category.items.length > 1 &&
              activeTemplateCapabilities.showDesktopCarouselNav}
                <div class="carousel-nav">
                  <button
                    class="carousel-nav__btn prev"
                    type="button"
                    aria-label={t("prevDish")}
                    on:click={() => shiftCarousel(category.id, -1)}
                  >
                    <span aria-hidden="true">‹</span>
                  </button>
                  <button
                    class="carousel-nav__btn next"
                    type="button"
                    aria-label={t("nextDish")}
                    on:click={() => shiftCarousel(category.id, 1)}
                  >
                    <span aria-hidden="true">›</span>
                  </button>
                </div>
              {/if}
              <div
                class="menu-carousel {category.items.length <= 1 ? 'single' : ''}"
                on:wheel={(event) => handleCarouselWheel(category.id, event)}
                on:touchstart={(event) => handleCarouselTouchStart(category.id, event)}
                on:touchmove|nonpassive={(event) =>
                  handleCarouselTouchMove(category.id, event)}
                on:touchend={(event) => handleCarouselTouchEnd(category.id, event)}
                on:touchcancel={(event) => handleCarouselTouchEnd(category.id, event)}
                data-category-id={category.id}
              >
                {#each renderItems as entry (entry.key)}
                  {@const stateClass = activeTemplateStrategy.getCardStateClass(
                    activeIndex,
                    entry.sourceIndex,
                    category.items.length
                  )}
                  <button
                    class={`carousel-card ${stateClass}`}
                    type="button"
                    style={activeTemplateStrategy.getCardStyle(
                      activeIndex,
                      entry.sourceIndex,
                      category.items.length
                    )}
                    on:click={() => openDish(category.id, entry.item.id)}
                  >
                    <div class="carousel-media">
                      <img
                        src={getCarouselImageSource(entry.item)}
                        srcset={buildResponsiveSrcSetFromMedia(entry.item)}
                        sizes="(max-width: 640px) 64vw, (max-width: 1200px) 34vw, 260px"
                        alt={textOf(entry.item.name)}
                        draggable="false"
                        on:contextmenu|preventDefault
                        on:dragstart|preventDefault
                        loading="lazy"
                        decoding="async"
                        fetchpriority="low"
                      />
                    </div>
                    <div class="carousel-text">
                      <div class="carousel-row">
                        <p class="carousel-title">
                          {textOf(entry.item.name)}
                          {#if entry.item.vegan}
                            <span class="vegan-icon" title={getMenuTerm("vegan")}>🌿</span>
                          {/if}
                        </p>
                        <span class="carousel-price">
                          {formatPrice(entry.item.price.amount)}
                        </span>
                      </div>
                      <p class="carousel-desc">{textOf(entry.item.description)}</p>
                    </div>
                  </button>
                {/each}
              </div>
            </section>
          {/each}
        </div>
        <div class="menu-tap-hint" aria-hidden="true">
          <span class="menu-tap-hint__dot"></span>
          <span>{getDishTapHint(locale)}</span>
        </div>
        <p class="menu-asset-disclaimer" aria-hidden="true">
          {getAssetOwnershipDisclaimer(locale)}
        </p>
      {/if}
    </section>
  </section>
</section>
