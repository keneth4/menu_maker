import type { MenuProject } from "./types";

export async function loadProject(slug: string): Promise<MenuProject> {
  const response = await fetch(`/projects/${slug}/menu.json`);
  if (!response.ok) {
    throw new Error(`No se pudo cargar el proyecto: ${slug}`);
  }
  return response.json() as Promise<MenuProject>;
}
