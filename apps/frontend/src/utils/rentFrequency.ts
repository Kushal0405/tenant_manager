import type { RentFrequency } from "@rent-manager/shared";

export const FREQUENCY_LABELS: Record<RentFrequency, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  half_yearly: "Half-yearly",
  yearly: "Yearly",
};

const FREQUENCY_MONTHS: Record<RentFrequency, number> = {
  monthly: 1,
  quarterly: 3,
  half_yearly: 6,
  yearly: 12,
};

/** Rough client-side estimate of how many past periods will be backfilled — the server computes the real figure. */
export function estimateBackfillPeriods(startDate: string, frequency: RentFrequency): number {
  const start = new Date(startDate);
  const now = new Date();
  const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  return Math.max(0, Math.floor(months / FREQUENCY_MONTHS[frequency]));
}
