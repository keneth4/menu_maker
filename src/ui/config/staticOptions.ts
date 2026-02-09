export const languageOptions = [
  { code: "es", label: "Español" },
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "pt", label: "Português" },
  { code: "it", label: "Italiano" },
  { code: "de", label: "Deutsch" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "zh", label: "中文" }
] as const;

export const currencyOptions = [
  { code: "MXN", label: "Peso MXN", symbol: "$" },
  { code: "USD", label: "US Dollar", symbol: "$" },
  { code: "EUR", label: "Euro", symbol: "€" },
  { code: "GBP", label: "Pound", symbol: "£" },
  { code: "JPY", label: "Yen", symbol: "¥" },
  { code: "COP", label: "Peso COP", symbol: "$" },
  { code: "ARS", label: "Peso ARS", symbol: "$" }
] as const;

export const fontOptions = [
  { value: "Fraunces", label: "Fraunces" },
  { value: "Cinzel", label: "Cinzel" },
  { value: "Cormorant Garamond", label: "Cormorant Garamond" },
  { value: "Playfair Display", label: "Playfair Display" },
  { value: "Poppins", label: "Poppins" }
] as const;

export const builtInFontSources: Record<string, string> = {
  Fraunces: "https://fonts.googleapis.com/css2?family=Fraunces:wght@400;500;700&display=swap",
  Cinzel: "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;700&display=swap",
  "Cormorant Garamond":
    "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;700&display=swap",
  "Playfair Display":
    "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;700&display=swap",
  Poppins: "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;700&display=swap"
};
