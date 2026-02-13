import { writable } from "svelte/store";
import type { ModalState } from "../contracts/state";

export const createModalStore = (initial?: Partial<ModalState>) =>
  writable<ModalState>({
    activeItem: null,
    detailRotateDirection: -1,
    ...initial
  });
