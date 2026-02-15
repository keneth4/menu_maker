<script lang="ts">
  import { onMount } from "svelte";
  import { createAppController } from "./ui/controllers/createAppController";
  import AppRuntime from "./ui/components/AppRuntime.svelte";

  const appController = createAppController();

  onMount(() => {
    appController.mount();
    return () => {
      appController.destroy();
    };
  });
</script>

<AppRuntime controller={appController} />
