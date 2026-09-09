"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { useAuthStore } from "@/lib/auth-store"
import { useLoginMutation } from "@/queries/auth.queries"
import { getApiErrorMessage } from "@/lib/api"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, user } = useAuthStore()

  const [showPassword, setShowPassword] = React.useState(false)
  const [form, setForm] = React.useState({ email: "", password: "", remember: false })
  const [errors, setErrors] = React.useState<{ email?: string; password?: string }>({})

  // Already logged in → skip straight to the right dashboard
  React.useEffect(() => {
    if (isAuthenticated && user) {
      const from = searchParams.get("from")
      const dest = from ?? (user.role === "ADMIN" ? "/admin/dashboard" : "/regular/dashboard")
      router.replace(dest)
    }
  }, [isAuthenticated, user, router, searchParams])

  const login = useLoginMutation()

  function validate() {
    const e: typeof errors = {}
    if (!form.email) e.email = "Email is required."
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email."
    if (!form.password) e.password = "Password is required."
    else if (form.password.length < 6) e.password = "At least 6 characters."
    return e
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    // Pass the ?from= destination into the mutation so it redirects correctly
    const from = searchParams.get("from") ?? undefined
    login.mutate({ email: form.email, password: form.password }, {
      onSuccess: (data) => {
        const dest = from ?? (data.user.role === "ADMIN" ? "/admin/dashboard" : "/regular/dashboard")
        router.push(dest)
      },
    })
  }

  // Keep the public shell stable while an authenticated user is redirected.
  if (isAuthenticated) {
    return (
      <div className="flex min-h-40 items-center justify-center text-sm text-muted-foreground" role="status" aria-live="polite">
        Redirecting...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div className="space-y-1.5 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Sign in to your account to continue</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Email */}
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            autoFocus
            value={form.email}
            onChange={(e) => { setForm({ ...form, email: e.target.value }); setErrors((p) => ({ ...p, email: undefined })) }}
            aria-invalid={!!errors.email || undefined}
            className="h-9"
            disabled={login.isPending}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium">Password</label>
            <Link
              href="/forgot-password"
              className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => { setForm({ ...form, password: e.target.value }); setErrors((p) => ({ ...p, password: undefined })) }}
              aria-invalid={!!errors.password || undefined}
              className="h-9 pr-9"
              disabled={login.isPending}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              tabIndex={-1}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
        </div>

        {/* Remember me */}
        <div className="flex items-center gap-2">
          <Checkbox
            id="remember"
            checked={form.remember}
            onCheckedChange={(v) => setForm({ ...form, remember: !!v })}
            disabled={login.isPending}
          />
          <label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer select-none">
            Remember me for 30 days
          </label>
        </div>

        <Button type="submit" className="w-full h-9" disabled={login.isPending}>
          {login.isPending ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">or</span>
        <Separator className="flex-1" />
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-medium text-foreground underline-offset-4 hover:underline">
          Create one
        </Link>
      </p>
    </div>
  )
}
