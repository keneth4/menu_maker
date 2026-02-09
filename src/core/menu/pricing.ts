const currencySymbols = {
  MXN: "$",
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  COP: "$",
  ARS: "$"
} as const;

export const formatMenuPrice = (
  amount: number,
  currency: string,
  currencyPosition: "left" | "right" = "left"
) => {
  const symbol = currencySymbols[currency as keyof typeof currencySymbols] ?? currency;
  return currencyPosition === "left" ? `${symbol}${amount}` : `${amount}${symbol}`;
};
