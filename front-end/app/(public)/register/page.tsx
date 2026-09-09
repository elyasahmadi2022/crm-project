"use client"

import Link from "next/link"
import { Eye, EyeOff, Loader2, Check, X } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import * as React from "react"

import { Button }    from "@/components/ui/button"
import { Input }     from "@/components/ui/input"
import { Checkbox }  from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { cn }        from "@/lib/utils"
import { useRegisterMutation } from "@/queries/auth.queries"

// ── Schema ────────────────────────────────────────────────────────────────────
const schema = z
  .object({
    firstName: z.string().min(1, "First name is required."),
    lastName:  z.string().min(1, "Last name is required."),
    email:     z.string().min(1, "Email is required.").email("Enter a valid email address."),
    password: z
      .string()
      .min(8, "At least 8 characters.")
      .regex(/[A-Z]/, "Must include an uppercase letter.")
      .regex(/[0-9]/, "Must include a number.")
      .regex(/[^A-Za-z0-9]/, "Must include a special character."),
    confirm: z.string().min(1, "Please confirm your password."),
    terms:   z.literal(true, { errorMap: () => ({ message: "You must accept the terms." }) }),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords don't match.",
    path: ["confirm"],
  })

type FormValues = z.infer<typeof schema>

// ── Password strength ─────────────────────────────────────────────────────────
const RULES = [
  { id: "length",  label: "At least 8 characters",        test: (p: string) => p.length >= 8 },
  { id: "upper",   label: "One uppercase letter",         test: (p: string) => /[A-Z]/.test(p) },
  { id: "number",  label: "One number",                   test: (p: string) => /\d/.test(p) },
  { id: "special", label: "One special character (!@#…)", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
]

// ── Inline error ──────────────────────────────────────────────────────────────
function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1 text-xs text-destructive">{message}</p>
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const [showPass,    setShowPass]    = React.useState(false)
  const [showConfirm, setShowConfirm] = React.useState(false)

  const registerMutation = useRegisterMutation()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      lastName:  "",
      email:     "",
      password:  "",
      confirm:   "",
      terms:     undefined,
    },
    mode: "onTouched", // validate on blur, then on every change after first touch
  })

  const password = watch("password") ?? ""
  const passedRules = RULES.filter((r) => r.test(password))
  const strength    = passedRules.length

  const strengthColor = ["", "bg-destructive", "bg-yellow-500", "bg-blue-500", "bg-green-500"][strength] ?? ""
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength] ?? ""

  function onSubmit(values: FormValues) {
    registerMutation.mutate({
      name:     `${values.firstName.trim()} ${values.lastName.trim()}`,
      email:    values.email,
      password: values.password,
      role:     "SALES",
    })
  }

  const isPending = isSubmitting || registerMutation.isPending

  return (
    <div className="space-y-6">
      <div className="space-y-1.5 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Create an account</h1>
        <p className="text-sm text-muted-foreground">Fill in the details below to get started</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {/* Name row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="firstName" className="text-sm font-medium">First name</label>
            <Input
              id="firstName"
              placeholder="John"
              autoComplete="given-name"
              aria-invalid={!!errors.firstName}
              className="h-9"
              {...register("firstName")}
            />
            <FieldError message={errors.firstName?.message} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="lastName" className="text-sm font-medium">Last name</label>
            <Input
              id="lastName"
              placeholder="Doe"
              autoComplete="family-name"
              aria-invalid={!!errors.lastName}
              className="h-9"
              {...register("lastName")}
            />
            <FieldError message={errors.lastName?.message} />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label htmlFor="reg-email" className="text-sm font-medium">Email</label>
          <Input
            id="reg-email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            aria-invalid={!!errors.email}
            className="h-9"
            {...register("email")}
          />
          <FieldError message={errors.email?.message} />
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label htmlFor="reg-password" className="text-sm font-medium">Password</label>
          <div className="relative">
            <Input
              id="reg-password"
              type={showPass ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              className="h-9 pr-9"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              tabIndex={-1}
              aria-label={showPass ? "Hide password" : "Show password"}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <FieldError message={errors.password?.message} />

          {/* Strength meter — shown as soon as user starts typing */}
          {password.length > 0 && (
            <div className="space-y-2 pt-1">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1 flex-1 rounded-full transition-colors duration-300",
                      i <= strength ? strengthColor : "bg-muted",
                    )}
                  />
                ))}
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {RULES.map((r) => {
                  const ok = r.test(password)
                  return (
                    <div key={r.id} className={cn("flex items-center gap-1.5 text-xs", ok ? "text-green-600 dark:text-green-400" : "text-muted-foreground")}>
                      {ok ? <Check className="size-3 shrink-0" /> : <X className="size-3 shrink-0" />}
                      {r.label}
                    </div>
                  )
                })}
              </div>
              {strengthLabel && (
                <p className={cn("text-xs font-medium", strengthColor.replace("bg-", "text-"))}>
                  {strengthLabel}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Confirm password */}
        <div className="space-y-1.5">
          <label htmlFor="confirm" className="text-sm font-medium">Confirm password</label>
          <div className="relative">
            <Input
              id="confirm"
              type={showConfirm ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="new-password"
              aria-invalid={!!errors.confirm}
              className="h-9 pr-9"
              {...register("confirm")}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              tabIndex={-1}
              aria-label={showConfirm ? "Hide" : "Show"}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <FieldError message={errors.confirm?.message} />
        </div>

        {/* Terms */}
        <div className="space-y-1">
          <div className="flex items-start gap-2">
            <Checkbox
              id="terms"
              aria-invalid={!!errors.terms}
              onCheckedChange={(v) =>
                setValue("terms", v === true ? true : (undefined as unknown as true), {
                  shouldValidate: true,
                })
              }
              className="mt-0.5"
            />
            <label htmlFor="terms" className="text-sm text-muted-foreground leading-snug cursor-pointer select-none">
              I agree to the{" "}
              <Link href="/terms" className="text-foreground underline-offset-4 hover:underline">Terms of Service</Link>
              {" "}and{" "}
              <Link href="/privacy" className="text-foreground underline-offset-4 hover:underline">Privacy Policy</Link>
            </label>
          </div>
          <FieldError message={errors.terms?.message} />
        </div>

        <Button type="submit" className="w-full h-9" disabled={isPending}>
          {isPending && <Loader2 className="size-4 animate-spin" />}
          {isPending ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">or</span>
        <Separator className="flex-1" />
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
