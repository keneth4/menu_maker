<script lang="ts">
  import EditorShell from "./EditorShell.svelte";
  import LandingView from "./LandingView.svelte";
  import PreviewCanvas from "./PreviewCanvas.svelte";
  import RuntimeEditorTabContent from "./RuntimeEditorTabContent.svelte";

  export let shell: any;
  export let editor: any;
  export let preview: any;
  export let actions: any;
  export let controllers: any;

  let projectFileInput: HTMLInputElement | null = null;
  let previousProjectFileInput: HTMLInputElement | null = null;
  $: if (projectFileInput !== previousProjectFileInput) {
    previousProjectFileInput = projectFileInput;
    actions?.setProjectFileInput?.(projectFileInput);
  }
</script>

<main class="min-h-screen app-shell">
  <input
    class="sr-only"
    type="file"
    accept=".json,.zip,application/zip"
    bind:this={projectFileInput}
    on:change={controllers.projectWorkflowController.handleProjectFile}
  />
  {#if shell.showLanding}
    <LandingView
      uiLang={shell.uiLang}
      t={shell.t}
      on:switchLang={(event) => actions.setUiLang(event.detail)}
      on:createProject={controllers.projectWorkflowController.startCreateProject}
      on:openProject={controllers.projectWorkflowController.startOpenProject}
      on:startWizard={controllers.projectWorkflowController.startWizard}
    />
  {:else if shell.loadError}
    <div class="rounded-2xl border border-red-500/30 bg-red-950/40 p-5 text-sm text-red-100">
      {shell.loadError}
    </div>
  {:else if !shell.project}
    <div class="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-200">
      {shell.t("loadingProject")}
    </div>
  {:else if shell.activeProject}
    <div class="split-layout">
      {#if shell.showEditorToggle}
        <button
          class="menu-fab"
          type="button"
          aria-label={shell.t("openEditor")}
          on:click={actions.toggleEditor}
        >
          <span class="menu-fab__icon"></span>
        </button>
      {/if}

      {#if shell.editorVisible && shell.editorPresentation === "desktop-card"}
        <button
          class="editor-backdrop"
          type="button"
          aria-label={shell.t("closeEditor")}
          on:click={actions.toggleEditor}
        ></button>
      {/if}

      <EditorShell
        t={shell.t}
        editorVisible={shell.editorVisible}
        editorPresentation={shell.editorPresentation}
        uiLang={shell.uiLang}
        editorTab={shell.editorTab}
        setUiLang={actions.setUiLang}
        setEditorTab={actions.setEditorTab}
        togglePreviewMode={actions.togglePreviewMode}
        toggleEditor={actions.toggleEditor}
      >
        <RuntimeEditorTabContent
          editorTab={shell.editorTab}
          t={shell.t}
          draft={editor.draft}
          uiLang={shell.uiLang}
          templateOptions={editor.templateOptions}
          workflowMode={editor.workflowMode}
          openError={editor.openError}
          exportStatus={editor.exportStatus}
          exportError={editor.exportError}
          workflowStep={editor.workflowStep}
          workflowProgress={editor.workflowProgress}
          fontChoice={editor.fontChoice}
          fontAssetOptions={editor.fontAssetOptions}
          rootLabel={editor.rootLabel}
          assetProjectReadOnly={editor.assetProjectReadOnly}
          assetUploadInput={editor.assetUploadInput}
          uploadTargetPath={editor.uploadTargetPath}
          uploadFolderOptions={editor.uploadFolderOptions}
          needsAssets={editor.needsAssets}
          fsError={editor.fsError}
          assetTaskVisible={editor.assetTaskVisible}
          assetTaskStep={editor.assetTaskStep}
          assetTaskProgress={editor.assetTaskProgress}
          assetMode={editor.assetMode}
          fsEntries={editor.fsEntries}
          treeRows={editor.treeRows}
          selectedAssetIds={editor.selectedAssetIds}
          deviceMode={shell.deviceMode}
          previewMode={shell.previewMode}
          editPanel={editor.editPanel}
          editLang={editor.editLang}
          selectedCategoryId={editor.selectedCategoryId}
          selectedItemId={editor.selectedItemId}
          selectedCategory={editor.selectedCategory}
          selectedItem={editor.selectedItem}
          assetOptions={editor.assetOptions}
          sectionBackgroundOptionsByCategory={editor.sectionBackgroundOptionsByCategory}
          sectionBackgroundNeedsCoverage={editor.sectionBackgroundNeedsCoverage}
          sectionBackgroundHasDuplicates={editor.sectionBackgroundHasDuplicates}
          commonAllergenCatalog={editor.commonAllergenCatalog}
          normalizeBackgroundCarouselSeconds={editor.normalizeBackgroundCarouselSeconds}
          wizardStep={editor.wizardStep}
          wizardSteps={editor.wizardSteps}
          wizardProgress={editor.wizardProgress}
          wizardStatus={editor.wizardStatus}
          wizardLang={editor.wizardLang}
          wizardCategoryId={editor.wizardCategoryId}
          wizardItemId={editor.wizardItemId}
          wizardCategory={editor.wizardCategory}
          wizardItem={editor.wizardItem}
          wizardDemoPreview={editor.wizardDemoPreview}
          wizardNeedsRootBackground={editor.wizardNeedsRootBackground}
          editorDraftController={controllers.editorDraftController}
          projectWorkflowController={controllers.projectWorkflowController}
          assetWorkspaceController={controllers.assetWorkspaceController}
          getLocalizedValue={editor.getLocalizedValue}
          textOf={editor.textOf}
          ensureRestaurantName={editor.ensureRestaurantName}
          ensureMetaTitle={editor.ensureMetaTitle}
          touchDraft={editor.touchDraft}
          setUploadTargetPath={actions.setUploadTargetPath}
          setAssetUploadInput={actions.setAssetUploadInput}
          setEditPanel={actions.setEditPanel}
          setSelectedCategoryId={actions.setSelectedCategoryId}
          setSelectedItemId={actions.setSelectedItemId}
          setWizardLang={actions.setWizardLang}
          setWizardCategoryId={actions.setWizardCategoryId}
          setWizardItemId={actions.setWizardItemId}
          isWizardStepValid={actions.isWizardStepValid}
          goToStep={actions.goToStep}
          goPrevStep={actions.goPrevStep}
          goNextStep={actions.goNextStep}
        />
      </EditorShell>

      <PreviewCanvas
        model={{
          effectivePreview: preview.effectivePreview,
          activeProject: shell.activeProject,
          locale: shell.locale,
          previewStartupLoading: preview.previewStartupLoading,
          previewStartupProgress: preview.previewStartupProgress,
          startupBlockingSources: preview.previewStartupBlockingSources,
          previewBackgrounds: preview.previewBackgrounds,
          loadedBackgroundIndexes: preview.loadedPreviewBackgroundIndexes,
          activeBackgroundIndex: preview.activeBackgroundIndex,
          isBlankMenu: preview.isBlankMenu,
          carouselActive: preview.carouselActive,
          deviceMode: shell.deviceMode,
          previewFontStack: preview.previewFontStack,
          previewFontVars: preview.previewFontVars,
          t: shell.t,
          textOf: editor.textOf,
          getLoadingLabel: preview.getLoadingLabel,
          getTemplateScrollHint: preview.getTemplateScrollHint,
          getCarouselImageSource: preview.getCarouselImageSource,
          buildResponsiveSrcSetFromMedia: preview.buildResponsiveSrcSetFromMedia,
          getMenuTerm: preview.getMenuTerm,
          formatPrice: preview.formatPrice,
          getDishTapHint: preview.getDishTapHint,
          getAssetOwnershipDisclaimer: preview.getAssetOwnershipDisclaimer,
          getItemFontStyle: preview.getItemFontStyle
        }}
        actions={{
          shiftSection: actions.shiftSection,
          handleMenuScroll: actions.handleMenuScroll,
          shiftCarousel: actions.shiftCarousel,
          handleCarouselWheel: actions.handleCarouselWheel,
          handleCarouselTouchStart: actions.handleCarouselTouchStart,
          handleCarouselTouchMove: actions.handleCarouselTouchMove,
          handleCarouselTouchEnd: actions.handleCarouselTouchEnd,
          openDish: actions.openDish,
          prefetchDishDetail: actions.prefetchDishDetail,
          setLocale: actions.setLocale
        }}
      />
    </div>
  {/if}
</main>
