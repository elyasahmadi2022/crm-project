import { Router } from "express";
import { UserRole } from "../generated/prisma/index.js";
import { asyncHandler } from "../utiles/error-handler.utiles.js";
import { authenticate, authorize } from "../middleware/auth.meddleware.js";
import { marketingController } from "../controllers/marketing.controller.js";
const router = Router();
router.get("/", authenticate, asyncHandler(marketingController.getAll));
router.get("/:id", authenticate, asyncHandler(marketingController.getById));
router.post("/", authenticate, authorize(UserRole.ADMIN, UserRole.SALES), asyncHandler(marketingController.create));
router.put("/:id", authenticate, authorize(UserRole.ADMIN, UserRole.SALES), asyncHandler(marketingController.update));
router.delete("/:id", authenticate, authorize(UserRole.ADMIN), asyncHandler(marketingController.delete));
export { router as campaignRouter };
//# sourceMappingURL=marketing.route.js.map