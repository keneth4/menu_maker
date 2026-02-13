import type { MenuProject } from "../../lib/types";
import type { BridgeAssetClient } from "../../infrastructure/bridge/client";
import type { AssetEntryKind, AssetMovePlan } from "../../infrastructure/bridge/pathing";

export type AssetWorkspaceMode = "filesystem" | "bridge" | "none";

export type AssetWorkspaceEntry = {
  id: string;
  name: string;
  path: string;
  kind: AssetEntryKind;
  handle: FileSystemHandle | null;
  parent: FileSystemDirectoryHandle | null;
  source: "filesystem" | "bridge";
};

export type AssetWorkspaceTreeRow = {
  entry: AssetWorkspaceEntry;
  depth: number;
  hasChildren: boolean;
  expanded: boolean;
};

export type AssetWorkspaceFolderOption = {
  value: string;
  label: string;
};

export type AssetWorkspaceState = {
  rootHandle: FileSystemDirectoryHandle | null;
  bridgeAvailable: boolean;
  assetMode: AssetWorkspaceMode;
  bridgeProjectSlug: string;
  fsEntries: AssetWorkspaceEntry[];
  rootFiles: string[];
  fsError: string;
  uploadTargetPath: string;
  uploadFolderOptions: AssetWorkspaceFolderOption[];
  expandedPaths: Record<string, boolean>;
  treeRows: AssetWorkspaceTreeRow[];
  selectedAssetIds: string[];
  assetProjectReadOnly: boolean;
};

type AssetWorkspaceControllerDeps = {
  t: (key: string) => string;
  userManagedRoots: readonly string[];
  bridgeClient: BridgeAssetClient;
  getProjectSlug: () => string;
  mapLegacyAssetRelativeToManaged: (value: string) => string;
  isManagedAssetRelativePath: (value: string) => boolean;
  isLockedManagedAssetRoot: (value: string) => boolean;
  joinAssetFolderPath: (base: string, child: string) => string;
  planEntryMove: (kind: AssetEntryKind, name: string, targetPath: string) => AssetMovePlan;
  planEntryRename: (currentPath: string, newName: string) => string;
  getDirectoryHandleByPath: (
    rootHandle: FileSystemDirectoryHandle,
    path: string,
    create?: boolean
  ) => Promise<FileSystemDirectoryHandle>;
  listFilesystemEntries: (
    rootHandle: FileSystemDirectoryHandle
  ) => Promise<
    {
      id: string;
      name: string;
      path: string;
      kind: AssetEntryKind;
      handle: FileSystemHandle;
      parent: FileSystemDirectoryHandle;
    }[]
  >;
  copyFileHandleTo: (
    source: FileSystemFileHandle,
    destination: FileSystemDirectoryHandle,
    name: string
  ) => Promise<void>;
  copyDirectoryHandleTo: (
    source: FileSystemDirectoryHandle,
    destination: FileSystemDirectoryHandle,
    name: string
  ) => Promise<void>;
  writeFileToDirectory: (
    file: File,
    destination: FileSystemDirectoryHandle,
    name: string
  ) => Promise<void>;
  ensureAssetProjectWritable: () => boolean;
  getDraftProject: () => MenuProject | null;
  cloneProject: (value: MenuProject) => MenuProject;
  isProtectedAssetProjectSlug: (slug: string) => boolean;
  queueBridgeDerivedPreparation: (
    slug: string,
    project: MenuProject,
    options: { applyIfUnchanged: boolean }
  ) => Promise<void>;
  startAssetTask: (step: string, progress: number) => void;
  updateAssetTask: (step: string, progress: number) => void;
  finishAssetTask: (step: string) => void;
  failAssetTask: () => void;
  pulseAssetTask: (cap: number, step: string, options?: { tickIncrement?: number }) => void;
  clearAssetTaskPulse: () => void;
  prompt: (message: string, defaultValue?: string) => string | null;
  showDirectoryPicker: (() => Promise<FileSystemDirectoryHandle>) | undefined;
  getState: () => AssetWorkspaceState;
  setState: (next: Partial<AssetWorkspaceState>) => void;
};

