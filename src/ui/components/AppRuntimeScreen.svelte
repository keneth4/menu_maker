<script lang="ts">
  import AppRuntimeScreenContent from "./AppRuntimeScreenContent.svelte";
  import type { AppController } from "../controllers/createAppController";

  export let controller: AppController | null = null;
</script>

<AppRuntimeScreenContent {controller} />
