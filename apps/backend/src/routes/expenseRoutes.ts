import { Router } from "express";
import * as expenseController from "../controllers/expenseController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const expenseRouter = Router();

expenseRouter.get("/", asyncHandler(expenseController.list));
expenseRouter.post("/", asyncHandler(expenseController.create));
expenseRouter.patch("/:id", asyncHandler(expenseController.update));
expenseRouter.delete("/:id", asyncHandler(expenseController.remove));
