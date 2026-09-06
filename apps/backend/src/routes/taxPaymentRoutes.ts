import { Router } from "express";
import * as taxPaymentController from "../controllers/taxPaymentController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const taxPaymentRouter = Router();

taxPaymentRouter.get("/", asyncHandler(taxPaymentController.list));
taxPaymentRouter.post("/", asyncHandler(taxPaymentController.create));
taxPaymentRouter.patch("/:id", asyncHandler(taxPaymentController.update));
taxPaymentRouter.post("/:id/mark-paid", asyncHandler(taxPaymentController.markPaid));
taxPaymentRouter.delete("/:id", asyncHandler(taxPaymentController.remove));
