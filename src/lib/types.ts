export type LocaleCode = "es" | "en" | "fr" | "pt" | string;

export type LocalizedText = {
  [locale: LocaleCode]: string;
};

export type MediaAsset = {
  id: string;
  label: string;
  src: string;
  type: "gif" | "webm" | "mp4" | "image";
  alt?: string;
};

export type MenuItem = {
  id: string;
  name: LocalizedText;
  description?: LocalizedText;
  price: {
    amount: number;
    currency: string;
    display?: string;
  };
  allergens?: string[];
  media: {
    hero360?: string;
    gallery?: string[];
  };
};

export type MenuCategory = {
  id: string;
  name: LocalizedText;
  items: MenuItem[];
};

export type SoundMap = {
  tap?: string;
  confirm?: string;
  success?: string;
};

export type SoundConfig = {
  enabled: boolean;
  theme: string;
  volume: number;
  map: SoundMap;
};

export type MenuProject = {
  meta: {
    slug: string;
    name: string;
    template: string;
    locales: LocaleCode[];
    defaultLocale: LocaleCode;
    currency: string;
    currencyPosition?: "left" | "right";
  };
  backgrounds: MediaAsset[];
  categories: MenuCategory[];
  sound: SoundConfig;
};
