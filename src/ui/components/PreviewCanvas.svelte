<script lang="ts">
  import type { PreviewCanvasActions, PreviewCanvasModel } from "../contracts/components";
  import PreviewCanvasLegacy from "./PreviewCanvasLegacy.svelte";

  export let model: PreviewCanvasModel;
  export let actions: PreviewCanvasActions;

  let locale = "es";
  let observedModelLocale = "";
  let pendingLocaleCommit = "";

  $: {
    if (model.locale !== observedModelLocale) {
      observedModelLocale = model.locale;
      if (!pendingLocaleCommit || model.locale === pendingLocaleCommit) {
        locale = model.locale;
      }
      if (pendingLocaleCommit && model.locale === pendingLocaleCommit) {
        pendingLocaleCommit = "";
      }
    }
  }

  $: if (locale !== observedModelLocale && pendingLocaleCommit !== locale) {
    pendingLocaleCommit = locale;
    actions.setLocale(locale);
  }
</script>

<PreviewCanvasLegacy
  effectivePreview={model.effectivePreview}
  activeProject={model.activeProject}
  bind:locale
  previewStartupLoading={model.previewStartupLoading}
  previewStartupProgress={model.previewStartupProgress}
  startupBlockingSources={model.startupBlockingSources}
  previewBackgrounds={model.previewBackgrounds}
  loadedBackgroundIndexes={model.loadedBackgroundIndexes}
  activeBackgroundIndex={model.activeBackgroundIndex}
  isBlankMenu={model.isBlankMenu}
  carouselActive={model.carouselActive}
  deviceMode={model.deviceMode}
  previewFontStack={model.previewFontStack}
  previewFontVars={model.previewFontVars}
  t={model.t}
  textOf={model.textOf}
  getLoadingLabel={model.getLoadingLabel}
  getTemplateScrollHint={model.getTemplateScrollHint}
  getCarouselImageSource={model.getCarouselImageSource}
  buildResponsiveSrcSetFromMedia={model.buildResponsiveSrcSetFromMedia}
  getMenuTerm={model.getMenuTerm}
  formatPrice={model.formatPrice}
  getDishTapHint={model.getDishTapHint}
  getAssetOwnershipDisclaimer={model.getAssetOwnershipDisclaimer}
  shiftSection={actions.shiftSection}
  handleMenuScroll={actions.handleMenuScroll}
  shiftCarousel={actions.shiftCarousel}
  handleCarouselWheel={actions.handleCarouselWheel}
  handleCarouselTouchStart={actions.handleCarouselTouchStart}
  handleCarouselTouchMove={actions.handleCarouselTouchMove}
  handleCarouselTouchEnd={actions.handleCarouselTouchEnd}
  openDish={actions.openDish}
  prefetchDishDetail={actions.prefetchDishDetail}
  getItemFontStyle={model.getItemFontStyle}
/>
