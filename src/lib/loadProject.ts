import type { MenuProject } from "./types";

export async function loadProject(
  slug: string,
  options?: { cacheBust?: string }
): Promise<MenuProject> {
  const cacheSuffix = options?.cacheBust
    ? `?v=${encodeURIComponent(options.cacheBust)}`
    : "";
  const response = await fetch(`/projects/${slug}/menu.json${cacheSuffix}`);
  if (!response.ok) {
    throw new Error(`No se pudo cargar el proyecto: ${slug}`);
  }
  return response.json() as Promise<MenuProject>;
}
