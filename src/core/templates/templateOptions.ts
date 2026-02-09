import { templateCapabilityList } from "./registry";

export type TemplateOption = {
  id: string;
  label: Record<string, string>;
  categories: Record<string, string[]>;
  smokeFixturePath: string;
};

export const templateOptions: TemplateOption[] = templateCapabilityList.map((capability) => ({
  id: capability.id,
  label: capability.label,
  categories: capability.categories,
  smokeFixturePath: capability.smokeFixturePath
}));
