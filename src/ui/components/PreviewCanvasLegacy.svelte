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
  const TRANSPARENT_PIXEL_SRC =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'/%3E";
  const CAROUSEL_MEDIA_ACTIVE_RADIUS = 2;

  export let effectivePreview = "device";
  export let activeProject: MenuProject;
  export let previewStartupLoading = false;
  export let previewStartupProgress = 100;
  export let startupBlockingSources: Set<string> = new Set();
  export let previewBackgrounds: PreviewBackground[] = [];
  export let loadedBackgroundIndexes: number[] = [];
  export let activeBackgroundIndex = 0;
  export let isBlankMenu = false;
  export let locale = "es";
  export let carouselActive: Record<string, number> = {};
  export let deviceMode: "mobile" | "desktop" = "desktop";
  export let previewFontStack = "";
  export let previewFontVars = "";

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
  export let handleMenuWheel: (event: WheelEvent) => void = () => {};
  export let handleMenuScroll: (event: Event) => void = () => {};
  export let shiftCarousel: (categoryId: string, direction: number) => void = () => {};
  export let handleCarouselWheel: (categoryId: string, event: WheelEvent) => void = () => {};
  export let handleCarouselTouchStart: (categoryId: string, event: TouchEvent) => void = () => {};
  export let handleCarouselTouchMove: (categoryId: string, event: TouchEvent) => void = () => {};
  export let handleCarouselTouchEnd: (categoryId: string, event: TouchEvent) => void = () => {};
  export let openDish: (categoryId: string, itemId: string) => void = () => {};
  export let prefetchDishDetail: (
    categoryId: string,
    itemId: string,
    includeNeighbors?: boolean
  ) => void = () => {};
  export let getItemFontStyle: (item: MenuItem) => string = () => "";

  let activeTemplateCapabilities: TemplateCapabilities = getTemplateCapabilities("focus-rows");
  let activeTemplateStrategy: TemplateStrategy = getTemplateStrategy("focus-rows");
  let loadedBackgroundIndexSet = new Set<number>();
  let loadedCarouselMediaKeys = new Set<string>();
  let readyCarouselMediaKeys = new Set<string>();
  let carouselMediaProjectSignature = "";
  let backgroundModeClass = "background-mode-carousel";

  const getCircularDistance = (activeIndex: number, sourceIndex: number, total: number) => {
    if (total <= 1) return 0;
    const normalizedActive = ((Math.round(activeIndex) % total) + total) % total;
    const normalizedSource = ((Math.round(sourceIndex) % total) + total) % total;
    const delta = Math.abs(normalizedSource - normalizedActive);
    return Math.min(delta, total - delta);
  };

  const shouldLoadCarouselMedia = (activeIndex: number, sourceIndex: number, total: number) =>
    getCircularDistance(activeIndex, sourceIndex, total) <= CAROUSEL_MEDIA_ACTIVE_RADIUS;

  const getCarouselMediaKey = (categoryId: string, itemId: string, source = "") =>
    `${categoryId}::${itemId}::${source}`;

  const buildProjectCarouselMediaKeySet = (project: MenuProject | null) => {
    const keys = new Set<string>();
    if (!project) return keys;
    project.categories.forEach((category) => {
      category.items.forEach((item) => {
        const source = getCarouselImageSource(item).trim();
        keys.add(getCarouselMediaKey(category.id, item.id, source));
      });
    });
    return keys;
  };

  const pruneCarouselMediaKeys = (sourceKeys: Set<string>, validKeys: Set<string>) => {
    const next = new Set<string>();
    sourceKeys.forEach((key) => {
      if (validKeys.has(key)) {
        next.add(key);
      }
    });
    return next;
  };

  const markCarouselMediaReady = (mediaKey: string) => {
    if (readyCarouselMediaKeys.has(mediaKey)) return;
    const next = new Set(readyCarouselMediaKeys);
    next.add(mediaKey);
    readyCarouselMediaKeys = next;
  };

  $: {
    const templateId = resolveTemplateId(activeProject?.meta.template);
    activeTemplateCapabilities = getTemplateCapabilities(templateId);
    activeTemplateStrategy = getTemplateStrategy(templateId);
  }

  $: backgroundModeClass =
    activeProject?.meta.backgroundDisplayMode === "section"
      ? "background-mode-section"
      : "background-mode-carousel";

  $: loadedBackgroundIndexSet = new Set(loadedBackgroundIndexes);

  $: {
    const signature = activeProject
      ? activeProject.categories
          .map(
            (category) =>
              `${category.id}:${category.items
                .map((item) => `${item.id}:${getCarouselImageSource(item).trim()}`)
                .join(",")}`
          )
          .join("|")
      : "";
    if (signature !== carouselMediaProjectSignature) {
      carouselMediaProjectSignature = signature;
      const validKeys = buildProjectCarouselMediaKeySet(activeProject);
      loadedCarouselMediaKeys = pruneCarouselMediaKeys(loadedCarouselMediaKeys, validKeys);
      readyCarouselMediaKeys = pruneCarouselMediaKeys(readyCarouselMediaKeys, validKeys);
    }
  }

  $: if (activeProject) {
    const next = new Set(loadedCarouselMediaKeys);
    let changed = false;
    activeProject.categories.forEach((category) => {
      const count = category.items.length;
      const activeIndex = carouselActive[category.id] ?? 0;
      const renderItems = activeTemplateStrategy.getRenderItems(category.items);
      renderItems.forEach((entry) => {
        if (!shouldLoadCarouselMedia(activeIndex, entry.sourceIndex, count)) return;
        const source = getCarouselImageSource(entry.item).trim();
        if (
          previewStartupLoading &&
          startupBlockingSources.size > 0 &&
          source &&
          !startupBlockingSources.has(source)
        ) {
          return;
        }
        const key = getCarouselMediaKey(category.id, entry.item.id, source);
        if (next.has(key)) return;
        next.add(key);
        changed = true;
      });
    });
    if (changed) {
      loadedCarouselMediaKeys = next;
    }
  }
