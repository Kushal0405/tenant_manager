import { Router } from "express";
import * as meterReadingController from "../controllers/meterReadingController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const meterReadingRouter = Router();

meterReadingRouter.get("/", asyncHandler(meterReadingController.list));
meterReadingRouter.post("/", asyncHandler(meterReadingController.create));
meterReadingRouter.post("/:id/bill", asyncHandler(meterReadingController.bill));
