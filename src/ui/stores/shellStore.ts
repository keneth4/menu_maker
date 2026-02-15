import { writable } from "svelte/store";
import type { ShellState } from "../contracts/state";

export const createShellStore = (initial?: Partial<ShellState>) =>
  writable<ShellState>({
    showLanding: true,
    editorOpen: false,
    editorTab: "info",
    uiLang: "es",
    languageMenuOpen: false,
    loadError: "",
    openError: "",
    exportError: "",
    exportStatus: "",
    previewMode: "device",
    deviceMode: "desktop",
    ...initial
  });