export type AssetWorkspaceController = {
  syncDerivedState: () => void;
  updateAssetMode: () => void;
  refreshRootEntries: () => Promise<void>;
  refreshBridgeEntries: () => Promise<void>;
  pickRootFolder: () => Promise<void>;
  createFolder: () => Promise<void>;
  renameEntry: (entry: Pick<AssetWorkspaceEntry, "id" | "path" | "name" | "kind">) => Promise<void>;
  moveEntry: (entry: Pick<AssetWorkspaceEntry, "id" | "path" | "name" | "kind">) => Promise<void>;
  deleteEntry: (entry: Pick<AssetWorkspaceEntry, "id" | "path" | "name" | "kind">) => Promise<void>;
  bulkDelete: () => Promise<void>;
  bulkMove: () => Promise<void>;
  uploadAssets: (files: FileList | File[]) => Promise<void>;
  handleAssetUpload: (event: Event) => Promise<void>;
  handleAssetDrop: (event: DragEvent) => Promise<void>;
  handleAssetDragOver: (event: DragEvent) => void;
  toggleExpandPath: (path: string) => void;
  toggleAssetSelection: (id: string) => void;
  selectAllAssets: () => void;
  clearAssetSelection: () => void;
};

const areFolderOptionsEqual = (
  left: AssetWorkspaceFolderOption[],
  right: AssetWorkspaceFolderOption[]
) => {
  if (left.length !== right.length) return false;
  for (let index = 0; index < left.length; index += 1) {
    if (left[index].value !== right[index].value || left[index].label !== right[index].label) {
      return false;
    }
  }
  return true;
};

const areTreeRowsEqual = (left: AssetWorkspaceTreeRow[], right: AssetWorkspaceTreeRow[]) => {
  if (left.length !== right.length) return false;
  for (let index = 0; index < left.length; index += 1) {
    const rowA = left[index];
    const rowB = right[index];
    if (
      rowA.entry.id !== rowB.entry.id ||
      rowA.depth !== rowB.depth ||
      rowA.hasChildren !== rowB.hasChildren ||
      rowA.expanded !== rowB.expanded
    ) {
      return false;
    }
  }
  return true;
};

const areRecordsEqual = (left: Record<string, boolean>, right: Record<string, boolean>) => {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) return false;
  for (const key of leftKeys) {
    if (left[key] !== right[key]) return false;
  }
  return true;
};

const toDataUrl = async (file: File) =>
  await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

