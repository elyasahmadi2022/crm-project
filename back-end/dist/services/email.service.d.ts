export declare const emailService: {
    /**
     * Send the OTP to the user's email address.
     *
     * ROUTING:
     *   - Production  → real SMTP (SendGrid, SES, Postmark…) → lands in user's real inbox
     *   - Dev + Mailtrap credentials → Mailtrap captures it so you can inspect it safely
     *   - Dev + no credentials → OTP is printed to the server console (no SMTP needed)
     */
    sendOtpEmail: (toEmail: string, userName: string, otp: string) => Promise<void>;
};
//# sourceMappingURL=email.service.d.ts.map