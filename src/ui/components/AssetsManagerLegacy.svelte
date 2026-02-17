<script lang="ts">
  type AssetEntry = {
    id: string;
    name: string;
    path: string;
    kind: "file" | "directory";
  };

  type AssetTreeRow = {
    entry: AssetEntry;
    depth: number;
    hasChildren: boolean;
    expanded: boolean;
  };

  export let t: (key: string) => string = (key) => key;
  export let rootLabel = "";
  export let assetProjectReadOnly = false;
  export let assetUploadInput: HTMLInputElement | null = null;
  export let uploadTargetPath = "";
  export let uploadFolderOptions: { value: string; label: string }[] = [];
  export let needsAssets = false;
  export let fsError = "";
  export let assetTaskVisible = false;
  export let assetTaskStep = "";
  export let assetTaskProgress = 0;
  export let assetMode: "filesystem" | "bridge" | "none" = "none";
  export let fsEntries: AssetEntry[] = [];
  export let treeRows: AssetTreeRow[] = [];
  export let selectedAssetIds: string[] = [];

  export let createFolder: () => void = () => {};
  export let handleAssetUpload: (event: Event) => void = () => {};
  export let handleAssetDragOver: (event: DragEvent) => void = () => {};
  export let handleAssetDrop: (event: DragEvent) => void = () => {};
  export let selectAllAssets: () => void = () => {};
  export let clearAssetSelection: () => void = () => {};
  export let bulkMove: () => void = () => {};
  export let bulkDelete: () => void = () => {};
  export let toggleAssetSelection: (entryId: string) => void = () => {};
  export let toggleExpandPath: (path: string) => void = () => {};
  export let renameEntry: (entry: AssetEntry) => void = () => {};
  export let moveEntry: (entry: AssetEntry) => void = () => {};
  export let deleteEntry: (entry: AssetEntry) => void = () => {};

  const LOCKED_ROOTS = new Set(["originals/backgrounds", "originals/items", "originals/fonts"]);
  const isLockedRoot = (path: string) => LOCKED_ROOTS.has(path);
  let assetWorkspaceReadOnly = false;
  let hasRenderedRows = false;
  $: assetWorkspaceReadOnly = assetProjectReadOnly || assetMode === "none";
  $: hasRenderedRows = treeRows.length > 0 || fsEntries.length > 0;
</script>

