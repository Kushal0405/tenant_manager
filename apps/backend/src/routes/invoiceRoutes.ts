import { Router } from "express";
import * as invoiceController from "../controllers/invoiceController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const invoiceRouter = Router();

invoiceRouter.get("/", asyncHandler(invoiceController.list));
invoiceRouter.get("/:id", asyncHandler(invoiceController.get));
invoiceRouter.post("/charges", asyncHandler(invoiceController.createCharge));
invoiceRouter.post("/generate", asyncHandler(invoiceController.runBillingCycleNow));
