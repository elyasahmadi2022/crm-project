import { Router } from "express";
import { UserRole } from "../generated/prisma/index.js";
import { asyncHandler } from "../utiles/error-handler.utiles.js";
import { authenticate, authorize } from "../middleware/auth.meddleware.js";
import { projectController } from "../controllers/project.controller.js";
const router = Router();
// Read — any authenticated user; mutations — ADMIN only; team ops — ADMIN or team leads
router.get("/", authenticate, asyncHandler(projectController.getAll));
router.get("/:id", authenticate, asyncHandler(projectController.getById));
router.post("/", authenticate, authorize(UserRole.ADMIN), asyncHandler(projectController.create));
router.put("/:id", authenticate, authorize(UserRole.ADMIN), asyncHandler(projectController.update));
router.patch("/:id/stage", authenticate, authorize(UserRole.ADMIN), asyncHandler(projectController.changeStage));
router.post("/:id/milestones", authenticate, authorize(UserRole.ADMIN, UserRole.DEVELOPER, UserRole.DESIGNER), asyncHandler(projectController.addMilestone));
router.put("/milestones/:id", authenticate, authorize(UserRole.ADMIN, UserRole.DEVELOPER, UserRole.DESIGNER), asyncHandler(projectController.updateMilestone));
router.post("/:id/team", authenticate, authorize(UserRole.ADMIN), asyncHandler(projectController.assignTeamMember));
router.delete("/:id/team/:employeeId", authenticate, authorize(UserRole.ADMIN), asyncHandler(projectController.unassignTeamMember));
router.delete("/:id", authenticate, authorize(UserRole.ADMIN), asyncHandler(projectController.deleteProject));
export { router as projectRouter };
//# sourceMappingURL=project.route.js.map