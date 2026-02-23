/**
 * Currency and amount formatting utilities
 */

export function formatAmountWithCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function getCurrencySymbol(currencyCode: string): string {
  try {
    const formatter = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currencyCode || "USD",
    });
    const parts = formatter.formatToParts(1);
    const symbol = parts.find((p) => p.type === "currency");
    return symbol?.value ?? currencyCode;
  } catch {
    return currencyCode;
  }
}

export function parseAmount(value: string): number {
  const cleaned = value.replace(/[^0-9.-]/g, "");
  const num = parseFloat(cleaned);
  return Number.isNaN(num) ? 0 : num;
}
