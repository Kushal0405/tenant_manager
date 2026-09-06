import cors from "cors";
import express, { type Express } from "express";

export function createApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Domain routes (properties, units, tenants, leases, invoices, payments,
  // expenses, reports) are mounted here once the schema proposal is approved.

  return app;
}
