import { Router } from "express";
import { UserRole } from "../generated/prisma/index.js";
import { asyncHandler } from "../utiles/error-handler.utiles.js";
import { authenticate, authorize } from "../middleware/auth.meddleware.js";
import { userController } from "../controllers/user.controller.js";

const userRouter = Router();

// All user-management routes require a valid session and ADMIN role
userRouter.get("/", authenticate, authorize(UserRole.ADMIN), asyncHandler(userController.getAll));
userRouter.get("/:id", authenticate, authorize(UserRole.ADMIN), asyncHandler(userController.getProfile));
userRouter.post("/", authenticate, authorize(UserRole.ADMIN), asyncHandler(userController.create));
userRouter.put("/:id", authenticate, authorize(UserRole.ADMIN), asyncHandler(userController.update));
userRouter.delete("/:id", authenticate, authorize(UserRole.ADMIN), asyncHandler(userController.delete));
userRouter.post("/:id/register-face", authenticate, authorize(UserRole.ADMIN), asyncHandler(userController.registerFace));

export default userRouter;
