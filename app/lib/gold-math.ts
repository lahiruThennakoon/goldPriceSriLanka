// Architecture AD referencing PRD NFR1: exact constants, no intermediate rounding.
export const GRAMS_PER_TROY_OUNCE = 31.1034768;
export const GRAMS_PER_PAVAN = 8;

export type Purity = 24 | 22 | 21 | 18 | 14 | number;

export function usdPerGram24k(goldUsdPerTroyOunce: number): number {
  return goldUsdPerTroyOunce / GRAMS_PER_TROY_OUNCE;
}

export function lkrPerGram24k(goldUsdPerTroyOunce: number, usdLkrRate: number): number {
  return usdPerGram24k(goldUsdPerTroyOunce) * usdLkrRate;
}

export function lkrPerGramAtPurity(
  goldUsdPerTroyOunce: number,
  usdLkrRate: number,
  purityKarat: number
): number {
  return (lkrPerGram24k(goldUsdPerTroyOunce, usdLkrRate) * purityKarat) / 24;
}

export function goldValueLkr(
  goldUsdPerTroyOunce: number,
  usdLkrRate: number,
  purityKarat: number,
  weightInGrams: number
): number {
  return lkrPerGramAtPurity(goldUsdPerTroyOunce, usdLkrRate, purityKarat) * weightInGrams;
}

export function gramsToPavan(grams: number): number {
  return grams / GRAMS_PER_PAVAN;
}

export function pavanToGrams(pavan: number): number {
  return pavan * GRAMS_PER_PAVAN;
}

// Round only for display -- never feed this back into a calculation.
export function formatLkr(value: number): string {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    currencyDisplay: "symbol",
    maximumFractionDigits: 2,
  })
    .format(value)
    .replace("LKR", "Rs.");
}

export function formatGrams(grams: number): string {
  return `${grams.toFixed(2)} g`;
}

export function formatPavan(pavan: number): string {
  return `${pavan.toFixed(4)} pavan`;
}
