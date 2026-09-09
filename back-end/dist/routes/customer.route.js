import { Router } from "express";
import { UserRole } from "../generated/prisma/index.js";
import { asyncHandler } from "../utiles/error-handler.utiles.js";
import { authenticate, authorize } from "../middleware/auth.meddleware.js";
import { customerController } from "../controllers/customer.controller.js";
const router = Router();
// Read — any authenticated user; write — ADMIN or SALES only
router.get("/", authenticate, asyncHandler(customerController.getAll));
router.get("/:id", authenticate, asyncHandler(customerController.getById));
router.post("/", authenticate, authorize(UserRole.ADMIN, UserRole.SALES), asyncHandler(customerController.create));
router.put("/:id", authenticate, authorize(UserRole.ADMIN, UserRole.SALES), asyncHandler(customerController.update));
router.delete("/:id", authenticate, authorize(UserRole.ADMIN), asyncHandler(customerController.delete));
// Contact sub-resource
router.post("/:id/contacts", authenticate, authorize(UserRole.ADMIN, UserRole.SALES), asyncHandler(customerController.addContact));
router.put("/contacts/:contactId", authenticate, authorize(UserRole.ADMIN, UserRole.SALES), asyncHandler(customerController.updateContact));
router.delete("/contacts/:contactId", authenticate, authorize(UserRole.ADMIN), asyncHandler(customerController.deleteContact));
export { router as customerRouter };
//# sourceMappingURL=customer.route.js.map