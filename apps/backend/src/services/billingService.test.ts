import {
  addMonthsClamped,
  computeDueDateForPeriod,
  computeLateFeeAmount,
  periodEndExclusive,
  periodLabel,
  periodMonths,
  periodStartContaining,
  recomputeStatus,
  sumLineItems,
} from "./billingService.js";

describe("periodMonths", () => {
  it("maps each frequency to its month span", () => {
    expect(periodMonths("monthly")).toBe(1);
    expect(periodMonths("quarterly")).toBe(3);
    expect(periodMonths("half_yearly")).toBe(6);
    expect(periodMonths("yearly")).toBe(12);
  });
});

describe("addMonthsClamped", () => {
  it("adds whole months", () => {
    expect(addMonthsClamped(new Date(2026, 0, 10), 3).toISOString().slice(0, 10)).toBe("2026-04-10");
  });

  it("clamps the day instead of rolling into the next month", () => {
    // Jan 31 + 1 month -> Feb has 28 days in 2026 (not a leap year)
    expect(addMonthsClamped(new Date(2026, 0, 31), 1).toISOString().slice(0, 10)).toBe("2026-02-28");
  });
});

describe("periodStartContaining", () => {
  const anchor = new Date(2021, 2, 10); // March 10, 2021

  it("returns the anchor itself for a date in the first period", () => {
    expect(periodStartContaining(anchor, "quarterly", new Date(2021, 2, 10)).toISOString().slice(0, 10)).toBe(
      "2021-03-10",
    );
    expect(periodStartContaining(anchor, "quarterly", new Date(2021, 4, 1)).toISOString().slice(0, 10)).toBe(
      "2021-03-10",
    );
  });

  it("does not advance to the next period until the anchor day is reached", () => {
    // One day before the quarter boundary (Jun 10) should still be in the first period.
    expect(periodStartContaining(anchor, "quarterly", new Date(2021, 5, 9)).toISOString().slice(0, 10)).toBe(
      "2021-03-10",
    );
    expect(periodStartContaining(anchor, "quarterly", new Date(2021, 5, 10)).toISOString().slice(0, 10)).toBe(
      "2021-06-10",
    );
  });

  it("steps correctly for a monthly frequency", () => {
    expect(periodStartContaining(anchor, "monthly", new Date(2021, 6, 15)).toISOString().slice(0, 10)).toBe(
      "2021-07-10",
    );
  });

  it("steps correctly many periods forward (years later)", () => {
    // 5 years after a monthly anchor of the 10th, checking a date well into year 5.
    expect(
      periodStartContaining(anchor, "monthly", new Date(2026, 1, 15)).toISOString().slice(0, 10),
    ).toBe("2026-02-10");
  });
});

describe("periodEndExclusive", () => {
  it("is periodMonths later than periodStart", () => {
    const start = new Date(2021, 2, 10);
    expect(periodEndExclusive(start, "half_yearly").toISOString().slice(0, 10)).toBe("2021-09-10");
  });
});

describe("computeDueDateForPeriod", () => {
  it("uses the given day within the period's first month", () => {
    expect(computeDueDateForPeriod(new Date(2026, 2, 1), 15).toISOString().slice(0, 10)).toBe("2026-03-15");
  });

  it("clamps to the last day of a shorter month instead of overflowing", () => {
    expect(computeDueDateForPeriod(new Date(2026, 1, 1), 31).toISOString().slice(0, 10)).toBe("2026-02-28");
  });
});

describe("periodLabel", () => {
  it("formats a monthly period as YYYY-MM", () => {
    expect(periodLabel(new Date(2026, 0, 15), "monthly")).toBe("2026-01");
  });

  it("formats a longer period as a month range", () => {
    expect(periodLabel(new Date(2026, 0, 15), "quarterly")).toBe("2026-01 to 2026-03");
    expect(periodLabel(new Date(2026, 0, 15), "yearly")).toBe("2026-01 to 2026-12");
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
