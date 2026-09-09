import nodemailer, {} from "nodemailer";
// In development with no mail credentials, OTPs are printed to the console
// so you can test the reset flow without any SMTP setup.
const MAIL_HOST = process.env.MAIL_HOST;
const MAIL_PORT = parseInt(process.env.MAIL_PORT ?? "587", 10);
const MAIL_USER = process.env.MAIL_USER;
const MAIL_PASS = process.env.MAIL_PASS;
const MAIL_FROM = process.env.MAIL_FROM ?? `"Luilala CRM" <noreply@luilala.com>`;
const IS_DEV = process.env.NODE_ENV !== "production";
// Only crash on missing mail config in production — dev can rely on console logging
if (!IS_DEV) {
    if (!MAIL_HOST)
        throw new Error("Missing required env var: MAIL_HOST");
    if (!MAIL_USER)
        throw new Error("Missing required env var: MAIL_USER");
    if (!MAIL_PASS)
        throw new Error("Missing required env var: MAIL_PASS");
}
let transporter = null;
function getTransporter() {
    // If mail credentials are not configured, return null — caller will fall back to console log
    if (!MAIL_HOST || !MAIL_USER || !MAIL_PASS)
        return null;
    if (!transporter) {
        transporter = nodemailer.createTransport({
            host: MAIL_HOST,
            port: MAIL_PORT,
            // port 465 = implicit TLS; anything else = STARTTLS upgrade
            secure: MAIL_PORT === 465,
            auth: { user: MAIL_USER, pass: MAIL_PASS },
        });
    }
    return transporter;
}
export const emailService = {
    /**
     * Send the OTP to the user's email address.
     *
     * ROUTING:
     *   - Production  → real SMTP (SendGrid, SES, Postmark…) → lands in user's real inbox
     *   - Dev + Mailtrap credentials → Mailtrap captures it so you can inspect it safely
     *   - Dev + no credentials → OTP is printed to the server console (no SMTP needed)
     */
    sendOtpEmail: async (toEmail, userName, otp) => {
        const transport = getTransporter();
        // No SMTP configured — print to console so dev can still test the flow
        if (!transport) {
            console.log("\n========================================");
            console.log(`[DEV] Password reset OTP for ${toEmail}`);
            console.log(`[DEV] OTP code: ${otp}`);
            console.log("========================================\n");
            return;
        }
        await transport.sendMail({
            from: MAIL_FROM,
            to: toEmail,
            subject: "Your password reset code — Luilala CRM",
            text: [
                `Hi ${userName},`,
                ``,
                `You requested a password reset for your Luilala CRM account.`,
                ``,
                `Your one-time code is:  ${otp}`,
                ``,
                `This code is valid for 10 minutes. Do not share it with anyone.`,
                ``,
                `If you did not request this, you can safely ignore this email.`,
                `Your password will not change until you use the code above.`,
                ``,
                `— The Luilala Team`,
            ].join("\n"),
            html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset Code</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f1f5f9;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Top accent bar -->
          <tr>
            <td style="background:linear-gradient(135deg,#1d4ed8 0%,#2563eb 100%);height:4px;"></td>
          </tr>

          <!-- Logo / Brand -->
          <tr>
            <td style="padding:32px 40px 24px;text-align:center;border-bottom:1px solid #f1f5f9;">
              <span style="font-size:22px;font-weight:800;color:#1d4ed8;letter-spacing:-0.5px;">Luilala</span>
              <span style="font-size:22px;font-weight:400;color:#64748b;"> CRM</span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 8px;font-size:13px;font-weight:600;letter-spacing:0.08em;color:#64748b;text-transform:uppercase;">Password Reset</p>
              <h1 style="margin:0 0 16px;font-size:26px;font-weight:700;color:#0f172a;line-height:1.2;">Your reset code</h1>
              <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:#475569;">
                Hi <strong style="color:#0f172a;">${userName}</strong>,<br>
                We received a request to reset the password for your account associated with
                <strong style="color:#0f172a;">${toEmail}</strong>.
                Use the code below — it expires in <strong style="color:#0f172a;">10 minutes</strong>.
              </p>

              <!-- OTP box -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <div style="display:inline-block;background:#eff6ff;border:2px solid #bfdbfe;border-radius:12px;padding:20px 40px;">
                      <p style="margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:0.1em;color:#3b82f6;text-transform:uppercase;">One-time code</p>
                      <p style="margin:0;font-size:42px;font-weight:800;letter-spacing:14px;color:#1d4ed8;line-height:1;">${otp}</p>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Steps -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f8fafc;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
                <tr>
                  <td>
                    <p style="margin:0 0 10px;font-size:13px;font-weight:600;color:#0f172a;">What to do next:</p>
                    <p style="margin:0 0 6px;font-size:13px;color:#475569;">1. Go back to the Luilala CRM reset page</p>
                    <p style="margin:0 0 6px;font-size:13px;color:#475569;">2. Enter the 6-digit code above</p>
                    <p style="margin:0;font-size:13px;color:#475569;">3. Create your new password</p>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:13px;line-height:1.6;color:#94a3b8;">
                If you didn&rsquo;t request a password reset, no action is needed &mdash; your account is safe and your password remains unchanged.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;">
              <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;line-height:1.6;">
                &copy; ${new Date().getFullYear()} Luilala CRM &nbsp;&bull;&nbsp; This is an automated message &mdash; please do not reply.<br>
                <span style="color:#cbd5e1;">For security, never share this code with anyone.</span>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
        });
    },
};
//# sourceMappingURL=email.service.js.map