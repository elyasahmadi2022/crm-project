"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Loader2, ShieldCheck, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { authService } from "@/services/auth.service"

const OTP_LENGTH = 6
const RESEND_SECONDS = 60

type Step = "otp" | "new-password" | "done"

export default function VerifyOtpPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const email = searchParams.get("email") ?? ""
  const mode  = searchParams.get("mode")  ?? "reset" // "reset" = password reset flow

  const [step, setStep]             = React.useState<Step>("otp")
  const [otp, setOtp]               = React.useState("")
  const [resetToken, setResetToken] = React.useState("")
  const resetTokenRef               = React.useRef("")
  const [newPassword, setNewPassword]     = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [showPw, setShowPw]       = React.useState(false)
  const [showConfirm, setShowConfirm] = React.useState(false)
  const [error, setError]         = React.useState("")
  const [loading, setLoading]     = React.useState(false)
  const [resending, setResending] = React.useState(false)
  const [countdown, setCountdown] = React.useState(RESEND_SECONDS)

  // Countdown for resend
  React.useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  // Auto-submit when all 6 digits entered
  React.useEffect(() => {
    if (otp.length === OTP_LENGTH && step === "otp" && !loading) {
      handleVerifyOtp(otp)
    }
  }, [otp])

  // ── Step 1: verify OTP ──────────────────────────────────────────────
  async function handleVerifyOtp(code = otp) {
    if (code.length < OTP_LENGTH) { setError("Please enter the full 6-digit code."); return }
    if (!email) { setError("Email missing. Please go back and try again."); return }
    setError("")
    setLoading(true)
    try {
      const res = await authService.verifyOtp({ email, otp: code })
      resetTokenRef.current = res.resetToken
      setResetToken(res.resetToken)
      setStep("new-password")
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Invalid or expired code. Please try again."
      setError(msg)
      setOtp("")
    } finally {
      setLoading(false)
    }
  }

  // ── Step 2: set new password ────────────────────────────────────────
  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!newPassword) { setError("Password is required."); return }
    if (newPassword.length < 8) { setError("Password must be at least 8 characters."); return }
    if (newPassword !== confirmPassword) { setError("Passwords do not match."); return }
    if (!resetTokenRef.current) { setError("Session expired. Please go back and request a new code."); return }
    setError("")
    setLoading(true)
    try {
      // Use the resetToken from Step 1 — no need to send email/otp again
      await authService.resetPassword({ resetToken: resetTokenRef.current, newPassword, confirmPassword })
      setStep("done")
    } catch (err: any) {
      // Show detailed Zod errors if present, otherwise the top-level message
      const data = err?.response?.data
      const detail = Array.isArray(data?.errors) && data.errors.length > 0
        ? data.errors.join(" ")
        : data?.message || "Failed to reset password. Please try again."
      setError(detail)
    } finally {
      setLoading(false)
    }
  }

  // ── Resend OTP ──────────────────────────────────────────────────────
  async function handleResend() {
    if (countdown > 0 || !email) return
    setResending(true)
    setError("")
    setOtp("")
    try {
      await authService.forgotPassword({ email })
      setCountdown(RESEND_SECONDS)
    } catch {
      setError("Failed to resend code. Please try again.")
    } finally {
      setResending(false)
    }
  }

  // ── Done ────────────────────────────────────────────────────────────
  if (step === "done") {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
            <ShieldCheck className="size-8" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Password reset!</h1>
          <p className="text-sm text-muted-foreground">
            Your password has been updated. You can now sign in with your new password.
          </p>
        </div>
        <Button className="w-full h-9" onClick={() => router.push("/login")}>
          Go to sign in
        </Button>
      </div>
    )
  }

  // ── New password form ───────────────────────────────────────────────
  if (step === "new-password") {
    return (
      <div className="space-y-6">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight">Set new password</h1>
          <p className="text-sm text-muted-foreground">
            Choose a strong password for{" "}
            <span className="font-medium text-foreground">{email}</span>.
          </p>
        </div>

        <form onSubmit={handleResetPassword} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">New password</label>
            <div className="relative">
              <Input
                type={showPw ? "text" : "password"}
                placeholder="Min. 8 characters"
                autoFocus
                value={newPassword}
                onChange={e => { setNewPassword(e.target.value); if (error) setError("") }}
                className="h-9 pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPw(v => !v)}
              >
                {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Confirm password</label>
            <div className="relative">
              <Input
                type={showConfirm ? "text" : "password"}
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={e => { setConfirmPassword(e.target.value); if (error) setError("") }}
                className="h-9 pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowConfirm(v => !v)}
              >
                {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full h-9" disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            {loading ? "Saving…" : "Reset password"}
          </Button>
        </form>
      </div>
    )
  }

  // ── OTP entry ───────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <Link
        href="/forgot-password"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        Back
      </Link>

      <div className="space-y-1.5 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Enter verification code</h1>
        <p className="text-sm text-muted-foreground">
          We sent a 6-digit code to{" "}
          {email
            ? <span className="font-medium text-foreground">{email}</span>
            : "your email address"
          }
          . It expires in 10 minutes.
        </p>
      </div>

      <div className="flex flex-col items-center gap-3">
        <InputOTP
          maxLength={OTP_LENGTH}
          value={otp}
          onChange={v => { setOtp(v); if (error) setError("") }}
          aria-label="Verification code"
          autoFocus
        >
          <InputOTPGroup>
            {Array.from({ length: OTP_LENGTH }).map((_, i) => (
              <InputOTPSlot key={i} index={i} className="size-11 text-base" />
            ))}
          </InputOTPGroup>
        </InputOTP>

        {error && <p className="text-sm text-destructive text-center">{error}</p>}
      </div>

      <Button
        className="w-full h-9"
        disabled={loading || otp.length < OTP_LENGTH}
        onClick={handleVerifyOtp.bind(null, otp)}
      >
        {loading && <Loader2 className="size-4 animate-spin" />}
        {loading ? "Verifying…" : "Verify code"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Didn&apos;t receive a code?{" "}
        {countdown > 0 ? (
          <span className="tabular-nums">
            Resend in <span className="font-medium text-foreground">{countdown}s</span>
          </span>
        ) : (
          <button
            onClick={handleResend}
            disabled={resending}
            className="font-medium text-foreground underline-offset-4 hover:underline disabled:opacity-50"
          >
            {resending ? "Sending…" : "Resend code"}
          </button>
        )}
      </p>
    </div>
  )
}
