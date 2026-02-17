<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { MenuItem } from "../../lib/types";

  export let dish: MenuItem;
  export let interactiveEnabled = false;
  export let itemFontStyle = "";
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

<div
  class="dish-modal open"
  role="dialog"
  aria-modal="true"
>
  <button
    class="dish-modal__backdrop"
    type="button"
    aria-label="Close"
    on:click={() => dispatch("close")}
  ></button>
  <div class="dish-modal__card" style={itemFontStyle}>
    <div class="dish-modal__header">
      <p class="dish-modal__title">{textOf(dish.name)}</p>
      <button class="dish-modal__close" type="button" on:click={() => dispatch("close")}>✕</button>
    </div>
    <div class="dish-modal__media" bind:this={modalMediaHost}>
      {#if interactiveEnabled}
        <div class="dish-modal__rotate-cue" aria-hidden="true">
          <span class="dish-modal__rotate-cue-gesture">
            <svg
              class="dish-modal__rotate-cue-gesture-main"
              data-icon="gesture-swipe-horizontal"
              viewBox="0 0 24 24"
              role="presentation"
              focusable="false"
              aria-hidden="true"
            >
              <path
                d="M6 1L3 4l3 3V5h3v2l3-3l-3-3v2H6zm5 7a1 1 0 0 0-1 1v10l-3.2-1.72h-.22c-.28 0-.55.11-.74.32l-.74.77l4.9 4.2c.26.28.62.43 1 .43h6.5a1.5 1.5 0 0 0 1.5-1.5v-4.36c0-.58-.32-1.11-.85-1.35l-4.94-2.19l-1.21-.13V9a1 1 0 0 0-1-1"
              />
            </svg>
            <svg
              class="dish-modal__rotate-cue-gesture-ghost"
              data-icon="gesture-swipe-horizontal"
              viewBox="0 0 24 24"
              role="presentation"
              focusable="false"
              aria-hidden="true"
            >
              <path
                d="M6 1L3 4l3 3V5h3v2l3-3l-3-3v2H6zm5 7a1 1 0 0 0-1 1v10l-3.2-1.72h-.22c-.28 0-.55.11-.74.32l-.74.77l4.9 4.2c.26.28.62.43 1 .43h6.5a1.5 1.5 0 0 0 1.5-1.5v-4.36c0-.58-.32-1.11-.85-1.35l-4.94-2.19l-1.21-.13V9a1 1 0 0 0-1-1"
              />
            </svg>
          </span>
        </div>
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
      {#if dish.priceVisible !== false}
        <p class="dish-modal__price">
          {formatPrice(dish.price.amount)}
        </p>
      {/if}
    </div>
  </div>
</div>
