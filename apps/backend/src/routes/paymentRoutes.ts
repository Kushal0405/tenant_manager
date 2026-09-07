import { Router } from "express";
import * as paymentController from "../controllers/paymentController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const paymentRouter = Router();

paymentRouter.get("/", asyncHandler(paymentController.list));
paymentRouter.post("/", asyncHandler(paymentController.create));
