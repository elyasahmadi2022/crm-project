"use client"

/**
 * components/settings/company-tab.tsx
 *
 * Two modes:
 *   VIEW  — shows current company info as read-only with an "Edit" button top-right
 *   EDIT  — shows all input fields; Save / Cancel buttons at the bottom
 *
 * Below the company info card there is a Contract Templates section that lists
 * saved templates and links to the dedicated template editor page.
 */

import * as React from "react"
import Link from "next/link"
import {
  Camera, Trash2, Loader2, Globe, Mail, Phone, Smartphone,
  MessageCircle, MapPin, Building2, Pencil, X, Check,
  LayoutTemplate, Plus, Star, ExternalLink,
} from "lucide-react"

import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
} from "@/components/ui/card"
import { Button }    from "@/components/ui/button"
import { Input }     from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Badge }     from "@/components/ui/badge"
import { Skeleton }  from "@/components/ui/skeleton"

import {
  useCompanySettingsQuery,
  useUpdateCompanySettingsMutation,
  useUploadLogoMutation,
  useDeleteLogoMutation,
  useContractTemplatesQuery,
  useSetDefaultTemplateMutation,
  useDeleteTemplateMutation,
} from "@/queries/company.queries"

// ── Helpers ───────────────────────────────────────────────────────────────────

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: string | null | undefined
}) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <Icon className="size-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className={`text-sm ${value ? "text-foreground" : "text-muted-foreground italic"}`}>
          {value || "Not set"}
        </p>
      </div>
    </div>
  )
}

function Field({
  label,
  htmlFor,
  icon: Icon,
  hint,
  children,
}: {
  label: string
  htmlFor?: string
  icon?: React.ElementType
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3 sm:gap-4 sm:items-start">
      <div className="pt-1.5 flex items-start gap-2 shrink-0">
        {Icon && <Icon className="size-4 text-muted-foreground mt-0.5 shrink-0" />}
        <div>
          <label htmlFor={htmlFor} className="text-sm font-medium leading-none">
            {label}
          </label>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
      </div>
      <div className="sm:col-span-2">{children}</div>
    </div>
  )
}

