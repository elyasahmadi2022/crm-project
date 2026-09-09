import { userRepository } from "../repositories/user.repository.js";
import {
    type RegisterDto,
    type LoginDto,
    type TokenKeyPairDto,
    type ForgotPasswordDto,
    type ResetPasswordDto,
    type ChangePasswordDto,
    type UpdateProfileDto,
    type ProfileResponseDto,
    toUserSummaryDto,
} from "../dtos/user.dto.js";
import { type User, UserRole } from "../generated/prisma/index.js";
import { AppError } from "../utiles/error-handler.utiles.js";
import { otpService } from "./otp.service.js";
import { emailService } from "./email.service.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Crash at startup if secrets are missing
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
if (!ACCESS_SECRET) throw new Error("Missing required env var: JWT_ACCESS_SECRET");
if (!REFRESH_SECRET) throw new Error("Missing required env var: JWT_REFRESH_SECRET");

/** Map a Prisma User record to the public-facing ProfileResponseDto */
function toProfileDto(user: User): ProfileResponseDto {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        forcePasswordChange: user.forcePasswordChange ?? false,
        updatedAt: user.updatedAt,
    };
}

export interface AuthInternalResult {
    accessToken: string;
    refreshToken: string;
    user: { id: number; name: string; role: UserRole };
}

