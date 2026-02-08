export type TemplateOption = {
  id: string;
  label: Record<string, string>;
  categories: Record<string, string[]>;
};

export const templateOptions: TemplateOption[] = [
  {
    id: "focus-rows",
    label: { es: "Filas En Foco", en: "In Focus Rows" },
    categories: { es: ["Cafe", "Brunch"], en: ["Cafe", "Brunch"] }
  },
  {
    id: "jukebox",
    label: { es: "Jukebox", en: "Jukebox" },
    categories: { es: ["Cafe", "Brunch"], en: ["Cafe", "Brunch"] }
  }
];