function SectionDivider({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 my-1">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
        {children}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function CompanyTab() {
  const { data: settings, isLoading } = useCompanySettingsQuery()
  const updateMut      = useUpdateCompanySettingsMutation()
  const uploadMut      = useUploadLogoMutation()
  const deleteMut      = useDeleteLogoMutation()
  const fileRef        = React.useRef<HTMLInputElement>(null)

  const { data: templates = [], isLoading: tplLoading } = useContractTemplatesQuery()
  const setDefaultMut  = useSetDefaultTemplateMutation()
  const deleteTplMut   = useDeleteTemplateMutation()

  // view | edit
  const [mode, setMode] = React.useState<"view" | "edit">("view")

  const [form, setForm] = React.useState({
    name:       "",
    tagline:    "",
    mobile:     "",
    email:      "",
    phone:      "",
    website:    "",
    whatsapp:   "",
    address:    "",
    footerText: "",
  })

  // Populate form whenever settings arrive
  React.useEffect(() => {
    if (!settings) return
    setForm({
      name:       settings.name       ?? "",
      tagline:    settings.tagline    ?? "",
      mobile:     settings.mobile     ?? "",
      email:      settings.email      ?? "",
      phone:      settings.phone      ?? "",
      website:    settings.website    ?? "",
      whatsapp:   settings.whatsapp   ?? "",
      address:    settings.address    ?? "",
      footerText: settings.footerText ?? "",
    })
  }, [settings])

  function enterEdit() {
    // Re-sync to latest before editing
    if (settings) {
      setForm({
        name:       settings.name       ?? "",
        tagline:    settings.tagline    ?? "",
        mobile:     settings.mobile     ?? "",
        email:      settings.email      ?? "",
        phone:      settings.phone      ?? "",
        website:    settings.website    ?? "",
        whatsapp:   settings.whatsapp   ?? "",
        address:    settings.address    ?? "",
        footerText: settings.footerText ?? "",
      })
    }
    setMode("edit")
  }

  function cancelEdit() {
    if (settings) {
      setForm({
        name:       settings.name       ?? "",
        tagline:    settings.tagline    ?? "",
        mobile:     settings.mobile     ?? "",
        email:      settings.email      ?? "",
        phone:      settings.phone      ?? "",
        website:    settings.website    ?? "",
        whatsapp:   settings.whatsapp   ?? "",
        address:    settings.address    ?? "",
        footerText: settings.footerText ?? "",
      })
    }
    setMode("view")
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) uploadMut.mutate(file)
    e.target.value = ""
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    updateMut.mutate(form, { onSuccess: () => setMode("view") })
  }

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((p) => ({ ...p, [field]: e.target.value }))
  }

  // ── Loading skeleton ──────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-36 w-full rounded-xl" />
      </div>
    )
  }

  // ── VIEW mode ─────────────────────────────────────────────────────────────

  if (mode === "view") {
    return (
      <div className="flex flex-col gap-6">

        {/* ── Company info card ─────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>Company Information</CardTitle>
                <CardDescription className="mt-1">
                  Used in contract headers. Click Edit to update.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 shrink-0"
                onClick={enterEdit}
              >
                <Pencil className="size-3.5" />
                Edit
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex flex-col gap-1">
            {/* Logo + identity */}
            <div className="flex items-center gap-5 pb-4">
              <div className="size-16 shrink-0 rounded-lg border bg-muted/30 flex items-center justify-center overflow-hidden">
                {settings?.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={settings.logoUrl}
                    alt="Company logo"
                    className="size-full object-contain p-1"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none" }}
                  />
                ) : (
                  <Building2 className="size-7 text-muted-foreground opacity-40" />
                )}
              </div>
              <div>
                <p className="font-semibold text-base leading-tight">
                  {settings?.name || <span className="text-muted-foreground italic font-normal">Company name not set</span>}
                </p>
                {settings?.tagline && (
                  <p className="text-sm text-muted-foreground mt-0.5">{settings.tagline}</p>
                )}
              </div>
            </div>

            <Separator />

            {/* Contact fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 mt-2">
              <InfoRow icon={Smartphone}   label="Mobile"   value={settings?.mobile} />
              <InfoRow icon={Phone}        label="Phone"    value={settings?.phone} />
              <InfoRow icon={MessageCircle}label="WhatsApp" value={settings?.whatsapp} />
              <InfoRow icon={Mail}         label="Email"    value={settings?.email} />
              <InfoRow icon={Globe}        label="Website"  value={settings?.website} />
              <InfoRow icon={MapPin}       label="Address"  value={settings?.address} />
            </div>

            {settings?.footerText && (
              <>
                <Separator className="mt-2" />
                <p className="text-xs text-muted-foreground mt-3">
                  <span className="font-medium text-foreground">Footer: </span>
                  {settings.footerText}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        

      </div>
    )
  }

  // ── EDIT mode ─────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-6">

      {/* ── Logo ──────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Company Logo</CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={cancelEdit}
              title="Cancel editing"
            >
              <X className="size-4" />
            </Button>
          </div>
          <CardDescription>PNG, JPG, WebP · max 3 MB · shown in every contract header.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-5">
            <div className="size-20 shrink-0 rounded-lg border bg-muted/30 flex items-center justify-center overflow-hidden">
              {settings?.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={settings.logoUrl}
                  alt="Company logo"
                  className="size-full object-contain p-1"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none" }}
                />
              ) : (
                <Building2 className="size-8 text-muted-foreground opacity-40" />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={handleLogoChange}
                aria-label="Upload company logo"
              />
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploadMut.isPending}
                >
                  {uploadMut.isPending
                    ? <Loader2 className="size-3.5 animate-spin" />
                    : <Camera className="size-3.5" />}
                  {uploadMut.isPending ? "Uploading…" : "Upload logo"}
                </Button>
                {settings?.logoUrl && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteMut.mutate()}
                    disabled={deleteMut.isPending}
                  >
                    {deleteMut.isPending
                      ? <Loader2 className="size-3.5 animate-spin" />
                      : <Trash2 className="size-3.5" />}
                    {deleteMut.isPending ? "Removing…" : "Remove"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Identity ──────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Company Identity</CardTitle>
          <CardDescription>Name and tagline appear in the contract header and footer.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <Field label="Company name" htmlFor="co-name" icon={Building2}>
            <Input id="co-name" value={form.name} onChange={set("name")} placeholder="Luilala" />
          </Field>
          <Field label="Tagline" htmlFor="co-tagline" hint="Shown below the company name">
            <Input
              id="co-tagline"
              value={form.tagline}
              onChange={set("tagline")}
              placeholder="Digital Solutions & Services"
            />
          </Field>
          <Field label="Footer text" htmlFor="co-footer" hint="One-liner printed at the bottom of each contract">
            <Input
              id="co-footer"
              value={form.footerText}
              onChange={set("footerText")}
              placeholder="Luilala · Digital Solutions & Services · www.luilala.com"
            />
          </Field>
        </CardContent>
      </Card>

      {/* ── Contact details ───────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Details</CardTitle>
          <CardDescription>
            Displayed in the contract header with SVG icons. Only fields with a value are shown.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <SectionDivider>Phone &amp; messaging</SectionDivider>

          <Field label="Mobile" htmlFor="co-mobile" icon={Smartphone}>
            <Input id="co-mobile" type="tel" value={form.mobile} onChange={set("mobile")} placeholder="+1 (555) 000-0001" />
          </Field>
          <Field label="Phone" htmlFor="co-phone" icon={Phone}>
            <Input id="co-phone" type="tel" value={form.phone} onChange={set("phone")} placeholder="+1 (555) 000-0002" />
          </Field>
          <Field label="WhatsApp" htmlFor="co-whatsapp" icon={MessageCircle}>
            <Input id="co-whatsapp" type="tel" value={form.whatsapp} onChange={set("whatsapp")} placeholder="+1 (555) 000-0001" />
          </Field>

          <SectionDivider>Digital presence</SectionDivider>

          <Field label="Email" htmlFor="co-email" icon={Mail}>
            <Input id="co-email" type="email" value={form.email} onChange={set("email")} placeholder="hello@luilala.com" />
          </Field>
          <Field label="Website" htmlFor="co-website" icon={Globe}>
            <Input id="co-website" value={form.website} onChange={set("website")} placeholder="www.luilala.com" />
          </Field>

          <SectionDivider>Location</SectionDivider>

          <Field label="Address" htmlFor="co-address" icon={MapPin}>
            <Input id="co-address" value={form.address} onChange={set("address")} placeholder="123 Business Ave, Suite 100, City, Country" />
          </Field>
        </CardContent>

        <CardFooter className="justify-end gap-2 border-t pt-4">
          <Button type="button" variant="outline" onClick={cancelEdit} disabled={updateMut.isPending}>
            <X className="size-3.5" />
            Cancel
          </Button>
          <Button type="submit" disabled={updateMut.isPending}>
            {updateMut.isPending
              ? <Loader2 className="size-3.5 animate-spin" />
              : <Check className="size-3.5" />}
            {updateMut.isPending ? "Saving…" : "Save changes"}
          </Button>
        </CardFooter>
      </Card>

    </form>
  )
}
