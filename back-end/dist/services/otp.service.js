import bcrypt from "bcryptjs";
import { prisma } from "../lib/primsa.js";
import { AppError } from "../utiles/error-handler.utiles.js";
const OTP_PURPOSE_RESET = "RESET_PASSWORD";
const OTP_TTL_MINUTES = 10;
export const otpService = {
    /**
     * Generate a 6-digit OTP, hash it, persist it, and return the plain-text
     * code so the caller can pass it to the email service.
     *
     * Any previous unused OTPs for the same user+purpose are invalidated first
     * so a user can't accumulate valid codes.
     */
    generateAndStore: async (userId) => {
        // Invalidate previous codes for this user
        await prisma.otpCode.updateMany({
            where: { userId, purpose: OTP_PURPOSE_RESET, usedAt: null },
            data: { usedAt: new Date() },
        });
        // Generate a cryptographically random 6-digit code
        const plain = String(Math.floor(100000 + Math.random() * 900000));
        const hashed = await bcrypt.hash(plain, 10);
        const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
        await prisma.otpCode.create({
            data: {
                userId,
                code: hashed,
                purpose: OTP_PURPOSE_RESET,
                expiresAt,
            },
        });
        return plain;
    },
    /**
     * Verify a plain-text OTP against the most recent stored hash.
     * On success, marks the code as used and returns the userId.
     * On failure, throws a descriptive AppError.
     */
    verify: async (userId, plainCode) => {
        // Get the most recent unused code for this user
        const record = await prisma.otpCode.findFirst({
            where: {
                userId,
                purpose: OTP_PURPOSE_RESET,
                usedAt: null,
                expiresAt: { gt: new Date() }, // not expired
            },
            orderBy: { createdAt: "desc" },
        });
        if (!record) {
            throw new AppError(400, "The OTP is invalid or has expired. Please request a new one.");
        }
        const isMatch = await bcrypt.compare(plainCode, record.code);
        if (!isMatch) {
            throw new AppError(400, "Incorrect OTP code. Please try again.");
        }
        // Mark as used so it cannot be replayed
        await prisma.otpCode.update({
            where: { id: record.id },
            data: { usedAt: new Date() },
        });
    },
    /**
     * Invalidate all OTPs for a user (called after a successful password reset
     * to ensure no stale codes remain).
     */
    invalidateAll: async (userId) => {
        await prisma.otpCode.updateMany({
            where: { userId, purpose: OTP_PURPOSE_RESET, usedAt: null },
            data: { usedAt: new Date() },
        });
    },
};
//# sourceMappingURL=otp.service.js.map