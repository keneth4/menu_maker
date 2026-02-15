import type { MenuProject } from "../lib/types";
import {
  buildRuntimeScript as buildRuntimeScriptComposer,
  type BuildRuntimeScriptOptions
} from "./fragments/runtimeScriptComposer";

export type { BuildRuntimeScriptOptions };

export const buildRuntimeScript = (
  data: MenuProject,
  options: BuildRuntimeScriptOptions
) => buildRuntimeScriptComposer(data, options);
