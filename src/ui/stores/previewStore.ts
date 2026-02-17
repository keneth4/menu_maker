import { writable } from "svelte/store";
import type { PreviewState } from "../contracts/state";

export const createPreviewStore = (initial?: Partial<PreviewState>) =>
  writable<PreviewState>({
    previewFontStack: "",
    previewFontVars: "",
    fontFaceCss: "",
    builtInFontHrefs: [],
    carouselActive: {},
    previewBackgrounds: [],
    loadedPreviewBackgroundIndexes: [],
    activeBackgroundIndex: 0,
    previewStartupLoading: false,
    previewStartupProgress: 100,
    previewStartupBlockingSources: new Set<string>(),
    sectionBackgroundIndexByCategory: {},
    ...initial
  });
