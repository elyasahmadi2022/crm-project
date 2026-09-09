import { z } from "zod";
import { UserRole } from "../generated/prisma/index.js";
export const createuUserSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email"),
    role: z.nativeEnum(UserRole),
    password: z.string().min(6, "Password must be at least 6 characters").optional(),
    salary: z.number().optional(),
    salaryCurrency: z.string().trim().min(3).max(3).default("USD"),
    position: z.string().optional(),
    department: z.string().optional(),
    joinDate: z.string().optional(),
});
const withCounts = {
    _count: {
        select: {
            ownedLeads: true,
            ownedCustomers: true,
            projectAssignments: true,
            interactions: true
        }
    }
};
export const updateUserSchema = z.object({
    name: z.string().min(1, "Name cannot be empty").optional(),
    email: z.string().email("Invalid email layout structure").optional(),
    role: z.nativeEnum(UserRole).optional(),
    isActive: z.boolean().optional(),
    salaryCurrency: z.string().trim().min(3).max(3).optional()
});
/**
* Validates search filters and pagination queries for listing users.
*/
export const listUsersQuerySchema = z.object({
    role: z.nativeEnum(UserRole).optional(),
    isActive: z.coerce.boolean().optional()
});
// 📝 Structural schema for new account setup
export const registerSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email layout structure"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role: z.nativeEnum(UserRole)
});
// 🔑 Structural schema for user login
export const loginSchema = z.object({
    email: z.string().email("Invalid email layout structure"),
    password: z.string().min(1, "Password is required")
});
// 🔄 Structural schema for session refreshing
export const refreshSchema = z.object({
    refreshToken: z.string().min(1, "Refresh token parameter is missing")
});
export const toUserResponseDto = (user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    salary: user.salary ? Number(user.salary) : null,
    salaryCurrency: user.salaryCurrency,
    position: user.position ?? null,
    department: user.department ?? null,
    joinDate: user.joinDate ?? null,
    avatarUrl: user.avatarUrl ?? null,
    faceEmbedding: user.faceEmbedding ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    workload: {
        ownedLeadsCount: user._count?.ownedLeads ?? 0,
        ownedCustomersCount: user._count?.ownedCustomers ?? 0,
        assignedProjectsCount: user._count?.projectAssignments ?? 0,
        interactionsCount: user._count?.interactions ?? 0,
    },
});
// 🔀 DTO Data transformer
export const toUserSummaryDto = (user) => ({
    id: user.id,
    name: user.name,
    role: user.role,
});
// -------------------------------------------------------
// Password reset / OTP flow
// -------------------------------------------------------
/** Step 1 — user provides their email to trigger an OTP */
export const forgotPasswordSchema = z.object({
    email: z.string().email("Please provide a valid email address."),
});
/** Step 2 — user provides email + the OTP they received */
export const verifyOtpSchema = z.object({
    email: z.string().email("Please provide a valid email address."),
    otp: z
        .string()
        .length(6, "OTP must be exactly 6 digits.")
        .regex(/^\d{6}$/, "OTP must contain only digits."),
});
/** Step 3 — user sets their new password (requires prior OTP verification) */
export const resetPasswordSchema = z.object({
    resetToken: z.string().min(1, "Reset token is required."),
    newPassword: z
        .string()
        .min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
});
/** Change password while already logged in */
export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z
        .string()
        .min(8, "New password must be at least 8 characters.")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
        .regex(/[0-9]/, "Password must contain at least one number."),
    confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
}).refine((d) => d.currentPassword !== d.newPassword, {
    message: "New password must be different from the current password.",
    path: ["newPassword"],
});
/** Update own profile (name only — email/role changes go through admin) */
export const updateProfileSchema = z.object({
    name: z.string().min(1, "Name cannot be empty.").optional(),
});
//# sourceMappingURL=user.dto.js.map