export const createAssetWorkspaceController = (
  deps: AssetWorkspaceControllerDeps
): AssetWorkspaceController => {
  const bridgeRequest = async (
    endpoint: string,
    payload?: Record<string, unknown>,
    overrideSlug?: string
  ) => {
    const slug = overrideSlug ?? deps.getProjectSlug();
    await deps.bridgeClient.request(endpoint, slug, payload);
  };

  const resolveEntry = (entry: Pick<AssetWorkspaceEntry, "id" | "path">) => {
    const state = deps.getState();
    return (
      state.fsEntries.find((candidate) => candidate.id === entry.id) ||
      state.fsEntries.find((candidate) => candidate.path === entry.path) ||
      null
    );
  };

  const updateAssetMode = () => {
    const state = deps.getState();
    if (state.rootHandle) {
      if (state.assetMode !== "filesystem") {
        deps.setState({ assetMode: "filesystem" });
      }
      return;
    }
    if (state.bridgeAvailable) {
      const patch: Partial<AssetWorkspaceState> = {};
      if (state.assetMode !== "bridge") patch.assetMode = "bridge";
      if (state.fsError) patch.fsError = "";
      if (Object.keys(patch).length) {
        deps.setState(patch);
      }
      return;
    }
    if (state.assetMode !== "none") {
      deps.setState({ assetMode: "none" });
    }
  };

  const refreshRootEntries = async () => {
    const state = deps.getState();
    if (!state.rootHandle) return;
    for (const root of deps.userManagedRoots) {
      await deps.getDirectoryHandleByPath(state.rootHandle, root, true);
    }
    const entries = await deps.listFilesystemEntries(state.rootHandle);
    const visibleEntries = entries.filter((entry) =>
      deps.isManagedAssetRelativePath(deps.mapLegacyAssetRelativeToManaged(entry.path))
    );
    const nextEntries: AssetWorkspaceEntry[] = visibleEntries.map((entry) => ({
      ...entry,
      path: deps.mapLegacyAssetRelativeToManaged(entry.path),
      source: "filesystem"
    }));
    const nextRootFiles = visibleEntries
      .filter((entry) => entry.kind === "file")
      .map((entry) => deps.mapLegacyAssetRelativeToManaged(entry.path))
      .filter((entry) => deps.isManagedAssetRelativePath(entry));
    deps.setState({
      fsEntries: nextEntries,
      rootFiles: nextRootFiles
    });
  };

  const refreshBridgeEntries = async () => {
    const state = deps.getState();
    if (!state.bridgeAvailable) return;
    const slug = deps.getProjectSlug();
    deps.setState({ bridgeProjectSlug: slug });
    try {
      const entries = (await deps.bridgeClient.list(slug))
        .map((entry) => ({
          ...entry,
          path: deps.mapLegacyAssetRelativeToManaged(entry.path)
        }))
        .filter((entry) => deps.isManagedAssetRelativePath(entry.path))
        .map((entry) => {
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
      const prefix = `/projects/${slug}/assets/`;
      const nextRootFiles = entries
        .filter((entry) => entry.kind === "file")
        .map((entry) => `${prefix}${entry.path}`);
      deps.setState({
        fsEntries: entries,
        rootFiles: nextRootFiles,
        fsError: ""
      });
    } catch (error) {
      deps.setState({ fsError: error instanceof Error ? error.message : deps.t("errOpenFolder") });
    }
  };

  const pickRootFolder = async () => {
    try {
      const picker = deps.showDirectoryPicker;
      if (!picker) {
        const state = deps.getState();
        if (state.bridgeAvailable) {
          deps.setState({ assetMode: "bridge", fsError: "" });
          await refreshBridgeEntries();
          return;
        }
        deps.setState({ fsError: deps.t("errNoFolder") });
        return;
      }
      const rootHandle = await picker();
      deps.setState({ rootHandle, fsError: "" });
      updateAssetMode();
      await refreshRootEntries();
    } catch (error) {
      deps.setState({ fsError: error instanceof Error ? error.message : deps.t("errOpenFolder") });
    }
  };

  const moveEntryToPath = async (entry: AssetWorkspaceEntry, targetPath: string) => {
    const state = deps.getState();
    const plan = deps.planEntryMove(entry.kind, entry.name, targetPath);
    if (!deps.isManagedAssetRelativePath(plan.destinationPath)) {
      throw new Error(deps.t("errAssetScope"));
    }
    if (state.assetMode === "filesystem") {
      if (!state.rootHandle || !entry.parent || !entry.handle) return;
      if (entry.kind === "file") {
        const destination = await deps.getDirectoryHandleByPath(
          state.rootHandle,
          plan.destinationDirPath,
          true
        );
        await deps.copyFileHandleTo(
          entry.handle as FileSystemFileHandle,
          destination,
          plan.destinationName
        );
        await entry.parent.removeEntry(entry.name);
      } else {
        const destination = await deps.getDirectoryHandleByPath(
          state.rootHandle,
          plan.destinationDirPath,
          true
        );
        await deps.copyDirectoryHandleTo(
          entry.handle as FileSystemDirectoryHandle,
          destination,
          plan.destinationName
        );
        await entry.parent.removeEntry(entry.name, { recursive: true });
      }
      return;
    }
    if (state.assetMode === "bridge") {
      await bridgeRequest("move", { from: entry.path, to: plan.destinationPath });
    }
  };

  const syncDerivedState = () => {
    const state = deps.getState();
    const seededExpandedPaths = { ...state.expandedPaths };
    state.fsEntries.forEach((entry) => {
      if (entry.kind === "directory" && seededExpandedPaths[entry.path] === undefined) {
        const isTopLevel = !entry.path.includes("/");
        seededExpandedPaths[entry.path] = isTopLevel;
      }
    });

    const entryMap = new Map<string, AssetWorkspaceEntry>();
    state.fsEntries.forEach((entry) => entryMap.set(entry.path, entry));

    const childrenMap = new Map<string, Set<string>>();
    const ensureChildren = (parent: string) => {
      if (!childrenMap.has(parent)) childrenMap.set(parent, new Set<string>());
      return childrenMap.get(parent)!;
    };

    state.fsEntries.forEach((entry) => {
      const parts = entry.path.split("/").filter(Boolean);
      let parent = "";
      parts.forEach((_, index) => {
        const current = parts.slice(0, index + 1).join("/");
        ensureChildren(parent).add(current);
        parent = current;
      });
    });

    const getEntry = (path: string): AssetWorkspaceEntry => {
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
        source: state.assetMode === "filesystem" ? "filesystem" : "bridge"
      };
    };

    const rows: AssetWorkspaceTreeRow[] = [];
    const sortPaths = (left: string, right: string) => {
      const entryLeft = getEntry(left);
      const entryRight = getEntry(right);
      if (entryLeft.kind !== entryRight.kind) {
        return entryLeft.kind === "directory" ? -1 : 1;
      }
      return entryLeft.name.localeCompare(entryRight.name);
    };
    const walk = (parent: string, depth: number) => {
      const children = Array.from(childrenMap.get(parent) ?? []).sort(sortPaths);
      children.forEach((child) => {
        const entry = getEntry(child);
        const hasChildren = (childrenMap.get(child)?.size ?? 0) > 0;
        const expanded = seededExpandedPaths[child] ?? depth === 0;
        rows.push({ entry, depth, hasChildren, expanded });
        if (entry.kind === "directory" && expanded) {
          walk(child, depth + 1);
        }
      });
    };
    walk("", 0);

    const folderSet = new Set<string>(deps.userManagedRoots);
    state.fsEntries
      .filter((entry) => entry.kind === "directory")
      .map((entry) => deps.mapLegacyAssetRelativeToManaged(entry.path))
      .filter((path) => deps.isManagedAssetRelativePath(path))
      .forEach((path) => folderSet.add(path));
    const folders = Array.from(folderSet)
      .map((path) => {
        const depth = path.split("/").filter(Boolean).length;
        const prefix = depth > 2 ? `${"—".repeat(depth - 2)} ` : "";
        return { value: path, label: `${prefix}${path}` };
      })
      .sort((left, right) => left.label.localeCompare(right.label));

    let nextUploadTargetPath = state.uploadTargetPath;
    if (nextUploadTargetPath && !folders.some((option) => option.value === nextUploadTargetPath)) {
      nextUploadTargetPath = deps.userManagedRoots[0];
    }
    if (!nextUploadTargetPath && folders.length > 0) {
      nextUploadTargetPath = folders[0].value;
    }

    const patch: Partial<AssetWorkspaceState> = {};
    if (!areRecordsEqual(seededExpandedPaths, state.expandedPaths)) {
      patch.expandedPaths = seededExpandedPaths;
    }
    if (!areTreeRowsEqual(rows, state.treeRows)) {
      patch.treeRows = rows;
    }
    if (!areFolderOptionsEqual(folders, state.uploadFolderOptions)) {
      patch.uploadFolderOptions = folders;
    }
    if (nextUploadTargetPath !== state.uploadTargetPath) {
      patch.uploadTargetPath = nextUploadTargetPath;
    }
    if (Object.keys(patch).length) {
      deps.setState(patch);
    }
  };

  const toggleExpandPath = (path: string) => {
    const state = deps.getState();
    deps.setState({
      expandedPaths: { ...state.expandedPaths, [path]: !state.expandedPaths[path] }
    });
    syncDerivedState();
  };

  const toggleAssetSelection = (id: string) => {
    const state = deps.getState();
    if (state.selectedAssetIds.includes(id)) {
      deps.setState({ selectedAssetIds: state.selectedAssetIds.filter((item) => item !== id) });
      return;
    }
    deps.setState({ selectedAssetIds: [...state.selectedAssetIds, id] });
  };

  const selectAllAssets = () => {
    const state = deps.getState();
    deps.setState({ selectedAssetIds: state.fsEntries.map((entry) => entry.id) });
  };

  const clearAssetSelection = () => {
    deps.setState({ selectedAssetIds: [] });
  };

  const createFolder = async () => {
    if (!deps.ensureAssetProjectWritable()) return;
    const name = deps.prompt(deps.t("promptNewFolder"));
    if (!name) return;
    const state = deps.getState();
    const baseFolder = state.uploadTargetPath || deps.userManagedRoots[0];
    const requestedPath = deps.mapLegacyAssetRelativeToManaged(name);
    const targetPath = deps.isManagedAssetRelativePath(requestedPath)
      ? requestedPath
      : deps.joinAssetFolderPath(baseFolder, requestedPath);
    if (!deps.isManagedAssetRelativePath(targetPath)) {
      deps.setState({ fsError: deps.t("errAssetScope") });
      return;
    }
    if (state.assetMode === "filesystem") {
      if (!state.rootHandle) return;
      await deps.getDirectoryHandleByPath(state.rootHandle, targetPath, true);
      await refreshRootEntries();
      return;
    }
    if (state.assetMode === "bridge") {
      try {
        await bridgeRequest("mkdir", { path: targetPath });
        await refreshBridgeEntries();
      } catch (error) {
        deps.setState({ fsError: error instanceof Error ? error.message : deps.t("errOpenFolder") });
      }
    }
  };

  const renameEntry = async (entryRef: Pick<AssetWorkspaceEntry, "id" | "path" | "name" | "kind">) => {
    if (!deps.ensureAssetProjectWritable()) return;
    if (deps.isLockedManagedAssetRoot(entryRef.path)) {
      deps.setState({ fsError: deps.t("errAssetRootProtected") });
      return;
    }
    const newName = deps.prompt(deps.t("promptRename"), entryRef.name);
    if (!newName || newName === entryRef.name) return;
    const entry = resolveEntry(entryRef);
    if (!entry) return;
    const state = deps.getState();
    if (state.assetMode === "filesystem") {
      if (!state.rootHandle || !entry.parent || !entry.handle) return;
      if (entry.kind === "file") {
        await deps.copyFileHandleTo(entry.handle as FileSystemFileHandle, entry.parent, newName);
        await entry.parent.removeEntry(entry.name);
      } else {
        await deps.copyDirectoryHandleTo(
          entry.handle as FileSystemDirectoryHandle,
          entry.parent,
          newName
        );
        await entry.parent.removeEntry(entry.name, { recursive: true });
      }
      await refreshRootEntries();
      return;
    }
    if (state.assetMode === "bridge") {
      const newPath = deps.planEntryRename(entry.path, newName);
      try {
        await bridgeRequest("move", { from: entry.path, to: newPath });
        await refreshBridgeEntries();
      } catch (error) {
        deps.setState({ fsError: error instanceof Error ? error.message : deps.t("errOpenFolder") });
      }
    }
  };

  const moveEntry = async (entryRef: Pick<AssetWorkspaceEntry, "id" | "path" | "name" | "kind">) => {
    if (!deps.ensureAssetProjectWritable()) return;
    if (deps.isLockedManagedAssetRoot(entryRef.path)) {
      deps.setState({ fsError: deps.t("errAssetRootProtected") });
      return;
    }
    const entry = resolveEntry(entryRef);
    if (!entry) return;
    const target = deps.prompt(deps.t("promptMoveTo"), entry.path);
    if (!target) return;
    try {
      await moveEntryToPath(entry, target);
      const state = deps.getState();
      if (state.assetMode === "filesystem") {
        await refreshRootEntries();
      } else if (state.assetMode === "bridge") {
        await refreshBridgeEntries();
      }
    } catch (error) {
      deps.setState({ fsError: error instanceof Error ? error.message : deps.t("errOpenFolder") });
    }
  };

  const deleteEntry = async (entryRef: Pick<AssetWorkspaceEntry, "id" | "path" | "name" | "kind">) => {
    if (!deps.ensureAssetProjectWritable()) return;
    if (deps.isLockedManagedAssetRoot(entryRef.path)) {
      deps.setState({ fsError: deps.t("errAssetRootProtected") });
      return;
    }
    const entry = resolveEntry(entryRef);
    if (!entry) return;
    const state = deps.getState();
    if (state.assetMode === "filesystem") {
      if (!entry.parent) return;
      await entry.parent.removeEntry(entry.name, { recursive: entry.kind === "directory" });
      await refreshRootEntries();
      return;
    }
    if (state.assetMode === "bridge") {
      try {
        await bridgeRequest("delete", { path: entry.path });
        await refreshBridgeEntries();
      } catch (error) {
        deps.setState({ fsError: error instanceof Error ? error.message : deps.t("errOpenFolder") });
      }
    }
  };

  const bulkDelete = async () => {
    if (!deps.ensureAssetProjectWritable()) return;
    const state = deps.getState();
    const targets = state.fsEntries.filter((entry) => state.selectedAssetIds.includes(entry.id));
    if (targets.some((entry) => deps.isLockedManagedAssetRoot(entry.path))) {
      deps.setState({ fsError: deps.t("errAssetRootProtected") });
      return;
    }
    for (const entry of targets) {
      if (state.assetMode === "filesystem") {
        if (!entry.parent) continue;
        await entry.parent.removeEntry(entry.name, { recursive: entry.kind === "directory" });
      } else if (state.assetMode === "bridge") {
        await bridgeRequest("delete", { path: entry.path });
      }
    }
    deps.setState({ selectedAssetIds: [] });
    if (state.assetMode === "filesystem") {
      await refreshRootEntries();
    } else if (state.assetMode === "bridge") {
      await refreshBridgeEntries();
    }
  };

  const bulkMove = async () => {
    if (!deps.ensureAssetProjectWritable()) return;
    const target = deps.prompt(deps.t("promptMoveTo"), "");
    if (!target) return;
    const state = deps.getState();
    const targets = state.fsEntries.filter((entry) => state.selectedAssetIds.includes(entry.id));
    if (targets.some((entry) => deps.isLockedManagedAssetRoot(entry.path))) {
      deps.setState({ fsError: deps.t("errAssetRootProtected") });
      return;
    }
    try {
      for (const entry of targets) {
        await moveEntryToPath(entry, target);
      }
    } catch (error) {
      deps.setState({ fsError: error instanceof Error ? error.message : deps.t("errOpenFolder") });
      return;
    }
    deps.setState({ selectedAssetIds: [] });
    if (state.assetMode === "filesystem") {
      await refreshRootEntries();
    } else if (state.assetMode === "bridge") {
      await refreshBridgeEntries();
    }
  };

  const uploadAssets = async (files: FileList | File[]) => {
    if (!deps.ensureAssetProjectWritable()) return;
    const state = deps.getState();
    const target = state.uploadTargetPath || deps.userManagedRoots[0];
    if (!deps.isManagedAssetRelativePath(target)) {
      deps.setState({ fsError: deps.t("errAssetScope") });
      return;
    }
    const uploads = Array.from(files);
    deps.setState({ fsError: "" });
    deps.startAssetTask("progressUploadAssets", 4);

    if (state.assetMode === "filesystem") {
      if (!state.rootHandle) {
        deps.failAssetTask();
        deps.setState({ fsError: deps.t("errNoFolder") });
        return;
      }
      const destination = await deps.getDirectoryHandleByPath(state.rootHandle, target, true);
      const totalUploads = Math.max(1, uploads.length);
      for (let index = 0; index < uploads.length; index += 1) {
        const file = uploads[index];
        deps.updateAssetTask("progressUploadAssets", 5 + (60 * index) / totalUploads);
        await deps.writeFileToDirectory(file, destination, file.name);
      }
      deps.updateAssetTask("progressUploadAssets", 72);
      await refreshRootEntries();
      deps.finishAssetTask("progressUploadDone");
      return;
    }

    if (state.assetMode === "bridge") {
      try {
        const totalUploads = Math.max(1, uploads.length);
        for (let index = 0; index < uploads.length; index += 1) {
          const file = uploads[index];
          deps.updateAssetTask("progressUploadAssets", 6 + (62 * index) / totalUploads);
          const dataUrl = await toDataUrl(file);
          await bridgeRequest("upload", { path: target, name: file.name, data: dataUrl });
          deps.updateAssetTask("progressUploadAssets", 6 + (62 * (index + 1)) / totalUploads);
        }
        deps.updateAssetTask("progressUploadAssets", 72);
        await refreshBridgeEntries();
        const draft = deps.getDraftProject();
        const slug = deps.getProjectSlug();
        if (draft && !deps.isProtectedAssetProjectSlug(slug)) {
          deps.pulseAssetTask(95, "progressUploadDerive", { tickIncrement: 0.08 });
          await deps.queueBridgeDerivedPreparation(slug, deps.cloneProject(draft), {
            applyIfUnchanged: true
          });
          deps.clearAssetTaskPulse();
          deps.updateAssetTask("progressUploadApply", 98);
          await refreshBridgeEntries();
        }
        deps.finishAssetTask("progressUploadDone");
      } catch (error) {
        deps.failAssetTask();
        deps.setState({ fsError: error instanceof Error ? error.message : deps.t("errOpenFolder") });
      }
      return;
    }

    deps.failAssetTask();
    deps.setState({ fsError: deps.t("errNoFolder") });
  };

  const handleAssetUpload = async (event: Event) => {
    const state = deps.getState();
    if (state.assetProjectReadOnly) {
      deps.setState({ fsError: deps.t("assetsReadOnly") });
      return;
    }
    const input = event.currentTarget as HTMLInputElement;
    const files = input.files;
    if (!files || files.length === 0) return;
    await uploadAssets(files);
    input.value = "";
  };

  const handleAssetDrop = async (event: DragEvent) => {
    event.preventDefault();
    const state = deps.getState();
    if (state.assetProjectReadOnly) {
      deps.setState({ fsError: deps.t("assetsReadOnly") });
      return;
    }
    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) return;
    await uploadAssets(files);
  };

  const handleAssetDragOver = (event: DragEvent) => {
    event.preventDefault();
  };

  return {
    syncDerivedState,
    updateAssetMode,
    refreshRootEntries,
    refreshBridgeEntries,
    pickRootFolder,
    createFolder,
    renameEntry,
    moveEntry,
    deleteEntry,
    bulkDelete,
    bulkMove,
    uploadAssets,
    handleAssetUpload,
    handleAssetDrop,
    handleAssetDragOver,
    toggleExpandPath,
    toggleAssetSelection,
    selectAllAssets,
    clearAssetSelection
  };
};