</script>

<section class="preview-panel">
  <section class="preview-shell {effectivePreview}">
    <section
      class={`menu-preview template-${activeTemplateCapabilities.id} ${backgroundModeClass} ${
        previewStartupLoading ? "is-loading" : ""
      }`}
      style={previewFontVars || `--menu-font:${previewFontStack};`}
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
            data-bg-src={background.src}
            style={
              loadedBackgroundIndexSet.has(index)
                ? `background-image: url('${background.src}');`
                : undefined
            }
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

        {#if deviceMode === "desktop" &&
        activeTemplateCapabilities.showSectionNav &&
        activeProject.categories.length > 1}
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

        <div
          class="menu-scroll"
          on:wheel|capture|nonpassive={(event) => handleMenuWheel(event)}
          on:scroll={(event) => handleMenuScroll(event)}
        >
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
                  {@const shouldLoadMedia = shouldLoadCarouselMedia(
                    activeIndex,
                    entry.sourceIndex,
                    category.items.length
                  )}
                  {@const carouselSource = getCarouselImageSource(entry.item)}
                  {@const mediaKey = getCarouselMediaKey(category.id, entry.item.id, carouselSource)}
                  {@const startupBlocked =
                    previewStartupLoading &&
                    startupBlockingSources.size > 0 &&
                    carouselSource.trim().length > 0 &&
                    !startupBlockingSources.has(carouselSource) &&
                    !loadedCarouselMediaKeys.has(mediaKey)}
                  {@const mediaShouldRender =
                    !startupBlocked && (loadedCarouselMediaKeys.has(mediaKey) || shouldLoadMedia)}
                  {@const showMediaLoading =
                    mediaShouldRender &&
                    carouselSource.trim().length > 0 &&
                    !readyCarouselMediaKeys.has(mediaKey)}
                  {@const srcSet = buildResponsiveSrcSetFromMedia(entry.item)}
                  {@const itemFontStyle = getItemFontStyle(entry.item)}
                  <button
                    class={`carousel-card ${stateClass}`}
                    type="button"
                    style={`${activeTemplateStrategy.getCardStyle(
                      activeIndex,
                      entry.sourceIndex,
                      category.items.length
                    )}${itemFontStyle}`}
                    on:pointerenter={() => prefetchDishDetail(category.id, entry.item.id)}
                    on:focus={() => prefetchDishDetail(category.id, entry.item.id)}
                    on:touchstart={() => prefetchDishDetail(category.id, entry.item.id)}
                    on:click={() => openDish(category.id, entry.item.id)}
                  >
                    <div class={`carousel-media ${showMediaLoading ? "is-loading" : "is-loaded"}`}>
                      <span class="carousel-media__loader" aria-hidden="true"></span>
                      <img
                        src={mediaShouldRender ? carouselSource : TRANSPARENT_PIXEL_SRC}
                        srcset={mediaShouldRender ? srcSet : undefined}
                        sizes="(max-width: 640px) 64vw, (max-width: 1200px) 34vw, 260px"
                        alt={textOf(entry.item.name)}
                        draggable="false"
                        on:contextmenu|preventDefault
                        on:dragstart|preventDefault
                        on:load={() =>
                          mediaShouldRender &&
                          carouselSource.trim().length > 0 &&
                          markCarouselMediaReady(mediaKey)}
                        on:error={() =>
                          mediaShouldRender &&
                          carouselSource.trim().length > 0 &&
                          markCarouselMediaReady(mediaKey)}
                        loading="lazy"
                        decoding="async"
                        fetchpriority={mediaShouldRender ? "high" : "low"}
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
                        {#if entry.item.priceVisible !== false}
                          <span class="carousel-price">
                            {formatPrice(entry.item.price.amount)}
                          </span>
                        {/if}
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
