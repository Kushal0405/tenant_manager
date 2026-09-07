import { Router } from "express";
import * as reportController from "../controllers/reportController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const reportRouter = Router();

reportRouter.get("/dashboard", asyncHandler(reportController.dashboard));
reportRouter.get("/income-statement", asyncHandler(reportController.incomeStatement));
reportRouter.get("/income-statement/csv", asyncHandler(reportController.incomeStatementCsv));
