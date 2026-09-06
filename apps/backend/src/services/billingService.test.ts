import {
  computeDueDate,
  computeLateFeeAmount,
  monthKey,
  recomputeStatus,
  sumLineItems,
} from "./billingService.js";

describe("computeDueDate", () => {
  it("uses the given day of month", () => {
    expect(computeDueDate("2026-03", 10).toISOString().slice(0, 10)).toBe("2026-03-10");
  });

  it("clamps to the last day of a shorter month instead of overflowing", () => {
    // February 2026 has 28 days
    expect(computeDueDate("2026-02", 31).toISOString().slice(0, 10)).toBe("2026-02-28");
  });
});

describe("monthKey", () => {
  it("formats as YYYY-MM with a zero-padded month", () => {
    expect(monthKey(new Date(2026, 0, 15))).toBe("2026-01");
    expect(monthKey(new Date(2026, 10, 1))).toBe("2026-11");
  });
});

describe("sumLineItems", () => {
  it("sums amountMinor across line items", () => {
    expect(
      sumLineItems([
        { type: "rent", description: "Rent", amountMinor: 250_000 },
        { type: "utility", description: "Electricity", amountMinor: 12_000 },
      ]),
    ).toBe(262_000);
  });

  it("returns 0 for an empty list", () => {
    expect(sumLineItems([])).toBe(0);
  });
});

describe("computeLateFeeAmount", () => {
  it("returns the flat fee value for flat rules", () => {
    expect(computeLateFeeAmount({ feeType: "flat", feeValueMinor: 50_000 }, 250_000)).toBe(50_000);
  });

  it("computes a rounded percentage of the invoice total for percent rules", () => {
    expect(computeLateFeeAmount({ feeType: "percent", feePercent: 5 }, 250_000)).toBe(12_500);
    // rounds to nearest integer minor unit
    expect(computeLateFeeAmount({ feeType: "percent", feePercent: 3.33 }, 100_000)).toBe(3_330);
  });

  it("defaults to 0 when the relevant field is missing", () => {
    expect(computeLateFeeAmount({ feeType: "flat" }, 250_000)).toBe(0);
    expect(computeLateFeeAmount({ feeType: "percent" }, 250_000)).toBe(0);
  });
});

describe("recomputeStatus", () => {
  const dueDate = new Date("2026-03-10T00:00:00.000Z");
  const beforeDue = new Date("2026-03-05T00:00:00.000Z");
  const afterDue = new Date("2026-03-15T00:00:00.000Z");

  it("is 'unpaid' before the due date with no payment", () => {
    expect(recomputeStatus(250_000, 0, dueDate, beforeDue)).toBe("unpaid");
  });

  it("is 'partial' before the due date with a partial payment", () => {
    expect(recomputeStatus(250_000, 100_000, dueDate, beforeDue)).toBe("partial");
  });

  it("is 'paid' once the paid amount covers the total", () => {
    expect(recomputeStatus(250_000, 250_000, dueDate, beforeDue)).toBe("paid");
    expect(recomputeStatus(250_000, 300_000, dueDate, afterDue)).toBe("paid");
  });

  it("is 'overdue' once past the due date with any outstanding balance, even if partially paid", () => {
    expect(recomputeStatus(250_000, 0, dueDate, afterDue)).toBe("overdue");
    expect(recomputeStatus(250_000, 100_000, dueDate, afterDue)).toBe("overdue");
  });
});
