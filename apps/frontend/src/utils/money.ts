/** Formats an integer minor-unit amount (e.g. paise) as a currency string. Assumes a 100-subunit currency (paise/cents). */
export function formatMoney(amountMinor: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(amountMinor / 100);
}

/** Parses a user-entered major-unit amount (e.g. "2500.50") into integer minor units. */
export function parseMoneyToMinor(value: string): number {
  const parsed = Number(value);
  return Math.round(parsed * 100);
}
