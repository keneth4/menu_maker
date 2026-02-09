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
</script>

<section class="asset-manager">
  <div class="asset-manager__header">
    <div>
      <p>{t("rootTitle")}</p>
      <span>{rootLabel}</span>
    </div>
    <div class="asset-actions">
      <button type="button" on:click={createFolder} disabled={assetProjectReadOnly}>
        {t("newFolder")}
      </button>
      <button
        type="button"
        disabled={assetProjectReadOnly}
        on:click={() => assetUploadInput?.click()}
      >
        {t("uploadAssets")}
      </button>
      <input
        class="sr-only"
        type="file"
        multiple
        disabled={assetProjectReadOnly}
        bind:this={assetUploadInput}
        on:change={handleAssetUpload}
      />
    </div>
  </div>
  <div class="asset-drop">
    <label class="editor-field">
      <span>{t("uploadTo")}</span>
      <select bind:value={uploadTargetPath} class="editor-select" disabled={assetProjectReadOnly}>
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
      class={`asset-drop__zone ${assetProjectReadOnly ? "disabled" : ""}`}
      on:dragover={handleAssetDragOver}
      on:drop={handleAssetDrop}
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
    <button type="button" on:click={selectAllAssets} disabled={assetProjectReadOnly}>
      {t("selectAll")}
    </button>
    <button type="button" on:click={clearAssetSelection}>{t("clear")}</button>
    <button type="button" on:click={bulkMove} disabled={assetProjectReadOnly}>
      {t("move")}
    </button>
    <button type="button" on:click={bulkDelete} disabled={assetProjectReadOnly}>
      {t("delete")}
    </button>
  </div>
  <div class="asset-list">
    {#if assetMode === "none"}
      <p class="text-xs text-slate-400">{t("pickRootHint")}</p>
    {:else if fsEntries.length === 0}
      <p class="text-xs text-slate-400">{t("rootEmpty")}</p>
    {:else}
      {#each treeRows as row}
        <div class="asset-item">
          <label class="asset-check">
            <input
              type="checkbox"
              disabled={assetProjectReadOnly}
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
          <div class="asset-actions">
            <button
              type="button"
              class="asset-icon-btn"
              title={t("rename")}
              aria-label={t("rename")}
              disabled={assetProjectReadOnly}
              on:click={() => renameEntry(row.entry)}
            >
              ✎
            </button>
            <button
              type="button"
              class="asset-icon-btn"
              title={t("move")}
              aria-label={t("move")}
              disabled={assetProjectReadOnly}
              on:click={() => moveEntry(row.entry)}
            >
              ⇄
            </button>
            <button
              type="button"
              class="asset-icon-btn danger"
              title={t("delete")}
              aria-label={t("delete")}
              disabled={assetProjectReadOnly}
              on:click={() => deleteEntry(row.entry)}
            >
              ✕
            </button>
          </div>
        </div>
      {/each}
    {/if}
  </div>
</section>
