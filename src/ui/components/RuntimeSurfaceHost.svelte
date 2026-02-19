<script lang="ts">
  import type { RuntimeSurfaceHostActions, RuntimeSurfaceHostModel } from "../contracts/components";
  import DishModal from "./DishModal.svelte";

  export let model: RuntimeSurfaceHostModel;
  export let actions: RuntimeSurfaceHostActions;
</script>

{#if model.activeItem && model.dish}
  <DishModal
    model={{
      t: model.t,
      dish: model.dish,
      interactiveEnabled: model.interactiveEnabled,
      itemFontStyle: model.itemFontStyle,
      modalMediaHost: model.modalMediaHost,
      modalMediaImage: model.modalMediaImage,
      textOf: model.textOf,
      getDetailImageSource: model.getDetailImageSource,
      getAllergenValues: model.getAllergenValues,
      getMenuTerm: model.getMenuTerm,
      formatPrice: model.formatPrice
    }}
    actions={{
      close: actions.closeDish,
      setModalMediaHost: actions.setModalMediaHost,
      setModalMediaImage: actions.setModalMediaImage
    }}
  />
{/if}

{#if model.assetOptions.length}
  <datalist id="asset-files">
    {#each model.assetOptions as option}
      <option value={option.value} label={option.label}></option>
    {/each}
  </datalist>
{/if}
{#if model.fontAssetOptions.length}
  <datalist id="font-asset-files">
    {#each model.fontAssetOptions as option}
      <option value={option.value} label={option.label}></option>
    {/each}
  </datalist>
{/if}
