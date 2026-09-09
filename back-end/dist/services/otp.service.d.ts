export declare const otpService: {
    /**
     * Generate a 6-digit OTP, hash it, persist it, and return the plain-text
     * code so the caller can pass it to the email service.
     *
     * Any previous unused OTPs for the same user+purpose are invalidated first
     * so a user can't accumulate valid codes.
     */
    generateAndStore: (userId: number) => Promise<string>;
    /**
     * Verify a plain-text OTP against the most recent stored hash.
     * On success, marks the code as used and returns the userId.
     * On failure, throws a descriptive AppError.
     */
    verify: (userId: number, plainCode: string) => Promise<void>;
    /**
     * Invalidate all OTPs for a user (called after a successful password reset
     * to ensure no stale codes remain).
     */
    invalidateAll: (userId: number) => Promise<void>;
};
//# sourceMappingURL=otp.service.d.ts.map