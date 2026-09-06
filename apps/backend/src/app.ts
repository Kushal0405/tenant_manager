import cors from "cors";
import express, { type Express } from "express";
import { authRouter } from "./routes/authRoutes.js";
import { expenseRouter } from "./routes/expenseRoutes.js";
import { invoiceRouter } from "./routes/invoiceRoutes.js";
import { leaseRouter } from "./routes/leaseRoutes.js";
import { meterReadingRouter } from "./routes/meterReadingRoutes.js";
import { paymentRouter } from "./routes/paymentRoutes.js";
import { propertyRouter } from "./routes/propertyRoutes.js";
import { reportRouter } from "./routes/reportRoutes.js";
import { taxPaymentRouter } from "./routes/taxPaymentRoutes.js";
import { tenantRouter } from "./routes/tenantRoutes.js";
import { unitRouter } from "./routes/unitRoutes.js";
import { requireAuth } from "./middleware/requireAuth.js";
import { errorHandler } from "./middleware/errorHandler.js";

export function createApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/properties", requireAuth, propertyRouter);
  app.use("/api/units", requireAuth, unitRouter);
  app.use("/api/tenants", requireAuth, tenantRouter);
  app.use("/api/leases", requireAuth, leaseRouter);
  app.use("/api/invoices", requireAuth, invoiceRouter);
  app.use("/api/payments", requireAuth, paymentRouter);
  app.use("/api/expenses", requireAuth, expenseRouter);
  app.use("/api/tax-payments", requireAuth, taxPaymentRouter);
  app.use("/api/meter-readings", requireAuth, meterReadingRouter);
  app.use("/api/reports", requireAuth, reportRouter);

  app.use(errorHandler);

  return app;
}
