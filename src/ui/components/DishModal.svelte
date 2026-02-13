<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { DishModalActions, DishModalModel } from "../contracts/components";
  import DishModalLegacy from "./DishModalLegacy.svelte";

  export let model: DishModalModel;
  export let actions: DishModalActions;

  const dispatch = createEventDispatcher<{
    close: void;
  }>();

  let modalMediaHost: HTMLDivElement | null = null;
  let modalMediaImage: HTMLImageElement | null = null;
  let modelModalMediaHost: HTMLDivElement | null = null;
  let modelModalMediaImage: HTMLImageElement | null = null;

  const handleClose = () => {
    actions.close();
    dispatch("close");
  };

  $: if (model.modalMediaHost !== modelModalMediaHost) {
    modelModalMediaHost = model.modalMediaHost;
    modalMediaHost = model.modalMediaHost;
  }
  $: if (model.modalMediaImage !== modelModalMediaImage) {
    modelModalMediaImage = model.modalMediaImage;
    modalMediaImage = model.modalMediaImage;
  }

  $: if (modalMediaHost !== modelModalMediaHost) {
    modelModalMediaHost = modalMediaHost;
    actions.setModalMediaHost(modalMediaHost);
  }
  $: if (modalMediaImage !== modelModalMediaImage) {
    modelModalMediaImage = modalMediaImage;
    actions.setModalMediaImage(modalMediaImage);
  }
</script>

<DishModalLegacy
  dish={model.dish}
  interactiveEnabled={model.interactiveEnabled}
  itemFontStyle={model.itemFontStyle}
  bind:modalMediaHost
  bind:modalMediaImage
  textOf={model.textOf}
  getDetailImageSource={model.getDetailImageSource}
  getAllergenValues={model.getAllergenValues}
  getMenuTerm={model.getMenuTerm}
  formatPrice={model.formatPrice}
  on:close={handleClose}
/>
