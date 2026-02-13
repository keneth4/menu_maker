<script lang="ts">
  import type { AssetsManagerActions, AssetsManagerModel } from "../contracts/components";
  import AssetsManagerLegacy from "./AssetsManagerLegacy.svelte";

  export let model: AssetsManagerModel;
  export let actions: AssetsManagerActions;

  let assetUploadInput: HTMLInputElement | null = null;
  let uploadTargetPath = "";

  $: if (model.assetUploadInput !== assetUploadInput) {
    assetUploadInput = model.assetUploadInput;
  }
  $: if (model.uploadTargetPath !== uploadTargetPath) {
    uploadTargetPath = model.uploadTargetPath;
  }

  $: if (assetUploadInput !== model.assetUploadInput) {
    actions.setAssetUploadInput(assetUploadInput);
  }
  $: if (uploadTargetPath !== model.uploadTargetPath) {
    actions.setUploadTargetPath(uploadTargetPath);
  }
</script>

<AssetsManagerLegacy
  t={model.t}
  rootLabel={model.rootLabel}
  assetProjectReadOnly={model.assetProjectReadOnly}
  bind:assetUploadInput
  bind:uploadTargetPath
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
  moveEntry={actions.moveEntry}
  deleteEntry={actions.deleteEntry}
/>
