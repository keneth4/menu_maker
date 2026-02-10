<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { MenuItem } from "../../lib/types";

  export let dish: MenuItem;
  export let interactiveEnabled = false;
  export let detailRotateHint = "";
  export let modalMediaHost: HTMLDivElement | null = null;
  export let modalMediaImage: HTMLImageElement | null = null;

  export let textOf: (value: Record<string, string> | undefined, fallback?: string) => string =
    () => "";
  export let getDetailImageSource: (value: MenuItem) => string = () => "";
  export let getAllergenValues: (value: MenuItem) => string[] = () => [];
  export let getMenuTerm: (key: string) => string = (key) => key;
  export let formatPrice: (value: number) => string = (value) => String(value);

  const dispatch = createEventDispatcher<{
    close: void;
  }>();

  let detailMediaSrc = "";
  let previousDetailMediaSrc = "";
  let detailMediaLoading = true;

  $: detailMediaSrc = getDetailImageSource(dish);
  $: if (detailMediaSrc !== previousDetailMediaSrc) {
    previousDetailMediaSrc = detailMediaSrc;
    detailMediaLoading = true;
  }
</script>

<div class="dish-modal" on:click={() => dispatch("close")}>
  <div class="dish-modal__card" on:click|stopPropagation>
    <div class="dish-modal__header">
      <p class="dish-modal__title">{textOf(dish.name)}</p>
      <button class="dish-modal__close" type="button" on:click={() => dispatch("close")}>✕</button>
    </div>
    <div class="dish-modal__media" bind:this={modalMediaHost}>
      {#if interactiveEnabled}
        <p class="dish-modal__media-note">{detailRotateHint}</p>
      {/if}
      {#if detailMediaLoading}
        <div class="dish-modal__media-loading" aria-hidden="true">
          <span></span>
        </div>
      {/if}
      <img
        bind:this={modalMediaImage}
        src={detailMediaSrc}
        alt={textOf(dish.name)}
        draggable="false"
        on:contextmenu|preventDefault
        on:dragstart|preventDefault
        on:load={() => (detailMediaLoading = false)}
        on:error={() => (detailMediaLoading = false)}
        decoding="async"
      />
    </div>
    <div class="dish-modal__content">
      <div class="dish-modal__text">
        <p class="dish-modal__desc">{textOf(dish.description)}</p>
        {#if textOf(dish.longDescription)}
          <p class="dish-modal__long">{textOf(dish.longDescription)}</p>
        {/if}
        {#if dish.allergens?.length}
          <p class="dish-modal__allergens">
            {getMenuTerm("allergens")}: {getAllergenValues(dish).join(", ")}
          </p>
        {/if}
        {#if dish.vegan}
          <span class="dish-modal__badge">🌿 {getMenuTerm("vegan")}</span>
        {/if}
      </div>
      <p class="dish-modal__price">
        {formatPrice(dish.price.amount)}
      </p>
    </div>
  </div>
</div>
