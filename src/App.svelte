<svelte:head>
  <title>{t("appTitle")}</title>
</svelte:head>

<script lang="ts">
  import { onMount, tick } from "svelte";
  import { createZipBlob, readZip } from "./lib/zip";
  import { loadProject } from "./lib/loadProject";
  import { loadProjects, type ProjectSummary } from "./lib/loadProjects";
  import type { AllergenEntry, MenuCategory, MenuItem, MenuProject } from "./lib/types";

  let project: MenuProject | null = null;
  let draft: MenuProject | null = null;
  let projects: ProjectSummary[] = [];
  let activeSlug = "demo";
  let locale = "es";
  let loadError = "";
  let activeProject: MenuProject | null = null;
  let showLanding = true;
  let previewFontStack = "";
  let fontFaceCss = "";
  let fontStyleEl: HTMLStyleElement | null = null;
  let editorOpen = false;
  let previewMode: "device" | "mobile" | "full" = "device";
  let deviceMode: "mobile" | "desktop" = "desktop";
  let editorTab: "info" | "assets" | "edit" | "wizard" = "info";
  let wizardStep = 0;
  let projectFileInput: HTMLInputElement | null = null;
  let assetUploadInput: HTMLInputElement | null = null;
  let openError = "";
  let needsAssets = false;
  let lastSaveName = "";
  let exportError = "";
  let exportStatus = "";
  let activeItem: { category: string; itemId: string } | null = null;
  let carouselActive: Record<string, number> = {};
  let carouselRaf: Record<string, number | null> = {};
  let carouselSnapTimeout: Record<string, number | null> = {};
  let languageMenuOpen = false;
  let uiLang: "es" | "en" = "es";
  let editLang = "es";
  let wizardLang = "es";
  let wizardCategoryId = "";
  let wizardItemId = "";
  let selectedCategoryId = "";
  let selectedItemId = "";
  let wizardStatus = {
    structure: false,
    identity: false,
    categories: false,
    dishes: false,
    preview: false
  };
  let wizardProgress = 0;
  let selectedCategory: MenuCategory | null = null;
  let selectedItem: MenuItem | null = null;
  let wizardCategory: MenuCategory | null = null;
  let wizardItem: MenuItem | null = null;
  let projectAssets: { id: string; label: string; src: string; group: string }[] = [];
  let selectedAssetIds: string[] = [];
  let rootHandle: FileSystemDirectoryHandle | null = null;
  let bridgeAvailable = false;
  let assetMode: "filesystem" | "bridge" | "none" = "none";
  let bridgeProjectSlug = "";
  let fsEntries: {
    id: string;
    name: string;
    path: string;
    kind: "file" | "directory";
    handle: FileSystemHandle | null;
    parent: FileSystemDirectoryHandle | null;
    source: "filesystem" | "bridge";
  }[] = [];
  let fsError = "";
  let rootFiles: string[] = [];
  let assetOptions: string[] = [];
  let rootLabel = "";
  let expandedPaths: Record<string, boolean> = {};
  let treeRows: {
    entry: (typeof fsEntries)[number];
    depth: number;
    hasChildren: boolean;
    expanded: boolean;
  }[] = [];
  let uploadTargetPath = "";
  let uploadFolderOptions: { value: string; label: string }[] = [];
  let fontChoice = "Fraunces";

  const languageOptions = [
    { code: "es", label: "Español" },
    { code: "en", label: "English" },
    { code: "fr", label: "Français" },
    { code: "pt", label: "Português" },
    { code: "it", label: "Italiano" },
    { code: "de", label: "Deutsch" },
    { code: "ja", label: "日本語" },
    { code: "ko", label: "한국어" },
    { code: "zh", label: "中文" }
  ];

  const currencyOptions = [
    { code: "MXN", label: "Peso MXN", symbol: "$" },
    { code: "USD", label: "US Dollar", symbol: "$" },
    { code: "EUR", label: "Euro", symbol: "€" },
    { code: "GBP", label: "Pound", symbol: "£" },
    { code: "JPY", label: "Yen", symbol: "¥" },
    { code: "COP", label: "Peso COP", symbol: "$" },
    { code: "ARS", label: "Peso ARS", symbol: "$" }
  ];

  const fontOptions = [
    { value: "Fraunces", label: "Fraunces" },
    { value: "Cinzel", label: "Cinzel" },
    { value: "Cormorant Garamond", label: "Cormorant Garamond" },
    { value: "Playfair Display", label: "Playfair Display" },
    { value: "Poppins", label: "Poppins" }
  ];

  const menuTerms = {
    es: { allergens: "Alérgenos", vegan: "Vegano" },
    en: { allergens: "Allergens", vegan: "Vegan" },
    fr: { allergens: "Allergènes", vegan: "Végétalien" },
    pt: { allergens: "Alergênicos", vegan: "Vegano" },
    it: { allergens: "Allergeni", vegan: "Vegano" },
    de: { allergens: "Allergene", vegan: "Vegan" },
    ja: { allergens: "アレルゲン", vegan: "ヴィーガン" },
    ko: { allergens: "알레르겐", vegan: "비건" },
    zh: { allergens: "过敏原", vegan: "纯素" }
  } as const;

  const commonAllergenCatalog = [
    {
      id: "gluten",
      label: {
        es: "Gluten",
        en: "Gluten",
        fr: "Gluten",
        pt: "Glúten",
        it: "Glutine",
        de: "Gluten",
        ja: "グルテン",
        ko: "글루텐",
        zh: "麸质"
      }
    },
    {
      id: "dairy",
      label: {
        es: "Lácteos",
        en: "Dairy",
        fr: "Produits laitiers",
        pt: "Laticínios",
        it: "Latticini",
        de: "Milchprodukte",
        ja: "乳製品",
        ko: "유제품",
        zh: "乳制品"
      }
    },
    {
      id: "egg",
      label: {
        es: "Huevo",
        en: "Egg",
        fr: "Oeuf",
        pt: "Ovo",
        it: "Uovo",
        de: "Ei",
        ja: "卵",
        ko: "달걀",
        zh: "鸡蛋"
      }
    },
    {
      id: "nuts",
      label: {
        es: "Frutos secos",
        en: "Nuts",
        fr: "Fruits à coque",
        pt: "Nozes",
        it: "Frutta a guscio",
        de: "Schalenfrüchte",
        ja: "木の実",
        ko: "견과류",
        zh: "坚果"
      }
    },
    {
      id: "peanut",
      label: {
        es: "Cacahuate",
        en: "Peanut",
        fr: "Arachide",
        pt: "Amendoim",
        it: "Arachide",
        de: "Erdnuss",
        ja: "ピーナッツ",
        ko: "땅콩",
        zh: "花生"
      }
    },
    {
      id: "soy",
      label: {
        es: "Soya",
        en: "Soy",
        fr: "Soja",
        pt: "Soja",
        it: "Soia",
        de: "Soja",
        ja: "大豆",
        ko: "대두",
        zh: "大豆"
      }
    },
    {
      id: "fish",
      label: {
        es: "Pescado",
        en: "Fish",
        fr: "Poisson",
        pt: "Peixe",
        it: "Pesce",
        de: "Fisch",
        ja: "魚",
        ko: "생선",
        zh: "鱼类"
      }
    },
    {
      id: "shellfish",
      label: {
        es: "Mariscos",
        en: "Shellfish",
        fr: "Crustacés",
        pt: "Mariscos",
        it: "Crostacei",
        de: "Schalentiere",
        ja: "甲殻類",
        ko: "갑각류",
        zh: "甲壳类"
      }
    },
    {
      id: "sesame",
      label: {
        es: "Ajonjolí",
        en: "Sesame",
        fr: "Sésame",
        pt: "Gergelim",
        it: "Sesamo",
        de: "Sesam",
        ja: "ごま",
        ko: "참깨",
        zh: "芝麻"
      }
    }
  ] satisfies { id: string; label: Record<string, string> }[];

  const uiCopy = {
    es: {
      appTitle: "Menú Interactivo",
      studioTitle: "Menú Interactivo",
      studioSubtitle: "Centro de control del proyecto.",
      landingTitle: "Menu Maker",
      landingBy: "By keneth4",
      landingCreate: "Crear proyecto",
      landingOpen: "Abrir proyecto",
      landingWizard: "Iniciar wizard",
      tabProject: "Proyecto",
      tabAssets: "Assets",
      tabEdit: "Edición",
      tabWizard: "Wizard",
      newProject: "Nuevo proyecto",
      open: "Abrir proyecto",
      save: "Guardar proyecto",
      export: "Exportar sitio",
      toggleView: "Cambiar vista",
      toggleLang: "Cambiar idioma UI",
      openEditor: "Abrir editor",
      closeEditor: "Cerrar editor",
      loadingProject: "Cargando proyecto...",
      uploadAssets: "Subir assets",
      uploadHint: "Arrastra archivos o usa el botón para subir.",
      uploadTo: "Subir a",
      promptMoveTo: "Mover a (ruta dentro de la carpeta raíz)",
      step: "Paso",
      wizardProgress: "Progreso",
      wizardNext: "Siguiente",
      wizardBack: "Anterior",
      wizardComplete: "Completo",
      wizardMissingBackground: "Agrega al menos un fondo con src.",
      wizardMissingCategories: "Crea al menos una sección con nombre.",
      wizardMissingDishes: "Agrega al menos un platillo con nombre y precio.",
      exporting: "Exportando...",
      exportReady: "Exportación lista.",
      exportFailed: "No se pudo exportar.",
      tipRotate: "Consejo: gira el dispositivo a horizontal para ver el layout completo.",
      selectFolder: "Seleccionar carpeta",
      newFolder: "Nueva carpeta",
      rootTitle: "Assets del proyecto",
      rootNone: "Sin ubicación",
      dragDrop: "Arrastra archivos aquí o usa el botón de subir.",
      selectAll: "Seleccionar todo",
      clear: "Limpiar",
      move: "Mover",
      delete: "Eliminar",
      rename: "Renombrar",
      pickRootHint: "Sube assets para verlos aquí.",
      rootEmpty: "Sin archivos en este proyecto.",
      filesCount: "archivos",
      projectName: "Nombre del proyecto",
      template: "Template",
      languages: "Idiomas disponibles",
      defaultLang: "Idioma default",
      font: "Tipografía",
      fontCustom: "Fuente personalizada",
      fontCustomName: "Nombre de fuente",
      fontCustomSrc: "Archivo de fuente",
      restaurantName: "Nombre del restaurante",
      menuTitle: "Título del menú",
      menuTitleFallback: "Menú",
      restaurantFallback: "Restaurante",
      blankMenu: "Selecciona una plantilla para comenzar.",
      currency: "Moneda",
      currencyPos: "Posición del símbolo",
      currencyLeft: "Izquierda (€150)",
      currencyRight: "Derecha (150€)",
      editLang: "Idioma de edición",
      section: "Sección",
      sectionName: "Nombre de sección",
      deleteSection: "Eliminar sección",
      dish: "Platillo",
      dishData: "Datos del platillo",
      name: "Nombre",
      description: "Descripción",
      longDescription: "Historia / descripción larga",
      allergensLabel: "Alérgenos",
      commonAllergens: "Alérgenos comunes",
      customAllergens: "Alérgenos personalizados",
      customAllergensHint: "Escribe separados por coma y tradúcelos en cada idioma.",
      veganLabel: "Vegano",
      price: "Precio",
      asset360: "Asset 360",
      addSection: "Agregar sección",
      addDish: "Agregar platillo",
      prevDish: "Platillo anterior",
      nextDish: "Platillo siguiente",
      wizardPick: "Elige una estructura base para comenzar.",
      wizardTip: "Tip: si ya tienes categorías, el template solo cambia el estilo.",
      wizardIdentity: "Define identidad y fondos.",
      wizardCategories: "Crea categorías principales.",
      wizardDishes: "Agrega platillos y sus GIFs 360.",
      wizardPreview: "Revisa el preview final.",
      wizardAssetsHint: "Sube assets en la pestaña Assets para seleccionarlos aquí.",
      wizardStepStructure: "Estructura",
      wizardStepIdentity: "Identidad",
      wizardStepCategories: "Categorías",
      wizardStepDishes: "Platillos",
      wizardStepPreview: "Preview",
      wizardAddBg: "+ Fondo",
      wizardLabel: "Label",
      wizardSrc: "Src",
      wizardLanguage: "Idioma",
      wizardCategory: "Categoría",
      wizardAddCategory: "+ Categoría",
      wizardAddDish: "+ Platillo",
      wizardExportNote: "El exportador del sitio estático se agregará en este paso.",
      backgroundLabel: "Fondo",
      errOpenProject: "No se pudo abrir el archivo",
      errNoFolder: "Tu navegador no soporta acceso a carpetas locales.",
      errOpenFolder: "No se pudo abrir la carpeta.",
      errMoveFolder: "Tu navegador no soporta mover archivos por carpeta.",
      errZipMissing: "El zip no contiene menu.json.",
      errZipCompression: "El zip usa compresión no soportada. Usa un zip sin compresión.",
      errZipNoBridge: "Para abrir zips necesitas el almacenamiento local activo.",
      assetsRequired: "Carga los assets del proyecto para completar el preview.",
      promptNewFolder: "Nombre de la nueva carpeta",
      promptRename: "Nuevo nombre",
      promptSaveName: "Nombre del archivo del proyecto (zip)"
    },
    en: {
      appTitle: "Interactive Menu",
      studioTitle: "Interactive Menu",
      studioSubtitle: "Project control center.",
      landingTitle: "Menu Maker",
      landingBy: "By keneth4",
      landingCreate: "Create project",
      landingOpen: "Open project",
      landingWizard: "Run wizard",
      tabProject: "Project",
      tabAssets: "Assets",
      tabEdit: "Edit",
      tabWizard: "Wizard",
      newProject: "New project",
      open: "Open project",
      save: "Save project",
      export: "Export site",
      toggleView: "Toggle view",
      toggleLang: "Toggle UI language",
      openEditor: "Open editor",
      closeEditor: "Close editor",
      loadingProject: "Loading project...",
      uploadAssets: "Upload assets",
      uploadHint: "Drag files here or use the upload button.",
      uploadTo: "Upload to",
      promptMoveTo: "Move to (path inside root folder)",
      step: "Step",
      wizardProgress: "Progress",
      wizardNext: "Next",
      wizardBack: "Back",
      wizardComplete: "Complete",
      wizardMissingBackground: "Add at least one background with src.",
      wizardMissingCategories: "Create at least one section with a name.",
      wizardMissingDishes: "Add at least one dish with name and price.",
      exporting: "Exporting...",
      exportReady: "Export ready.",
      exportFailed: "Export failed.",
      tipRotate: "Tip: rotate the device to landscape to see the full layout.",
      selectFolder: "Select folder",
      newFolder: "New folder",
      rootTitle: "Project assets",
      rootNone: "No location",
      dragDrop: "Drag files here or use the upload button.",
      selectAll: "Select all",
      clear: "Clear",
      move: "Move",
      delete: "Delete",
      rename: "Rename",
      pickRootHint: "Upload assets to see them here.",
      rootEmpty: "No files in this project yet.",
      filesCount: "files",
      projectName: "Project name",
      template: "Template",
      languages: "Available languages",
      defaultLang: "Default language",
      font: "Typography",
      fontCustom: "Custom font",
      fontCustomName: "Font name",
      fontCustomSrc: "Font file",
      restaurantName: "Restaurant name",
      menuTitle: "Menu title",
      menuTitleFallback: "Menu",
      restaurantFallback: "Restaurant",
      blankMenu: "Select a template to begin.",
      currency: "Currency",
      currencyPos: "Symbol position",
      currencyLeft: "Left (€150)",
      currencyRight: "Right (150€)",
      editLang: "Editing language",
      section: "Section",
      sectionName: "Section name",
      deleteSection: "Delete section",
      dish: "Dish",
      dishData: "Dish details",
      name: "Name",
      description: "Description",
      longDescription: "History / long description",
      allergensLabel: "Allergens",
      commonAllergens: "Common Allergens",
      customAllergens: "Custom Allergens",
      customAllergensHint: "Use comma-separated names and translate them for each language.",
      veganLabel: "Vegan",
      price: "Price",
      asset360: "360 asset",
      addSection: "Add section",
      addDish: "Add dish",
      prevDish: "Previous dish",
      nextDish: "Next dish",
      wizardPick: "Choose a base structure to start.",
      wizardTip: "Tip: if you already have categories, the template only changes layout.",
      wizardIdentity: "Define identity and backgrounds.",
      wizardCategories: "Create main categories.",
      wizardDishes: "Add dishes and their 360 GIFs.",
      wizardPreview: "Review the final preview.",
      wizardAssetsHint: "Upload assets in the Assets tab to select them here.",
      wizardStepStructure: "Structure",
      wizardStepIdentity: "Identity",
      wizardStepCategories: "Categories",
      wizardStepDishes: "Dishes",
      wizardStepPreview: "Preview",
      wizardAddBg: "+ Background",
      wizardLabel: "Label",
      wizardSrc: "Src",
      wizardLanguage: "Language",
      wizardCategory: "Category",
      wizardAddCategory: "+ Category",
      wizardAddDish: "+ Dish",
      wizardExportNote: "The static site exporter will be added in this step.",
      backgroundLabel: "Background",
      errOpenProject: "Unable to open the file",
      errNoFolder: "Your browser doesn't support local folder access.",
      errOpenFolder: "Unable to open the folder.",
      errMoveFolder: "Your browser doesn't support moving files by folder.",
      errZipMissing: "The zip file doesn't contain menu.json.",
      errZipCompression: "The zip uses unsupported compression. Use a stored zip.",
      errZipNoBridge: "Zip import requires local bridge storage.",
      assetsRequired: "Upload the project assets to complete the preview.",
      promptNewFolder: "New folder name",
      promptRename: "New name",
      promptSaveName: "Project file name (zip)"
    }
  };

  type UiKey = keyof (typeof uiCopy)["es"];
  let t: (key: UiKey) => string = (key) => uiCopy.es[key];
  let selectedLabel: (count: number) => string = (count) => `${count} seleccionados`;
  $: t = (key) => uiCopy[uiLang]?.[key] ?? key;
  $: selectedLabel = (count) =>
    uiLang === "es" ? `${count} seleccionados` : `${count} selected`;

  type TemplateOption = {
    id: string;
    label: Record<string, string>;
    categories: Record<string, string[]>;
  };

  const templateOptions: TemplateOption[] = [
    {
      id: "focus-rows",
      label: { es: "Filas En Foco", en: "In Focus Rows" },
      categories: { es: ["Cafe", "Brunch"], en: ["Cafe", "Brunch"] }
    },
    {
      id: "jukebox",
      label: { es: "Jukebox", en: "Jukebox" },
      categories: { es: ["Cafe", "Brunch"], en: ["Cafe", "Brunch"] }
    }
  ];

  $: if (draft) {
    const validCategory = draft.categories.some((item) => item.id === selectedCategoryId);
    if (!selectedCategoryId || !validCategory) {
      selectedCategoryId = draft.categories[0]?.id ?? "";
    }
    selectedCategory = draft.categories.find((item) => item.id === selectedCategoryId) ?? null;
    const validItem = selectedCategory?.items.some((item) => item.id === selectedItemId);
    if (!selectedItemId || !validItem) {
      selectedItemId = selectedCategory?.items[0]?.id ?? "";
    }
    selectedItem =
      selectedCategory?.items.find((item) => item.id === selectedItemId) ?? null;

    if (!draft.meta.locales.includes(editLang)) {
      editLang = draft.meta.defaultLocale;
    }
    if (!draft.meta.locales.includes(wizardLang)) {
      wizardLang = draft.meta.defaultLocale;
    }
    if (!draft.meta.currencyPosition) {
      draft.meta.currencyPosition = "left";
    }
    const matchesFont = fontOptions.some((option) => option.value === draft.meta.fontFamily);
    fontChoice = matchesFont ? draft.meta.fontFamily ?? "Fraunces" : "custom";
    const validWizardCategory = draft.categories.some((item) => item.id === wizardCategoryId);
    if (!wizardCategoryId || !validWizardCategory) {
      wizardCategoryId = draft.categories[0]?.id ?? "";
    }
    wizardCategory = draft.categories.find((item) => item.id === wizardCategoryId) ?? null;
    const validWizardItem = wizardCategory?.items.some((item) => item.id === wizardItemId);
    if (!wizardItemId || !validWizardItem) {
      wizardItemId = wizardCategory?.items[0]?.id ?? "";
    }
    wizardItem =
      wizardCategory?.items.find((item) => item.id === wizardItemId) ?? null;
  }

  $: if (draft) {
    const backgrounds =
      draft.backgrounds?.map((asset) => ({
        id: `bg-${asset.id}`,
        label: asset.label,
        src: asset.src,
        group: "Fondos"
      })) ?? [];
    const dishes = draft.categories.flatMap((category) =>
      category.items
        .filter((item) => item.media.hero360)
        .map((item) => ({
          id: `dish-${item.id}`,
          label: textOf(item.name),
          src: item.media.hero360 ?? "",
          group: "Platillos"
        }))
    );
    const fonts = draft.meta.fontSource
      ? [
          {
            id: "font-source",
            label: draft.meta.fontFamily ?? "Font",
            src: draft.meta.fontSource ?? "",
            group: "Fuentes"
          }
        ]
      : [];
    projectAssets = [...backgrounds, ...dishes, ...fonts];
  }

  $: assetOptions = rootFiles.length
    ? rootFiles
    : projectAssets.map((asset) => asset.src).filter(Boolean);
  $: rootLabel = rootHandle
    ? rootHandle.name
    : bridgeAvailable
      ? `Container · ${getProjectSlug()}`
      : t("rootNone");
  $: if (needsAssets && assetMode !== "none" && rootFiles.length > 0) {
    needsAssets = false;
  }
  $: if (assetMode === "bridge") {
    const slug = getProjectSlug();
    if (slug && slug !== bridgeProjectSlug) {
      void refreshBridgeEntries();
    }
  }

  const buildTreeRows = () => {
    if (!fsEntries.length) {
      treeRows = [];
      return;
    }
    const entryMap = new Map<string, (typeof fsEntries)[number]>();
    fsEntries.forEach((entry) => entryMap.set(entry.path, entry));

    const childrenMap = new Map<string, Set<string>>();
    const ensureChildren = (parent: string) => {
      if (!childrenMap.has(parent)) childrenMap.set(parent, new Set());
      return childrenMap.get(parent)!;
    };

    fsEntries.forEach((entry) => {
      const parts = entry.path.split("/").filter(Boolean);
      let parent = "";
      parts.forEach((part, index) => {
        const current = parts.slice(0, index + 1).join("/");
        ensureChildren(parent).add(current);
        parent = current;
      });
    });

    const getEntry = (path: string) => {
      const existing = entryMap.get(path);
      if (existing) return existing;
      const name = path.split("/").filter(Boolean).pop() ?? path;
      return {
        id: path,
        name,
        path,
        kind: "directory",
        handle: null,
        parent: null,
        source: assetMode === "filesystem" ? "filesystem" : "bridge"
      } as (typeof fsEntries)[number];
    };

    const rows: {
      entry: (typeof fsEntries)[number];
      depth: number;
      hasChildren: boolean;
      expanded: boolean;
    }[] = [];

    const sortPaths = (a: string, b: string) => {
      const entryA = getEntry(a);
      const entryB = getEntry(b);
      if (entryA.kind !== entryB.kind) {
        return entryA.kind === "directory" ? -1 : 1;
      }
      return entryA.name.localeCompare(entryB.name);
    };

    const walk = (parent: string, depth: number) => {
      const children = Array.from(childrenMap.get(parent) ?? []).sort(sortPaths);
      children.forEach((child) => {
        const entry = getEntry(child);
        const hasChildren = (childrenMap.get(child)?.size ?? 0) > 0;
        const expanded = expandedPaths[child] ?? (depth === 0);
        rows.push({ entry, depth, hasChildren, expanded });
        if (entry.kind === "directory" && expanded) {
          walk(child, depth + 1);
        }
      });
    };

    walk("", 0);
    treeRows = rows;
  };

  $: {
    const folders = fsEntries
      .filter((entry) => entry.kind === "directory")
      .map((entry) => {
        const depth = entry.path.split("/").filter(Boolean).length;
        const prefix = depth > 1 ? `${"—".repeat(depth - 1)} ` : "";
        return { value: entry.path, label: `${prefix}${entry.path}` };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
    uploadFolderOptions = [{ value: "", label: "/" }, ...folders];
    if (
      uploadTargetPath &&
      !uploadFolderOptions.some((option) => option.value === uploadTargetPath)
    ) {
      uploadTargetPath = "";
    }
  }

  $: if (fsEntries) {
    fsEntries.forEach((entry) => {
      if (entry.kind === "directory" && expandedPaths[entry.path] === undefined) {
        const isTopLevel = !entry.path.includes("/");
        expandedPaths = { ...expandedPaths, [entry.path]: isTopLevel };
      }
    });
    buildTreeRows();
  }

  $: effectivePreview =
    previewMode === "device" ? (deviceMode === "mobile" ? "mobile" : "full") : previewMode;
  $: editorLocked = deviceMode === "desktop" && effectivePreview === "mobile";
  $: layoutMode = editorLocked ? "split" : "full";
  $: editorVisible = editorLocked ? true : editorOpen;
  $: showEditorToggle = !editorLocked;
  $: isBlankMenu =
    !!activeProject &&
    !activeProject.meta.template &&
    activeProject.backgrounds.length === 0 &&
    activeProject.categories.length === 0;

  $: if (draft) {
    const defaultLocale = draft.meta.defaultLocale || "es";
    const hasTemplate = Boolean(draft.meta.template);
    const hasBackground = draft.backgrounds.some((bg) => bg.src && bg.src.trim().length > 0);
    const hasCategories =
      draft.categories.length > 0 &&
      draft.categories.every((category) => category.name?.[defaultLocale]?.trim());
    const dishCount = draft.categories.reduce((acc, category) => acc + category.items.length, 0);
    const hasDishes =
      dishCount > 0 &&
      draft.categories.every((category) =>
        category.items.every(
          (item) =>
            item.name?.[defaultLocale]?.trim() &&
            typeof item.price?.amount === "number" &&
            item.price.amount > 0
        )
      );
    wizardStatus = {
      structure: hasTemplate,
      identity: hasBackground,
      categories: hasCategories,
      dishes: hasDishes,
      preview: hasTemplate && hasBackground && hasCategories && hasDishes
    };
    const completed = [
      wizardStatus.structure,
      wizardStatus.identity,
      wizardStatus.categories,
      wizardStatus.dishes,
      wizardStatus.preview
    ].filter(Boolean).length;
    wizardProgress = completed / wizardSteps.length;
  } else {
    wizardStatus = {
      structure: false,
      identity: false,
      categories: false,
      dishes: false,
      preview: false
    };
    wizardProgress = 0;
  }

  onMount(async () => {
    try {
      const query = window.matchMedia("(min-width: 900px)");
      const updateDeviceMode = () => {
        deviceMode = query.matches ? "desktop" : "mobile";
        void syncCarousels();
      };
      updateDeviceMode();
      query.addEventListener?.("change", updateDeviceMode);
      query.addListener?.(updateDeviceMode);
      let resizeTimeout: ReturnType<typeof setTimeout> | null = null;
      const handleViewportChange = () => {
        if (resizeTimeout) {
          clearTimeout(resizeTimeout);
        }
        resizeTimeout = setTimeout(() => {
          void syncCarousels();
        }, 120);
      };
      window.addEventListener("resize", handleViewportChange);
      window.addEventListener("orientationchange", handleViewportChange);

      try {
        const response = await fetch("/api/assets/ping");
        bridgeAvailable = response.ok;
      } catch {
        bridgeAvailable = false;
      }
      updateAssetMode();
      if (assetMode === "bridge") {
        await refreshBridgeEntries();
      }

      try {
        projects = await loadProjects();
      } catch {
        projects = [];
      }
      const emptyProject = createEmptyProject();
      project = emptyProject;
      draft = cloneProject(emptyProject);
      activeSlug = emptyProject.meta.slug;
      locale = emptyProject.meta.defaultLocale;
      initCarouselIndices(emptyProject);
    } catch (error) {
      loadError = error instanceof Error ? error.message : "Error desconocido";
    }
  });

  $: activeProject = draft ?? project;
  $: previewFontStack = activeProject ? buildFontStack(activeProject.meta.fontFamily) : "";
  $: fontFaceCss = activeProject
    ? buildFontFaceCss(activeProject.meta.fontFamily, activeProject.meta.fontSource)
    : "";
  $: if (typeof document !== "undefined") {
    if (!fontFaceCss) {
      if (fontStyleEl) {
        fontStyleEl.remove();
        fontStyleEl = null;
      }
    } else {
      if (!fontStyleEl) {
        fontStyleEl = document.createElement("style");
        fontStyleEl.dataset.menuFont = "true";
        document.head.appendChild(fontStyleEl);
      }
      fontStyleEl.textContent = fontFaceCss;
    }
  }

  const touchDraft = () => {
    if (draft) {
      draft = { ...draft };
    }
  };

  const textOf = (entry: Record<string, string> | undefined, fallback = "") => {
    if (!entry) return fallback;
    return entry[locale] ?? entry[activeProject?.meta.defaultLocale ?? "es"] ?? fallback;
  };

  const normalizeLocaleCode = (lang: string) => lang.toLowerCase().split("-")[0];

  const getLocalizedValue = (
    labels: Record<string, string> | undefined,
    lang: string,
    defaultLang = "en"
  ) => {
    if (!labels) return "";
    const normalized = normalizeLocaleCode(lang);
    const defaultNormalized = normalizeLocaleCode(defaultLang);
    return (
      labels[lang] ??
      labels[normalized] ??
      labels[defaultLang] ??
      labels[defaultNormalized] ??
      labels.en ??
      Object.values(labels).find((value) => value.trim().length > 0) ??
      ""
    );
  };

  const getMenuTerm = (term: "allergens" | "vegan", lang = locale) => {
    const localeKey = normalizeLocaleCode(lang) as keyof typeof menuTerms;
    return menuTerms[localeKey]?.[term] ?? menuTerms.en[term];
  };

  const getAllergenLabel = (entry: AllergenEntry, lang = locale) => {
    const defaultLocale = activeProject?.meta.defaultLocale ?? "es";
    return (
      getLocalizedValue(entry.label, lang, defaultLocale) ||
      getLocalizedValue(entry.label, defaultLocale, "en")
    );
  };

  const getAllergenValues = (item: MenuItem, lang = locale) =>
    (item.allergens ?? [])
      .map((entry) => getAllergenLabel(entry, lang))
      .filter((value) => value.trim().length > 0);

  const ensureMetaTitle = () => {
    if (!draft) return null;
    if (!draft.meta.title) {
      draft.meta.title = createLocalized(draft.meta.locales);
    }
    return draft.meta.title;
  };

  const ensureRestaurantName = () => {
    if (!draft) return null;
    if (!draft.meta.restaurantName) {
      draft.meta.restaurantName = createLocalized(draft.meta.locales);
    }
    return draft.meta.restaurantName;
  };

  const normalizeProject = (value: MenuProject) => {
    const locales = value.meta.locales?.length ? value.meta.locales : ["es", "en"];
    value.meta.locales = locales;
    if (!value.meta.title) {
      value.meta.title = createLocalized(locales);
    }
    if (!value.meta.restaurantName) {
      value.meta.restaurantName = createLocalized(locales);
    }
    if (!value.meta.fontFamily) {
      value.meta.fontFamily = "Fraunces";
    }
    if (value.meta.fontSource === undefined) {
      value.meta.fontSource = "";
    }
    if (!value.meta.currencyPosition) {
      value.meta.currencyPosition = "left";
    }
    value.categories = (value.categories ?? []).map((category) => ({
      ...category,
      items: (category.items ?? []).map((item) => {
        const rawAllergens = (item as MenuItem & { allergens?: unknown }).allergens;
        const normalizedAllergens: AllergenEntry[] = Array.isArray(rawAllergens)
          ? rawAllergens
              .map((entry) => {
                if (typeof entry === "string") {
                  const clean = entry.trim();
                  if (!clean) return null;
                  return {
                    label: locales.reduce<Record<string, string>>((acc, lang) => {
                      acc[lang] = clean;
                      return acc;
                    }, {})
                  };
                }
                if (entry && typeof entry === "object" && "label" in entry) {
                  const asEntry = entry as AllergenEntry;
                  const safeLabel = locales.reduce<Record<string, string>>((acc, lang) => {
                    acc[lang] = getLocalizedValue(
                      asEntry.label,
                      lang,
                      value.meta.defaultLocale ?? "en"
                    );
                    return acc;
                  }, {});
                  return {
                    id: asEntry.id,
                    label: safeLabel
                  };
                }
                return null;
              })
              .filter((entry): entry is AllergenEntry => Boolean(entry))
          : [];
        return {
          ...item,
          allergens: normalizedAllergens
        };
      })
    }));
    const legacyTemplateMap: Record<string, string> = {
      "bar-pub": "focus-rows",
      "cafe-brunch": "focus-rows",
      "street-food": "focus-rows"
    };
    value.meta.template = legacyTemplateMap[value.meta.template] ?? value.meta.template;
    if (!value.meta.template) {
      value.meta.template = "focus-rows";
    }
    return value;
  };

  const changeProject = async (slug: string) => {
    try {
      activeSlug = slug;
      project = normalizeProject(await loadProject(slug));
      draft = cloneProject(project);
      locale = project.meta.defaultLocale;
      loadError = "";
      initCarouselIndices(project);
      if (assetMode === "bridge") {
        await refreshBridgeEntries();
      }
    } catch (error) {
      loadError = error instanceof Error ? error.message : "Error desconocido";
    }
  };

  const cloneProject = (value: MenuProject) => {
    if (typeof structuredClone === "function") {
      return structuredClone(value);
    }
    return JSON.parse(JSON.stringify(value)) as MenuProject;
  };

  const createEmptyProject = (): MenuProject => ({
    meta: {
      slug: "nuevo-proyecto",
      name: "Nuevo proyecto",
      restaurantName: { es: "", en: "" },
      title: { es: "", en: "" },
      fontFamily: "Fraunces",
      fontSource: "",
      template: "focus-rows",
      locales: ["es", "en"],
      defaultLocale: "es",
      currency: "MXN",
      currencyPosition: "left"
    },
    backgrounds: [],
    categories: [],
    sound: {
      enabled: false,
      theme: "bar-amber",
      volume: 0.6,
      map: {}
    }
  });

  const toggleLanguage = (code: string) => {
    if (!draft) return;
    const set = new Set(draft.meta.locales);
    if (set.has(code)) {
      set.delete(code);
    } else {
      set.add(code);
    }
    if (set.size === 0) {
      set.add(draft.meta.defaultLocale || "es");
    }
    draft.meta.locales = Array.from(set);
    if (!draft.meta.locales.includes(draft.meta.defaultLocale)) {
      draft.meta.defaultLocale = draft.meta.locales[0];
    }
    draft.categories.forEach((category) => {
      category.items.forEach((item) => {
        (item.allergens ?? []).forEach((entry) => {
          if (!entry.label) {
            entry.label = {};
          }
          const common = entry.id
            ? commonAllergenCatalog.find((catalogItem) => catalogItem.id === entry.id)
            : null;
          draft.meta.locales.forEach((lang) => {
            if (entry.label[lang] === undefined) {
              entry.label[lang] = common
                ? getLocalizedValue(common.label, lang, draft.meta.defaultLocale)
                : "";
            }
          });
        });
      });
    });
    touchDraft();
  };

  const setCurrency = (code: string) => {
    if (!draft) return;
    draft.meta.currency = code;
  };

  const toggleCurrencyPosition = () => {
    if (!draft) return;
    draft.meta.currencyPosition = draft.meta.currencyPosition === "right" ? "left" : "right";
  };

  const slugifyName = (value: string) =>
    value
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60);

  const normalizeZipName = (value: string) => {
    const sanitized = value.replace(/[\\/:*?"<>|]/g, "").trim();
    if (!sanitized) return "";
    const lower = sanitized.toLowerCase();
    if (lower.endsWith(".zip")) return sanitized;
    if (lower.endsWith(".json")) return `${sanitized.slice(0, -5)}.zip`;
    return `${sanitized}.zip`;
  };

  const getSuggestedZipName = () => {
    if (lastSaveName) {
      const base = lastSaveName.replace(/\.json$/i, "").replace(/\.zip$/i, "");
      const slug = slugifyName(base) || "menu";
      return `${slug}.zip`;
    }
    const baseName = draft?.meta.name?.trim() || draft?.meta.slug || "menu";
    const slug = slugifyName(baseName) || "menu";
    return `${slug}.zip`;
  };

  const updateAssetPathsForSlug = (fromSlug: string, toSlug: string) => {
    if (!draft) return;
    if (!fromSlug || !toSlug || fromSlug === toSlug) return;
    const fromPrefix = `/projects/${fromSlug}/assets/`;
    const toPrefix = `/projects/${toSlug}/assets/`;
    const updatePath = (value: string) =>
      value.startsWith(fromPrefix) ? `${toPrefix}${value.slice(fromPrefix.length)}` : value;

    if (draft.meta.fontSource) {
      draft.meta.fontSource = updatePath(draft.meta.fontSource);
    }
    draft.backgrounds = draft.backgrounds.map((bg) => ({
      ...bg,
      src: bg.src ? updatePath(bg.src) : bg.src
    }));
    draft.categories = draft.categories.map((category) => ({
      ...category,
      items: category.items.map((item) => ({
        ...item,
        media: {
          ...item.media,
          hero360: item.media.hero360 ? updatePath(item.media.hero360) : item.media.hero360
        }
      }))
    }));
  };

  const mapImportedAssetPath = (value: string, slug: string) => {
    if (!value) return value;
    const normalized = value.replace(/^\/+/, "");
    if (normalized.startsWith("assets/")) {
      return `/projects/${slug}/${normalized}`;
    }
    const match = normalized.match(/^projects\/[^/]+\/(assets\/.*)$/);
    if (match) {
      return `/projects/${slug}/${match[1]}`;
    }
    return value;
  };

  const applyImportedPaths = (data: MenuProject, slug: string) => {
    if (data.meta.fontSource) {
      data.meta.fontSource = mapImportedAssetPath(data.meta.fontSource, slug);
    }
    data.backgrounds = data.backgrounds.map((bg) => ({
      ...bg,
      src: bg.src ? mapImportedAssetPath(bg.src, slug) : bg.src
    }));
    data.categories = data.categories.map((category) => ({
      ...category,
      items: category.items.map((item) => ({
        ...item,
        media: {
          ...item.media,
          hero360: item.media.hero360 ? mapImportedAssetPath(item.media.hero360, slug) : item.media.hero360
        }
      }))
    }));
  };

  const saveProject = async () => {
    if (!draft) return;
    const suggested = getSuggestedZipName();
    const response = window.prompt(t("promptSaveName"), suggested);
    if (!response) return;
    const fileName = normalizeZipName(response) || suggested;
    lastSaveName = fileName;
    const base = fileName.replace(/\.zip$/i, "");
    const nextSlug = slugifyName(base) || draft.meta.slug || "menu";
    const previousSlug = getProjectSlug();
    if (previousSlug && nextSlug && previousSlug !== nextSlug) {
      if (assetMode === "bridge") {
        try {
          await bridgeRequest("rename-project", { from: previousSlug, to: nextSlug });
        } catch (error) {
          console.warn("Unable to rename project folder", error);
        }
      }
      updateAssetPathsForSlug(previousSlug, nextSlug);
      draft.meta.slug = nextSlug;
      activeSlug = nextSlug;
    } else if (!draft.meta.slug) {
      draft.meta.slug = nextSlug;
      activeSlug = nextSlug;
    }

    if (assetMode === "bridge") {
      try {
        await bridgeRequest("save-project", {
          slug: draft.meta.slug || nextSlug,
          name: draft.meta.name,
          template: draft.meta.template,
          cover: draft.backgrounds?.[0]?.src ?? "",
          project: draft
        });
        const existingIndex = projects.findIndex(
          (item) => item.slug === draft.meta.slug || item.slug === previousSlug
        );
        const summary = {
          slug: draft.meta.slug,
          name: draft.meta.name,
          template: draft.meta.template,
          cover: draft.backgrounds?.[0]?.src
        };
        if (existingIndex >= 0) {
          projects = [
            ...projects.slice(0, existingIndex),
            summary,
            ...projects.slice(existingIndex + 1)
          ];
        } else {
          projects = [...projects, summary];
        }
        await refreshBridgeEntries();
      } catch (error) {
        openError = error instanceof Error ? error.message : t("errOpenProject");
      }
    }
    const zipEntries = await buildProjectZipEntries(draft.meta.slug || nextSlug);
    if (zipEntries.length === 0) return;
    const blob = createZipBlob(zipEntries);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const buildExportStyles = () => `
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: "SF Pro Display", "Poppins", system-ui, sans-serif;
  background: #05060f;
  color: #e2e8f0;
}
.menu-preview {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  font-family: var(--menu-font, "Fraunces", "Georgia", serif);
}
.menu-background {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  opacity: 0.92;
  filter: blur(2px);
  transform: scale(1.05);
}
.menu-overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at top, rgba(15, 23, 42, 0.2), rgba(2, 6, 23, 0.75));
}
.menu-content {
  position: relative;
  z-index: 2;
  padding: 32px 24px 40px;
  display: grid;
  gap: 24px;
}
.menu-topbar {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  gap: 16px;
  text-align: center;
}
.menu-title-block {
  flex: 1;
}
.menu-lang {
  position: absolute;
  right: 0;
  top: 0;
}
.menu-eyebrow {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.3em;
  color: rgba(226, 232, 240, 0.7);
}
.menu-title {
  margin: 4px 0 0;
  font-size: clamp(1.4rem, 3vw, 2.2rem);
}
.menu-select {
  background: rgba(15, 23, 42, 0.65);
  color: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.4);
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 0.75rem;
}
.menu-scroll {
  display: grid;
  gap: 24px;
}
.menu-section__head {
  display: grid;
  justify-items: center;
  gap: 2px;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.3em;
  color: rgba(226, 232, 240, 0.7);
  text-align: center;
}
.menu-section__title { margin: 0; font-size: 0.75rem; }
.menu-section__count { margin: 0; font-size: 0.65rem; }
.menu-carousel {
  --carousel-card: clamp(200px, 70vw, 260px);
  --carousel-edge: max(24px, calc(50% - (var(--carousel-card) / 2)));
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding: 12px var(--carousel-edge) 16px;
  scroll-snap-type: x mandatory;
  scroll-padding-inline: var(--carousel-edge);
  scrollbar-width: none;
  align-items: center;
}
.menu-carousel::-webkit-scrollbar { display: none; }
.template-jukebox .menu-scroll {
  display: flex;
  gap: 0;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-snap-type: x mandatory;
}
.template-jukebox .menu-scroll::-webkit-scrollbar { display: none; }
.template-jukebox .menu-section {
  min-width: 100%;
  scroll-snap-align: start;
}
.template-jukebox .menu-carousel {
  --carousel-card: clamp(220px, 62vw, 300px);
  --carousel-edge: max(20px, calc(50% - (var(--carousel-card) / 2)));
}
@media (max-width: 640px) {
  .menu-carousel {
    --carousel-card: clamp(160px, 60vw, 220px);
    gap: 12px;
  }
}
.carousel-card {
  --fade: 1;
  width: var(--carousel-card);
  min-width: var(--carousel-card);
  max-width: var(--carousel-card);
  scroll-snap-align: center;
  scroll-snap-stop: always;
  border-radius: 22px;
  padding: 8px 6px 12px;
  background: transparent;
  border: none;
  display: grid;
  gap: 8px;
  text-align: left;
  justify-items: center;
  transition: transform 280ms cubic-bezier(0.2, 0.8, 0.2, 1),
    opacity 220ms ease, filter 240ms ease;
  transform-origin: center center;
  opacity: 1;
  filter: none;
  transform: scale(1);
  color: inherit;
}
.menu-preview.is-enhanced .carousel-card {
  opacity: var(--fade);
  filter: blur(calc((1 - var(--fade)) * 8px));
  transform: scale(calc(0.4 + var(--fade) * 0.6));
}
.menu-preview.is-enhanced .carousel-card.active {
  transform: scale(1);
  opacity: 1;
  filter: none;
}
.carousel-media {
  width: 100%;
  aspect-ratio: 1 / 1;
  display: grid;
  place-items: center;
  margin-bottom: -10px;
}
.carousel-media img {
  width: 75%;
  height: 75%;
  object-fit: contain;
  filter: drop-shadow(0 18px 24px rgba(0, 0, 0, 0.35));
}
.carousel-text {
  width: 100%;
  border-radius: 18px;
  padding: 12px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: grid;
  gap: 6px;
}
.carousel-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.carousel-title { margin: 0; font-size: 0.95rem; display: inline-flex; align-items: center; gap: 6px; }
.carousel-desc { margin: 0; font-size: 0.75rem; color: rgba(226, 232, 240, 0.75); }
.carousel-price { font-weight: 600; color: #fbbf24; text-align: right; }
.vegan-icon { font-size: 0.75rem; opacity: 0.8; }
.dish-modal {
  position: fixed;
  inset: 0;
  background: rgba(2, 6, 23, 0.75);
  display: none;
  place-items: center;
  z-index: 20;
  padding: 20px;
}
.dish-modal.open { display: grid; }
.dish-modal__card {
  max-width: 420px;
  width: 100%;
  border-radius: 22px;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 20px;
  position: relative;
  display: grid;
  gap: 12px;
  color: #e2e8f0;
}
.dish-modal__close {
  position: absolute;
  top: 12px;
  right: 12px;
  background: transparent;
  border: none;
  color: #fff;
  font-size: 1.2rem;
  cursor: pointer;
}
.dish-modal__media {
  width: 100%;
  aspect-ratio: 1 / 1;
  display: grid;
  place-items: center;
}
.dish-modal__media img {
  width: 70%;
  height: 70%;
  object-fit: contain;
}
.dish-modal__title { margin: 0; font-size: 1.2rem; text-align: center; }
.dish-modal__desc { margin: 0; font-size: 0.85rem; color: rgba(226,232,240,0.8); }
.dish-modal__long { margin: 0; font-size: 0.8rem; color: rgba(226,232,240,0.7); }
.dish-modal__allergens { margin: 0; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.2em; color: rgba(251, 191, 36, 0.7); }
.dish-modal__badge { align-self: start; border-radius: 999px; padding: 4px 10px; border: 1px solid rgba(251, 191, 36, 0.5); color: #fde68a; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.15em; }
.dish-modal__price { margin: 0; justify-self: end; font-weight: 700; color: #fbbf24; }
@media (min-width: 900px) {
  .menu-content {
    padding: 40px 48px 60px;
  }
}
`;

  const buildExportScript = (data: MenuProject) => {
    const payload = JSON.stringify(data);
    return `
const DATA = ${payload};
const currencySymbols = {
  MXN: "$", USD: "$", EUR: "€", GBP: "£", JPY: "¥", COP: "$", ARS: "$"
};
const LOOP_COPIES = 5;
let locale = DATA.meta.defaultLocale || DATA.meta.locales[0] || "es";
const fontFamily = DATA.meta.fontFamily || "Fraunces";
const fontSource = DATA.meta.fontSource || "";
let fontInjected = false;
const app = document.getElementById("app");
const modal = document.getElementById("dish-modal");
const modalContent = document.getElementById("dish-modal-content");
let carouselCleanup = [];

const textOf = (entry) => entry?.[locale] ?? entry?.[DATA.meta.defaultLocale] ?? "";
const menuTerms = {
  es: { allergens: "Alérgenos", vegan: "Vegano" },
  en: { allergens: "Allergens", vegan: "Vegan" },
  fr: { allergens: "Allergènes", vegan: "Végétalien" },
  pt: { allergens: "Alergênicos", vegan: "Vegano" },
  it: { allergens: "Allergeni", vegan: "Vegano" },
  de: { allergens: "Allergene", vegan: "Vegan" },
  ja: { allergens: "アレルゲン", vegan: "ヴィーガン" },
  ko: { allergens: "알레르겐", vegan: "비건" },
  zh: { allergens: "过敏原", vegan: "纯素" }
};
const getTerm = (key) => {
  const lang = (locale || "").toLowerCase().split("-")[0];
  return (menuTerms[lang] || menuTerms.en)[key];
};
const getAllergenValues = (dish) =>
  (dish.allergens || [])
    .map((entry) => {
      if (!entry) return "";
      if (typeof entry === "string") return entry;
      const lang = (locale || "").toLowerCase();
      const langBase = lang.split("-")[0];
      const defaultLang = (DATA.meta.defaultLocale || "en").toLowerCase();
      const defaultBase = defaultLang.split("-")[0];
      return (
        entry.label?.[lang] ??
        entry.label?.[langBase] ??
        entry.label?.[defaultLang] ??
        entry.label?.[defaultBase] ??
        entry.label?.en ??
        ""
      );
    })
    .filter((value) => value && value.trim().length > 0);
const formatPrice = (amount) => {
  const symbol = currencySymbols[DATA.meta.currency] || DATA.meta.currency;
  const position = DATA.meta.currencyPosition || "left";
  return position === "left" ? symbol + amount : amount + symbol;
};
const getFontStack = (family) => {
  const cleaned = (family || "").replace(/"/g, "");
  const primary = cleaned ? '"' + cleaned + '", ' : "";
  return primary + '"Fraunces", "Georgia", serif';
};
const ensureFont = () => {
  if (!fontSource || fontInjected) return;
  const ext = fontSource.split(".").pop()?.toLowerCase();
  let format = "";
  if (ext === "woff2") format = "woff2";
  if (ext === "woff") format = "woff";
  if (ext === "otf") format = "opentype";
  if (ext === "ttf") format = "truetype";
  const formatLine = format ? ' format("' + format + '")' : "";
  const style = document.createElement("style");
  style.textContent = '@font-face { font-family: "' + fontFamily + '"; src: url("' + fontSource + '")' + formatLine + '; font-display: swap; }';
  document.head.appendChild(style);
  fontInjected = true;
};

const getLoopCopies = (count) => (count > 1 ? LOOP_COPIES : 1);
const getLoopStart = (count) => count * Math.floor(getLoopCopies(count) / 2);
const getLoopedItems = (items) => {
  if (items.length <= 1) {
    return items.map((item, index) => ({ item, loopIndex: index, key: item.id + "-0" }));
  }
  const copies = getLoopCopies(items.length);
  const looped = [];
  for (let copy = 0; copy < copies; copy += 1) {
    items.forEach((item, index) => {
      looped.push({ item, loopIndex: copy * items.length + index, key: item.id + "-" + copy });
    });
  }
  return looped;
};

const buildCarousel = (category) => {
  const looped = getLoopedItems(category.items);
  return \`
    <div class="menu-section__head" style="display:grid;justify-items:center;gap:2px;font-size:0.7rem;text-transform:uppercase;letter-spacing:0.3em;color:rgba(226,232,240,0.8);text-align:center;">
      <p class="menu-section__title" style="margin:0;font-size:0.75rem;">\${textOf(category.name)}</p>
      <span class="menu-section__count" style="margin:0;font-size:0.65rem;">\${category.items.length} items</span>
    </div>
    <div class="menu-carousel" data-category-id="\${category.id}" style="width:100%;max-width:100%;min-width:0;box-sizing:border-box;display:flex;align-items:center;gap:16px;overflow-x:auto;overflow-y:hidden;padding:12px 24px 16px;scroll-snap-type:x mandatory;">
      \${looped
        .map(
          (entry) => \`
            <button class="carousel-card" type="button" data-item="\${entry.item.id}" data-loop="\${entry.loopIndex}">
              <div class="carousel-media">
                <img src="\${entry.item.media.hero360 || ""}" alt="\${textOf(entry.item.name)}" />
              </div>
              <div class="carousel-text">
                <div class="carousel-row">
                  <p class="carousel-title">\${textOf(entry.item.name)}\${entry.item.vegan ? '<span class="vegan-icon" title="' + getTerm("vegan") + '">🌿</span>' : ""}</p>
                  <span class="carousel-price">\${formatPrice(entry.item.price.amount)}</span>
                </div>
                <p class="carousel-desc">\${textOf(entry.item.description)}</p>
              </div>
            </button>
          \`
        )
        .join("")}
    </div>
  \`;
};

const render = () => {
  const bg = DATA.backgrounds?.[0]?.src || "";
  const restaurantName =
    DATA.meta.restaurantName?.[locale] ??
    DATA.meta.restaurantName?.[DATA.meta.defaultLocale] ??
    "";
  const menuTitle =
    DATA.meta.title?.[locale] ??
    DATA.meta.title?.[DATA.meta.defaultLocale] ??
    "";
  const templateClass = "template-" + (DATA.meta.template || "focus-rows");
  ensureFont();
  app.innerHTML = \`
    <div class="menu-preview \${templateClass}" style="position:relative;min-height:100vh;overflow:hidden;color:#e2e8f0;">
      <div class="menu-background" style="position:absolute;inset:0;z-index:0;background-image:url('\${bg}');background-size:cover;background-position:center;opacity:0.92;filter:blur(2px);transform:scale(1.05);"></div>
      <div class="menu-overlay" style="position:absolute;inset:0;z-index:1;background:radial-gradient(circle at top, rgba(15, 23, 42, 0.2), rgba(2, 6, 23, 0.75));"></div>
      <div class="menu-content" style="position:relative;z-index:2;padding:32px 24px 40px;display:grid;gap:24px;width:100%;max-width:100vw;overflow-x:hidden;box-sizing:border-box;">
        <header class="menu-topbar" style="position:relative;display:flex;justify-content:center;align-items:flex-start;gap:16px;text-align:center;width:100%;">
          <div class="menu-title-block" style="flex:1;">
            <p class="menu-eyebrow" style="margin:0;font-size:0.7rem;text-transform:uppercase;letter-spacing:0.3em;color:rgba(226,232,240,0.7);">\${restaurantName}</p>
            <h1 class="menu-title" style="margin:4px 0 0;font-size:clamp(1.4rem,3vw,2.2rem);color:#f8fafc;">\${menuTitle || "Menu"}</h1>
          </div>
          <div class="menu-lang" style="position:absolute;right:0;top:0;">
            <select class="menu-select" id="menu-locale" style="background:rgba(15,23,42,0.65);color:#f8fafc;border:1px solid rgba(148,163,184,0.4);border-radius:999px;padding:6px 12px;font-size:0.75rem;">
              \${DATA.meta.locales
                .map((lang) => \`<option value="\${lang}" \${lang === locale ? "selected" : ""}>\${lang.toUpperCase()}</option>\`)
                .join("")}
            </select>
          </div>
        </header>
        <div class="menu-scroll" style="display:grid;gap:24px;width:100%;min-width:0;overflow-x:hidden;">
          \${DATA.categories
            .map(
              (category) =>
                \`<section class="menu-section" style="display:grid;gap:12px;width:100%;min-width:0;overflow-x:hidden;">\${buildCarousel(
                  category
                )}</section>\`
            )
            .join("")}
        </div>
      </div>
    </div>
  \`;
  const applyBaseStyles = () => {
    const preview = app.querySelector(".menu-preview");
    if (preview) {
      preview.style.position = "relative";
      preview.style.minHeight = "100vh";
      preview.style.overflow = "hidden";
      preview.style.color = "#e2e8f0";
    }
    const bgLayer = app.querySelector(".menu-background");
    if (bgLayer) {
      bgLayer.style.position = "absolute";
      bgLayer.style.inset = "0";
      bgLayer.style.backgroundSize = "cover";
      bgLayer.style.backgroundPosition = "center";
      bgLayer.style.zIndex = "0";
    }
    const overlay = app.querySelector(".menu-overlay");
    if (overlay) {
      overlay.style.position = "absolute";
      overlay.style.inset = "0";
      overlay.style.zIndex = "1";
    }
    const content = app.querySelector(".menu-content");
    if (content) {
      content.style.position = "relative";
      content.style.zIndex = "2";
      content.style.display = "grid";
      content.style.gap = "24px";
    }
    const topbar = app.querySelector(".menu-topbar");
    if (topbar) {
      topbar.style.position = "relative";
      topbar.style.display = "flex";
      topbar.style.justifyContent = "center";
      topbar.style.alignItems = "flex-start";
      topbar.style.textAlign = "center";
    }
    const titleBlock = app.querySelector(".menu-title-block");
    if (titleBlock) {
      titleBlock.style.flex = "1";
    }
    const lang = app.querySelector(".menu-lang");
    if (lang) {
      lang.style.position = "absolute";
      lang.style.right = "0";
      lang.style.top = "0";
    }
    const scroll = app.querySelector(".menu-scroll");
    if (scroll) {
      scroll.style.display = "grid";
      scroll.style.gap = "24px";
      scroll.style.width = "100%";
      scroll.style.minWidth = "0";
      scroll.style.overflowX = "hidden";
    }
    app.querySelectorAll(".menu-section").forEach((section) => {
      section.style.display = "grid";
      section.style.gap = "12px";
      section.style.width = "100%";
      section.style.minWidth = "0";
      section.style.overflowX = "hidden";
    });
    app.querySelectorAll(".menu-section__head").forEach((head) => {
      head.style.display = "grid";
      head.style.justifyItems = "center";
      head.style.gap = "2px";
      head.style.textAlign = "center";
    });
    app.querySelectorAll(".menu-carousel").forEach((carousel) => {
      carousel.style.display = "flex";
      carousel.style.alignItems = "center";
      carousel.style.gap = "16px";
      carousel.style.overflowX = "auto";
      carousel.style.overflowY = "hidden";
      carousel.style.padding = "12px 24px 16px";
      carousel.style.scrollSnapType = "x mandatory";
      carousel.style.width = "100%";
      carousel.style.maxWidth = "100%";
      carousel.style.minWidth = "0";
      carousel.style.boxSizing = "border-box";
    });
    app.querySelectorAll(".carousel-card").forEach((card) => {
      card.style.flex = "0 0 220px";
      card.style.width = "220px";
      card.style.minWidth = "220px";
      card.style.maxWidth = "220px";
      card.style.display = "grid";
      card.style.gap = "8px";
      card.style.border = "none";
      card.style.background = "transparent";
      card.style.color = "#e2e8f0";
      card.style.scrollSnapAlign = "center";
      card.style.padding = "8px 6px 12px";
      card.style.textAlign = "left";
    });
    app.querySelectorAll(".carousel-media").forEach((media) => {
      media.style.width = "100%";
      media.style.height = "180px";
      media.style.display = "grid";
      media.style.placeItems = "center";
    });
    app.querySelectorAll(".carousel-media img").forEach((image) => {
      image.style.width = "75%";
      image.style.height = "75%";
      image.style.objectFit = "contain";
    });
    app.querySelectorAll(".carousel-text").forEach((text) => {
      text.style.width = "100%";
      text.style.borderRadius = "18px";
      text.style.padding = "12px";
      text.style.background = "rgba(15, 23, 42, 0.62)";
      text.style.border = "1px solid rgba(255, 255, 255, 0.08)";
      text.style.display = "grid";
      text.style.gap = "6px";
    });
    app.querySelectorAll(".carousel-row").forEach((row) => {
      row.style.display = "flex";
      row.style.alignItems = "center";
      row.style.justifyContent = "space-between";
      row.style.gap = "12px";
    });
    app.querySelectorAll(".carousel-title").forEach((title) => {
      title.style.margin = "0";
      title.style.fontSize = "0.95rem";
    });
    app.querySelectorAll(".carousel-price").forEach((price) => {
      price.style.fontWeight = "600";
      price.style.color = "#fbbf24";
      price.style.textAlign = "right";
    });
    app.querySelectorAll(".carousel-desc").forEach((desc) => {
      desc.style.margin = "0";
      desc.style.fontSize = "0.75rem";
      desc.style.color = "rgba(226, 232, 240, 0.82)";
    });

    if (DATA.meta.template === "jukebox") {
      if (scroll) {
        scroll.style.display = "flex";
        scroll.style.gap = "0";
        scroll.style.overflowX = "auto";
        scroll.style.overflowY = "hidden";
        scroll.style.scrollSnapType = "x mandatory";
      }
      app.querySelectorAll(".menu-section").forEach((section) => {
        section.style.minWidth = "100%";
        section.style.scrollSnapAlign = "start";
      });
    }
  };
  const preview = app.querySelector(".menu-preview");
  if (preview) {
    preview.style.setProperty("--menu-font", getFontStack(fontFamily));
  }
  applyBaseStyles();
  const localeSelect = document.getElementById("menu-locale");
  localeSelect?.addEventListener("change", (event) => {
    locale = event.target.value;
    render();
  });
  bindCarousels();
  bindCards();
};

const centerCarousel = (container, index, behavior = "auto") => {
  const cards = Array.from(container.querySelectorAll(".carousel-card"));
  const target = cards[index];
  if (!target) return;
  if (container.clientWidth === 0) return;
  const targetLeft = target.offsetLeft + target.offsetWidth / 2 - container.clientWidth / 2;
  container.scrollTo({ left: targetLeft, behavior });
};

const applyFocusState = (container, activeIndex) => {
  const cards = Array.from(container.querySelectorAll(".carousel-card"));
  cards.forEach((card, index) => {
    const distance = Math.abs(activeIndex - index);
    const opacity = Math.max(0.18, 1 - distance * 0.2);
    const scale = Math.max(0.62, 1 - distance * 0.14);
    const blur = Math.min(8, distance * 2.5);
    card.style.opacity = opacity.toString();
    card.style.transform = \`scale(\${distance === 0 ? 1 : scale})\`;
    card.style.filter = distance === 0 ? "none" : \`blur(\${blur}px)\`;
    card.style.zIndex = String(Math.max(1, 100 - distance));
    card.classList.toggle("active", distance === 0);
  });
};

const getClosestIndex = (container) => {
  const cards = Array.from(container.querySelectorAll(".carousel-card"));
  const center = container.scrollLeft + container.clientWidth / 2;
  let closestIndex = 0;
  let closestDistance = Number.POSITIVE_INFINITY;
  cards.forEach((card, index) => {
    const cardCenter = card.offsetLeft + card.offsetWidth / 2;
    const distance = Math.abs(center - cardCenter);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = index;
    }
  });
  return closestIndex;
};

const bindCarousels = () => {
  carouselCleanup.forEach((dispose) => dispose());
  carouselCleanup = [];
  const carousels = Array.from(document.querySelectorAll(".menu-carousel"));
  carousels.forEach((container) => {
    const id = container.dataset.categoryId;
    const category = DATA.categories.find((item) => item.id === id);
    const count = category?.items.length || 0;
    if (count === 0) return;
    const start = getLoopStart(count);

    const alignTo = (index, behavior = "auto") => {
      centerCarousel(container, index, behavior);
      const closest = getClosestIndex(container);
      applyFocusState(container, closest);
    };

    requestAnimationFrame(() => {
      alignTo(start, "auto");
    });
    window.setTimeout(() => {
      alignTo(start, "auto");
    }, 180);
    window.setTimeout(() => {
      const closestIndex = getClosestIndex(container);
      let finalIndex = closestIndex;
      if (count > 1) {
        const normalized = ((closestIndex % count) + count) % count;
        finalIndex = getLoopStart(count) + normalized;
      }
      alignTo(finalIndex, "auto");
    }, 360);

    let timeout;
    const onScroll = () => {
      if (timeout) window.clearTimeout(timeout);
      const closestIndex = getClosestIndex(container);
      applyFocusState(container, closestIndex);
      timeout = window.setTimeout(() => {
        let finalIndex = closestIndex;
        if (count > 1) {
          const normalized = ((closestIndex % count) + count) % count;
          finalIndex = getLoopStart(count) + normalized;
        }
        const behavior = finalIndex === closestIndex ? "smooth" : "auto";
        alignTo(finalIndex, behavior);
      }, 140);
    };
    container.addEventListener("scroll", onScroll);

    let resizeTimeout;
    const onResize = () => {
      if (resizeTimeout) window.clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(() => {
        const closestIndex = getClosestIndex(container);
        let finalIndex = closestIndex;
        if (count > 1) {
          const normalized = ((closestIndex % count) + count) % count;
          finalIndex = getLoopStart(count) + normalized;
        }
        alignTo(finalIndex, "auto");
      }, 120);
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    carouselCleanup.push(() => {
      container.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    });
  });
};

const bindCards = () => {
  document.querySelectorAll(".carousel-card").forEach((card) => {
    card.addEventListener("click", () => {
      const categoryId = card.closest(".menu-carousel")?.dataset.categoryId;
      const itemId = card.dataset.item;
      const category = DATA.categories.find((item) => item.id === categoryId);
      const dish = category?.items.find((item) => item.id === itemId);
      if (!dish) return;
      const allergenLabel = getTerm("allergens");
      const veganLabel = getTerm("vegan");
      const longDesc = textOf(dish.longDescription);
      const allergens = getAllergenValues(dish).join(", ");
      modalContent.innerHTML = \`
        <button class="dish-modal__close" id="modal-close">✕</button>
        <p class="dish-modal__title">\${textOf(dish.name)}</p>
        <div class="dish-modal__media">
          <img src="\${dish.media.hero360 || ""}" alt="\${textOf(dish.name)}" />
        </div>
        <div>
          <p class="dish-modal__desc">\${textOf(dish.description)}</p>
          \${longDesc ? '<p class="dish-modal__long">' + longDesc + '</p>' : ""}
          \${allergens ? '<p class="dish-modal__allergens">' + allergenLabel + ': ' + allergens + '</p>' : ""}
          \${dish.vegan ? '<span class="dish-modal__badge">🌿 ' + veganLabel + '</span>' : ""}
        </div>
        <p class="dish-modal__price">\${formatPrice(dish.price.amount)}</p>
      \`;
      modal.classList.add("open");
      modal.querySelector("#modal-close")?.addEventListener("click", closeModal);
    });
  });
};

const closeModal = () => {
  modal.classList.remove("open");
};

modal?.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});

render();
`;
  };

  const buildExportHtml = (version: string) => `
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
    <meta http-equiv="Pragma" content="no-cache" />
    <meta http-equiv="Expires" content="0" />
    <title>Menu Export</title>
    <link rel="stylesheet" href="styles.css?v=${version}" />
  </head>
  <body>
    <div id="app"></div>
    <div id="dish-modal" class="dish-modal">
      <div id="dish-modal-content" class="dish-modal__card"></div>
    </div>
    <script src="app.js?v=${version}"></scr${"ipt"}>
  </body>
</html>
`;

  const collectAssetPaths = (data: MenuProject) => {
    const assets = new Set<string>();
    if (data.meta.fontSource) {
      assets.add(data.meta.fontSource);
    }
    data.backgrounds.forEach((bg) => {
      if (bg.src) assets.add(bg.src);
    });
    data.categories.forEach((category) => {
      category.items.forEach((item) => {
        if (item.media.hero360) assets.add(item.media.hero360);
      });
    });
    return Array.from(assets)
      .map((path) => normalizePath(path))
      .filter((path) => path && !path.startsWith("http"));
  };

  const buildProjectZipEntries = async (slug: string) => {
    if (!draft) return [];
    const encoder = new TextEncoder();
    const exportProject = JSON.parse(JSON.stringify(draft)) as MenuProject;
    const assets = collectAssetPaths(draft);
    const assetPairs = assets.map((assetPath) => {
      const normalized = normalizePath(assetPath);
      const prefix = `projects/${slug}/assets/`;
      let relativePath = normalized;
      if (normalized.startsWith(prefix)) {
        relativePath = normalized.slice(prefix.length);
      } else if (normalized.includes("assets/")) {
        relativePath = normalized.slice(normalized.lastIndexOf("assets/") + "assets/".length);
      } else {
        relativePath = normalized.split("/").filter(Boolean).pop() ?? "asset";
      }
      return {
        sourcePath: normalized,
        relativePath,
        zipPath: `${slug}/assets/${relativePath}`
      };
    });

    if (exportProject.meta.fontSource) {
      const normalized = normalizePath(exportProject.meta.fontSource);
      const pair = assetPairs.find((item) => item.sourcePath === normalized);
      if (pair) {
        exportProject.meta.fontSource = `assets/${pair.relativePath}`;
      }
    }

    exportProject.backgrounds = exportProject.backgrounds.map((bg) => {
      const normalized = normalizePath(bg.src || "");
      const pair = assetPairs.find((item) => item.sourcePath === normalized);
      return { ...bg, src: pair ? `assets/${pair.relativePath}` : bg.src };
    });
    exportProject.categories = exportProject.categories.map((category) => ({
      ...category,
      items: category.items.map((item) => {
        const hero = normalizePath(item.media.hero360 || "");
        const pair = assetPairs.find((p) => p.sourcePath === hero);
        return {
          ...item,
          media: {
            ...item.media,
            hero360: pair ? `assets/${pair.relativePath}` : item.media.hero360
          }
        };
      })
    }));

    const entries: { name: string; data: Uint8Array }[] = [];
    const menuData = JSON.stringify(exportProject, null, 2);
    entries.push({ name: `${slug}/menu.json`, data: encoder.encode(menuData) });

    if (assetMode === "filesystem" && rootHandle) {
      for (const pair of assetPairs) {
        try {
          const fileHandle = await getFileHandleByPath(pair.sourcePath);
          const file = await fileHandle.getFile();
          const buffer = await file.arrayBuffer();
          entries.push({ name: pair.zipPath, data: new Uint8Array(buffer) });
        } catch (error) {
          console.warn("Missing asset", pair.sourcePath, error);
        }
      }
    } else if (assetMode === "bridge") {
      for (const pair of assetPairs) {
        try {
          const prefix = `projects/${slug}/assets/`;
          let bridgePath = pair.sourcePath.startsWith(prefix)
            ? pair.sourcePath.slice(prefix.length)
            : pair.sourcePath;
          if (bridgePath.includes("assets/")) {
            bridgePath = bridgePath.slice(bridgePath.lastIndexOf("assets/") + "assets/".length);
          }
          const response = await fetch(
            `/api/assets/file?project=${encodeURIComponent(slug)}&path=${encodeURIComponent(
              bridgePath
            )}`
          );
          if (!response.ok) continue;
          const buffer = await response.arrayBuffer();
          entries.push({ name: pair.zipPath, data: new Uint8Array(buffer) });
        } catch (error) {
          console.warn("Missing asset", pair.sourcePath, error);
        }
      }
    }

    return entries;
  };

  const exportStaticSite = async () => {
    if (!draft) return;
    exportError = "";
    exportStatus = t("exporting");
    try {
      const slug = getProjectSlug();
      const exportProject = JSON.parse(JSON.stringify(draft)) as MenuProject;
      const assets = collectAssetPaths(draft);
      const assetPairs = assets.map((assetPath) => {
        const normalized = normalizePath(assetPath);
        const prefix = `projects/${slug}/assets/`;
        let exportPath = normalized;
        if (normalized.startsWith(prefix)) {
          exportPath = `assets/${normalized.slice(prefix.length)}`;
        } else if (!normalized.startsWith("assets/")) {
          const fileName = normalized.split("/").filter(Boolean).pop() ?? "asset";
          exportPath = `assets/${fileName}`;
        }
        return { sourcePath: normalized, exportPath };
      });

      exportProject.backgrounds = exportProject.backgrounds.map((bg) => {
        const normalized = normalizePath(bg.src || "");
        const pair = assetPairs.find((item) => item.sourcePath === normalized);
        return { ...bg, src: pair ? pair.exportPath : bg.src };
      });
      if (exportProject.meta.fontSource) {
        const normalized = normalizePath(exportProject.meta.fontSource);
        const pair = assetPairs.find((item) => item.sourcePath === normalized);
        if (pair) {
          exportProject.meta.fontSource = pair.exportPath;
        }
      }
      exportProject.categories = exportProject.categories.map((category) => ({
        ...category,
        items: category.items.map((item) => {
          const hero = normalizePath(item.media.hero360 || "");
          const pair = assetPairs.find((p) => p.sourcePath === hero);
          return {
            ...item,
            media: {
              ...item.media,
              hero360: pair ? pair.exportPath : item.media.hero360
            }
          };
        })
      }));

      const encoder = new TextEncoder();
      const entries: { name: string; data: Uint8Array }[] = [];
      const exportVersion = String(Date.now());
      const menuData = JSON.stringify(exportProject, null, 2);
      const serveCommand = `#!/bin/bash
set -e
cd "$(dirname "$0")"
python3 -m http.server 4173 --bind 127.0.0.1
`;
      const serveBat = `@echo off
cd /d %~dp0
python -m http.server 4173 --bind 127.0.0.1
`;
      const readme = `Open this exported site with a local server (recommended).

macOS / Linux:
1. Run chmod +x serve.command
2. Run ./serve.command
3. Open http://127.0.0.1:4173

Windows:
1. Run serve.bat
2. Open http://127.0.0.1:4173
`;
      entries.push({ name: "menu.json", data: encoder.encode(menuData) });
      entries.push({ name: "styles.css", data: encoder.encode(buildExportStyles()) });
      entries.push({ name: "app.js", data: encoder.encode(buildExportScript(exportProject)) });
      entries.push({ name: "index.html", data: encoder.encode(buildExportHtml(exportVersion)) });
      entries.push({ name: "serve.command", data: encoder.encode(serveCommand) });
      entries.push({ name: "serve.bat", data: encoder.encode(serveBat) });
      entries.push({ name: "README.txt", data: encoder.encode(readme) });

      if (assetMode === "filesystem" && rootHandle) {
        for (const pair of assetPairs) {
          try {
            const fileHandle = await getFileHandleByPath(pair.sourcePath);
            const file = await fileHandle.getFile();
            const buffer = await file.arrayBuffer();
            entries.push({ name: pair.exportPath, data: new Uint8Array(buffer) });
          } catch (error) {
            console.warn("Missing asset", pair.sourcePath, error);
          }
        }
    } else if (assetMode === "bridge") {
      for (const pair of assetPairs) {
        try {
          const prefix = `projects/${slug}/assets/`;
          let bridgePath = pair.sourcePath.startsWith(prefix)
            ? pair.sourcePath.slice(prefix.length)
            : pair.sourcePath;
          if (bridgePath.includes("assets/")) {
            bridgePath = bridgePath.slice(bridgePath.lastIndexOf("assets/") + "assets/".length);
          }
          const response = await fetch(
            `/api/assets/file?project=${encodeURIComponent(slug)}&path=${encodeURIComponent(
              bridgePath
            )}`
            );
            if (!response.ok) continue;
            const buffer = await response.arrayBuffer();
            entries.push({ name: pair.exportPath, data: new Uint8Array(buffer) });
          } catch (error) {
            console.warn("Missing asset", pair.sourcePath, error);
          }
        }
      }

      const blob = createZipBlob(entries);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${draft.meta.slug || "menu"}-export.zip`;
      anchor.click();
      URL.revokeObjectURL(url);
      exportStatus = t("exportReady");
    } catch (error) {
      exportStatus = "";
      exportError = error instanceof Error ? error.message : t("exportFailed");
    }
  };

  const toggleEditor = () => {
    editorOpen = !editorOpen;
  };

  const togglePreviewMode = () => {
    if (previewMode === "device") {
      previewMode = deviceMode === "mobile" ? "full" : "mobile";
    } else {
      previewMode = "device";
    }
    if (deviceMode === "mobile" && previewMode === "full") {
      void tryLockLandscape();
    }
    if (deviceMode === "mobile" && previewMode === "device") {
      screen.orientation?.unlock?.();
    }
    if (previewMode === "device" && !editorLocked) {
      editorOpen = false;
    }
    void syncCarousels();
  };

  const tryLockLandscape = async () => {
    try {
      if (screen.orientation?.lock) {
        await screen.orientation.lock("landscape");
      }
    } catch {
      // Ignore failures; browser may require fullscreen or user gesture.
    }
  };

  let wizardSteps: string[] = [];
  $: wizardSteps = [
    t("wizardStepStructure"),
    t("wizardStepIdentity"),
    t("wizardStepCategories"),
    t("wizardStepDishes"),
    t("wizardStepPreview")
  ];

  const LOOP_COPIES = 5;

  const getLoopCopies = (count: number) => (count > 1 ? LOOP_COPIES : 1);

  const getLoopStart = (count: number) => count * Math.floor(getLoopCopies(count) / 2);

  const getLoopedItems = (items: MenuItem[]) => {
    if (items.length === 0) return [];
    if (items.length === 1) {
      return [
        {
          item: items[0],
          loopIndex: 0,
          sourceIndex: 0,
          key: `${items[0].id}-0`
        }
      ];
    }
    const copies = getLoopCopies(items.length);
    const looped: { item: MenuItem; loopIndex: number; sourceIndex: number; key: string }[] = [];
    for (let copy = 0; copy < copies; copy += 1) {
      items.forEach((item, index) => {
        looped.push({
          item,
          loopIndex: copy * items.length + index,
          sourceIndex: index,
          key: `${item.id}-${copy}`
        });
      });
    }
    return looped;
  };

  const goToStep = (index: number) => {
    wizardStep = index;
  };

  const isWizardStepValid = (index: number) => {
    if (index === 0) return wizardStatus.structure;
    if (index === 1) return wizardStatus.identity;
    if (index === 2) return wizardStatus.categories;
    if (index === 3) return wizardStatus.dishes;
    return wizardStatus.preview;
  };

  const goNextStep = () => {
    if (wizardStep >= wizardSteps.length - 1) return;
    if (!isWizardStepValid(wizardStep)) return;
    wizardStep += 1;
  };

  const goPrevStep = () => {
    if (wizardStep <= 0) return;
    wizardStep -= 1;
  };

  const setEditorTab = (tab: "info" | "assets" | "edit" | "wizard") => {
    editorTab = tab;
  };

  const applyLoadedProject = async (data: MenuProject, sourceName = "") => {
    project = data;
    draft = cloneProject(data);
    activeSlug = data.meta.slug || "importado";
    lastSaveName = sourceName || `${activeSlug}.zip`;
    locale = data.meta.defaultLocale || "es";
    initCarouselIndices(data);
    const existing = projects.find((item) => item.slug === activeSlug);
    const summary = {
      slug: activeSlug,
      name: data.meta.name,
      template: data.meta.template,
      cover: data.backgrounds?.[0]?.src
    };
    if (existing) {
      existing.name = summary.name;
      existing.template = summary.template;
      existing.cover = summary.cover;
      projects = [...projects];
    } else {
      projects = [...projects, summary];
    }
    openError = "";
    showLanding = false;
  };

  const createNewProject = async () => {
    const empty = createEmptyProject();
    empty.meta.name = uiLang === "en" ? "New project" : "Nuevo proyecto";
    empty.meta.slug = "new-project";
    if (!empty.meta.locales.includes(uiLang)) {
      empty.meta.locales = [uiLang, ...empty.meta.locales];
    }
    empty.meta.defaultLocale = uiLang;
    project = empty;
    draft = cloneProject(empty);
    activeSlug = empty.meta.slug;
    locale = uiLang;
    editLang = uiLang;
    wizardLang = uiLang;
    lastSaveName = "";
    needsAssets = false;
    openError = "";
    exportStatus = "";
    exportError = "";
    wizardStep = 0;
    await applyTemplate(empty.meta.template || "focus-rows");
    if (assetMode === "bridge") {
      await refreshBridgeEntries();
    }
  };

  const startCreateProject = async () => {
    await createNewProject();
    editorTab = "info";
    editorOpen = true;
    showLanding = false;
  };

  const startWizard = async () => {
    await createNewProject();
    editorTab = "wizard";
    editorOpen = true;
    showLanding = false;
  };

  const startOpenProject = () => {
    editorTab = "info";
    editorOpen = true;
    showLanding = false;
    openProjectDialog();
  };

  const openProjectDialog = () => {
    projectFileInput?.click();
  };

  const handleProjectFile = async (event: Event) => {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      openError = "";
      if (file.name.toLowerCase().endsWith(".zip")) {
        const buffer = await file.arrayBuffer();
        let entries: { name: string; data: Uint8Array }[] = [];
        try {
          entries = readZip(buffer);
        } catch (error) {
          const message = error instanceof Error ? error.message : "";
          openError = message.includes("compression") ? t("errZipCompression") : message;
          return;
        }
        const menuEntry = entries.find((entry) => entry.name.endsWith("menu.json"));
        if (!menuEntry) {
          openError = t("errZipMissing");
          return;
        }
        const menuText = new TextDecoder().decode(menuEntry.data);
        const data = normalizeProject(JSON.parse(menuText) as MenuProject);
        const prefix = menuEntry.name.replace(/menu\.json$/i, "");
        const folder = prefix.replace(/\/$/, "");
        const folderName = folder.split("/").filter(Boolean).pop() ?? "";
        const slug =
          slugifyName(data.meta.slug || folderName || data.meta.name || "menu") || "menu";
        data.meta.slug = slug;
        applyImportedPaths(data, slug);
        if (assetMode === "bridge") {
          const assetsPrefix = prefix ? `${prefix}assets/` : "assets/";
          const assetEntries = entries.filter((entry) => entry.name.startsWith(assetsPrefix));
          for (const entry of assetEntries) {
            const relative = entry.name.slice(assetsPrefix.length);
            if (!relative) continue;
            const parts = relative.split("/").filter(Boolean);
            const name = parts.pop() ?? "";
            const targetPath = parts.join("/");
            const mime = getMimeType(name);
            const dataUrl = `data:${mime};base64,${toBase64(entry.data)}`;
            await bridgeRequest(
              "upload",
              { path: targetPath, name, data: dataUrl },
              slug
            );
          }
          needsAssets = false;
        } else {
          needsAssets = true;
          openError = t("errZipNoBridge");
        }
        await applyLoadedProject(data, file.name);
        if (assetMode === "bridge") {
          await refreshBridgeEntries();
        }
      } else {
        const text = await file.text();
        const data = normalizeProject(JSON.parse(text) as MenuProject);
        const slug =
          slugifyName(data.meta.slug || data.meta.name || "importado") || "importado";
        data.meta.slug = slug;
        applyImportedPaths(data, slug);
        await applyLoadedProject(data, file.name);
        if (assetMode === "bridge") {
          needsAssets = true;
          editorTab = "assets";
          await tick();
          assetUploadInput?.click();
        }
      }
    } catch (error) {
      openError = error instanceof Error ? error.message : t("errOpenProject");
    } finally {
      input.value = "";
    }
  };

  const centerCarousel = (container: HTMLElement, index: number, behavior: ScrollBehavior) => {
    const cards = Array.from(container.querySelectorAll<HTMLElement>(".carousel-card"));
    const target = cards[index];
    if (!target) return;
    if (container.clientWidth === 0) return;
    const targetLeft = target.offsetLeft + target.offsetWidth / 2 - container.clientWidth / 2;
    container.scrollTo({ left: targetLeft, behavior });
  };

  const getClosestCarouselIndex = (container: HTMLElement) => {
    const cards = Array.from(container.querySelectorAll<HTMLElement>(".carousel-card"));
    if (cards.length === 0) return 0;
    const center = container.scrollLeft + container.clientWidth / 2;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;
    cards.forEach((card, index) => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const distance = Math.abs(center - cardCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });
    return closestIndex;
  };

  const syncCarousels = async () => {
    await tick();
    const containers = Array.from(
      document.querySelectorAll<HTMLElement>(".menu-carousel")
    );
    containers.forEach((container) => {
      const id = container.dataset.categoryId;
      if (!id) return;
      const index = carouselActive[id] ?? 0;
      centerCarousel(container, index, "auto");
    });
    requestAnimationFrame(() => {
      const next = { ...carouselActive };
      containers.forEach((container) => {
        const id = container.dataset.categoryId;
        if (!id) return;
        next[id] = getClosestCarouselIndex(container);
      });
      carouselActive = next;
    });
  };

  const initCarouselIndices = (value: MenuProject) => {
    const next: Record<string, number> = {};
    value.categories.forEach((category) => {
      next[category.id] = getLoopStart(category.items.length);
    });
    carouselActive = next;
    void syncCarousels();
  };

  const pickRootFolder = async () => {
    try {
      const picker = (window as Window & { showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle> })
        .showDirectoryPicker;
      if (!picker) {
        if (bridgeAvailable) {
          assetMode = "bridge";
          fsError = "";
          await refreshBridgeEntries();
          return;
        }
        fsError = t("errNoFolder");
        return;
      }
      rootHandle = await picker();
      fsError = "";
      updateAssetMode();
      await refreshRootEntries();
    } catch (error) {
      fsError = error instanceof Error ? error.message : t("errOpenFolder");
    }
  };

  const refreshRootEntries = async () => {
    if (!rootHandle) return;
    const entries: {
      id: string;
      name: string;
      path: string;
      kind: "file" | "directory";
      handle: FileSystemHandle | null;
      parent: FileSystemDirectoryHandle | null;
      source: "filesystem" | "bridge";
    }[] = [];
    const walk = async (dir: FileSystemDirectoryHandle, prefix = "") => {
      for await (const [name, handle] of dir.entries()) {
        const path = `${prefix}${name}`;
        entries.push({
          id: path,
          name,
          path,
          kind: handle.kind,
          handle,
          parent: dir,
          source: "filesystem"
        });
        if (handle.kind === "directory") {
          await walk(handle as FileSystemDirectoryHandle, `${path}/`);
        }
      }
    };
    await walk(rootHandle);
    entries.sort((a, b) => {
      if (a.kind !== b.kind) {
        return a.kind === "directory" ? -1 : 1;
      }
      return a.path.localeCompare(b.path);
    });
    fsEntries = entries;
    rootFiles = entries.filter((entry) => entry.kind === "file").map((entry) => entry.path);
  };

  const getProjectSlug = () => draft?.meta.slug || activeSlug || "demo";

  const updateAssetMode = () => {
    if (rootHandle) {
      assetMode = "filesystem";
    } else if (bridgeAvailable) {
      assetMode = "bridge";
      fsError = "";
    } else {
      assetMode = "none";
    }
  };

  const refreshBridgeEntries = async () => {
    if (!bridgeAvailable) return;
    const slug = getProjectSlug();
    bridgeProjectSlug = slug;
    try {
      const response = await fetch(`/api/assets/list?project=${encodeURIComponent(slug)}`);
      if (!response.ok) {
        fsError = t("errOpenFolder");
        return;
      }
      const data = (await response.json()) as {
        entries?: { path: string; kind: "file" | "directory" }[];
      };
      const entries = (data.entries ?? []).map((entry) => {
        const name = entry.path.split("/").filter(Boolean).pop() ?? entry.path;
        return {
          id: entry.path,
          name,
          path: entry.path,
          kind: entry.kind,
          handle: null,
          parent: null,
          source: "bridge" as const
        };
      });
      fsEntries = entries;
      const prefix = `/projects/${slug}/assets/`;
      rootFiles = entries
        .filter((entry) => entry.kind === "file")
        .map((entry) => `${prefix}${entry.path}`);
      fsError = "";
    } catch (error) {
      fsError = error instanceof Error ? error.message : t("errOpenFolder");
    }
  };

  const bridgeRequest = async (
    endpoint: string,
    payload?: Record<string, unknown>,
    overrideSlug?: string
  ) => {
    const slug = overrideSlug ?? getProjectSlug();
    const response = await fetch(`/api/assets/${endpoint}?project=${encodeURIComponent(slug)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload ? JSON.stringify(payload) : undefined
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || "Bridge error");
    }
  };

  const seedDemoAssets = async () => {
    if (assetMode !== "bridge") return;
    try {
      await bridgeRequest("seed", { from: "demo" });
      await refreshBridgeEntries();
    } catch (error) {
      fsError = error instanceof Error ? error.message : t("errOpenFolder");
    }
  };

  const normalizePath = (value: string) => value.replace(/^\/+/, "").trim();

  const toBase64 = (data: Uint8Array) => {
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.subarray(i, i + chunkSize);
      binary += String.fromCharCode(...chunk);
    }
    return btoa(binary);
  };

  const getMimeType = (name: string) => {
    const ext = name.split(".").pop()?.toLowerCase();
    if (!ext) return "application/octet-stream";
    if (["png", "gif", "webp", "jpg", "jpeg", "svg"].includes(ext)) {
      return `image/${ext === "jpg" ? "jpeg" : ext}`;
    }
    if (["mp4", "webm"].includes(ext)) {
      return `video/${ext}`;
    }
    return "application/octet-stream";
  };

  const getFontFormat = (value: string) => {
    const ext = value.split(".").pop()?.toLowerCase();
    if (!ext) return "";
    if (ext === "woff2") return "woff2";
    if (ext === "woff") return "woff";
    if (ext === "otf") return "opentype";
    if (ext === "ttf") return "truetype";
    return "";
  };

  const buildFontStack = (family?: string) => {
    const cleaned = (family || "").replace(/"/g, "").trim();
    const primary = cleaned ? `"${cleaned}", ` : "";
    return `${primary}"Fraunces", "Georgia", serif`;
  };

  const buildFontFaceCss = (family?: string, source?: string) => {
    if (!family || !source) return "";
    const format = getFontFormat(source);
    const formatLine = format ? ` format("${format}")` : "";
    return `@font-face { font-family: "${family}"; src: url("${source}")${formatLine}; font-display: swap; }`;
  };

  const getDirectoryHandleByPath = async (
    path: string,
    create = false
  ): Promise<FileSystemDirectoryHandle> => {
    if (!rootHandle) {
      throw new Error(t("errNoFolder"));
    }
    const parts = normalizePath(path).split("/").filter(Boolean);
    let current = rootHandle;
    for (const part of parts) {
      current = await current.getDirectoryHandle(part, { create });
    }
    return current;
  };

  const getFileHandleByPath = async (path: string): Promise<FileSystemFileHandle> => {
    const normalized = normalizePath(path);
    const parts = normalized.split("/").filter(Boolean);
    const fileName = parts.pop();
    if (!fileName) {
      throw new Error("Missing file name");
    }
    const dir = await getDirectoryHandleByPath(parts.join("/"), false);
    return await dir.getFileHandle(fileName);
  };

  const createFolder = async () => {
    const name = window.prompt(t("promptNewFolder"));
    if (!name) return;
    if (assetMode === "filesystem") {
      if (!rootHandle) return;
      await getDirectoryHandleByPath(name, true);
      await refreshRootEntries();
      return;
    }
    if (assetMode === "bridge") {
      try {
        await bridgeRequest("mkdir", { path: name });
        await refreshBridgeEntries();
      } catch (error) {
        fsError = error instanceof Error ? error.message : t("errOpenFolder");
      }
    }
  };

  const writeFileTo = async (
    file: File,
    destination: FileSystemDirectoryHandle,
    name: string
  ) => {
    const newHandle = await destination.getFileHandle(name, { create: true });
    const writable = await newHandle.createWritable();
    await writable.write(await file.arrayBuffer());
    await writable.close();
  };

  const copyFileTo = async (
    source: FileSystemFileHandle,
    destination: FileSystemDirectoryHandle,
    name: string
  ) => {
    const file = await source.getFile();
    const newHandle = await destination.getFileHandle(name, { create: true });
    const writable = await newHandle.createWritable();
    await writable.write(await file.arrayBuffer());
    await writable.close();
  };

  const copyDirectoryTo = async (
    source: FileSystemDirectoryHandle,
    destination: FileSystemDirectoryHandle,
    name: string
  ) => {
    const newDir = await destination.getDirectoryHandle(name, { create: true });
    for await (const [entryName, handle] of source.entries()) {
      if (handle.kind === "file") {
        await copyFileTo(handle as FileSystemFileHandle, newDir, entryName);
      } else {
        await copyDirectoryTo(handle as FileSystemDirectoryHandle, newDir, entryName);
      }
    }
  };

  const renameEntry = async (entry: (typeof fsEntries)[number]) => {
    const newName = window.prompt(t("promptRename"), entry.name);
    if (!newName || newName === entry.name) return;
    if (assetMode === "filesystem") {
      if (!rootHandle || !entry.parent || !entry.handle) return;
      if (entry.kind === "file") {
        await copyFileTo(entry.handle as FileSystemFileHandle, entry.parent, newName);
        await entry.parent.removeEntry(entry.name);
      } else {
        await copyDirectoryTo(entry.handle as FileSystemDirectoryHandle, entry.parent, newName);
        await entry.parent.removeEntry(entry.name, { recursive: true });
      }
      await refreshRootEntries();
      return;
    }
    if (assetMode === "bridge") {
      const parts = entry.path.split("/").filter(Boolean);
      parts.pop();
      const newPath = [...parts, newName].join("/");
      try {
        await bridgeRequest("move", { from: entry.path, to: newPath });
        await refreshBridgeEntries();
      } catch (error) {
        fsError = error instanceof Error ? error.message : t("errOpenFolder");
      }
    }
  };

  const moveEntryToPath = async (
    entry: (typeof fsEntries)[number],
    targetPath: string
  ) => {
    if (assetMode === "filesystem") {
      if (!rootHandle || !entry.parent || !entry.handle) return;
      const raw = normalizePath(targetPath);
      const endsWithSlash = targetPath.trim().endsWith("/");
      const parts = raw.split("/").filter(Boolean);
      if (entry.kind === "file") {
        let fileName = entry.name;
        let folderParts = parts;
        if (!endsWithSlash && parts.length) {
          fileName = parts[parts.length - 1];
          folderParts = parts.slice(0, -1);
        }
        const destination = await getDirectoryHandleByPath(folderParts.join("/"), true);
        await copyFileTo(entry.handle as FileSystemFileHandle, destination, fileName);
        await entry.parent.removeEntry(entry.name);
      } else {
        let folderName = entry.name;
        let folderParts = parts;
        if (!endsWithSlash && parts.length) {
          folderName = parts[parts.length - 1];
          folderParts = parts.slice(0, -1);
        }
        const destination = await getDirectoryHandleByPath(folderParts.join("/"), true);
        await copyDirectoryTo(entry.handle as FileSystemDirectoryHandle, destination, folderName);
        await entry.parent.removeEntry(entry.name, { recursive: true });
      }
      return;
    }
    if (assetMode === "bridge") {
      const raw = normalizePath(targetPath);
      const endsWithSlash = targetPath.trim().endsWith("/");
      const parts = raw.split("/").filter(Boolean);
      let destinationPath = raw;
      if (entry.kind === "file") {
        let fileName = entry.name;
        let folderParts = parts;
        if (!endsWithSlash && parts.length) {
          fileName = parts[parts.length - 1];
          folderParts = parts.slice(0, -1);
        }
        destinationPath = [...folderParts, fileName].join("/");
      } else {
        let folderName = entry.name;
        let folderParts = parts;
        if (!endsWithSlash && parts.length) {
          folderName = parts[parts.length - 1];
          folderParts = parts.slice(0, -1);
        }
        destinationPath = [...folderParts, folderName].join("/");
      }
      await bridgeRequest("move", { from: entry.path, to: destinationPath });
    }
  };

  const moveEntry = async (entry: (typeof fsEntries)[number]) => {
    const target = window.prompt(t("promptMoveTo"), entry.path);
    if (!target) return;
    try {
      await moveEntryToPath(entry, target);
      if (assetMode === "filesystem") {
        await refreshRootEntries();
      } else if (assetMode === "bridge") {
        await refreshBridgeEntries();
      }
    } catch (error) {
      fsError = error instanceof Error ? error.message : t("errOpenFolder");
    }
  };

  const deleteEntry = async (entry: (typeof fsEntries)[number]) => {
    if (assetMode === "filesystem") {
      if (!entry.parent) return;
      await entry.parent.removeEntry(entry.name, { recursive: entry.kind === "directory" });
      await refreshRootEntries();
      return;
    }
    if (assetMode === "bridge") {
      try {
        await bridgeRequest("delete", { path: entry.path });
        await refreshBridgeEntries();
      } catch (error) {
        fsError = error instanceof Error ? error.message : t("errOpenFolder");
      }
    }
  };

  const bulkDelete = async () => {
    const targets = fsEntries.filter((entry) => selectedAssetIds.includes(entry.id));
    for (const entry of targets) {
      if (assetMode === "filesystem") {
        if (!entry.parent) continue;
        await entry.parent.removeEntry(entry.name, { recursive: entry.kind === "directory" });
      } else if (assetMode === "bridge") {
        await bridgeRequest("delete", { path: entry.path });
      }
    }
    selectedAssetIds = [];
    if (assetMode === "filesystem") {
      await refreshRootEntries();
    } else if (assetMode === "bridge") {
      await refreshBridgeEntries();
    }
  };

  const bulkMove = async () => {
    const target = window.prompt(t("promptMoveTo"), "");
    if (!target) return;
    const targets = fsEntries.filter((entry) => selectedAssetIds.includes(entry.id));
    for (const entry of targets) {
      await moveEntryToPath(entry, target);
    }
    selectedAssetIds = [];
    if (assetMode === "filesystem") {
      await refreshRootEntries();
    } else if (assetMode === "bridge") {
      await refreshBridgeEntries();
    }
  };

  const uploadAssets = async (files: FileList | File[]) => {
    const target = uploadTargetPath;
    const uploads = Array.from(files);
    if (assetMode === "filesystem") {
      if (!rootHandle) {
        fsError = t("errNoFolder");
        return;
      }
      const destination = await getDirectoryHandleByPath(target, true);
      for (const file of uploads) {
        await writeFileTo(file, destination, file.name);
      }
      await refreshRootEntries();
      return;
    }
    if (assetMode === "bridge") {
      try {
        for (const file of uploads) {
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ""));
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
          });
          await bridgeRequest("upload", { path: target, name: file.name, data: dataUrl });
        }
        await refreshBridgeEntries();
      } catch (error) {
        fsError = error instanceof Error ? error.message : t("errOpenFolder");
      }
      return;
    }
    fsError = t("errNoFolder");
  };

  const handleAssetUpload = async (event: Event) => {
    const input = event.currentTarget as HTMLInputElement;
    const files = input.files;
    if (!files || files.length === 0) return;
    await uploadAssets(files);
    input.value = "";
  };

  const handleAssetDrop = async (event: DragEvent) => {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) return;
    await uploadAssets(files);
  };

  const handleAssetDragOver = (event: DragEvent) => {
    event.preventDefault();
  };

  const toggleExpandPath = (path: string) => {
    expandedPaths = { ...expandedPaths, [path]: !expandedPaths[path] };
    buildTreeRows();
  };

  const toggleAssetSelection = (id: string) => {
    if (selectedAssetIds.includes(id)) {
      selectedAssetIds = selectedAssetIds.filter((item) => item !== id);
    } else {
      selectedAssetIds = [...selectedAssetIds, id];
    }
  };

  const selectAllAssets = () => {
    if (assetMode === "filesystem") {
      selectedAssetIds = fsEntries.map((entry) => entry.id);
    } else {
      selectedAssetIds = fsEntries.map((entry) => entry.id);
    }
  };

  const clearAssetSelection = () => {
    selectedAssetIds = [];
  };

  const createLocalized = (locales: string[]) => {
    return locales.reduce<Record<string, string>>((acc, lang) => {
      acc[lang] = "";
      return acc;
    }, {});
  };

  const applyTemplate = async (templateId: string) => {
    if (!draft) return;
    draft.meta.template = templateId;
    const template = templateOptions.find((item) => item.id === templateId);
    if (!template) return;
    const slug = getProjectSlug();
    const assetRoot =
      assetMode === "bridge" ? `/projects/${slug}/assets` : "/projects/demo/assets";
    const sampleHero = `${assetRoot}/dishes/sample360food.gif`;
    const sampleBg = `${assetRoot}/backgrounds/background.webp`;

    const needsSampleAssets = draft.backgrounds.length === 0 || draft.categories.length === 0;
    if (needsSampleAssets && assetMode === "bridge") {
      await seedDemoAssets();
    }

    if (draft.backgrounds.length === 0) {
      draft.backgrounds = [
        {
          id: `bg-${Date.now()}`,
          label: "Cafe / Brunch Hero",
          src: sampleBg,
          type: "image"
        }
      ];
    }

    if (draft.categories.length === 0) {
      const toLocalized = (esValue: string, enValue: string) =>
        draft.meta.locales.reduce<Record<string, string>>((acc, lang) => {
          acc[lang] = lang === "en" ? enValue : esValue;
          return acc;
        }, {});
      const buildCommonAllergens = (ids: string[]): AllergenEntry[] =>
        ids
          .map((id) => commonAllergenCatalog.find((entry) => entry.id === id))
          .filter(
            (entry): entry is { id: string; label: Record<string, string> } => Boolean(entry)
          )
          .map((entry) => ({
            id: entry.id,
            label: draft.meta.locales.reduce<Record<string, string>>((acc, lang) => {
              acc[lang] = getLocalizedValue(entry.label, lang, draft.meta.defaultLocale);
              return acc;
            }, {})
          }));
      const createDish = (
        esName: string,
        enName: string,
        esDesc: string,
        enDesc: string,
        esLong: string,
        enLong: string,
        amount: number,
        allergenIds: string[],
        vegan = false
      ): MenuItem => ({
        id: `dish-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: toLocalized(esName, enName),
        description: toLocalized(esDesc, enDesc),
        longDescription: toLocalized(esLong, enLong),
        price: {
          amount,
          currency: draft.meta.currency
        },
        allergens: buildCommonAllergens(allergenIds),
        vegan,
        media: {
          hero360: sampleHero
        }
      });

      draft.meta.restaurantName = toLocalized("Cafe Aurora", "Cafe Aurora");
      draft.meta.title = toLocalized("Menu Brunch de la Casa", "House Brunch Menu");

      draft.categories = [
        {
          id: `section-${Math.random().toString(36).slice(2, 8)}`,
          name: toLocalized("Cafe", "Cafe"),
          items: [
            createDish(
              "Flat White Avellana",
              "Hazelnut Flat White",
              "Espresso doble con leche cremosa y avellana tostada.",
              "Double espresso with velvety milk and toasted hazelnut notes.",
              "Inspirado en las cafeterias de Melbourne, se sirve con microespuma fina para resaltar el perfil del grano.",
              "Inspired by Melbourne coffee bars, served with fine microfoam to highlight bean profile.",
              95,
              ["dairy", "nuts"]
            ),
            createDish(
              "Cold Brew Cacao",
              "Cocoa Cold Brew",
              "Extraccion en frio de 16 horas con nibs de cacao.",
              "16-hour cold extraction with cocoa nibs.",
              "Su maceracion lenta reduce la acidez y aporta un final achocolatado natural, sin jarabes pesados.",
              "Its slow brew lowers acidity and adds a natural cocoa finish without heavy syrups.",
              88,
              [],
              true
            ),
            createDish(
              "Matcha Nube",
              "Cloud Matcha",
              "Matcha ceremonial batido con leche de avena.",
              "Ceremonial matcha whisked with oat milk.",
              "La receta equilibra umami y dulzor vegetal para una taza ligera y energizante.",
              "The recipe balances umami and plant sweetness for a light, energizing cup.",
              102,
              [],
              true
            ),
            createDish(
              "Chocolate Especiado",
              "Spiced Hot Chocolate",
              "Cacao oscuro con canela y un toque de chile ancho.",
              "Dark cocoa with cinnamon and a hint of ancho chili.",
              "Version inspirada en el chocolate de mesa tradicional mexicano, cremosa y aromatica.",
              "A version inspired by traditional Mexican table chocolate, creamy and aromatic.",
              98,
              ["dairy"]
            )
          ]
        },
        {
          id: `section-${Math.random().toString(36).slice(2, 8)}`,
          name: toLocalized("Brunch", "Brunch"),
          items: [
            createDish(
              "Croissant Vegano de Pistache",
              "Vegan Pistachio Croissant",
              "Laminado artesanal con crema ligera de pistache.",
              "Artisanal laminated pastry with light pistachio cream.",
              "Fermentacion de 24 horas para lograr una miga aireada y capas crujientes.",
              "24-hour fermentation for an airy crumb and crisp layers.",
              120,
              ["gluten", "nuts"],
              true
            ),
            createDish(
              "Toast de Salmon Curado",
              "Cured Salmon Toast",
              "Pan de masa madre, queso crema de eneldo y salmon curado.",
              "Sourdough toast with dill cream cheese and cured salmon.",
              "El salmon se cura en sal y citricos para lograr textura firme y sabor limpio.",
              "Salmon is cured with salt and citrus for a firm texture and clean taste.",
              185,
              ["gluten", "fish", "dairy"]
            ),
            createDish(
              "Hotcakes de Mora Azul",
              "Blueberry Pancakes",
              "Hotcakes esponjosos con compota de mora azul.",
              "Fluffy pancakes with blueberry compote.",
              "Se terminan con mantequilla batida de vainilla y ralladura de limon.",
              "Finished with whipped vanilla butter and lemon zest.",
              165,
              ["gluten", "egg", "dairy"]
            ),
            createDish(
              "Bowl Verde de Temporada",
              "Seasonal Green Bowl",
              "Quinoa, aguacate, pepino, brotes y aderezo citrico.",
              "Quinoa, avocado, cucumber, sprouts and citrus dressing.",
              "Plato fresco de temporada pensado para una opcion ligera y completa.",
              "Fresh seasonal plate designed as a light yet complete option.",
              148,
              [],
              true
            )
          ]
        }
      ];
      wizardCategoryId = draft.categories[0]?.id ?? "";
    }
    touchDraft();
    initCarouselIndices(draft);
  };

  const addBackground = () => {
    if (!draft) return;
    const id = `bg-${Date.now()}`;
    draft.backgrounds = [
      ...draft.backgrounds,
      {
        id,
        label: `${t("backgroundLabel")} ${draft.backgrounds.length + 1}`,
        src: "",
        type: "image"
      }
    ];
    touchDraft();
  };

  const removeBackground = (id: string) => {
    if (!draft) return;
    draft.backgrounds = draft.backgrounds.filter((item) => item.id !== id);
    touchDraft();
  };

  const addSection = () => {
    if (!draft) return;
    const id = `section-${Date.now()}`;
    const newSection = {
      id,
      name: createLocalized(draft.meta.locales),
      items: []
    };
    draft.categories = [...draft.categories, newSection];
    selectedCategoryId = id;
    selectedItemId = "";
    touchDraft();
  };

  const deleteSection = () => {
    if (!draft) return;
    if (!selectedCategoryId) return;
    draft.categories = draft.categories.filter((item) => item.id !== selectedCategoryId);
    selectedCategoryId = draft.categories[0]?.id ?? "";
    selectedItemId = "";
    touchDraft();
  };

  const addDish = () => {
    if (!draft) return;
    const category = selectedCategory;
    if (!category) return;
    const id = `dish-${Date.now()}`;
    const newDish: MenuItem = {
      id,
      name: createLocalized(draft.meta.locales),
      description: createLocalized(draft.meta.locales),
      longDescription: createLocalized(draft.meta.locales),
      price: {
        amount: 0,
        currency: draft.meta.currency
      },
      allergens: [],
      vegan: false,
      media: {
        hero360: ""
      }
    };
    category.items = [...category.items, newDish];
    selectedItemId = id;
    touchDraft();
  };

  const addWizardCategory = () => {
    if (!draft) return;
    const id = `section-${Date.now()}`;
    const newSection = {
      id,
      name: createLocalized(draft.meta.locales),
      items: []
    };
    draft.categories = [...draft.categories, newSection];
    wizardCategoryId = id;
    wizardItemId = "";
    touchDraft();
  };

  const removeWizardCategory = (id: string) => {
    if (!draft) return;
    draft.categories = draft.categories.filter((item) => item.id !== id);
    wizardCategoryId = draft.categories[0]?.id ?? "";
    wizardItemId = "";
    touchDraft();
  };

  const addWizardDish = () => {
    if (!draft) return;
    const category = draft.categories.find((item) => item.id === wizardCategoryId);
    if (!category) return;
    const id = `dish-${Date.now()}`;
    const newDish: MenuItem = {
      id,
      name: createLocalized(draft.meta.locales),
      description: createLocalized(draft.meta.locales),
      longDescription: createLocalized(draft.meta.locales),
      price: {
        amount: 0,
        currency: draft.meta.currency
      },
      allergens: [],
      vegan: false,
      media: {
        hero360: ""
      }
    };
    category.items = [...category.items, newDish];
    wizardItemId = id;
    touchDraft();
  };

  const removeWizardDish = () => {
    if (!draft) return;
    const category = draft.categories.find((item) => item.id === wizardCategoryId);
    if (!category || !wizardItemId) return;
    category.items = category.items.filter((item) => item.id !== wizardItemId);
    wizardItemId = category.items[0]?.id ?? "";
    touchDraft();
  };

  const deleteDish = () => {
    const category = selectedCategory;
    if (!category) return;
    if (!selectedItemId) return;
    category.items = category.items.filter((item) => item.id !== selectedItemId);
    selectedItemId = category.items[0]?.id ?? "";
    touchDraft();
  };

  const goPrevDish = () => {
    const category = selectedCategory;
    if (!category) return;
    const index = category.items.findIndex((item) => item.id === selectedItemId);
    if (index > 0) {
      selectedItemId = category.items[index - 1].id;
    }
  };

  const goNextDish = () => {
    const category = selectedCategory;
    if (!category) return;
    const index = category.items.findIndex((item) => item.id === selectedItemId);
    if (index >= 0 && index < category.items.length - 1) {
      selectedItemId = category.items[index + 1].id;
    }
  };

  const handleCarouselScroll = (categoryId: string, event: Event) => {
    const container = event.currentTarget as HTMLElement;
    if (carouselRaf[categoryId]) {
      cancelAnimationFrame(carouselRaf[categoryId] ?? 0);
    }
    carouselRaf[categoryId] = requestAnimationFrame(() => {
      const closestIndex = getClosestCarouselIndex(container);
      carouselActive = { ...carouselActive, [categoryId]: closestIndex };
    });

    if (carouselSnapTimeout[categoryId]) {
      window.clearTimeout(carouselSnapTimeout[categoryId] ?? 0);
    }
    carouselSnapTimeout[categoryId] = window.setTimeout(() => {
      const closestIndex = getClosestCarouselIndex(container);
      const category = activeProject?.categories.find((item) => item.id === categoryId);
      const count = category?.items.length ?? 0;
      let finalIndex = closestIndex;
      if (count > 1) {
        const loopStart = getLoopStart(count);
        const normalized = ((closestIndex % count) + count) % count;
        finalIndex = loopStart + normalized;
      }
      const behavior: ScrollBehavior = finalIndex === closestIndex ? "smooth" : "auto";
      centerCarousel(container, finalIndex, behavior);
      carouselActive = { ...carouselActive, [categoryId]: finalIndex };
    }, 160);
  };

  const openDish = (categoryId: string, itemId: string) => {
    activeItem = { category: categoryId, itemId };
  };

  const closeDish = () => {
    activeItem = null;
  };

  const resolveActiveDish = () => {
    if (!activeProject || !activeItem) return null;
    const category = activeProject.categories.find((item) => item.id === activeItem.category);
    const dish = category?.items.find((item) => item.id === activeItem.itemId);
    return dish ?? null;
  };

  const ensureDescription = (item: MenuItem) => {
    if (!item.description) {
      item.description = {};
    }
    return item.description;
  };

  const ensureLongDescription = (item: MenuItem) => {
    if (!item.longDescription) {
      item.longDescription = {};
    }
    return item.longDescription;
  };

  const handleDescriptionInput = (item: MenuItem, lang: string, event: Event) => {
    const input = event.currentTarget as HTMLTextAreaElement;
    const desc = ensureDescription(item);
    desc[lang] = input.value;
    touchDraft();
  };

  const handleLongDescriptionInput = (item: MenuItem, lang: string, event: Event) => {
    const input = event.currentTarget as HTMLTextAreaElement;
    const desc = ensureLongDescription(item);
    desc[lang] = input.value;
    touchDraft();
  };

  const ensureAllergens = (item: MenuItem) => {
    if (!item.allergens) {
      item.allergens = [];
    }
    return item.allergens;
  };

  const isCommonAllergenChecked = (item: MenuItem, id: string) =>
    (item.allergens ?? []).some((entry) => entry.id === id);

  const getCommonAllergenLabel = (
    entry: { label: Record<string, string> },
    lang: string = editLang
  ) => getLocalizedValue(entry.label, lang, activeProject?.meta.defaultLocale ?? "en");

  const getCustomAllergensInput = (item: MenuItem, lang: string = editLang) =>
    (item.allergens ?? [])
      .filter((entry) => !entry.id)
      .map((entry) => entry.label?.[lang] ?? "")
      .join(", ");

  const toggleCommonAllergen = (item: MenuItem, allergenId: string, checked: boolean) => {
    if (!draft) return;
    const list = ensureAllergens(item);
    const index = list.findIndex((entry) => entry.id === allergenId);
    if (checked && index === -1) {
      const common = commonAllergenCatalog.find((entry) => entry.id === allergenId);
      if (!common) return;
      list.push({
        id: common.id,
        label: draft.meta.locales.reduce<Record<string, string>>((acc, lang) => {
          acc[lang] = getLocalizedValue(common.label, lang, draft.meta.defaultLocale);
          return acc;
        }, {})
      });
    }
    if (!checked && index >= 0) {
      list.splice(index, 1);
    }
    touchDraft();
  };

  const handleCommonAllergenToggle = (item: MenuItem, allergenId: string, event: Event) => {
    const input = event.currentTarget as HTMLInputElement;
    toggleCommonAllergen(item, allergenId, input.checked);
  };

  const handleCustomAllergensInput = (item: MenuItem, lang: string, event: Event) => {
    if (!draft) return;
    const input = event.currentTarget as HTMLInputElement;
    const values = input.value.split(",").map((value) => value.trim());
    const list = ensureAllergens(item);
    const common = list.filter((entry) => entry.id);
    const custom = list.filter((entry) => !entry.id);
    const nextCount = Math.max(custom.length, values.length);
    const nextCustom: AllergenEntry[] = [];
    for (let index = 0; index < nextCount; index += 1) {
      const base = custom[index]?.label
        ? { ...custom[index].label }
        : draft.meta.locales.reduce<Record<string, string>>((acc, localeCode) => {
            acc[localeCode] = "";
            return acc;
          }, {});
      base[lang] = values[index] ?? "";
      const hasAny = draft.meta.locales.some((localeCode) => (base[localeCode] ?? "").trim());
      if (hasAny) {
        nextCustom.push({ label: base });
      }
    }
    item.allergens = [...common, ...nextCustom];
    touchDraft();
  };

  const formatPrice = (amount: number) => {
    const currency = activeProject?.meta.currency ?? "USD";
    const symbol = currencyOptions.find((option) => option.code === currency)?.symbol ?? currency;
    const position = activeProject?.meta.currencyPosition ?? "left";
    return position === "left" ? `${symbol}${amount}` : `${amount}${symbol}`;
  };

  const handleLocalizedInput = (
    record: Record<string, string>,
    lang: string,
    event: Event
  ) => {
    const input = event.currentTarget as HTMLInputElement;
    record[lang] = input.value;
    touchDraft();
  };

  const handleCurrencyChange = (event: Event) => {
    const input = event.currentTarget as HTMLSelectElement;
    setCurrency(input.value);
  };

  const handleFontChoice = (value: string) => {
    if (!draft) return;
    if (value === "custom") {
      if (!draft.meta.fontFamily || fontOptions.some((opt) => opt.value === draft.meta.fontFamily)) {
        draft.meta.fontFamily = "Custom Font";
      }
      if (draft.meta.fontSource === undefined) {
        draft.meta.fontSource = "";
      }
    } else {
      draft.meta.fontFamily = value;
      draft.meta.fontSource = "";
    }
    touchDraft();
  };

  const handleFontSelect = (event: Event) => {
    const input = event.currentTarget as HTMLSelectElement;
    handleFontChoice(input.value);
  };

  const handleCustomFontNameInput = (event: Event) => {
    if (!draft) return;
    const input = event.currentTarget as HTMLInputElement;
    draft.meta.fontFamily = input.value;
    touchDraft();
  };

  const handleCustomFontSourceInput = (event: Event) => {
    if (!draft) return;
    const input = event.currentTarget as HTMLInputElement;
    draft.meta.fontSource = input.value;
    touchDraft();
  };

  const handleVeganToggle = (item: MenuItem, event: Event) => {
    const input = event.currentTarget as HTMLInputElement;
    item.vegan = input.checked;
    touchDraft();
  };
</script>

<main class="min-h-screen app-shell {layoutMode}">
  <input
    class="sr-only"
    type="file"
    accept=".json,.zip,application/zip"
    bind:this={projectFileInput}
    on:change={handleProjectFile}
  />
  {#if showLanding}
    <section class="landing-screen">
      <div class="landing-lang">
        <div class="lang-toggle" aria-label={t("toggleLang")}>
          <button
            class="lang-btn {uiLang === 'es' ? 'active' : ''}"
            type="button"
            on:click={() => (uiLang = 'es')}
          >
            ES
          </button>
          <button
            class="lang-btn {uiLang === 'en' ? 'active' : ''}"
            type="button"
            on:click={() => (uiLang = 'en')}
          >
            EN
          </button>
        </div>
      </div>
      <header class="landing-header">
        <h1>{t("landingTitle")}</h1>
        <p>{t("landingBy")}</p>
      </header>
      <div class="landing-actions">
        <button type="button" class="landing-action" on:click={startCreateProject}>
          <span class="landing-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 5v14"></path>
              <path d="M5 12h14"></path>
            </svg>
          </span>
          <span>{t("landingCreate")}</span>
        </button>
        <button type="button" class="landing-action" on:click={startOpenProject}>
          <span class="landing-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 7h6l2 2h10v8a2 2 0 0 1-2 2H3z"></path>
              <path d="M3 7v-2a2 2 0 0 1 2-2h4l2 2"></path>
            </svg>
          </span>
          <span>{t("landingOpen")}</span>
        </button>
        <button type="button" class="landing-action" on:click={startWizard}>
          <span class="landing-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 20l10-10"></path>
              <path d="M14 10l6-6"></path>
              <path d="M18 4l2 2"></path>
              <path d="M6 14l4 4"></path>
              <path d="M16 6l2 2"></path>
            </svg>
          </span>
          <span>{t("landingWizard")}</span>
        </button>
      </div>
    </section>
  {:else if loadError}
    <div class="rounded-2xl border border-red-500/30 bg-red-950/40 p-5 text-sm text-red-100">
      {loadError}
    </div>
  {:else if !project}
    <div class="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-200">
      {t("loadingProject")}
    </div>
  {:else if activeProject}
    <div class="split-layout {layoutMode}">
      {#if showEditorToggle}
        <button
          class="menu-fab"
          type="button"
          aria-label={editorOpen ? t("closeEditor") : t("openEditor")}
          on:click={toggleEditor}
        >
          <span class="menu-fab__icon"></span>
        </button>
      {/if}

      {#if editorVisible && !editorLocked}
        <div class="editor-backdrop" on:click={toggleEditor}></div>
      {/if}

      <aside class="editor-panel {editorVisible ? 'open' : ''} {editorLocked ? 'locked' : ''}">
        <div class="editor-panel__header">
          <div>
            <p class="editor-eyebrow">{t("studioTitle")}</p>
            <p class="mt-1 text-xs text-slate-400">{t("studioSubtitle")}</p>
          </div>
          <div class="editor-actions">
            <button
              class="icon-btn"
              type="button"
              aria-label={t("toggleView")}
              title={t("toggleView")}
              on:click={togglePreviewMode}
            >
              <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="2.5" y="4.5" width="13" height="9" rx="1.5"></rect>
                <rect x="18" y="6" width="3.5" height="10" rx="1"></rect>
                <path d="M6 18h6"></path>
              </svg>
            </button>
            <div class="lang-toggle" aria-label={t("toggleLang")}>
              <button
                class="lang-btn {uiLang === 'es' ? 'active' : ''}"
                type="button"
                on:click={() => (uiLang = 'es')}
              >
                ES
              </button>
              <button
                class="lang-btn {uiLang === 'en' ? 'active' : ''}"
                type="button"
                on:click={() => (uiLang = 'en')}
              >
                EN
              </button>
            </div>
            {#if !editorLocked}
              <button
                class="editor-close"
                type="button"
                aria-label={t("closeEditor")}
                on:click={toggleEditor}
              >
                ✕
              </button>
            {/if}
          </div>
        </div>

        <div class="editor-tabs">
          <button
            class="editor-tab {editorTab === 'info' ? 'active' : ''}"
            type="button"
            on:click={() => setEditorTab('info')}
          >
            <span class="editor-tab__icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 7h6l2 2h10v8a2 2 0 0 1-2 2H3z"></path>
                <path d="M3 7v-2a2 2 0 0 1 2-2h4l2 2"></path>
              </svg>
            </span>
            <span>{t("tabProject")}</span>
          </button>
          <button
            class="editor-tab {editorTab === 'assets' ? 'active' : ''}"
            type="button"
            on:click={() => setEditorTab('assets')}
          >
            <span class="editor-tab__icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 6h16v12H4z"></path>
                <path d="M8 10h8"></path>
                <path d="M8 14h6"></path>
              </svg>
            </span>
            <span>{t("tabAssets")}</span>
          </button>
          <button
            class="editor-tab {editorTab === 'edit' ? 'active' : ''}"
            type="button"
            on:click={() => setEditorTab('edit')}
          >
            <span class="editor-tab__icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 20h6"></path>
                <path d="M14 4l6 6"></path>
                <path d="M5 19l4-1 9-9-3-3-9 9z"></path>
              </svg>
            </span>
            <span>{t("tabEdit")}</span>
          </button>
          <button
            class="editor-tab {editorTab === 'wizard' ? 'active' : ''}"
            type="button"
            on:click={() => setEditorTab('wizard')}
          >
            <span class="editor-tab__icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 20l10-10"></path>
                <path d="M14 10l6-6"></path>
                <path d="M18 4l2 2"></path>
                <path d="M6 14l4 4"></path>
              </svg>
            </span>
            <span>{t("tabWizard")}</span>
          </button>
        </div>

        <div class="editor-content">
          {#if editorTab === "info"}
            <div class="editor-toolbar">
              <button
                class="icon-btn"
                type="button"
                aria-label={t("newProject")}
                title={t("newProject")}
                on:click={createNewProject}
              >
                <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 5v14"></path>
                  <path d="M5 12h14"></path>
                </svg>
              </button>
              <button
                class="icon-btn"
                type="button"
                aria-label={t("open")}
                title={t("open")}
                on:click={openProjectDialog}
              >
                <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M3 7h6l2 2h10v8a2 2 0 0 1-2 2H3z"></path>
                  <path d="M3 7v-2a2 2 0 0 1 2-2h4l2 2"></path>
                </svg>
              </button>
              <button
                class="icon-btn"
                type="button"
                aria-label={t("save")}
                title={t("save")}
                on:click={saveProject}
              >
                <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 4h12l2 2v14H5z"></path>
                  <path d="M7 4v6h10V4"></path>
                  <rect x="8" y="14" width="8" height="5" rx="1"></rect>
                </svg>
              </button>
              <button
                class="icon-btn"
                type="button"
                aria-label={t("export")}
                title={t("export")}
                on:click={exportStaticSite}
              >
                <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 3v10"></path>
                  <path d="M8 7l4-4 4 4"></path>
                  <rect x="4" y="13" width="16" height="8" rx="2"></rect>
                </svg>
              </button>
            </div>

            {#if openError}
              <p class="mt-2 text-xs text-red-300">{openError}</p>
            {/if}
            {#if exportStatus}
              <p class="mt-2 text-xs text-emerald-200">{exportStatus}</p>
            {/if}
            {#if exportError}
              <p class="mt-2 text-xs text-red-300">{exportError}</p>
            {/if}

            {#if draft}
              <div class="mt-5 grid gap-4">
                <label class="editor-field">
                  <span>{t("projectName")}</span>
                  <input
                    type="text"
                    bind:value={draft.meta.name}
                    class="editor-input"
                    placeholder={t("projectName")}
                  />
                </label>
                <label class="editor-field">
                  <span>{t("template")}</span>
                  <select bind:value={draft.meta.template} class="editor-select">
                    {#each templateOptions as template}
                      <option value={template.id}>
                        {template.label[uiLang] ?? template.label.es ?? template.id}
                      </option>
                    {/each}
                  </select>
                </label>
                <div class="editor-field">
                  <span>{t("languages")}</span>
                  <button
                    class="editor-select"
                    type="button"
                    on:click={() => (languageMenuOpen = !languageMenuOpen)}
                  >
                    {selectedLabel(draft.meta.locales.length)}
                  </button>
                  {#if languageMenuOpen}
                    <div class="dropdown-panel">
                      {#each languageOptions as lang}
                        <label class="dropdown-item">
                          <input
                            type="checkbox"
                            checked={draft.meta.locales.includes(lang.code)}
                            on:change={() => toggleLanguage(lang.code)}
                          />
                          <span>{lang.label}</span>
                        </label>
                      {/each}
                    </div>
                  {/if}
                </div>
                <label class="editor-field">
                  <span>{t("defaultLang")}</span>
                  <select bind:value={draft.meta.defaultLocale} class="editor-select">
                    {#each draft.meta.locales as lang}
                      <option value={lang}>{lang.toUpperCase()}</option>
                    {/each}
                  </select>
                </label>
                <label class="editor-field">
                  <span>{t("currency")}</span>
                  <select
                    class="editor-select"
                    bind:value={draft.meta.currency}
                    on:change={handleCurrencyChange}
                  >
                    {#each currencyOptions as currency}
                      <option value={currency.code}>{currency.label}</option>
                    {/each}
                  </select>
                </label>
                <div class="editor-field">
                  <span>{t("currencyPos")}</span>
                  <button class="editor-outline" type="button" on:click={toggleCurrencyPosition}>
                    {draft.meta.currencyPosition === "right"
                      ? t("currencyRight")
                      : t("currencyLeft")}
                  </button>
                </div>
                <label class="editor-field">
                  <span>{t("font")}</span>
                  <select
                    class="editor-select"
                    bind:value={fontChoice}
                    on:change={handleFontSelect}
                  >
                    {#each fontOptions as font}
                      <option value={font.value}>{font.label}</option>
                    {/each}
                    <option value="custom">{t("fontCustom")}</option>
                  </select>
                </label>
                {#if fontChoice === "custom"}
                  <label class="editor-field">
                    <span>{t("fontCustomName")}</span>
                    <input
                      type="text"
                      class="editor-input"
                      value={draft.meta.fontFamily ?? ""}
                      on:input={handleCustomFontNameInput}
                    />
                  </label>
                  <label class="editor-field">
                    <span>{t("fontCustomSrc")}</span>
                    <input
                      type="text"
                      class="editor-input"
                      value={draft.meta.fontSource ?? ""}
                      list="asset-files"
                      on:input={handleCustomFontSourceInput}
                    />
                  </label>
                {/if}
              </div>
            {/if}
          {:else if editorTab === "assets"}
            <section class="asset-manager">
              <div class="asset-manager__header">
                <div>
                  <p>{t("rootTitle")}</p>
                  <span>{rootLabel}</span>
                </div>
                <div class="asset-actions">
                  <button type="button" on:click={createFolder}>{t("newFolder")}</button>
                  <button
                    type="button"
                    on:click={() => assetUploadInput?.click()}
                  >
                    {t("uploadAssets")}
                  </button>
                  <input
                    class="sr-only"
                    type="file"
                    multiple
                    bind:this={assetUploadInput}
                    on:change={handleAssetUpload}
                  />
                </div>
              </div>
              <div class="asset-drop">
                <label class="editor-field">
                  <span>{t("uploadTo")}</span>
                  <select bind:value={uploadTargetPath} class="editor-select">
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
                  class="asset-drop__zone"
                  on:dragover={handleAssetDragOver}
                  on:drop={handleAssetDrop}
                >
                  {t("dragDrop")}
                </div>
              </div>
              {#if fsError}
                <p class="text-xs text-red-300">{fsError}</p>
              {/if}
              <div class="asset-bulk">
                <button type="button" on:click={selectAllAssets}>{t("selectAll")}</button>
                <button type="button" on:click={clearAssetSelection}>{t("clear")}</button>
                <button type="button" on:click={bulkMove}>{t("move")}</button>
                <button type="button" on:click={bulkDelete}>{t("delete")}</button>
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
                          on:click={() => renameEntry(row.entry)}
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          class="asset-icon-btn"
                          title={t("move")}
                          aria-label={t("move")}
                          on:click={() => moveEntry(row.entry)}
                        >
                          ⇄
                        </button>
                        <button
                          type="button"
                          class="asset-icon-btn danger"
                          title={t("delete")}
                          aria-label={t("delete")}
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
          {:else if editorTab === "edit"}
            {#if deviceMode === "mobile" && previewMode === "full"}
              <p class="mt-2 text-xs text-amber-200">
                {t("tipRotate")}
              </p>
            {/if}

            {#if draft}
              <div class="edit-shell">
                <div class="edit-row">
                  <label class="editor-field">
                    <span>{t("editLang")}</span>
                    <select bind:value={editLang} class="editor-select">
                      {#each draft.meta.locales as lang}
                        <option value={lang}>{lang.toUpperCase()}</option>
                      {/each}
                    </select>
                  </label>
                </div>
                <div class="edit-block">
                  <p class="edit-block__title">{t("restaurantName")}</p>
                  <label class="editor-field">
                    <span>{editLang.toUpperCase()}</span>
                    <input
                      type="text"
                      class="editor-input"
                      value={draft.meta.restaurantName?.[editLang] ?? ""}
                      on:input={(event) => {
                        const name = ensureRestaurantName();
                        if (!name) return;
                        handleLocalizedInput(name, editLang, event);
                      }}
                    />
                  </label>
                </div>
                <div class="edit-block">
                  <p class="edit-block__title">{t("menuTitle")}</p>
                  <label class="editor-field">
                    <span>{editLang.toUpperCase()}</span>
                    <input
                      type="text"
                      class="editor-input"
                      value={draft.meta.title?.[editLang] ?? ""}
                      on:input={(event) => {
                        const title = ensureMetaTitle();
                        if (!title) return;
                        handleLocalizedInput(title, editLang, event);
                      }}
                    />
                  </label>
                </div>
                <div class="edit-row">
                  <label class="editor-field">
                    <span>{t("section")}</span>
                    <select bind:value={selectedCategoryId} class="editor-select">
                      {#each draft.categories as category}
                        <option value={category.id}>{textOf(category.name)}</option>
                      {/each}
                    </select>
                  </label>
                  <div class="edit-actions">
                    <button
                      class="editor-outline"
                      type="button"
                      aria-label={t("addSection")}
                      title={t("addSection")}
                      on:click={addSection}
                    >
                      <span class="btn-icon">＋</span>
                    </button>
                    <button class="editor-outline danger" type="button" on:click={deleteSection}>
                      {t("deleteSection")}
                    </button>
                  </div>
                </div>

                {#if selectedCategory}
                  <div class="edit-block">
                    <p class="edit-block__title">{t("sectionName")}</p>
                    <label class="editor-field">
                      <span>{editLang.toUpperCase()}</span>
                      <input
                        type="text"
                        class="editor-input"
                        value={selectedCategory.name?.[editLang] ?? ""}
                        on:input={(event) =>
                          handleLocalizedInput(selectedCategory.name, editLang, event)}
                      />
                    </label>
                  </div>

                  <div class="edit-row">
                    <label class="editor-field">
                      <span>{t("dish")}</span>
                      <select bind:value={selectedItemId} class="editor-select">
                        {#each selectedCategory.items as item}
                          <option value={item.id}>{textOf(item.name)}</option>
                        {/each}
                      </select>
                    </label>
                    <div class="edit-actions">
                      <button
                        class="editor-outline"
                        type="button"
                        aria-label={t("prevDish")}
                        title={t("prevDish")}
                        on:click={goPrevDish}
                      >
                        <span class="btn-icon">◀</span>
                      </button>
                      <button
                        class="editor-outline"
                        type="button"
                        aria-label={t("nextDish")}
                        title={t("nextDish")}
                        on:click={goNextDish}
                      >
                        <span class="btn-icon">▶</span>
                      </button>
                      <button
                        class="editor-outline"
                        type="button"
                        aria-label={t("addDish")}
                        title={t("addDish")}
                        on:click={addDish}
                      >
                        <span class="btn-icon">＋</span>
                      </button>
                      <button class="editor-outline danger" type="button" on:click={deleteDish}>
                        {t("delete")}
                      </button>
                    </div>
                  </div>

                  {#if selectedItem}
                    <div class="edit-block">
                      <p class="edit-block__title">{t("dishData")}</p>
                      <div class="edit-item">
                        <div class="edit-item__media">
                          <img src={selectedItem.media.hero360 ?? ""} alt={textOf(selectedItem.name)} />
                        </div>
                        <div class="edit-item__content">
                          <label class="editor-field">
                            <span>{t("name")} ({editLang.toUpperCase()})</span>
                            <input
                              type="text"
                              class="editor-input"
                              value={selectedItem.name?.[editLang] ?? ""}
                              on:input={(event) =>
                                handleLocalizedInput(selectedItem.name, editLang, event)}
                            />
                          </label>
                          <label class="editor-field">
                            <span>{t("description")} ({editLang.toUpperCase()})</span>
                            <textarea
                              class="editor-input"
                              rows="2"
                              value={selectedItem.description?.[editLang] ?? ""}
                              on:input={(event) =>
                                handleDescriptionInput(selectedItem, editLang, event)}
                            ></textarea>
                          </label>
                          <label class="editor-field">
                            <span>{t("longDescription")} ({editLang.toUpperCase()})</span>
                            <textarea
                              class="editor-input"
                              rows="3"
                              value={selectedItem.longDescription?.[editLang] ?? ""}
                              on:input={(event) =>
                                handleLongDescriptionInput(selectedItem, editLang, event)}
                            ></textarea>
                          </label>
                          <label class="editor-field">
                            <span>{t("price")}</span>
                            <input
                              type="number"
                              class="editor-input"
                              bind:value={selectedItem.price.amount}
                            />
                          </label>
                          <div class="editor-field">
                            <span>{t("commonAllergens")}</span>
                            <div class="allergen-checklist">
                              {#each commonAllergenCatalog as allergen}
                                <label class="allergen-option">
                                  <input
                                    type="checkbox"
                                    checked={isCommonAllergenChecked(selectedItem, allergen.id)}
                                    on:change={(event) =>
                                      handleCommonAllergenToggle(selectedItem, allergen.id, event)}
                                  />
                                  <span>{getCommonAllergenLabel(allergen, editLang)}</span>
                                </label>
                              {/each}
                            </div>
                          </div>
                          <label class="editor-field">
                            <span>{t("customAllergens")} ({editLang.toUpperCase()})</span>
                            <input
                              type="text"
                              class="editor-input"
                              value={getCustomAllergensInput(selectedItem, editLang)}
                              on:input={(event) =>
                                handleCustomAllergensInput(selectedItem, editLang, event)}
                            />
                            <small class="editor-hint">{t("customAllergensHint")}</small>
                          </label>
                          <label class="editor-field editor-inline">
                            <span>{t("veganLabel")}</span>
                            <input
                              type="checkbox"
                              checked={selectedItem.vegan ?? false}
                              on:change={(event) => handleVeganToggle(selectedItem, event)}
                            />
                          </label>
                          <label class="editor-field">
                            <span>{t("asset360")}</span>
                            <input
                              type="text"
                              class="editor-input"
                              bind:value={selectedItem.media.hero360}
                              list="asset-files"
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  {/if}
                {/if}
              </div>
            {/if}
          {:else}
            <section class="wizard">
              <div class="wizard-header">
                <p class="text-[0.6rem] uppercase tracking-[0.35em] text-slate-300">
                  {t("tabWizard")}
                </p>
                <span class="text-xs text-slate-400">
                  {t("step")} {wizardStep + 1} / {wizardSteps.length}
                </span>
              </div>
              <div class="wizard-progress">
                <span>{t("wizardProgress")} {Math.round(wizardProgress * 100)}%</span>
                <div class="wizard-progress__bar">
                  <span style={`width:${wizardProgress * 100}%`}></span>
                </div>
              </div>
              <div class="wizard-steps">
                {#each wizardSteps as step, index}
                  <button
                    class="wizard-step {index === wizardStep ? 'active' : ''} {isWizardStepValid(index) ? 'done' : ''}"
                    type="button"
                    on:click={() => goToStep(index)}
                  >
                    <span>{step}</span>
                    <span class="wizard-step__status">
                      {isWizardStepValid(index) ? "●" : "○"}
                    </span>
                  </button>
                {/each}
              </div>
              <div class="wizard-body">
                {#if wizardStep === 0}
                  <p class="text-sm text-slate-200">{t("wizardPick")}</p>
                  <div class="wizard-card-grid">
                    {#each templateOptions as template}
                      <button
                        class="wizard-card {draft?.meta.template === template.id ? 'active' : ''}"
                        type="button"
                        on:click={() => applyTemplate(template.id)}
                      >
                        <p class="wizard-card__title">
                          {template.label[uiLang] ?? template.label.es ?? template.id}
                        </p>
                        <p class="wizard-card__meta">
                          {(template.categories[uiLang] ?? template.categories.es ?? []).join(" • ")}
                        </p>
                      </button>
                    {/each}
                  </div>
                  {#if draft?.categories.length}
                    <p class="text-xs text-slate-400">
                      {t("wizardTip")}
                    </p>
                  {/if}
                {:else if wizardStep === 1}
                  <p class="text-sm text-slate-200">{t("wizardIdentity")}</p>
                  {#if !wizardStatus.identity}
                    <p class="wizard-warning">{t("wizardMissingBackground")}</p>
                  {/if}
                  {#if assetOptions.length === 0}
                    <p class="text-xs text-slate-400">{t("wizardAssetsHint")}</p>
                  {/if}
                  <div class="wizard-block">
                    <button class="editor-outline" type="button" on:click={addBackground}>
                      {t("wizardAddBg")}
                    </button>
                    {#if draft}
                      <div class="wizard-list">
                        {#each draft.backgrounds as bg}
                          <div class="wizard-item">
                            <label class="editor-field">
                              <span>{t("wizardLabel")}</span>
                              <input
                                type="text"
                                class="editor-input"
                                bind:value={bg.label}
                              />
                            </label>
                            <label class="editor-field">
                              <span>{t("wizardSrc")}</span>
                              {#if assetOptions.length}
                                <select bind:value={bg.src} class="editor-select">
                                  <option value=""></option>
                                  {#each assetOptions as path}
                                    <option value={path}>{path}</option>
                                  {/each}
                                </select>
                              {:else}
                                <input
                                  type="text"
                                  class="editor-input"
                                  bind:value={bg.src}
                                  list="asset-files"
                                />
                              {/if}
                            </label>
                            <button
                              class="editor-outline danger"
                              type="button"
                              on:click={() => removeBackground(bg.id)}
                            >
                              {t("delete")}
                            </button>
                          </div>
                        {/each}
                      </div>
                    {/if}
                  </div>
                {:else if wizardStep === 2}
                  <p class="text-sm text-slate-200">{t("wizardCategories")}</p>
                  {#if !wizardStatus.categories}
                    <p class="wizard-warning">{t("wizardMissingCategories")}</p>
                  {/if}
                  {#if draft}
                    <div class="wizard-block">
                      <label class="editor-field">
                        <span>{t("wizardLanguage")}</span>
                        <select bind:value={wizardLang} class="editor-select">
                          {#each draft.meta.locales as lang}
                            <option value={lang}>{lang.toUpperCase()}</option>
                          {/each}
                        </select>
                      </label>
                      <button class="editor-outline" type="button" on:click={addWizardCategory}>
                        {t("wizardAddCategory")}
                      </button>
                      <div class="wizard-list">
                        {#each draft.categories as category}
                          <div class="wizard-item">
                            <label class="editor-field">
                              <span>{t("name")} ({wizardLang.toUpperCase()})</span>
                              <input
                                type="text"
                                class="editor-input"
                                value={category.name?.[wizardLang] ?? ""}
                                on:input={(event) =>
                                  handleLocalizedInput(category.name, wizardLang, event)}
                              />
                            </label>
                            <button
                              class="editor-outline danger"
                              type="button"
                              on:click={() => removeWizardCategory(category.id)}
                            >
                              {t("delete")}
                            </button>
                          </div>
                        {/each}
                      </div>
                    </div>
                  {/if}
                {:else if wizardStep === 3}
                  <p class="text-sm text-slate-200">{t("wizardDishes")}</p>
                  {#if !wizardStatus.dishes}
                    <p class="wizard-warning">{t("wizardMissingDishes")}</p>
                  {/if}
                  {#if draft}
                    <div class="wizard-block">
                      <label class="editor-field">
                        <span>{t("wizardLanguage")}</span>
                        <select bind:value={wizardLang} class="editor-select">
                          {#each draft.meta.locales as lang}
                            <option value={lang}>{lang.toUpperCase()}</option>
                          {/each}
                        </select>
                      </label>
                      <label class="editor-field">
                        <span>{t("wizardCategory")}</span>
                        <select bind:value={wizardCategoryId} class="editor-select">
                          {#each draft.categories as category}
                            <option value={category.id}>{textOf(category.name)}</option>
                          {/each}
                        </select>
                      </label>
                      <div class="edit-actions">
                        <button class="editor-outline" type="button" on:click={addWizardDish}>
                          {t("wizardAddDish")}
                        </button>
                        <button class="editor-outline danger" type="button" on:click={removeWizardDish}>
                          {t("delete")}
                        </button>
                      </div>
                      {#if wizardCategory}
                        <label class="editor-field">
                          <span>{t("dish")}</span>
                          <select bind:value={wizardItemId} class="editor-select">
                            {#each wizardCategory.items as item}
                              <option value={item.id}>{textOf(item.name)}</option>
                            {/each}
                          </select>
                        </label>
                      {/if}
                      {#if wizardItem}
                        <label class="editor-field">
                          <span>{t("name")} ({wizardLang.toUpperCase()})</span>
                          <input
                            type="text"
                            class="editor-input"
                            value={wizardItem.name?.[wizardLang] ?? ""}
                            on:input={(event) =>
                              handleLocalizedInput(wizardItem.name, wizardLang, event)}
                          />
                        </label>
                        <label class="editor-field">
                          <span>{t("description")} ({wizardLang.toUpperCase()})</span>
                          <textarea
                            class="editor-input"
                            rows="2"
                            value={wizardItem.description?.[wizardLang] ?? ""}
                            on:input={(event) => handleDescriptionInput(wizardItem, wizardLang, event)}
                          ></textarea>
                        </label>
                        <label class="editor-field">
                          <span>{t("price")}</span>
                          <input
                            type="number"
                            class="editor-input"
                            bind:value={wizardItem.price.amount}
                          />
                        </label>
                        <label class="editor-field">
                          <span>{t("asset360")}</span>
                          <input
                            type="text"
                            class="editor-input"
                            bind:value={wizardItem.media.hero360}
                            list="asset-files"
                          />
                        </label>
                      {/if}
                    </div>
                  {/if}
                {:else}
                  <p class="text-sm text-slate-200">{t("wizardPreview")}</p>
                  <p class="text-xs text-slate-400">
                    {t("wizardExportNote")}
                  </p>
                {/if}
              </div>
              <div class="wizard-nav">
                <button
                  class="editor-outline"
                  type="button"
                  on:click={goPrevStep}
                  disabled={wizardStep === 0}
                >
                  {t("wizardBack")}
                </button>
                {#if wizardStep < wizardSteps.length - 1}
                  <button
                    class="editor-cta"
                    type="button"
                    on:click={goNextStep}
                    disabled={!isWizardStepValid(wizardStep)}
                  >
                    {t("wizardNext")}
                  </button>
                {:else}
                  <button
                    class="editor-cta"
                    type="button"
                    on:click={exportStaticSite}
                    disabled={!wizardStatus.preview}
                  >
                    {t("export")}
                  </button>
                {/if}
              </div>
            </section>
          {/if}
        </div>
      </aside>

      <section class="preview-panel {layoutMode}">
        <section class="preview-shell {effectivePreview}">
        <section
          class={`menu-preview template-${activeProject.meta.template || "focus-rows"}`}
          style={`--menu-font:${previewFontStack};`}
        >
            {#if activeProject.backgrounds[0]?.src}
              <div
                class="menu-background"
                style={`background-image: url('${activeProject.backgrounds[0]?.src}');`}
              ></div>
            {/if}
            <div class="menu-overlay"></div>

            {#if isBlankMenu}
              <div class="menu-blank">
                <p>{t("blankMenu")}</p>
              </div>
            {:else}
              <header class="menu-topbar">
                <div class="menu-title-block">
                  {#if textOf(activeProject.meta.restaurantName)}
                    <p class="menu-eyebrow">{textOf(activeProject.meta.restaurantName)}</p>
                  {/if}
                  <h1 class="menu-title">
                    {textOf(activeProject.meta.title, t("menuTitleFallback"))}
                  </h1>
                </div>
                <div class="menu-lang">
                  <select bind:value={locale} class="menu-select">
                    {#each activeProject.meta.locales as lang}
                      <option value={lang}>{lang.toUpperCase()}</option>
                    {/each}
                  </select>
                </div>
              </header>

              <div class="menu-scroll">
                {#each activeProject.categories as category}
                  {@const loopedItems = getLoopedItems(category.items)}
                  {@const activeIndex =
                    carouselActive[category.id] ?? getLoopStart(category.items.length)}
                  <section class="menu-section">
                    <div class="menu-section__head">
                      <p class="menu-section__title">{textOf(category.name)}</p>
                      <span class="menu-section__count">{category.items.length} items</span>
                    </div>
                    <div
                      class="menu-carousel {category.items.length <= 1 ? 'single' : ''}"
                      on:scroll={(event) => handleCarouselScroll(category.id, event)}
                      data-category-id={category.id}
                    >
                      {#each loopedItems as entry (entry.key)}
                        {@const distance = Math.abs(activeIndex - entry.loopIndex)}
                        {@const fade = Math.max(0, 1 - distance * 0.2)}
                        <button
                          class={`carousel-card ${
                            distance === 0 ? "active" : distance === 1 ? "near" : "far"
                          }`}
                          type="button"
                          style={`--fade:${fade}`}
                          on:click={() => openDish(category.id, entry.item.id)}
                        >
                          <div class="carousel-media">
                            <img
                              src={entry.item.media.hero360 ?? ""}
                              alt={textOf(entry.item.name)}
                            />
                          </div>
                          <div class="carousel-text">
                            <div class="carousel-row">
                              <p class="carousel-title">
                                {textOf(entry.item.name)}
                                {#if entry.item.vegan}
                                  <span class="vegan-icon" title={getMenuTerm("vegan")}>🌿</span>
                                {/if}
                              </p>
                              <span class="carousel-price">
                                {formatPrice(entry.item.price.amount)}
                              </span>
                            </div>
                            <p class="carousel-desc">{textOf(entry.item.description)}</p>
                          </div>
                        </button>
                      {/each}
                    </div>
                  </section>
                {/each}
              </div>
            {/if}
          </section>
        </section>
      </section>
    </div>
  {/if}
</main>

{#if activeItem}
  {@const dish = resolveActiveDish()}
  {#if dish}
    <div class="dish-modal" on:click={closeDish}>
      <div class="dish-modal__card" on:click|stopPropagation>
        <button class="dish-modal__close" type="button" on:click={closeDish}>✕</button>
        <p class="dish-modal__title">{textOf(dish.name)}</p>
        <div class="dish-modal__media">
          <img src={dish.media.hero360 ?? ""} alt={textOf(dish.name)} />
        </div>
        <div class="dish-modal__content">
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
        <p class="dish-modal__price">
          {formatPrice(dish.price.amount)}
        </p>
      </div>
    </div>
  {/if}
{/if}

{#if assetOptions.length}
  <datalist id="asset-files">
    {#each assetOptions as path}
      <option value={path}></option>
    {/each}
  </datalist>
{/if}
