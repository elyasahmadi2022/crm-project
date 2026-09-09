import { Router } from "express";
import { UserRole } from "../generated/prisma/index.js";
import { asyncHandler } from "../utiles/error-handler.utiles.js";
import { authenticate, authorize } from "../middleware/auth.meddleware.js";
import { expenseCategoryController } from "../controllers/expense-category.controller.js";

const router = Router();

// Read — any authenticated user (needed in expenses form + category badge)
router.get("/",    authenticate, asyncHandler(expenseCategoryController.getAll));
router.get("/:id", authenticate, asyncHandler(expenseCategoryController.getById));

// Write — ADMIN only
router.post("/",    authenticate, authorize(UserRole.ADMIN), asyncHandler(expenseCategoryController.create));
router.patch("/:id", authenticate, authorize(UserRole.ADMIN), asyncHandler(expenseCategoryController.update));
router.delete("/:id", authenticate, authorize(UserRole.ADMIN), asyncHandler(expenseCategoryController.delete));

export { router as expenseCategoryRouter };
