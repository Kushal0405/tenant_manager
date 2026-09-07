import { computeRunningBalance } from "./ledgerService.js";

describe("computeRunningBalance", () => {
  it("adds a charge to the previous balance", () => {
    expect(computeRunningBalance(0, "charge", 250_000)).toBe(250_000);
    expect(computeRunningBalance(250_000, "charge", 100_000)).toBe(350_000);
  });

  it("subtracts a payment (stored as a negative amount) from the balance", () => {
    expect(computeRunningBalance(350_000, "payment", -350_000)).toBe(0);
  });

  it("applies a credit the same way as a payment", () => {
    expect(computeRunningBalance(100_000, "credit", -20_000)).toBe(80_000);
  });

  it("keeps the rent balance unchanged for deposit entries", () => {
    expect(computeRunningBalance(150_000, "deposit", 500_000)).toBe(150_000);
  });

  it("keeps the rent balance unchanged for deposit_deduction entries", () => {
    expect(computeRunningBalance(150_000, "deposit_deduction", -50_000)).toBe(150_000);
  });
});
