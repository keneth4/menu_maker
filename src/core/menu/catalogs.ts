export const menuTerms = {
  es: { allergens: "Alérgenos", vegan: "Vegano" },
  en: { allergens: "Allergens", vegan: "Vegan" },
  fr: { allergens: "Allergènes", vegan: "Végétalien" },
  pt: { allergens: "Alergênicos", vegan: "Vegano" },
  it: { allergens: "Allergeni", vegan: "Vegano" },
  de: { allergens: "Allergene", vegan: "Vegan" },
  ja: { allergens: "アレルゲン", vegan: "ヴィーガン" },
  ko: { allergens: "알레르겐", vegan: "비건" },
  zh: { allergens: "过敏原", vegan: "纯素" }
} as const;

export const commonAllergenCatalog = [
  {
    id: "gluten",
    label: {
      es: "Gluten",
      en: "Gluten",
      fr: "Gluten",
      pt: "Glúten",
      it: "Glutine",
      de: "Gluten",
      ja: "グルテン",
      ko: "글루텐",
      zh: "麸质"
    }
  },
  {
    id: "dairy",
    label: {
      es: "Lácteos",
      en: "Dairy",
      fr: "Produits laitiers",
      pt: "Laticínios",
      it: "Latticini",
      de: "Milchprodukte",
      ja: "乳製品",
      ko: "유제품",
      zh: "乳制品"
    }
  },
  {
    id: "egg",
    label: {
      es: "Huevo",
      en: "Egg",
      fr: "Oeuf",
      pt: "Ovo",
      it: "Uovo",
      de: "Ei",
      ja: "卵",
      ko: "달걀",
      zh: "鸡蛋"
    }
  },
  {
    id: "nuts",
    label: {
      es: "Frutos secos",
      en: "Nuts",
      fr: "Fruits à coque",
      pt: "Nozes",
      it: "Frutta a guscio",
      de: "Schalenfrüchte",
      ja: "木の実",
      ko: "견과류",
      zh: "坚果"
    }
  },
  {
    id: "peanut",
    label: {
      es: "Cacahuate",
      en: "Peanut",
      fr: "Arachide",
      pt: "Amendoim",
      it: "Arachide",
      de: "Erdnuss",
      ja: "ピーナッツ",
      ko: "땅콩",
      zh: "花生"
    }
  },
  {
    id: "soy",
    label: {
      es: "Soya",
      en: "Soy",
      fr: "Soja",
      pt: "Soja",
      it: "Soia",
      de: "Soja",
      ja: "大豆",
      ko: "대두",
      zh: "大豆"
    }
  },
  {
    id: "fish",
    label: {
      es: "Pescado",
      en: "Fish",
      fr: "Poisson",
      pt: "Peixe",
      it: "Pesce",
      de: "Fisch",
      ja: "魚",
      ko: "생선",
      zh: "鱼类"
    }
  },
  {
    id: "shellfish",
    label: {
      es: "Mariscos",
      en: "Shellfish",
      fr: "Crustacés",
      pt: "Mariscos",
      it: "Crostacei",
      de: "Schalentiere",
      ja: "甲殻類",
      ko: "갑각류",
      zh: "甲壳类"
    }
  },
  {
    id: "sesame",
    label: {
      es: "Ajonjolí",
      en: "Sesame",
      fr: "Sésame",
      pt: "Gergelim",
      it: "Sesamo",
      de: "Sesam",
      ja: "ごま",
      ko: "참깨",
      zh: "芝麻"
    }
  }
] satisfies { id: string; label: Record<string, string> }[];
