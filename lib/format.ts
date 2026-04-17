// Formatting utilities — pure functions, no side effects.

/**
 * Formats a numeric value as German currency (e.g. "12,50 €").
 * Returns an empty string for null or undefined inputs.
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "";
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formats an ISO date string as TT.MM.JJJJ (e.g. "17.04.2026").
 * Parses the first 10 characters to avoid timezone shifts.
 */
export function formatDate(iso: string): string {
  // Use the date part only (YYYY-MM-DD) to avoid UTC offset issues.
  const [year, month, day] = iso.slice(0, 10).split("-");
  return `${day}.${month}.${year}`;
}
