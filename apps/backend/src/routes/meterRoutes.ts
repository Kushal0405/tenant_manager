import { Router } from "express";
import * as meterController from "../controllers/meterController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const meterRouter = Router();

meterRouter.get("/", asyncHandler(meterController.list));
meterRouter.post("/", asyncHandler(meterController.create));
