"use client"

import { useState, useRef, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { User, Lock, Upload, Eye, EyeOff, Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/lib/toast"
import { authService } from "@/services/auth.service"
import { useAuthStore } from "@/lib/auth-store"

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
}

export default function SettingsPage() {
  const qc = useQueryClient()
  const { user, setAuth } = useAuthStore()

  // ── Profile ──────────────────────────────────────────────────────
  const { data: profile, isLoading } = useQuery({
    queryKey: ["my-profile-settings"],
    queryFn: () => authService.getProfile(),
    enabled: !!user,
  })

  const [name, setName] = useState("")
  useEffect(() => { if (profile?.name) setName(profile.name) }, [profile?.name])

  const updateProfile = useMutation({
    mutationFn: () => authService.updateProfile({ name: name.trim() }),
    onSuccess: (data) => {
      qc.setQueryData(["my-profile-settings"], data)
      const token = sessionStorage.getItem("crm_access_token") ?? ""
      if (user) setAuth(token, { ...user, name: data.name })
      toast.success("Profile updated")
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to update profile"),
  })

  // ── Avatar ───────────────────────────────────────────────────────
  const fileRef = useRef<HTMLInputElement>(null)

  const uploadAvatar = useMutation({
    mutationFn: (file: File) => authService.uploadAvatar(file),
    onSuccess: (data) => { qc.setQueryData(["my-profile-settings"], data); toast.success("Avatar updated") },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to upload avatar"),
  })

  const deleteAvatar = useMutation({
    mutationFn: () => authService.deleteAvatar(),
    onSuccess: (data) => { qc.setQueryData(["my-profile-settings"], data); toast.success("Avatar removed") },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to remove avatar"),
  })

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error("File must be under 2 MB"); return }
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return }
    uploadAvatar.mutate(file)
    e.target.value = ""
  }

  // ── Password ─────────────────────────────────────────────────────
  const [pw, setPw]     = useState({ current: "", newPw: "", confirm: "" })
  const [show, setShow] = useState({ current: false, newPw: false, confirm: false })
  const [pwError, setPwError] = useState("")

  const changePassword = useMutation({
    mutationFn: () => authService.changePassword({
      currentPassword: pw.current,
      newPassword: pw.newPw,
      confirmPassword: pw.confirm,
    }),
    onSuccess: () => {
      toast.success("Password changed successfully")
      setPw({ current: "", newPw: "", confirm: "" })
      setPwError("")
    },
    onError: (err: any) => {
      const data = err?.response?.data
      const msg = Array.isArray(data?.errors) && data.errors.length > 0
        ? data.errors.join(" ")
        : data?.message ?? "Failed to change password"
      setPwError(msg)
    },
  })

  function handleChangePassword() {
    setPwError("")
    if (!pw.current)              { setPwError("Current password is required"); return }
    if (!pw.newPw)                { setPwError("New password is required"); return }
    if (pw.newPw.length < 8)      { setPwError("New password must be at least 8 characters"); return }
    if (pw.newPw !== pw.confirm)  { setPwError("Passwords do not match"); return }
    changePassword.mutate()
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-4 max-w-3xl">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and security preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid grid-cols-2 w-72">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Lock className="h-4 w-4" />Security
          </TabsTrigger>
        </TabsList>

        {/* ── Profile ───────────────────────────────────────── */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your display name and profile photo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-5">
                <div className="relative shrink-0">
                  <Avatar className="h-20 w-20 border-2 border-border">
                    <AvatarImage src={profile?.avatarUrl ?? undefined} />
                    <AvatarFallback className="text-xl font-bold">
                      {getInitials(profile?.name ?? user?.name ?? "U")}
                    </AvatarFallback>
                  </Avatar>
                  {uploadAvatar.isPending && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                      <Loader2 className="h-5 w-5 text-white animate-spin" />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}
                      disabled={uploadAvatar.isPending}>
                      <Upload className="h-4 w-4 mr-2" />
                      {uploadAvatar.isPending ? "Uploading…" : "Upload photo"}
                    </Button>
                    {profile?.avatarUrl && (
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"
                        onClick={() => deleteAvatar.mutate()} disabled={deleteAvatar.isPending}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">JPG, PNG or GIF · Max 2 MB</p>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </div>
              </div>

              <Separator />

              {/* Read-only fields */}
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { label: "Email",       value: profile?.email },
                  { label: "Role",        value: profile?.role,       badge: true },
                  { label: "Position",    value: profile?.position },
                  { label: "Department",  value: profile?.department },
                  { label: "Join Date",   value: profile?.joinDate
                    ? new Date(profile.joinDate).toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})
                    : undefined },
                  { label: "Salary",      value: profile?.salary
                    ? `${Number(profile.salary).toLocaleString()} AFN / month`
                    : undefined },
                ].filter(f => f.value).map(({ label, value, badge }) => (
                  <div key={label} className="space-y-1">
                    <Label className="text-muted-foreground text-xs uppercase tracking-wide">{label}</Label>
                    {badge
                      ? <p><Badge variant="secondary">{value}</Badge></p>
                      : <p className="text-sm font-medium">{value}</p>
                    }
                  </div>
                ))}
              </div>

              <Separator />

              {/* Editable name */}
              <div className="space-y-2">
                <Label htmlFor="display-name">Display Name</Label>
                <Input id="display-name" value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your full name" />
              </div>

              <div className="flex justify-end">
                <Button onClick={() => updateProfile.mutate()}
                  disabled={updateProfile.isPending || !name.trim()}>
                  {updateProfile.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {updateProfile.isPending ? "Saving…" : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Security ──────────────────────────────────────── */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Use a strong password you don't use elsewhere</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(["current","newPw","confirm"] as const).map(key => {
                const labels = { current: "Current Password", newPw: "New Password", confirm: "Confirm New Password" }
                return (
                  <div key={key} className="space-y-2">
                    <Label>{labels[key]}</Label>
                    <div className="relative">
                      <Input
                        type={show[key] ? "text" : "password"}
                        value={pw[key]}
                        onChange={e => { setPw(p => ({...p, [key]: e.target.value})); setPwError("") }}
                        className="pr-10"
                        placeholder="••••••••"
                      />
                      <button type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShow(s => ({...s, [key]: !s[key]}))}>
                        {show[key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )
              })}

              {pwError && <p className="text-sm text-destructive">{pwError}</p>}

              <div className="flex justify-end">
                <Button onClick={handleChangePassword} disabled={changePassword.isPending}>
                  {changePassword.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {changePassword.isPending ? "Changing…" : "Change Password"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
