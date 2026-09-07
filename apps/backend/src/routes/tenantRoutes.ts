import { Router } from "express";
import * as tenantController from "../controllers/tenantController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const tenantRouter = Router();

tenantRouter.get("/", asyncHandler(tenantController.list));
tenantRouter.get("/:id", asyncHandler(tenantController.get));
tenantRouter.post("/", asyncHandler(tenantController.create));
tenantRouter.patch("/:id", asyncHandler(tenantController.update));
tenantRouter.delete("/:id", asyncHandler(tenantController.remove));
tenantRouter.post("/:id/link", asyncHandler(tenantController.link));
tenantRouter.delete("/:id/link", asyncHandler(tenantController.unlink));
