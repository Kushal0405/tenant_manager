import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { env } from "../config/env.js";
import {
  Expense,
  Invoice,
  Lease,
  LedgerEntry,
  Payment,
  Property,
  TaxPayment,
  Tenant,
  Unit,
  User,
  UtilityMeterReading,
} from "../models/index.js";
import { getOrCreateMonthlyInvoice, monthKey, refreshOverdueInvoiceStatuses } from "../services/billingService.js";
import { applyLateFeesForActiveLeases } from "../services/lateFeeService.js";
import { amendLease, createLease } from "../services/leaseService.js";
import { recordPayment } from "../services/paymentService.js";

const DEMO_EMAIL = "demo@rentmanager.test";
const DEMO_PASSWORD = "password123";

function monthsAgo(n: number, day = 1): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - n, day);
}

async function main() {
  await mongoose.connect(env.mongodbUri);
  console.log("[seed] connected to MongoDB");

  await Promise.all([
    User.deleteMany({}),
    Property.deleteMany({}),
    Unit.deleteMany({}),
    Tenant.deleteMany({}),
    Lease.deleteMany({}),
    Invoice.deleteMany({}),
    Payment.deleteMany({}),
    Expense.deleteMany({}),
    TaxPayment.deleteMany({}),
    UtilityMeterReading.deleteMany({}),
    LedgerEntry.deleteMany({}),
  ]);
  console.log("[seed] cleared existing collections");

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const owner = await User.create({ name: "Demo Owner", email: DEMO_EMAIL, passwordHash });

  const [propertyOne, propertyTwo] = await Property.create([
    {
      owner: owner._id,
      name: "Sunrise Apartments",
      type: "residential",
      address: {
        line1: "12 Sunrise Boulevard",
        city: "Pune",
        state: "Maharashtra",
        zip: "411001",
        country: "India",
      },
    },
    {
      owner: owner._id,
      name: "Lakeview Commercial Plaza",
      type: "commercial",
      address: {
        line1: "88 Lakeview Road",
        city: "Pune",
        state: "Maharashtra",
        zip: "411045",
        country: "India",
      },
    },
  ]);

  const unitSpecs = [
    { property: propertyOne, label: "A-101", bedrooms: 2, bathrooms: 2, sqft: 950, baseRentMinor: 2_500_000 },
    { property: propertyOne, label: "A-102", bedrooms: 1, bathrooms: 1, sqft: 620, baseRentMinor: 1_800_000 },
    { property: propertyOne, label: "A-201", bedrooms: 3, bathrooms: 2, sqft: 1250, baseRentMinor: 3_200_000 },
    { property: propertyTwo, label: "Shop-1", bedrooms: 0, bathrooms: 1, sqft: 400, baseRentMinor: 4_000_000 },
    { property: propertyTwo, label: "Shop-2", bedrooms: 0, bathrooms: 1, sqft: 550, baseRentMinor: 5_000_000 },
  ];

  const units = await Unit.create(
    unitSpecs.map((spec) => ({
      owner: owner._id,
      property: spec.property._id,
      label: spec.label,
      bedrooms: spec.bedrooms,
      bathrooms: spec.bathrooms,
      sqft: spec.sqft,
      baseRentMinor: spec.baseRentMinor,
      status: "vacant",
    })),
  );

  const tenantSpecs = [
    { name: "Aarav Sharma", email: "aarav.sharma@example.com", phone: "+91-9800000001" },
    { name: "Priya Nair", email: "priya.nair@example.com", phone: "+91-9800000002" },
    { name: "Rohan Mehta", email: "rohan.mehta@example.com", phone: "+91-9800000003" },
    { name: "Sanya Kapoor", email: "sanya.kapoor@example.com", phone: "+91-9800000004" },
    { name: "Vikram Singh", email: "vikram.singh@example.com", phone: "+91-9800000005" },
  ];

  const tenants = await Tenant.create(
    tenantSpecs.map((spec) => ({ ...spec, owner: owner._id, idProofType: "PAN", idProofNumber: "ABCDE1234F" })),
  );

  const leaseStart = monthsAgo(6);
  const leaseEnd = new Date(leaseStart.getFullYear() + 1, leaseStart.getMonth(), leaseStart.getDate());

  const leases = [];
  for (let i = 0; i < units.length; i++) {
    const unit = units[i];
    const tenant = tenants[i];
    const lease = await createLease({
      unit: unit._id.toString(),
      tenant: tenant._id.toString(),
      owner: owner._id.toString(),
      startDate: leaseStart,
      endDate: leaseEnd,
      rentAmountMinor: unit.baseRentMinor,
      depositAmountMinor: unit.baseRentMinor * 2,
      dueDayOfMonth: [1, 5, 10, 1, 15][i],
      lateFeeRule: { graceDays: 5, feeType: "flat", feeValueMinor: 50_000 },
    });
    leases.push(lease);
  }
  console.log(`[seed] created ${leases.length} active leases (units now occupied)`);

  // Showcase the rental-agreement amendment feature: a rent revision on lease[0].
  await amendLease(
    leases[0]._id.toString(),
    owner._id.toString(),
    { rentAmountMinor: leases[0].rentAmountMinor + 200_000 },
    monthsAgo(1),
    "Annual rent revision (+2,000)",
  );
  console.log("[seed] recorded a rent-revision amendment on the first lease");

  // 3 months of invoice/payment history per lease, with varied payment behavior.
  for (let m = 2; m >= 0; m--) {
    const issueDate = monthsAgo(m);
    const month = monthKey(issueDate);

    for (let i = 0; i < leases.length; i++) {
      const lease = await Lease.findById(leases[i]._id);
      if (!lease) continue;

      const { invoice } = await getOrCreateMonthlyInvoice(lease, month, issueDate);

      // Tenant 0: always pays in full. Tenant 1: pays partially. Tenant 2: pays late
      // but in full. Tenant 3: leaves the oldest month unpaid (overdue). Tenant 4: pays in full.
      if (i === 1) {
        await recordPayment({
          invoiceId: invoice._id.toString(),
          ownerId: owner._id.toString(),
          amountMinor: Math.round(invoice.totalMinor * 0.6),
          method: "upi",
          date: issueDate,
          recordedBy: owner._id.toString(),
        });
      } else if (i === 3 && m === 2) {
        // leave unpaid — will show as overdue once billing cycle runs
      } else {
        await recordPayment({
          invoiceId: invoice._id.toString(),
          ownerId: owner._id.toString(),
          amountMinor: invoice.totalMinor,
          method: m % 2 === 0 ? "bank" : "cash",
          date: issueDate,
          recordedBy: owner._id.toString(),
        });
      }
    }
  }
  console.log("[seed] generated 3 months of invoice/payment history");

  // Mark old unpaid invoices overdue and apply any late fees, same as the nightly cron.
  await refreshOverdueInvoiceStatuses();
  await applyLateFeesForActiveLeases();

  // Property-level expenses (owner P&L, not billed to tenants).
  await Expense.create([
    { owner: owner._id, property: propertyOne._id, category: "repair", amountMinor: 350_000, date: monthsAgo(1, 12), note: "Plumbing repair in common area" },
    { owner: owner._id, property: propertyOne._id, category: "insurance", amountMinor: 1_200_000, date: monthsAgo(2, 5), note: "Annual building insurance" },
    { owner: owner._id, property: propertyTwo._id, category: "management_fee", amountMinor: 600_000, date: monthsAgo(0, 3), note: "Facility management fee" },
  ]);

  // Tax payments / other government bills.
  await TaxPayment.create([
    {
      owner: owner._id,
      property: propertyOne._id,
      taxType: "property_tax",
      period: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
      amountMinor: 4_500_000,
      dueDate: new Date(new Date().getFullYear(), 11, 31),
      status: "pending",
    },
    {
      owner: owner._id,
      property: propertyTwo._id,
      taxType: "water_bill",
      period: monthKey(monthsAgo(1)),
      amountMinor: 250_000,
      dueDate: monthsAgo(1, 20),
      paidDate: monthsAgo(1, 15),
      status: "paid",
      receiptNumber: "WB-2026-0091",
    },
  ]);

  // Utility meter readings for one unit (electricity), one billed, one pending.
  const meteredUnit = units[0];
  const firstReading = await UtilityMeterReading.create({
    owner: owner._id,
    property: propertyOne._id,
    unit: meteredUnit._id,
    meterType: "electricity",
    readingDate: monthsAgo(1, 28),
    previousReadingValue: 1000,
    currentReadingValue: 1180,
    unitsConsumed: 180,
    ratePerUnitMinor: 800,
    amountMinor: 180 * 800,
    billed: true,
  });
  await UtilityMeterReading.create({
    owner: owner._id,
    property: propertyOne._id,
    unit: meteredUnit._id,
    meterType: "electricity",
    readingDate: new Date(),
    previousReadingValue: firstReading.currentReadingValue,
    currentReadingValue: firstReading.currentReadingValue + 165,
    unitsConsumed: 165,
    ratePerUnitMinor: 800,
    amountMinor: 165 * 800,
    billed: false,
  });

  console.log("[seed] added expenses, tax payments, and meter readings");
  console.log(`[seed] done. Demo login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("[seed] failed:", err);
  process.exit(1);
});
