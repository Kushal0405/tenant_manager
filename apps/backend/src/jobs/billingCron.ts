import cron, { type ScheduledTask } from "node-cron";
import {
  generateInvoicesForActiveLeases,
  refreshOverdueInvoiceStatuses,
} from "../services/billingService.js";
import { applyLateFeesForActiveLeases } from "../services/lateFeeService.js";

/** Generates each lease's current-period rent invoice, flips overdue statuses, and applies late fees. */
export async function runDailyBillingCycle(now = new Date()) {
  const invoicesCreated = await generateInvoicesForActiveLeases(now);
  const markedOverdue = await refreshOverdueInvoiceStatuses(now);
  const lateFeesApplied = await applyLateFeesForActiveLeases(now);

  console.log(
    `[billing-cron] invoicesCreated=${invoicesCreated} markedOverdue=${markedOverdue} lateFeesApplied=${lateFeesApplied}`,
  );
}

/** Runs once daily at 01:00 server time — comfortably covers every lease's due day each month. */
export function startBillingCron(): ScheduledTask {
  return cron.schedule("0 1 * * *", () => {
    runDailyBillingCycle().catch((err) => {
      console.error("[billing-cron] failed:", err);
    });
  });
}
