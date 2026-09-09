import { z } from "zod";
import { UserRole, type User, type Prisma } from "../generated/prisma/index.js";


export const createuUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  role: z.nativeEnum(UserRole),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  salary: z.number().optional(),
  position: z.string().optional(),
  department: z.string().optional(),
  joinDate: z.string().optional(),
});
export type CreateUserDto = z.infer<typeof createuUserSchema>;
const withCounts = {
  _count: {
      select: {
          ownedLeads: true,
          ownedCustomers: true,
          projectAssignments: true,
          interactions: true
      }
  }
} satisfies Prisma.UserInclude;
// This mirrors your PrismaUserWithCounts type perfectly
export type UserWithCounts = Prisma.UserGetPayload<{ include: typeof withCounts }>;


export const updateUserSchema = z.object({
  name: z.string().min(1, "Name cannot be empty").optional(),
  email: z.string().email("Invalid email layout structure").optional(),
  role: z.nativeEnum(UserRole).optional(),
  isActive: z.boolean().optional()
});
export type UpdateUserDto = z.infer<typeof updateUserSchema>;

/**
* Validates search filters and pagination queries for listing users.
*/
export const listUsersQuerySchema = z.object({
  role: z.nativeEnum(UserRole).optional(),
  isActive: z.coerce.boolean().optional()
});
export type ListUsersQueryDto = z.infer<typeof listUsersQuerySchema>;

// 📝 Structural schema for new account setup
export const registerSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email layout structure"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role: z.nativeEnum(UserRole)
});
export type RegisterDto = z.infer<typeof registerSchema>;

// 🔑 Structural schema for user login
export const loginSchema = z.object({
    email: z.string().email("Invalid email layout structure"),
    password: z.string().min(1, "Password is required")
});
export type LoginDto = z.infer<typeof loginSchema>;

// 🔄 Structural schema for session refreshing
export const refreshSchema = z.object({
    refreshToken: z.string().min(1, "Refresh token parameter is missing")
});
export type RefreshDto = z.infer<typeof refreshSchema>;

// 🧱 Minimal output footprint interfaces
export interface UserSummaryDto {
    id: number;
    name: string;
    role: UserRole;
}

export interface AuthResponseDto {
    accessToken: string;  // ⚡ Valid for 15 minutes — send in every API request as Bearer token
    user: UserSummaryDto; // 🧑 Basic user info for the client to display
    // refreshToken is NOT returned in the body — it lives in an HttpOnly cookie
}

export interface TokenKeyPairDto {
    accessToken: string;
    refreshToken: string;
}

export interface UserResponseDto {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  salary: number | null;
  position: string | null;
  department: string | null;
  joinDate: Date | null;
  avatarUrl: string | null;
  faceEmbedding: string | null;
  createdAt: Date;
  updatedAt: Date;
  workload: {
      ownedLeadsCount: number;
      ownedCustomersCount: number;
      assignedProjectsCount: number;
      interactionsCount: number;
  };
}

export const toUserResponseDto = (user: UserWithCounts): UserResponseDto => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  isActive: user.isActive,
  salary: user.salary ? Number(user.salary) : null,
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
export const toUserSummaryDto = (user: User): UserSummaryDto => ({
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
export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>;

/** Step 2 — user provides email + the OTP they received */
export const verifyOtpSchema = z.object({
    email: z.string().email("Please provide a valid email address."),
    otp: z
        .string()
        .length(6, "OTP must be exactly 6 digits.")
        .regex(/^\d{6}$/, "OTP must contain only digits."),
});
export type VerifyOtpDto = z.infer<typeof verifyOtpSchema>;

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
export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;

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
export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;

/** Update own profile (name only — email/role changes go through admin) */
export const updateProfileSchema = z.object({
    name: z.string().min(1, "Name cannot be empty.").optional(),
});
export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;

/** Shape returned after a profile update or avatar upload */
export interface ProfileResponseDto {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    avatarUrl: string | null;
    forcePasswordChange: boolean;
    updatedAt: Date;
}
