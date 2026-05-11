// src/utils/decimal.ts

/**
 * Normalize a free-form decimal input to a backend-friendly string.
 * Accepts:
 *   "12.50"  -> "12.50"
 *   "12,50"  -> "12.50"
 *   "12"     -> "12"
 *   " 1.234,56 " -> "1234.56"   (German formatting with thousand separator)
 *   "1,234.56"   -> "1234.56"   (English formatting with thousand separator)
 *
 * Returns null if the input cannot be parsed as a non-negative decimal.
 */
export function normalizeDecimalInput(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Detect format by which separator is rightmost
  const lastDot = trimmed.lastIndexOf(".");
  const lastComma = trimmed.lastIndexOf(",");

  let normalized: string;
  if (lastDot === -1 && lastComma === -1) {
    // Integer
    normalized = trimmed;
  } else if (lastComma > lastDot) {
    // German-style: comma is decimal separator; dots (if any) are thousand sep
    normalized = trimmed.replace(/\./g, "").replace(",", ".");
  } else {
    // English-style: dot is decimal separator; commas (if any) are thousand sep
    normalized = trimmed.replace(/,/g, "");
  }

  // Validate: non-negative decimal with at most 2 fractional digits.
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;

  // Strip trailing zeros in fractional part but keep at least 2 places for currency display.
  return normalized;
}

/**
 * Format a backend decimal string for display in inputs.
 * Backend returns "45.00"; we leave it as-is so the value round-trips cleanly.
 */
export function formatDecimalForInput(value: string | null | undefined): string {
  if (value == null) return "";
  return value;
}

/**
 * Format a decimal string as a EUR amount for display in lists.
 *   "45.50"  -> "€45.50"
 *   "45"     -> "€45.00"
 */
export function formatPriceEur(value: string | null | undefined): string {
  if (value == null) return "—";
  const num = Number(value);
  if (Number.isNaN(num)) return value;
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}
