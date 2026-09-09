"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { api } from "@/lib/api"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = React.useState("")
  const [error, setError] = React.useState("")
  const [loading, setLoading] = React.useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) { setError("Email is required."); return }
    if (!/\S+@\S+\.\S+/.test(email)) { setError("Enter a valid email address."); return }
    setError("")
    setLoading(true)

    try {
      await api.post("/auth/forgot-password", { email })
      // Navigate to OTP page — pass email so it shows in the description
      router.push(`/verify-otp?email=${encodeURIComponent(email)}&mode=reset`)
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Something went wrong. Please try again."
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        Back to sign in
      </Link>

      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight">Forgot your password?</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a 6-digit reset code.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="forgot-email" className="text-sm font-medium">
            Email address
          </label>
          <Input
            id="forgot-email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => { setEmail(e.target.value); if (error) setError("") }}
            aria-invalid={!!error || undefined}
            className="h-9"
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <Button type="submit" className="w-full h-9" disabled={loading}>
          {loading && <Loader2 className="size-4 animate-spin" />}
          {loading ? "Sending code…" : "Send reset code"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
