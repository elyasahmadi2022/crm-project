import { Router } from "express";
import { authController } from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.meddleware.js";
import { uploadAvatar } from "../middleware/upload.middleware.js";

const authRouter = Router();

// -------------------------------------------------------
// Public — no token required
// -------------------------------------------------------
authRouter.post("/register",        authController.register);
authRouter.post("/login",           authController.login);
authRouter.post("/refresh",         authController.refresh);   // reads HttpOnly cookie
authRouter.post("/logout",          authController.logout);

// Password reset (3-step flow)
authRouter.post("/forgot-password", authController.forgotPassword);  // Step 1 — send OTP
authRouter.post("/verify-otp",      authController.verifyOtp);       // Step 2 — validate OTP, get resetToken
authRouter.post("/reset-password",  authController.resetPassword);   // Step 3 — set new password

// -------------------------------------------------------
// Protected — valid access token required
// -------------------------------------------------------
authRouter.get("/me",               authenticate, authController.getMe);
authRouter.patch("/me",             authenticate, authController.updateProfile);
authRouter.post("/me/avatar",       authenticate, uploadAvatar, authController.uploadAvatar);
authRouter.delete("/me/avatar",     authenticate, authController.deleteAvatar);
authRouter.post("/change-password", authenticate, authController.changePassword);

export default authRouter;