export const authService = {
    // -------------------------------------------------------
    // Token helpers
    // -------------------------------------------------------
    generateTokenSet: (id: number, role: UserRole): TokenKeyPairDto => {
        const payload = { id, role };
        const accessToken = jwt.sign(payload, ACCESS_SECRET, { expiresIn: "15m" });
        const refreshToken = jwt.sign(payload, REFRESH_SECRET, { expiresIn: "7d" });
        return { accessToken, refreshToken };
    },

    // -------------------------------------------------------
    // Core auth
    // -------------------------------------------------------
    register: async (dto: RegisterDto): Promise<AuthInternalResult> => {
        const existingUser = await userRepository.findByEmail(dto.email);
        if (existingUser) throw new AppError(409, "This email address is already registered.");

        const hashedPassword = await bcrypt.hash(dto.password, 10);
        const createdUser = await userRepository.create({
            name: dto.name,
            email: dto.email,
            password: hashedPassword,
            role: dto.role,
        });

        const tokens = authService.generateTokenSet(createdUser.id, createdUser.role);
        return { ...tokens, user: toUserSummaryDto(createdUser) };
    },

    login: async (dto: LoginDto): Promise<AuthInternalResult> => {
        const user = await userRepository.findByEmail(dto.email);
        if (!user || !user.isActive) {
            throw new AppError(401, "Invalid credentials, or your account has been deactivated.");
        }

        const isPasswordValid = await bcrypt.compare(dto.password, user.password);
        if (!isPasswordValid) throw new AppError(401, "Invalid credentials.");

        const tokens = authService.generateTokenSet(user.id, user.role);
        return { ...tokens, user: toUserSummaryDto(user) };
    },

    refreshSession: async (oldRefreshToken: string): Promise<TokenKeyPairDto> => {
        let decoded: { id: number; role: UserRole };
        try {
            decoded = jwt.verify(oldRefreshToken, REFRESH_SECRET) as { id: number; role: UserRole };
        } catch {
            throw new AppError(401, "Your session has expired. Please log in again.");
        }

        const user = await userRepository.findById(decoded.id);
        if (!user || !user.isActive) {
            throw new AppError(401, "The account associated with this session no longer exists or has been deactivated.");
        }

        return authService.generateTokenSet(user.id, user.role);
    },

    // -------------------------------------------------------
    // Forgot password — Step 1: send OTP
    // -------------------------------------------------------
    forgotPassword: async (dto: ForgotPasswordDto): Promise<void> => {
        const user = await userRepository.findByEmail(dto.email);

        // Return a clear error if the email is not registered or the account is inactive
        if (!user) {
            throw new AppError(404, "No account found with that email address.");
        }
        if (!user.isActive) {
            throw new AppError(403, "This account is inactive. Please contact an administrator.");
        }

        const otp = await otpService.generateAndStore(user.id);
        await emailService.sendOtpEmail(user.email, user.name, otp);
    },

    // -------------------------------------------------------
    // Forgot password — Step 2: verify OTP only (no password change yet)
    // Returns a short-lived "reset token" the client must send in Step 3.
    // -------------------------------------------------------
    verifyOtp: async (email: string, otp: string): Promise<{ resetToken: string }> => {
        const user = await userRepository.findByEmail(email);
        if (!user || !user.isActive) {
            throw new AppError(400, "The OTP is invalid or has expired. Please request a new one.");
        }

        await otpService.verify(user.id, otp);

        // Issue a short-lived single-use token signed with the access secret.
        // The front-end sends this as a Bearer token when submitting the new password.
        const resetToken = jwt.sign(
            { id: user.id, purpose: "PASSWORD_RESET" },
            ACCESS_SECRET,
            { expiresIn: "15m" }
        );

        return { resetToken };
    },

    // -------------------------------------------------------
    // Forgot password — Step 3: set new password using reset token
    // -------------------------------------------------------
    resetPassword: async (dto: ResetPasswordDto): Promise<void> => {
        // Validate the resetToken issued in Step 2 — this is the proof OTP was verified.
        // No need to re-verify the OTP (it was already consumed in Step 2).
        let userId: number;
        try {
            const decoded = jwt.verify(dto.resetToken, ACCESS_SECRET) as { id: number; purpose: string };
            if (decoded.purpose !== "PASSWORD_RESET") {
                throw new AppError(400, "Invalid reset token.");
            }
            userId = decoded.id;
        } catch {
            throw new AppError(400, "The reset token is invalid or has expired. Please request a new code.");
        }

        const user = await userRepository.findById(userId);
        if (!user || !user.isActive) {
            throw new AppError(400, "Account not found or inactive.");
        }

        const hashed = await bcrypt.hash(dto.newPassword, 10);
        await userRepository.updatePassword(user.id, hashed);
        await otpService.invalidateAll(user.id);
    },

    // -------------------------------------------------------
    // Change password (logged-in user)
    // -------------------------------------------------------
    changePassword: async (userId: number, dto: ChangePasswordDto): Promise<void> => {
        const user = await userRepository.findById(userId);
        if (!user) throw new AppError(404, "User not found.");

        const isCurrentValid = await bcrypt.compare(dto.currentPassword, user.password);
        if (!isCurrentValid) throw new AppError(401, "Current password is incorrect.");

        const hashed = await bcrypt.hash(dto.newPassword, 10);
        await userRepository.updatePassword(user.id, hashed);
    },

    // -------------------------------------------------------
    // Update own profile (name)
    // -------------------------------------------------------
    updateProfile: async (userId: number, dto: UpdateProfileDto): Promise<ProfileResponseDto> => {
        const user = await userRepository.findById(userId);
        if (!user) throw new AppError(404, "User not found.");

        const updated = await userRepository.updateProfile(userId, {
            ...(dto.name !== undefined ? { name: dto.name } : {}),
        });

        return toProfileDto(updated);
    },

    // -------------------------------------------------------
    // Upload / update avatar
    // -------------------------------------------------------
    updateAvatar: async (userId: number, avatarUrl: string): Promise<ProfileResponseDto> => {
        const user = await userRepository.findById(userId);
        if (!user) throw new AppError(404, "User not found.");

        const updated = await userRepository.updateAvatar(userId, avatarUrl);
        return toProfileDto(updated);
    },

    // -------------------------------------------------------
    // Get own profile
    // -------------------------------------------------------
    getMyProfile: async (userId: number): Promise<ProfileResponseDto> => {
        const user = await userRepository.findById(userId);
        if (!user) throw new AppError(404, "User not found.");
        return toProfileDto(user);
    },
};
