/**
 * Monetary values are persisted as integer minor units (paise, cents, etc.).
 * These helpers are safe to import in both client and server code.
 */
export const MINOR_UNITS_PER_MAJOR = 100;

const currencyLocales: Record<string, string> = {
  INR: 'en-IN',
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB',
  CAD: 'en-CA',
  AUD: 'en-AU',
};

const currencyBySymbol: Record<string, string> = {
  '₹': 'INR',
  '$': 'USD',
  '€': 'EUR',
  '£': 'GBP',
  'CA$': 'CAD',
  'A$': 'AUD',
};

export function fromMinorUnits(minorUnits: number): number {
  return minorUnits / MINOR_UNITS_PER_MAJOR;
}

export function toMinorUnits(amount: number | string): number {
  const parsed = typeof amount === 'number' ? amount : Number(amount);
  if (!Number.isFinite(parsed)) return 0;
  return Math.round(parsed * MINOR_UNITS_PER_MAJOR);
}

export function formatMinorCurrency(minorUnits: number, currency = 'INR'): string {
  const normalizedCurrency = (currencyBySymbol[currency] || currency).toUpperCase();
  const locale = currencyLocales[normalizedCurrency] || undefined;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: normalizedCurrency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(fromMinorUnits(minorUnits));
}

export function formatMajorAmount(amount: number, currency = 'INR'): string {
  return formatMinorCurrency(toMinorUnits(amount), currency);
}
