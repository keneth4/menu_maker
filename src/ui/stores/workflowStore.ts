import { writable } from "svelte/store";
import type { WorkflowState } from "../contracts/state";

export const createWorkflowStore = (initial?: Partial<WorkflowState>) =>
  writable<WorkflowState>({
    workflowMode: null,
    workflowStep: "",
    workflowProgress: 0,
    assetTaskVisible: false,
    assetTaskStep: "",
    assetTaskProgress: 0,
    ...initial
  });
