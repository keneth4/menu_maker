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
  originalSrc?: string;
  derived?: DerivedMediaMap;
};

export type AllergenEntry = {
  id?: string;
  label: LocalizedText;
};

export type MenuItem = {
  id: string;
  name: LocalizedText;
  description?: LocalizedText;
  longDescription?: LocalizedText;
  price: {
    amount: number;
    currency: string;
    display?: string;
  };
  allergens?: AllergenEntry[];
  vegan?: boolean;
  media: {
    hero360?: string;
    originalHero360?: string;
    rotationDirection?: "cw" | "ccw";
    gallery?: string[];
    responsive?: {
      small?: string;
      medium?: string;
      large?: string;
    };
    derived?: DerivedMediaMap;
  };
};

export type DerivedMediaVariant = string | Record<string, string | undefined>;

export type DerivedMediaMap = {
  profileId?: string;
  small?: DerivedMediaVariant;
  medium?: DerivedMediaVariant;
  large?: DerivedMediaVariant;
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
    restaurantName?: LocalizedText;
    title?: LocalizedText;
    identityMode?: "text" | "logo";
    logoSrc?: string;
    fontFamily?: string;
    fontSource?: string;
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
