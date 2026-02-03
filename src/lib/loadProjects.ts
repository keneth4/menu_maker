export type ProjectSummary = {
  slug: string;
  name: string;
  template: string;
  cover?: string;
};

export async function loadProjects(): Promise<ProjectSummary[]> {
  const response = await fetch("/projects/index.json");
  if (!response.ok) {
    throw new Error("No se pudo cargar el indice de proyectos");
  }
  const data = (await response.json()) as { projects: ProjectSummary[] };
  return data.projects ?? [];
}
