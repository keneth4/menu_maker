import type { AllergenEntry, MenuItem } from "../../lib/types";

export const ensureDescription = (item: MenuItem) => {
  if (!item.description) {
    item.description = {};
  }
  return item.description;
};

export const ensureLongDescription = (item: MenuItem) => {
  if (!item.longDescription) {
    item.longDescription = {};
  }
  return item.longDescription;
};

export const ensureAllergens = (item: MenuItem): AllergenEntry[] => {
  if (!item.allergens) {
    item.allergens = [];
  }
  return item.allergens;
};
