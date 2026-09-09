"use client"

import * as React from "react"
import {
  Camera,
  Trash2,
  Loader2,
  User,
  Lock,
  ShieldCheck,
  Eye,
  EyeOff,
  Building2,
  Tag,
} from "lucide-react"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

import {
  useProfileQuery,
  useUpdateProfileMutation,
  useUploadAvatarMutation,
  useDeleteAvatarMutation,
  useChangePasswordMutation,
} from "@/queries/auth.queries"
import { CompanyTab }            from "@/components/settings/company-tab"
import { ExpenseCategoriesTab } from "@/components/settings/expense-categories-tab"

// ── helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
}

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrator",
  SALES: "Sales",
  FINANCE: "Finance",
  DEVELOPER: "Developer",
  DESIGNER: "Designer",
  USER: "User",
}

// ── sub-section label ─────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
      {children}
    </p>
  )
}

// ── field row ────────────────────────────────────────────────────────────────

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string
  htmlFor?: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3 sm:gap-4 sm:items-start">
      <div className="pt-1.5">
        <label
          htmlFor={htmlFor}
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {label}
        </label>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </div>
      <div className="sm:col-span-2">{children}</div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROFILE TAB
// ═══════════════════════════════════════════════════════════════════════════════

function ProfileTab() {
  const { data: profile, isLoading } = useProfileQuery()
  const updateProfile = useUpdateProfileMutation()
  const uploadAvatar  = useUploadAvatarMutation()
  const deleteAvatar  = useDeleteAvatarMutation()

  const [name, setName] = React.useState("")
  const fileRef = React.useRef<HTMLInputElement>(null)

  // Sync form when profile loads
  React.useEffect(() => {
    if (profile) setName(profile.name)
  }, [profile])

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) uploadAvatar.mutate(file)
    // Reset so the same file can be re-selected after deletion
    e.target.value = ""
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || name === profile?.name) return
    updateProfile.mutate({ name: name.trim() })
  }

  const avatarUrl  = profile?.avatarUrl ?? null
  const initials   = profile ? getInitials(profile.name) : "…"
  const isPending  = updateProfile.isPending
  const isDirty    = name.trim() !== (profile?.name ?? "")

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
        <Loader2 className="size-4 animate-spin" />
        <span className="text-sm">Loading profile…</span>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">

      {/* ── Avatar ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Picture</CardTitle>
          <CardDescription>
            A photo helps people recognise you across the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              <Avatar size="lg" className="size-20 overflow-hidden">
                {avatarUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt={profile?.name}
                    className="absolute inset-0 size-full rounded-full object-cover"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none" }}
                  />
                )}
                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">{profile?.name}</p>
              <p className="text-xs text-muted-foreground">{profile?.email}</p>
              <div className="flex items-center gap-2 flex-wrap mt-1">
                {/* Hidden file input */}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="sr-only"
                  onChange={handleAvatarChange}
                  aria-label="Upload avatar"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploadAvatar.isPending}
                >
                  {uploadAvatar.isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Camera className="size-3.5" />
                  )}
                  {uploadAvatar.isPending ? "Uploading…" : "Upload photo"}
                </Button>

                {avatarUrl && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteAvatar.mutate()}
                    disabled={deleteAvatar.isPending}
                  >
                    {deleteAvatar.isPending ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="size-3.5" />
                    )}
                    {deleteAvatar.isPending ? "Removing…" : "Remove"}
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, WebP or GIF · max 5 MB
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Personal info ───────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Update your display name. Email and role are managed by your administrator.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <Field
            label="Full name"
            htmlFor="name"
            hint="This is shown across the CRM."
          >
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              required
              minLength={1}
            />
          </Field>

          <Field label="Email address" hint="Contact your admin to change email.">
            <Input
              value={profile?.email ?? ""}
              readOnly
              disabled
              className="opacity-60"
            />
          </Field>

          <Field label="Role">
            <div className="flex items-center h-8">
              <Badge variant="secondary">
                {ROLE_LABEL[profile?.role ?? ""] ?? profile?.role}
              </Badge>
            </div>
          </Field>
        </CardContent>
        <CardFooter className="justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setName(profile?.name ?? "")}
            disabled={!isDirty || isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={!isDirty || isPending}>
            {isPending && <Loader2 className="size-3.5 animate-spin" />}
            {isPending ? "Saving…" : "Save changes"}
          </Button>
        </CardFooter>
      </Card>

      {/* ── Account info (read-only) ─────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
          <CardDescription>Read-only account metadata.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field label="Account ID">
            <div className="flex items-center h-8">
              <span className="text-sm text-muted-foreground font-mono">
                #{profile?.id}
              </span>
            </div>
          </Field>
          <Field label="Last updated">
            <div className="flex items-center h-8">
              <span className="text-sm text-muted-foreground">
                {profile?.updatedAt
                  ? new Date(profile.updatedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—"}
              </span>
            </div>
          </Field>
          {profile?.forcePasswordChange && (
            <div className="flex items-center gap-2 rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm text-yellow-800 dark:border-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300">
              <ShieldCheck className="size-4 shrink-0" />
              You are required to change your password before continuing.
            </div>
          )}
        </CardContent>
      </Card>

    </form>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECURITY TAB
// ═══════════════════════════════════════════════════════════════════════════════

function SecurityTab() {
  const changePassword = useChangePasswordMutation()

  const [form, setForm] = React.useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [showCurrent, setShowCurrent] = React.useState(false)
  const [showNew, setShowNew]         = React.useState(false)
  const [showConfirm, setShowConfirm] = React.useState(false)

  // Inline validation
  const newTooShort  = form.newPassword.length > 0 && form.newPassword.length < 8
  const noUppercase  = form.newPassword.length > 0 && !/[A-Z]/.test(form.newPassword)
  const noDigit      = form.newPassword.length > 0 && !/[0-9]/.test(form.newPassword)
  const mismatch     = form.confirmPassword.length > 0 && form.newPassword !== form.confirmPassword
  const sameAsCurrent = form.newPassword.length > 0 && form.newPassword === form.currentPassword

  const isInvalid =
    !form.currentPassword ||
    !form.newPassword ||
    !form.confirmPassword ||
    newTooShort ||
    noUppercase ||
    noDigit ||
    mismatch ||
    sameAsCurrent

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isInvalid) return
    changePassword.mutate(
      {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      },
      {
        onSuccess: () => {
          setForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
        },
      },
    )
  }

  function handleChange(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            Use a strong password with at least 8 characters, one uppercase letter, and one number.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {/* Current password */}
          <Field label="Current password" htmlFor="current-password">
            <div className="relative">
              <Input
                id="current-password"
                type={showCurrent ? "text" : "password"}
                value={form.currentPassword}
                onChange={handleChange("currentPassword")}
                placeholder="Your current password"
                autoComplete="current-password"
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showCurrent ? "Hide password" : "Show password"}
              >
                {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </Field>

          <Separator />

          {/* New password */}
          <Field
            label="New password"
            htmlFor="new-password"
            hint="Min 8 chars · 1 uppercase · 1 number"
          >
            <div className="relative">
              <Input
                id="new-password"
                type={showNew ? "text" : "password"}
                value={form.newPassword}
                onChange={handleChange("newPassword")}
                placeholder="New password"
                autoComplete="new-password"
                required
                aria-invalid={newTooShort || noUppercase || noDigit || sameAsCurrent || undefined}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showNew ? "Hide password" : "Show password"}
              >
                {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {/* Inline error hints */}
            {newTooShort && (
              <p className="mt-1 text-xs text-destructive">At least 8 characters required.</p>
            )}
            {noUppercase && !newTooShort && (
              <p className="mt-1 text-xs text-destructive">Must include an uppercase letter.</p>
            )}
            {noDigit && !newTooShort && (
              <p className="mt-1 text-xs text-destructive">Must include a number.</p>
            )}
            {sameAsCurrent && (
              <p className="mt-1 text-xs text-destructive">New password must differ from current.</p>
            )}
          </Field>

          {/* Confirm password */}
          <Field label="Confirm password" htmlFor="confirm-password">
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirm ? "text" : "password"}
                value={form.confirmPassword}
                onChange={handleChange("confirmPassword")}
                placeholder="Repeat new password"
                autoComplete="new-password"
                required
                aria-invalid={mismatch || undefined}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showConfirm ? "Hide password" : "Show password"}
              >
                {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {mismatch && (
              <p className="mt-1 text-xs text-destructive">Passwords do not match.</p>
            )}
          </Field>
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" disabled={isInvalid || changePassword.isPending}>
            {changePassword.isPending && <Loader2 className="size-3.5 animate-spin" />}
            {changePassword.isPending ? "Updating…" : "Update password"}
          </Button>
        </CardFooter>
      </Card>

      {/* Password requirements reminder */}
      <Card>
        <CardHeader>
          <CardTitle>Password Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
            {[
              "At least 8 characters long",
              "At least one uppercase letter (A–Z)",
              "At least one number (0–9)",
              "Must be different from your current password",
            ].map((req) => (
              <li key={req} className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
                {req}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </form>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function SettingsPage() {
  return (
    <div className="mx-auto flex p-3 flex-col gap-6 pb-10">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your profile, avatar, and account security.
        </p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile" className="gap-1.5">
            <User className="size-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-1.5">
            <Lock className="size-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="company" className="gap-1.5">
            <Building2 className="size-4" />
            Company
          </TabsTrigger>
          <TabsTrigger value="expense-categories" className="gap-1.5">
            <Tag className="size-4" />
            Expense Categories
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileTab />
        </TabsContent>

        <TabsContent value="security">
          <SecurityTab />
        </TabsContent>

        <TabsContent value="company">
          <CompanyTab />
        </TabsContent>

        <TabsContent value="expense-categories">
          <ExpenseCategoriesTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
