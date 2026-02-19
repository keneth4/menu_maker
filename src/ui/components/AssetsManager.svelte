<script lang="ts">
  import type { AssetsManagerActions, AssetsManagerModel } from "../contracts/components";
  import AssetsManagerLegacy from "./AssetsManagerLegacy.svelte";

  export let model: AssetsManagerModel;
  export let actions: AssetsManagerActions;

  let syncedAssetUploadInput: HTMLInputElement | null = null;

  $: if (model.assetUploadInput !== syncedAssetUploadInput) {
    syncedAssetUploadInput = model.assetUploadInput;
  }
</script>

<AssetsManagerLegacy
  t={model.t}
  rootLabel={model.rootLabel}
  assetProjectReadOnly={model.assetProjectReadOnly}
  assetUploadInput={syncedAssetUploadInput}
  onAssetUploadInputChange={actions.setAssetUploadInput}
  uploadTargetPath={model.uploadTargetPath}
  onUploadTargetChange={actions.setUploadTargetPath}
  uploadFolderOptions={model.uploadFolderOptions}
  needsAssets={model.needsAssets}
  fsError={model.fsError}
  assetTaskVisible={model.assetTaskVisible}
  assetTaskStep={model.assetTaskStep}
  assetTaskProgress={model.assetTaskProgress}
  assetMode={model.assetMode}
  fsEntries={model.fsEntries}
  treeRows={model.treeRows}
  selectedAssetIds={model.selectedAssetIds}
  createFolder={actions.createFolder}
  createFolderNamed={actions.createFolderNamed}
  handleAssetUpload={actions.handleAssetUpload}
  handleAssetDragOver={actions.handleAssetDragOver}
  handleAssetDrop={actions.handleAssetDrop}
  selectAllAssets={actions.selectAllAssets}
  clearAssetSelection={actions.clearAssetSelection}
  bulkMove={actions.bulkMove}
  bulkDelete={actions.bulkDelete}
  toggleAssetSelection={actions.toggleAssetSelection}
  toggleExpandPath={actions.toggleExpandPath}
  renameEntry={actions.renameEntry}
  renameEntryNamed={actions.renameEntryNamed}
  moveEntry={actions.moveEntry}
  deleteEntry={actions.deleteEntry}
/>
