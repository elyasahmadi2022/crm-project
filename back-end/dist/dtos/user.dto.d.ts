import { z } from "zod";
import { UserRole, type User, type Prisma } from "../generated/prisma/index.js";
export declare const createuUserSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    role: z.ZodEnum<{
        ADMIN: 'ADMIN';
        SALES: 'SALES';
        DEVELOPER: 'DEVELOPER';
        DESIGNER: 'DESIGNER';
        FINANCE: 'FINANCE';
        EMPLOYEE: 'EMPLOYEE';
    }>;
    password: z.ZodOptional<z.ZodString>;
    salary: z.ZodOptional<z.ZodNumber>;
    salaryCurrency: z.ZodDefault<z.ZodString>;
    position: z.ZodOptional<z.ZodString>;
    department: z.ZodOptional<z.ZodString>;
    joinDate: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type CreateUserDto = z.infer<typeof createuUserSchema>;
declare const withCounts: {
    _count: {
        select: {
            ownedLeads: true;
            ownedCustomers: true;
            projectAssignments: true;
            interactions: true;
        };
    };
};
export type UserWithCounts = Prisma.UserGetPayload<{
    include: typeof withCounts;
}>;
export declare const updateUserSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodEnum<{
        ADMIN: 'ADMIN';
        SALES: 'SALES';
        DEVELOPER: 'DEVELOPER';
        DESIGNER: 'DESIGNER';
        FINANCE: 'FINANCE';
        EMPLOYEE: 'EMPLOYEE';
    }>>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    salaryCurrency: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;
/**
* Validates search filters and pagination queries for listing users.
*/
export declare const listUsersQuerySchema: z.ZodObject<{
    role: z.ZodOptional<z.ZodEnum<{
        ADMIN: 'ADMIN';
        SALES: 'SALES';
        DEVELOPER: 'DEVELOPER';
        DESIGNER: 'DESIGNER';
        FINANCE: 'FINANCE';
        EMPLOYEE: 'EMPLOYEE';
    }>>;
    isActive: z.ZodOptional<z.ZodCoercedBoolean<unknown>>;
}, z.core.$strip>;
export type ListUsersQueryDto = z.infer<typeof listUsersQuerySchema>;
export declare const registerSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    role: z.ZodEnum<{
        ADMIN: 'ADMIN';
        SALES: 'SALES';
        DEVELOPER: 'DEVELOPER';
        DESIGNER: 'DESIGNER';
        FINANCE: 'FINANCE';
        EMPLOYEE: 'EMPLOYEE';
    }>;
}, z.core.$strip>;
export type RegisterDto = z.infer<typeof registerSchema>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export type LoginDto = z.infer<typeof loginSchema>;
export declare const refreshSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, z.core.$strip>;
export type RefreshDto = z.infer<typeof refreshSchema>;
export interface UserSummaryDto {
    id: number;
    name: string;
    role: UserRole;
}
export interface AuthResponseDto {
    accessToken: string;
    user: UserSummaryDto;
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
    salaryCurrency: string;
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
export declare const toUserResponseDto: (user: UserWithCounts) => UserResponseDto;
export declare const toUserSummaryDto: (user: User) => UserSummaryDto;
/** Step 1 — user provides their email to trigger an OTP */
export declare const forgotPasswordSchema: z.ZodObject<{
    email: z.ZodString;
}, z.core.$strip>;
export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>;
/** Step 2 — user provides email + the OTP they received */
export declare const verifyOtpSchema: z.ZodObject<{
    email: z.ZodString;
    otp: z.ZodString;
}, z.core.$strip>;
export type VerifyOtpDto = z.infer<typeof verifyOtpSchema>;
/** Step 3 — user sets their new password (requires prior OTP verification) */
export declare const resetPasswordSchema: z.ZodObject<{
    resetToken: z.ZodString;
    newPassword: z.ZodString;
    confirmPassword: z.ZodString;
}, z.core.$strip>;
export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;
/** Change password while already logged in */
export declare const changePasswordSchema: z.ZodObject<{
    currentPassword: z.ZodString;
    newPassword: z.ZodString;
    confirmPassword: z.ZodString;
}, z.core.$strip>;
export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;
/** Update own profile (name only — email/role changes go through admin) */
export declare const updateProfileSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
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
export {};
//# sourceMappingURL=user.dto.d.ts.map