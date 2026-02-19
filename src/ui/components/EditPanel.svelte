<script lang="ts">
  import type { EditPanelActions, EditPanelModel } from "../contracts/components";
  import EditPanelLegacy from "./EditPanelLegacy.svelte";

  export let model: EditPanelModel;
  export let actions: EditPanelActions;

  let editPanel: "identity" | "background" | "section" | "dish" = "identity";
  let selectedCategoryId = "";
  let selectedItemId = "";
  let modelEditPanel: "identity" | "background" | "section" | "dish" = "identity";
  let modelSelectedCategoryId = "";
  let modelSelectedItemId = "";

  $: if (model.editPanel !== modelEditPanel) {
    modelEditPanel = model.editPanel;
    editPanel = model.editPanel;
  }
  $: if (model.selectedCategoryId !== modelSelectedCategoryId) {
    modelSelectedCategoryId = model.selectedCategoryId;
    selectedCategoryId = model.selectedCategoryId;
  }
  $: if (model.selectedItemId !== modelSelectedItemId) {
    modelSelectedItemId = model.selectedItemId;
    selectedItemId = model.selectedItemId;
  }

  $: if (editPanel !== modelEditPanel) {
    modelEditPanel = editPanel;
    actions.setEditPanel(editPanel);
  }
  $: if (selectedCategoryId !== modelSelectedCategoryId) {
    modelSelectedCategoryId = selectedCategoryId;
    actions.setSelectedCategoryId(selectedCategoryId);
  }
  $: if (selectedItemId !== modelSelectedItemId) {
    modelSelectedItemId = selectedItemId;
    actions.setSelectedItemId(selectedItemId);
  }
</script>

<EditPanelLegacy
  t={model.t}
  draft={model.draft}
  deviceMode={model.deviceMode}
  previewMode={model.previewMode}
  bind:editPanel
  editLang={model.editLang}
  bind:selectedCategoryId
  bind:selectedItemId
  selectedCategory={model.selectedCategory}
  selectedItem={model.selectedItem}
  assetOptions={model.assetOptions}
  sectionBackgroundOptionsByCategory={model.sectionBackgroundOptionsByCategory}
  sectionBackgroundNeedsCoverage={model.sectionBackgroundNeedsCoverage}
  sectionBackgroundHasDuplicates={model.sectionBackgroundHasDuplicates}
  commonAllergenCatalog={model.commonAllergenCatalog}
  cycleEditLang={actions.cycleEditLang}
  ensureRestaurantName={actions.ensureRestaurantName}
  ensureMetaTitle={actions.ensureMetaTitle}
  handleLocalizedInput={actions.handleLocalizedInput}
  getLocalizedValue={actions.getLocalizedValue}
  addSection={actions.addSection}
  deleteSection={actions.deleteSection}
  deleteSectionById={actions.deleteSectionById}
  setSectionNameById={actions.setSectionNameById}
  addBackground={actions.addBackground}
  moveBackground={actions.moveBackground}
  removeBackground={actions.removeBackground}
  setBackgroundDisplayMode={actions.setBackgroundDisplayMode}
  setCategoryBackgroundId={actions.setCategoryBackgroundId}
  backgroundCarouselSeconds={model.backgroundCarouselSeconds}
  setBackgroundCarouselSeconds={actions.setBackgroundCarouselSeconds}
  goPrevDish={actions.goPrevDish}
  goNextDish={actions.goNextDish}
  addDish={actions.addDish}
  deleteDish={actions.deleteDish}
  textOf={actions.textOf}
  handleDescriptionInput={actions.handleDescriptionInput}
  handleLongDescriptionInput={actions.handleLongDescriptionInput}
  isCommonAllergenChecked={actions.isCommonAllergenChecked}
  handleCommonAllergenToggle={actions.handleCommonAllergenToggle}
  getCommonAllergenLabel={actions.getCommonAllergenLabel}
  getCustomAllergensInput={actions.getCustomAllergensInput}
  handleCustomAllergensInput={actions.handleCustomAllergensInput}
  handleVeganToggle={actions.handleVeganToggle}
  setIdentityMode={actions.setIdentityMode}
  setLogoSrc={actions.setLogoSrc}
  setFontRoleSelection={actions.setFontRoleSelection}
  setItemRotationDirection={actions.setItemRotationDirection}
  setItemScrollAnimationMode={actions.setItemScrollAnimationMode}
  setItemScrollAnimationSrc={actions.setItemScrollAnimationSrc}
  setItemFontSelection={actions.setItemFontSelection}
  setItemPriceVisible={actions.setItemPriceVisible}
  touchDraft={actions.touchDraft}
/>