<section class="asset-manager">
  <div class="asset-manager__header">
    <div>
      <p>{t("rootTitle")}</p>
      <span>{rootLabel}</span>
    </div>
    <div class="asset-header-actions">
      <button
        type="button"
        class="asset-icon-btn"
        title={t("newFolder")}
        aria-label={t("newFolder")}
        on:click={createFolder}
        disabled={assetWorkspaceReadOnly}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h4l1.6 2h9.4A1.5 1.5 0 0 1 21 8.5v9A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5v-11z" />
          <path d="M12 10.5v5M9.5 13h5" />
        </svg>
      </button>
      <button
        type="button"
        class="asset-icon-btn"
        title={t("uploadAssets")}
        aria-label={t("uploadAssets")}
        disabled={assetWorkspaceReadOnly}
        on:click={() => assetUploadInput?.click()}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 15V6" />
          <path d="M8.5 9.5 12 6l3.5 3.5" />
          <path d="M4 17.5A1.5 1.5 0 0 0 5.5 19h13a1.5 1.5 0 0 0 1.5-1.5V17" />
        </svg>
      </button>
      <input
        class="sr-only"
        type="file"
        multiple
        disabled={assetWorkspaceReadOnly}
        bind:this={assetUploadInput}
        on:change={handleAssetUpload}
      />
    </div>
  </div>
  {#if assetTaskVisible}
    <div class="asset-task" role="status" aria-live="polite">
      <div class="asset-task__row">
        <p>{assetTaskStep}</p>
        <span>{Math.round(assetTaskProgress)}%</span>
      </div>
      <div class="asset-task__bar" aria-hidden="true">
        <span style={`width:${Math.max(0, Math.min(100, assetTaskProgress))}%`}></span>
      </div>
    </div>
  {/if}
  <div class="asset-drop">
    <label class="editor-field">
      <span>{t("uploadTo")}</span>
      <select bind:value={uploadTargetPath} class="editor-select" disabled={assetWorkspaceReadOnly}>
        {#each uploadFolderOptions as folder}
          <option value={folder.value}>{folder.label}</option>
        {/each}
      </select>
    </label>
    {#if needsAssets}
      <p class="text-xs text-amber-200">{t("assetsRequired")}</p>
    {/if}
    <p>{t("uploadHint")}</p>
    <div
      class={`asset-drop__zone ${assetWorkspaceReadOnly ? "disabled" : ""}`}
      role="button"
      tabindex={assetWorkspaceReadOnly ? -1 : 0}
      aria-label={t("uploadAssets")}
      on:dragover={handleAssetDragOver}
      on:drop={handleAssetDrop}
      on:click={() => !assetWorkspaceReadOnly && assetUploadInput?.click()}
      on:keydown={(event) => {
        if (assetWorkspaceReadOnly) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          assetUploadInput?.click();
        }
      }}
    >
      {t("dragDrop")}
    </div>
  </div>
  {#if assetProjectReadOnly}
    <p class="text-xs text-amber-200">{t("assetsReadOnly")}</p>
  {/if}
  {#if fsError}
    <p class="text-xs text-red-300">{fsError}</p>
  {/if}
  <div class="asset-bulk">
    <button type="button" on:click={selectAllAssets} disabled={assetWorkspaceReadOnly}>
      {t("selectAll")}
    </button>
    <button type="button" on:click={clearAssetSelection}>{t("clear")}</button>
    <button type="button" on:click={bulkMove} disabled={assetWorkspaceReadOnly}>
      {t("move")}
    </button>
    <button type="button" on:click={bulkDelete} disabled={assetWorkspaceReadOnly}>
      {t("delete")}
    </button>
  </div>
  <div class="asset-list">
    {#if assetMode === "none" && !hasRenderedRows}
      <p class="text-xs text-slate-400">{t("pickRootHint")}</p>
    {:else if !hasRenderedRows}
      <p class="text-xs text-slate-400">{t("rootEmpty")}</p>
    {:else}
      {#each treeRows as row}
        <div class="asset-item">
          <label class="asset-check">
            <input
              type="checkbox"
              disabled={assetWorkspaceReadOnly}
              checked={selectedAssetIds.includes(row.entry.id)}
              on:change={() => toggleAssetSelection(row.entry.id)}
            />
          </label>
          <div>
            <div
              class="asset-name"
              style={`padding-left:${row.depth * 16}px`}
            >
              {#if row.entry.kind === "directory" && row.hasChildren}
                <button
                  class="asset-toggle"
                  type="button"
                  on:click={() => toggleExpandPath(row.entry.path)}
                >
                  {row.expanded ? "▾" : "▸"}
                </button>
              {:else}
                <span class="asset-toggle placeholder"></span>
              {/if}
              <span class="asset-icon">
                {row.entry.kind === "directory" ? "📁" : "📄"}
              </span>
              <span>{row.entry.name}</span>
            </div>
            <p class="asset-meta">{row.entry.path}</p>
          </div>
          <div class="asset-row-actions">
            <button
              type="button"
              class="asset-icon-btn"
              title={t("rename")}
              aria-label={t("rename")}
              disabled={assetWorkspaceReadOnly || isLockedRoot(row.entry.path)}
              on:click={() => renameEntry(row.entry)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 20h4l9.5-9.5a1.75 1.75 0 1 0-2.5-2.5L5.5 17.5 4 20z" />
                <path d="m13.5 6.5 4 4" />
              </svg>
            </button>
            <button
              type="button"
              class="asset-icon-btn"
              title={t("move")}
              aria-label={t("move")}
              disabled={assetWorkspaceReadOnly || isLockedRoot(row.entry.path)}
              on:click={() => moveEntry(row.entry)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m6 8 3-3 3 3" />
                <path d="M9 5v10" />
                <path d="m18 16-3 3-3-3" />
                <path d="M15 9v10" />
              </svg>
            </button>
            <button
              type="button"
              class="asset-icon-btn danger"
              title={t("delete")}
              aria-label={t("delete")}
              disabled={assetWorkspaceReadOnly || isLockedRoot(row.entry.path)}
              on:click={() => deleteEntry(row.entry)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 7h14" />
                <path d="M10 11v6M14 11v6" />
                <path d="M7.5 7 8.5 19h7L16.5 7" />
                <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
              </svg>
            </button>
          </div>
        </div>
      {/each}
    {/if}
  </div>
</section>
