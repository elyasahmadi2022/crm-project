import { Router } from "express";
import { UserRole } from "../generated/prisma/index.js";
import { asyncHandler } from "../utiles/error-handler.utiles.js";
import { authenticate, authorize } from "../middleware/auth.meddleware.js";
import { leadController } from "../controllers/lead.controller.js";
const router = Router();
router.get("/", authenticate, asyncHandler(leadController.getAll));
router.get("/:id", authenticate, asyncHandler(leadController.getById));
router.post("/", authenticate, authorize(UserRole.ADMIN, UserRole.SALES), asyncHandler(leadController.create));
router.put("/:id", authenticate, authorize(UserRole.ADMIN, UserRole.SALES), asyncHandler(leadController.update));
router.patch("/:id/status", authenticate, authorize(UserRole.ADMIN, UserRole.SALES), asyncHandler(leadController.changeStatus));
router.post("/:id/notes", authenticate, asyncHandler(leadController.addNote));
router.post("/:id/convert", authenticate, authorize(UserRole.ADMIN, UserRole.SALES), asyncHandler(leadController.convertToCustomer));
router.delete("/:id", authenticate, authorize(UserRole.ADMIN), asyncHandler(leadController.delete));
export { router as leadRouter };
//# sourceMappingURL=lead.route.js.map