import { Router } from "express";
import * as leaseController from "../controllers/leaseController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const leaseRouter = Router();

leaseRouter.get("/", asyncHandler(leaseController.list));
leaseRouter.get("/:id", asyncHandler(leaseController.get));
leaseRouter.post("/", asyncHandler(leaseController.create));
leaseRouter.patch("/:id/amend", asyncHandler(leaseController.amend));
leaseRouter.post("/:id/terminate", asyncHandler(leaseController.terminate));
leaseRouter.get("/:id/ledger", asyncHandler(leaseController.ledger));
leaseRouter.get("/:id/invoices", asyncHandler(leaseController.invoices));
