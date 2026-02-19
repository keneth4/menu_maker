<script lang="ts">
  import type { WizardPanelActions, WizardPanelModel } from "../contracts/components";
  import WizardPanelLegacy from "./WizardPanelLegacy.svelte";

  export let model: WizardPanelModel;
  export let actions: WizardPanelActions;

  let wizardLang = "";
  let wizardCategoryId = "";
  let wizardItemId = "";
  let modelWizardLang = "";
  let modelWizardCategoryId = "";
  let modelWizardItemId = "";

  $: if (model.wizardLang !== modelWizardLang) {
    modelWizardLang = model.wizardLang;
    wizardLang = model.wizardLang;
  }
  $: if (model.wizardCategoryId !== modelWizardCategoryId) {
    modelWizardCategoryId = model.wizardCategoryId;
    wizardCategoryId = model.wizardCategoryId;
  }
  $: if (model.wizardItemId !== modelWizardItemId) {
    modelWizardItemId = model.wizardItemId;
    wizardItemId = model.wizardItemId;
  }

  $: if (wizardLang !== modelWizardLang) {
    modelWizardLang = wizardLang;
    actions.setWizardLang(wizardLang);
  }
  $: if (wizardCategoryId !== modelWizardCategoryId) {
    modelWizardCategoryId = wizardCategoryId;
    actions.setWizardCategoryId(wizardCategoryId);
  }
  $: if (wizardItemId !== modelWizardItemId) {
    modelWizardItemId = wizardItemId;
    actions.setWizardItemId(wizardItemId);
  }
</script>

<WizardPanelLegacy
  t={model.t}
  draft={model.draft}
  uiLang={model.uiLang}
  templateOptions={model.templateOptions}
  wizardStep={model.wizardStep}
  wizardSteps={model.wizardSteps}
  wizardProgress={model.wizardProgress}
  wizardStatus={model.wizardStatus}
  bind:wizardLang
  bind:wizardCategoryId
  bind:wizardItemId
  wizardCategory={model.wizardCategory}
  wizardItem={model.wizardItem}
  wizardDemoPreview={model.wizardDemoPreview}
  wizardNeedsRootBackground={model.wizardNeedsRootBackground}
  assetOptions={model.assetOptions}
  sectionBackgroundOptionsByCategory={model.sectionBackgroundOptionsByCategory}
  sectionBackgroundNeedsCoverage={model.sectionBackgroundNeedsCoverage}
  sectionBackgroundHasDuplicates={model.sectionBackgroundHasDuplicates}
  isWizardStepValid={actions.isWizardStepValid}
  goToStep={actions.goToStep}
  applyTemplate={actions.applyTemplate}
  addBackground={actions.addBackground}
  removeBackground={actions.removeBackground}
  setBackgroundDisplayMode={actions.setBackgroundDisplayMode}
  setCategoryBackgroundId={actions.setCategoryBackgroundId}
  addWizardCategory={actions.addWizardCategory}
  removeWizardCategory={actions.removeWizardCategory}
  addWizardDish={actions.addWizardDish}
  removeWizardDish={actions.removeWizardDish}
  setIdentityMode={actions.setIdentityMode}
  setLogoSrc={actions.setLogoSrc}
  setFontRoleSelection={actions.setFontRoleSelection}
  setItemRotationDirection={actions.setItemRotationDirection}
  setItemScrollAnimationMode={actions.setItemScrollAnimationMode}
  setItemScrollAnimationSrc={actions.setItemScrollAnimationSrc}
  setItemFontSelection={actions.setItemFontSelection}
  setItemPriceVisible={actions.setItemPriceVisible}
  handleLocalizedInput={actions.handleLocalizedInput}
  handleDescriptionInput={actions.handleDescriptionInput}
  getLocalizedValue={actions.getLocalizedValue}
  goPrevStep={actions.goPrevStep}
  goNextStep={actions.goNextStep}
  exportStaticSite={actions.exportStaticSite}
  touchDraft={actions.touchDraft}
/>
