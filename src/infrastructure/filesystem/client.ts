import { normalizeAssetPath } from "../bridge/pathing";

export type FilesystemAssetEntry = {
  id: string;
  name: string;
  path: string;
  kind: "file" | "directory";
  handle: FileSystemHandle;
  parent: FileSystemDirectoryHandle;
};

export const listFilesystemEntries = async (rootHandle: FileSystemDirectoryHandle) => {
  const entries: FilesystemAssetEntry[] = [];
  const walk = async (dir: FileSystemDirectoryHandle, prefix = "") => {
    for await (const [name, handle] of dir.entries()) {
      const path = `${prefix}${name}`;
      entries.push({
        id: path,
        name,
        path,
        kind: handle.kind,
        handle,
        parent: dir
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
  return entries;
};

export const getDirectoryHandleByPath = async (
  rootHandle: FileSystemDirectoryHandle,
  path: string,
  create = false
) => {
  const parts = normalizeAssetPath(path).split("/").filter(Boolean);
  let current = rootHandle;
  for (const part of parts) {
    current = await current.getDirectoryHandle(part, { create });
  }
  return current;
};

export const getFileHandleByPath = async (rootHandle: FileSystemDirectoryHandle, path: string) => {
  const normalized = normalizeAssetPath(path);
  const parts = normalized.split("/").filter(Boolean);
  const fileName = parts.pop();
  if (!fileName) {
    throw new Error("Missing file name");
  }
  const dir = await getDirectoryHandleByPath(rootHandle, parts.join("/"), false);
  return await dir.getFileHandle(fileName);
};

export const writeFileToDirectory = async (
  file: File,
  destination: FileSystemDirectoryHandle,
  name: string
) => {
  const newHandle = await destination.getFileHandle(name, { create: true });
  const writable = await newHandle.createWritable();
  await writable.write(await file.arrayBuffer());
  await writable.close();
};

export const copyFileHandleTo = async (
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

export const copyDirectoryHandleTo = async (
  source: FileSystemDirectoryHandle,
  destination: FileSystemDirectoryHandle,
  name: string
) => {
  const newDir = await destination.getDirectoryHandle(name, { create: true });
  for await (const [entryName, handle] of source.entries()) {
    if (handle.kind === "file") {
      await copyFileHandleTo(handle as FileSystemFileHandle, newDir, entryName);
    } else {
      await copyDirectoryHandleTo(handle as FileSystemDirectoryHandle, newDir, entryName);
    }
  }
};
