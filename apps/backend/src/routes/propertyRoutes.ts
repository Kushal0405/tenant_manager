import { Router } from "express";
import * as propertyController from "../controllers/propertyController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const propertyRouter = Router();

propertyRouter.get("/", asyncHandler(propertyController.list));
propertyRouter.get("/:id", asyncHandler(propertyController.get));
propertyRouter.post("/", asyncHandler(propertyController.create));
propertyRouter.patch("/:id", asyncHandler(propertyController.update));
propertyRouter.delete("/:id", asyncHandler(propertyController.remove));
