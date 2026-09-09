import path from "path";
import { authService } from "../services/auth.service.js";
import { registerSchema, loginSchema, forgotPasswordSchema, verifyOtpSchema, resetPasswordSchema, changePasswordSchema, updateProfileSchema, } from "../dtos/user.dto.js";
import { asyncHandler, AppError } from "../utiles/error-handler.utiles.js";
import { sendSuccess, sendError } from "../utiles/api-response.utiles.js";
const formatZodIssues = (issues) => issues.map((e) => (e.path.length ? `${e.path.map(String).join(".")}: ${e.message}` : e.message));
const REFRESH_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days — matches JWT expiry
    path: "/api/v1/auth",
};
const setRefreshCookie = (res, token) => res.cookie("refreshToken", token, REFRESH_COOKIE_OPTIONS);
const clearRefreshCookie = (res) => res.clearCookie("refreshToken", { ...REFRESH_COOKIE_OPTIONS, maxAge: undefined });
// -------------------------------------------------------
// Handlers
// -------------------------------------------------------
export const authController = {
    // POST /api/v1/auth/register
    register: asyncHandler(async (req, res) => {
        const parsed = registerSchema.safeParse(req.body);
        if (!parsed.success) {
            sendError(res, 400, "Validation failed. Please check your input.", formatZodIssues(parsed.error.issues));
            return;
        }
        const { accessToken, refreshToken, user } = await authService.register(parsed.data);
        setRefreshCookie(res, refreshToken);
        sendSuccess(res, { accessToken, user }, 201);
    }),
    // POST /api/v1/auth/login
    login: asyncHandler(async (req, res) => {
        const parsed = loginSchema.safeParse(req.body);
        console.log(parsed);
        if (!parsed.success) {
            sendError(res, 400, "Validation failed. Please check your input.", formatZodIssues(parsed.error.issues));
            return;
        }
        const { accessToken, refreshToken, user } = await authService.login(parsed.data);
        setRefreshCookie(res, refreshToken);
        sendSuccess(res, { accessToken, user }, 200);
    }),
    // POST /api/v1/auth/refresh  — reads cookie, no body needed
    refresh: asyncHandler(async (req, res) => {
        const tokenFromCookie = req.cookies?.refreshToken;
        if (!tokenFromCookie)
            throw new AppError(401, "No refresh token found. Please log in again.");
        const { accessToken, refreshToken } = await authService.refreshSession(tokenFromCookie);
        setRefreshCookie(res, refreshToken);
        sendSuccess(res, { accessToken }, 200);
    }),
    // POST /api/v1/auth/logout
    logout: asyncHandler(async (_req, res) => {
        clearRefreshCookie(res);
        sendSuccess(res, { message: "Logged out successfully." }, 200);
    }),
    // -------------------------------------------------------
    // Password reset flow (3 steps — public, no auth required)
    // -------------------------------------------------------
    // POST /api/v1/auth/forgot-password
    // Body: { email }
    forgotPassword: asyncHandler(async (req, res) => {
        const parsed = forgotPasswordSchema.safeParse(req.body);
        if (!parsed.success) {
            sendError(res, 400, "Validation failed.", formatZodIssues(parsed.error.issues));
            return;
        }
        // Always returns 200 — never reveal whether the email exists
        await authService.forgotPassword(parsed.data);
        sendSuccess(res, {
            message: "If an account with that email exists, a 6-digit reset code has been sent."
        }, 200);
    }),
    // POST /api/v1/auth/verify-otp
    // Body: { email, otp }
    // Returns a short-lived resetToken the client must use in the next step
    verifyOtp: asyncHandler(async (req, res) => {
        const parsed = verifyOtpSchema.safeParse(req.body);
        if (!parsed.success) {
            sendError(res, 400, "Validation failed.", formatZodIssues(parsed.error.issues));
            return;
        }
        const result = await authService.verifyOtp(parsed.data.email, parsed.data.otp);
        sendSuccess(res, {
            resetToken: result.resetToken,
            message: "OTP verified. Use the resetToken to set your new password."
        }, 200);
    }),
    // POST /api/v1/auth/reset-password
    // Body: { email, otp, newPassword, confirmPassword }
    resetPassword: asyncHandler(async (req, res) => {
        const parsed = resetPasswordSchema.safeParse(req.body);
        if (!parsed.success) {
            sendError(res, 400, "Validation failed.", formatZodIssues(parsed.error.issues));
            return;
        }
        await authService.resetPassword(parsed.data);
        sendSuccess(res, { message: "Password reset successfully. You can now log in with your new password." }, 200);
    }),
    // -------------------------------------------------------
    // Authenticated routes (require Bearer token)
    // -------------------------------------------------------
    // GET /api/v1/auth/me
    getMe: asyncHandler(async (req, res) => {
        const profile = await authService.getMyProfile(req.user.id);
        sendSuccess(res, profile, 200);
    }),
    // PATCH /api/v1/auth/me
    // Body: { name? }
    updateProfile: asyncHandler(async (req, res) => {
        const parsed = updateProfileSchema.safeParse(req.body);
        if (!parsed.success) {
            sendError(res, 400, "Validation failed.", formatZodIssues(parsed.error.issues));
            return;
        }
        const profile = await authService.updateProfile(req.user.id, parsed.data);
        sendSuccess(res, profile, 200);
    }),
    // POST /api/v1/auth/me/avatar
    // multipart/form-data, field name: "avatar"
    uploadAvatar: asyncHandler(async (req, res) => {
        if (!req.file) {
            throw new AppError(400, "No image file was uploaded. Please attach a file using the 'avatar' field.");
        }
        // Build a public URL the front-end can use directly
        const BACKEND_URL = process.env.BACKEND_URL ?? `http://localhost:${process.env.PORT ?? 4444}`;
        const relativePath = req.file.path.replace(/\\/g, "/"); // normalise Windows paths
        const avatarUrl = `${BACKEND_URL}/${relativePath}`;
        const profile = await authService.updateAvatar(req.user.id, avatarUrl);
        sendSuccess(res, profile, 200);
    }),
    // DELETE /api/v1/auth/me/avatar  — remove avatar, revert to null
    deleteAvatar: asyncHandler(async (req, res) => {
        const { default: fs } = await import("fs/promises");
        const user = await authService.getMyProfile(req.user.id);
        // Delete the file from disk if it was stored locally
        if (user.avatarUrl) {
            try {
                const BACKEND_URL = process.env.BACKEND_URL ?? `http://localhost:${process.env.PORT ?? 4444}`;
                const filePath = user.avatarUrl.replace(BACKEND_URL + "/", "");
                await fs.unlink(filePath);
            }
            catch {
                // File may already be gone — not a fatal error
            }
        }
        const profile = await authService.updateAvatar(req.user.id, "");
        sendSuccess(res, { ...profile, avatarUrl: null }, 200);
    }),
    // POST /api/v1/auth/change-password
    // Body: { currentPassword, newPassword, confirmPassword }
    changePassword: asyncHandler(async (req, res) => {
        const parsed = changePasswordSchema.safeParse(req.body);
        if (!parsed.success) {
            sendError(res, 400, "Validation failed.", formatZodIssues(parsed.error.issues));
            return;
        }
        await authService.changePassword(req.user.id, parsed.data);
        sendSuccess(res, { message: "Password changed successfully." }, 200);
    }),
};
//# sourceMappingURL=auth.controller.js.map