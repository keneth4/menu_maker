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
  export let onAssetUploadInputChange: (input: HTMLInputElement | null) => void = () => {};
  export let uploadTargetPath = "";
  export let onUploadTargetChange: (path: string) => void = () => {};
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
  export let createFolderNamed: (name: string, parentPath?: string) => Promise<void> | void = () => {};
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
  export let renameEntryNamed: (entry: AssetEntry, name: string) => Promise<void> | void = () => {};
  export let moveEntry: (entry: AssetEntry) => void = () => {};
  export let deleteEntry: (entry: AssetEntry) => void = () => {};

  const LOCKED_ROOTS = new Set([
    "originals",
    "originals/backgrounds",
    "originals/items",
    "originals/fonts",
    "originals/logos"
  ]);
  const isLockedRoot = (path: string) => LOCKED_ROOTS.has(path.trim());
  const normalizePath = (path: string) =>
    path
      .replace(/\\/g, "/")
      .replace(/^\/+/, "")
      .replace(/\/+$/, "")
      .trim();

  let assetWorkspaceReadOnly = false;
  let hasRenderedRows = false;
  let previousAssetUploadInput: HTMLInputElement | null = null;
  let editingEntryId = "";
  let editingValue = "";
  let renameInput: HTMLInputElement | null = null;
  let creatingFolderInline = false;
  let creatingFolderValue = "";
  let newFolderInput: HTMLInputElement | null = null;
  let hasInlineCreateAnchor = false;

  $: assetWorkspaceReadOnly = assetProjectReadOnly || assetMode === "none";
  $: hasRenderedRows = treeRows.length > 0 || fsEntries.length > 0;
  $: hasInlineCreateAnchor =
    creatingFolderInline &&
    treeRows.some(
      (row) => row.entry.kind === "directory" && normalizePath(row.entry.path) === normalizePath(uploadTargetPath)
    );
  $: if (assetUploadInput !== previousAssetUploadInput) {
    previousAssetUploadInput = assetUploadInput;
    onAssetUploadInputChange(assetUploadInput);
  }
  $: if (editingEntryId && renameInput) {
    renameInput.focus();
    renameInput.select();
  }
  $: if (creatingFolderInline && newFolderInput) {
    newFolderInput.focus();
    newFolderInput.select();
  }

  const cancelInlineRename = () => {
    editingEntryId = "";
    editingValue = "";
  };

  const cancelInlineCreateFolder = () => {
    creatingFolderInline = false;
    creatingFolderValue = "";
  };

  const handleUploadTargetChange = (event: Event) => {
    const target = event.currentTarget;
    if (!(target instanceof HTMLSelectElement)) return;
    onUploadTargetChange(target.value);
  };

  const beginInlineRename = (entry: AssetEntry) => {
    if (assetWorkspaceReadOnly || isLockedRoot(entry.path)) return;
    cancelInlineCreateFolder();
    editingEntryId = entry.id;
    editingValue = entry.name;
  };

  const commitInlineRename = async (entry: AssetEntry) => {
    const nextValue = editingValue.trim();
    if (!nextValue) {
      cancelInlineRename();
      return;
    }
    await renameEntryNamed(entry, nextValue);
    cancelInlineRename();
  };

  const beginInlineCreateFolder = () => {
    if (assetWorkspaceReadOnly) return;
    cancelInlineRename();
    creatingFolderInline = true;
    creatingFolderValue = "";
  };

  const commitInlineCreateFolder = async () => {
    const nextValue = creatingFolderValue.trim();
    if (!nextValue) {
      cancelInlineCreateFolder();
      return;
    }
    await createFolderNamed(nextValue, uploadTargetPath || undefined);
    cancelInlineCreateFolder();
  };

  const isInlineCreateAnchor = (row: AssetTreeRow) =>
    row.entry.kind === "directory" && normalizePath(row.entry.path) === normalizePath(uploadTargetPath);

  const inlineFolderPath = () => {
    const base = normalizePath(uploadTargetPath);
    const name = normalizePath(creatingFolderValue);
    if (!base) return name;
    if (!name) return base;
    return `${base}/${name}`;
  };

  const handleInlineRenameKeydown = async (entry: AssetEntry, event: KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault();
      await commitInlineRename(entry);
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      cancelInlineRename();
    }
  };

  const handleInlineCreateKeydown = async (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault();
      await commitInlineCreateFolder();
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      cancelInlineCreateFolder();
    }
  };
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
        on:click={beginInlineCreateFolder}
        disabled={assetWorkspaceReadOnly}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h4l1.6 2h9.4A1.5 1.5 0 0 1 21 8.5v9A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5v-11z" />
          <path d="M12 10.5v5M9.5 13h5" />
        </svg>
        <span>{t("newFolder")}</span>
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
        <span>{t("uploadAssets")}</span>
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
      <select
        value={uploadTargetPath}
        class="editor-select"
        disabled={assetWorkspaceReadOnly}
        on:change={handleUploadTargetChange}
      >
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
      {#if creatingFolderInline && !hasInlineCreateAnchor}
        <div class="asset-item asset-item--inline">
          <div class="asset-check" aria-hidden="true">
            <span class="asset-toggle placeholder"></span>
          </div>
          <div>
            <div class="asset-name asset-name--editing">
              <span class="asset-toggle placeholder"></span>
              <span class="asset-icon" aria-hidden="true">📁</span>
              <input
                bind:this={newFolderInput}
                class="asset-name-input"
                type="text"
                bind:value={creatingFolderValue}
                aria-label={t("newFolder")}
                on:keydown={handleInlineCreateKeydown}
              />
            </div>
            <p class="asset-meta">{inlineFolderPath()}</p>
          </div>
          <div class="asset-row-actions">
            <button
              type="button"
              class="asset-icon-btn"
              title={t("save")}
              aria-label={t("save")}
              on:click={() => void commitInlineCreateFolder()}
            >
              <span aria-hidden="true">💾</span>
              <span>{t("save")}</span>
            </button>
            <button
              type="button"
              class="asset-icon-btn danger"
              title={t("clear")}
              aria-label={t("clear")}
              on:click={cancelInlineCreateFolder}
            >
              <span aria-hidden="true">✕</span>
              <span>{t("clear")}</span>
            </button>
          </div>
        </div>
      {/if}
      {#each treeRows as row}
        <div class="asset-item">
          <label class="asset-check">
            <input
              type="checkbox"
              disabled={assetWorkspaceReadOnly || isLockedRoot(row.entry.path)}
              checked={selectedAssetIds.includes(row.entry.id)}
              on:change={() => toggleAssetSelection(row.entry.id)}
            />
          </label>
          <div>
            <div class="asset-name" style={`padding-left:${row.depth * 16}px`}>
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
              {#if editingEntryId === row.entry.id}
                <input
                  bind:this={renameInput}
                  class="asset-name-input"
                  type="text"
                  bind:value={editingValue}
                  aria-label={t("rename")}
                  on:keydown={(event) => handleInlineRenameKeydown(row.entry, event)}
                />
              {:else}
                <span>{row.entry.name}</span>
              {/if}
            </div>
            <p class="asset-meta">{row.entry.path}</p>
          </div>
          <div class="asset-row-actions">
            {#if editingEntryId === row.entry.id}
              <button
                type="button"
                class="asset-icon-btn"
                title={t("save")}
                aria-label={t("save")}
                on:click={() => void commitInlineRename(row.entry)}
              >
                <span aria-hidden="true">💾</span>
                <span>{t("save")}</span>
              </button>
              <button
                type="button"
                class="asset-icon-btn danger"
                title={t("clear")}
                aria-label={t("clear")}
                on:click={cancelInlineRename}
              >
                <span aria-hidden="true">✕</span>
                <span>{t("clear")}</span>
              </button>
            {:else}
              <button
                type="button"
                class="asset-icon-btn"
                title={t("rename")}
                aria-label={t("rename")}
                disabled={assetWorkspaceReadOnly || isLockedRoot(row.entry.path)}
                on:click={() => beginInlineRename(row.entry)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 20h4l9.5-9.5a1.75 1.75 0 1 0-2.5-2.5L5.5 17.5 4 20z" />
                  <path d="m13.5 6.5 4 4" />
                </svg>
                <span>{t("rename")}</span>
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
                <span>{t("move")}</span>
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
                <span>{t("delete")}</span>
              </button>
            {/if}
          </div>
        </div>
        {#if creatingFolderInline && isInlineCreateAnchor(row)}
          <div class="asset-item asset-item--inline">
            <div class="asset-check" aria-hidden="true">
              <span class="asset-toggle placeholder"></span>
            </div>
            <div>
              <div class="asset-name asset-name--editing" style={`padding-left:${(row.depth + 1) * 16}px`}>
                <span class="asset-toggle placeholder"></span>
                <span class="asset-icon" aria-hidden="true">📁</span>
                <input
                  bind:this={newFolderInput}
                  class="asset-name-input"
                  type="text"
                  bind:value={creatingFolderValue}
                  aria-label={t("newFolder")}
                  on:keydown={handleInlineCreateKeydown}
                />
              </div>
              <p class="asset-meta">{inlineFolderPath()}</p>
            </div>
            <div class="asset-row-actions">
              <button
                type="button"
                class="asset-icon-btn"
                title={t("save")}
                aria-label={t("save")}
                on:click={() => void commitInlineCreateFolder()}
              >
                <span aria-hidden="true">💾</span>
                <span>{t("save")}</span>
              </button>
              <button
                type="button"
                class="asset-icon-btn danger"
                title={t("clear")}
                aria-label={t("clear")}
                on:click={cancelInlineCreateFolder}
              >
                <span aria-hidden="true">✕</span>
                <span>{t("clear")}</span>
              </button>
            </div>
          </div>
        {/if}
      {/each}
    {/if}
  </div>
</section>
