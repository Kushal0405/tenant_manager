import { Router } from "express";
import * as unitController from "../controllers/unitController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const unitRouter = Router();

unitRouter.get("/", asyncHandler(unitController.list));
unitRouter.get("/:id", asyncHandler(unitController.get));
unitRouter.post("/", asyncHandler(unitController.create));
unitRouter.patch("/:id", asyncHandler(unitController.update));
unitRouter.delete("/:id", asyncHandler(unitController.remove));
