<script lang="ts">
  import type { AppController } from "../controllers/createAppController";
  import AppRuntimeScreen from "./AppRuntimeScreen.svelte";

  export let controller: AppController | null = null;
</script>

<AppRuntimeScreen {controller} />
