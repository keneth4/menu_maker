export type LocaleCode = "es" | "en" | "fr" | "pt" | string;

export type LocalizedText = {
  [locale: LocaleCode]: string;
};

export type FontConfig = {
  family?: string;
  source?: string;
};

export type ProjectFontRole = "identity" | "restaurant" | "title" | "section" | "item";

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
  priceVisible?: boolean;
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
    scrollAnimationMode?: "hero360" | "alternate";
    scrollAnimationSrc?: string;
    gallery?: string[];
    responsive?: {
      small?: string;
      medium?: string;
      large?: string;
    };
    derived?: DerivedMediaMap;
  };
  typography?: {
    item?: FontConfig;
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
  backgroundId?: string;
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
    fontRoles?: {
      identity?: FontConfig;
      restaurant?: FontConfig;
      title?: FontConfig;
      section?: FontConfig;
      item?: FontConfig;
    };
    template: string;
    locales: LocaleCode[];
    defaultLocale: LocaleCode;
    currency: string;
    currencyPosition?: "left" | "right";
    backgroundCarouselSeconds?: number;
    backgroundDisplayMode?: "carousel" | "section";
    scrollSensitivity?: {
      item?: number;
      section?: number;
    };
  };
  backgrounds: MediaAsset[];
  categories: MenuCategory[];
  sound: SoundConfig;
};
