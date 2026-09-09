"use client"

import * as React from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Plus, Search, Pencil, Trash2, Loader2, Upload, FileJson,
  ArrowRightLeft, StickyNote, TrendingUp, Users, CheckCircle2, Clock,
  MessageCircle, Phone, Mail, Globe, MapPin, ExternalLink, AlertCircle,
  ChevronLeft, ChevronRight, PhoneCall, Calendar, Building2,
  Hash, ThumbsUp, Link as LinkIcon,
} from "lucide-react"

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog"
import { Button }    from "@/components/ui/button"
import { Input }     from "@/components/ui/input"
import { Badge }     from "@/components/ui/badge"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Skeleton }  from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import {
  Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle,
} from "@/components/ui/empty"

import {
  useListLeadsQuery,
  useCreateLeadMutation,
  useUpdateLeadMutation,
  useChangeLeadStatusMutation,
  useAddLeadNoteMutation,
  useConvertLeadMutation,
  useDeleteLeadMutation,
} from "@/queries/lead.queries"
import { leadService } from "@/services/lead.service"
import { toast } from "@/components/ui/toast"
import { useQueryClient } from "@tanstack/react-query"
import type { Lead, LeadStatus, CompanySize } from "@/services/lead.service"

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: "New", CONTACTED: "Contacted", PENDING: "Pending",
  ON_HOLD: "On Hold", WON: "Won", LOST: "Lost",
}
const STATUS_CLASS: Record<LeadStatus, string> = {
  NEW:       "bg-blue-100 text-blue-700 border-transparent dark:bg-blue-900/30 dark:text-blue-300",
  CONTACTED: "bg-purple-100 text-purple-700 border-transparent dark:bg-purple-900/30 dark:text-purple-300",
  PENDING:   "bg-yellow-100 text-yellow-700 border-transparent dark:bg-yellow-900/30 dark:text-yellow-300",
  ON_HOLD:   "bg-orange-100 text-orange-700 border-transparent dark:bg-orange-900/30 dark:text-orange-300",
  WON:       "bg-green-100 text-green-700 border-transparent dark:bg-green-900/30 dark:text-green-300",
  LOST:      "bg-red-100 text-red-700 border-transparent dark:bg-red-900/30 dark:text-red-300",
}
const SIZE_LABELS: Record<CompanySize, string> = {
  MICRO: "Micro", SMALL: "Small", MEDIUM: "Medium", LARGE: "Large", ENTERPRISE: "Enterprise",
}
const ALL_STATUSES: LeadStatus[] = ["NEW", "CONTACTED", "PENDING", "ON_HOLD", "WON", "LOST"]
const ALL_SIZES: CompanySize[]   = ["MICRO", "SMALL", "MEDIUM", "LARGE", "ENTERPRISE"]

const WA_SOURCE_TAG = "[WhatsApp Marketing Import]"
const PAGE_SIZE     = 20
const BATCH_SIZE    = 5

// ─────────────────────────────────────────────────────────────────────────────
// WhatsApp import types
// ─────────────────────────────────────────────────────────────────────────────

interface FacebookPageEntry {
  rank?: number
  is_new?: boolean
  page_key?: string
  url?: string
  name: string
  category?: string
  about?: string
  likes?: number
  talking_about?: number
  were_here?: number | null
  phones?: string[]
  emails?: string[]
  website?: string
  address?: string
  page_created_date?: string
  page_status?: string
}

interface PreviewRow extends FacebookPageEntry {
  _idx: number
  _valid: boolean
  _reason?: string
  _duplicate?: boolean
  _province?: string
  _district?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Address parser
// ─────────────────────────────────────────────────────────────────────────────

// Noise words to strip when extracting province/district
const ADDRESS_NOISE = /\b(afghanistan|pakistan|india|iran|AFGHANISTAN|PAKISTAN)\b/gi

/** Normalise a string to Title Case: "nangarhar" → "Nangarhar", "KABUL" → "Kabul" */
function toTitleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim()
}

/**
 * Parses an address string like:
 *   "Kama,Nangarhar AFGHANISTAN, Jalalabad, Afghanistan"
 *   "Kabul, Kabul, Afghanistan"
 *   "District 3, Herat, Afghanistan"
 *
 * Strategy:
 *  - Split by comma
 *  - Strip known country noise from each segment
 *  - Normalise to Title Case so "NANGARHAR" and "nangarhar" merge into "Nangarhar"
 *  - First clean non-empty segment → district
 *  - Second clean non-empty segment → province
 *  - If only one segment → treat as province, district empty
 */
function parseAddress(raw: string | undefined): { province: string; district: string; fullAddress: string } {
  if (!raw?.trim()) return { province: "", district: "", fullAddress: "" }

  const fullAddress = raw.trim()
  const parts = raw
    .split(",")
    .map((p) => toTitleCase(p.replace(ADDRESS_NOISE, "").replace(/\s+/g, " ")))
    .filter(Boolean)

  if (parts.length === 0) return { province: "", district: "", fullAddress }
  if (parts.length === 1) return { province: parts[0], district: "", fullAddress }

  // First part is typically district/city, second is province
  const district = parts[0]
  const province  = parts[1]

  return { province, district, fullAddress }
}

/** Extract a named field from a WA lead's message string */
function extractField(message: string, key: string): string {
  const line = message.split("\n").find((l) => l.startsWith(`${key}:`))
  return line ? line.slice(key.length + 1).trim() : ""
}

/** Parse all WA fields from the message into a structured object */
function parseWaMessage(message: string) {
  if (!message.includes(WA_SOURCE_TAG)) return null
  return {
    about:       extractField(message, "About"),
    address:     extractField(message, "Address"),
    province:    extractField(message, "Province"),
    district:    extractField(message, "District"),
    page:        extractField(message, "Page"),
    likes:       extractField(message, "Likes"),
    website:     extractField(message, "Website"),
    created:     extractField(message, "Created"),
    talking:     extractField(message, "Talking"),
    rank:        extractField(message, "Rank"),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// General helpers
// ─────────────────────────────────────────────────────────────────────────────

function fmtDate(val: string | null | undefined) {
  if (!val) return "—"
  return new Date(val).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
}

function firstPhone(e: FacebookPageEntry) { return e.phones?.find((p) => p.trim()) }
function firstEmail(e: FacebookPageEntry) { return e.emails?.find((em) => em.includes("@")) ?? "" }
function syntheticEmail(e: FacebookPageEntry) {
  const slug = (e.page_key ?? e.name ?? "unknown").replace(/[^a-z0-9]/gi, "").toLowerCase().slice(0, 30)
  return `${slug}@whatsapp-import.local`
}
function dedupKey(name: string, phone?: string | null) {
  return `${name.trim().toLowerCase().replace(/\s+/g, " ")}||${(phone ?? "").replace(/\D/g, "")}`
}
async function runInBatches<T>(
  tasks: (() => Promise<T>)[],
  size: number,
  onDone?: (n: number) => void,
): Promise<PromiseSettledResult<T>[]> {
  const out: PromiseSettledResult<T>[] = []
  for (let i = 0; i < tasks.length; i += size) {
    const settled = await Promise.allSettled(tasks.slice(i, i + size).map((t) => t()))
    out.push(...settled)
    onDone?.(Math.min(i + size, tasks.length))
  }
  return out
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared UI components
// ─────────────────────────────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1 text-xs text-destructive">{message}</p>
}

function StatCard({ label, value, icon: Icon, color, sub }: {
  label: string; value: string | number; icon: React.ElementType; color: string; sub?: string
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-4">
        <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${color}`}>
          <Icon className="size-4" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold leading-none mt-0.5">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

function TableSkeleton({ cols }: { cols: number }) {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: cols }).map((__, j) => (
            <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

function PaginationBar({ page, totalPages, total, pageSize, onPage }: {
  page: number; totalPages: number; total: number; pageSize: number; onPage: (p: number) => void
}) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to   = Math.min(page * pageSize, total)
  return (
    <div className="flex items-center justify-between gap-2 flex-wrap">
      <p className="text-xs text-muted-foreground">
        {total === 0 ? "No results" : `${from}–${to} of ${total}`}
      </p>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon-sm" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Prev">
          <ChevronLeft className="size-4" />
        </Button>
        <span className="text-xs text-muted-foreground px-2 tabular-nums">{page} / {totalPages || 1}</span>
        <Button variant="outline" size="icon-sm" disabled={page >= totalPages} onClick={() => onPage(page + 1)} aria-label="Next">
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Lead form schema
// ─────────────────────────────────────────────────────────────────────────────

const leadSchema = z.object({
  name:        z.string().min(1, "Full name is required."),
  email:       z.string().email("Enter a valid email address.").optional().or(z.literal("")),
  phone:       z.string().optional(),
  companyName: z.string().min(1, "Company name is required."),
  companySize: z.enum(["MICRO", "SMALL", "MEDIUM", "LARGE", "ENTERPRISE"] as const, {
    error: "Please select a company size.",
  }),
  message: z.string().optional(),
}).refine(
  (d) => !!(d.email?.trim() || d.phone?.trim()),
  { message: "At least one of email or phone is required.", path: ["email"] },
)
type LeadFormValues = z.infer<typeof leadSchema>

// ─────────────────────────────────────────────────────────────────────────────
// Lead Form (create & edit)
// ─────────────────────────────────────────────────────────────────────────────

function LeadForm({ initial, onClose }: { initial?: Lead; onClose: () => void }) {
  const isEdit = !!initial
  const createMutation = useCreateLeadMutation()
  const updateMutation = useUpdateLeadMutation()
  const isPending = createMutation.isPending || updateMutation.isPending

  const { register, handleSubmit, control, formState: { errors } } = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: initial?.name ?? "", email: initial?.email ?? "", phone: initial?.phone ?? "",
      companyName: initial?.companyName ?? "", companySize: initial?.companySize ?? "SMALL",
      message: initial?.message ?? "",
    },    mode: "onTouched",
  })

  function onSubmit(values: LeadFormValues) {
    const dto = {
      name:        values.name,
      email:       values.email?.trim()   || undefined,
      phone:       values.phone?.trim()   || undefined,
      companyName: values.companyName,
      companySize: values.companySize,
    }
    if (isEdit) {
      updateMutation.mutate({ id: initial.id, dto }, { onSuccess: onClose })
    } else {
      createMutation.mutate(
        { ...dto, message: values.message || "" },
        { onSuccess: onClose },
      )
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="l-name" className="text-sm font-medium">Full name <span className="text-destructive">*</span></label>
          <Input id="l-name" placeholder="Jane Doe" aria-invalid={!!errors.name} {...register("name")} />
          <FieldError message={errors.name?.message} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="l-email" className="text-sm font-medium">
            Email
            <span className="ml-1 text-xs font-normal text-muted-foreground">(or phone required)</span>
          </label>
          <Input id="l-email" type="email" placeholder="jane@company.com" aria-invalid={!!errors.email} {...register("email")} />
          <FieldError message={errors.email?.message} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="l-phone" className="text-sm font-medium">
            Phone
            <span className="ml-1 text-xs font-normal text-muted-foreground">(or email required)</span>
          </label>
          <Input id="l-phone" placeholder="+1 555 000 0000" {...register("phone")} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="l-company" className="text-sm font-medium">Company <span className="text-destructive">*</span></label>
          <Input id="l-company" placeholder="Acme Corp" aria-invalid={!!errors.companyName} {...register("companyName")} />
          <FieldError message={errors.companyName?.message} />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Company size <span className="text-destructive">*</span></label>
        <Controller control={control} name="companySize" render={({ field }) => (
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger className="w-full" aria-invalid={!!errors.companySize}>
              <SelectValue>{field.value ? SIZE_LABELS[field.value] : "Select size"}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {ALL_SIZES.map((s) => <SelectItem key={s} value={s}>{SIZE_LABELS[s]}</SelectItem>)}
            </SelectContent>
          </Select>
        )} />
        <FieldError message={errors.companySize?.message} />
      </div>
      {!isEdit && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="l-msg" className="text-sm font-medium">Message</label>
          <textarea id="l-msg" placeholder="Describe what the lead is interested in…" rows={3}
            className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none"
            {...register("message")} />
        </div>
      )}
      <DialogFooter showCloseButton>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="size-3.5 animate-spin" />}
          {isPending ? "Saving…" : isEdit ? "Save changes" : "Create lead"}
        </Button>
      </DialogFooter>
    </form>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Status Change Dialog
// ─────────────────────────────────────────────────────────────────────────────

function ChangeStatusDialog({ lead, onClose, onStatusChanged }: {
  lead: Lead
  onClose: () => void
  onStatusChanged?: (newStatus: LeadStatus) => void
}) {
  const statusMutation  = useChangeLeadStatusMutation()
  const convertMutation = useConvertLeadMutation()
  const [value, setValue] = React.useState<LeadStatus>(lead.status)

  const isPending = statusMutation.isPending || convertMutation.isPending

  function handleUpdate() {
    if (value === lead.status) { onClose(); return }
    statusMutation.mutate(
      { id: lead.id, dto: { newStatus: value } },
      {
        onSuccess: () => {
          // If WON and not yet converted → auto-convert to customer
          if (value === "WON" && !lead.conversion.isConverted) {
            convertMutation.mutate(lead.id, {
              onSuccess: () => {
                onStatusChanged?.(value)
                onClose()
              },
              onError: () => {
                // Status was changed but convert failed — still close and notify
                onStatusChanged?.(value)
                onClose()
              },
            })
          } else {
            onStatusChanged?.(value)
            onClose()
          }
        },
      },
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Current: <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[lead.status]}`}>{STATUS_LABELS[lead.status]}</span>
      </p>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">New status</label>
        <Select value={value} onValueChange={(v) => setValue(v as LeadStatus)}>
          <SelectTrigger className="w-full"><SelectValue>{STATUS_LABELS[value]}</SelectValue></SelectTrigger>
          <SelectContent>
            {ALL_STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {value === "WON" && !lead.conversion.isConverted && (
        <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-900/10 px-3 py-2.5">
          <p className="text-sm font-medium text-green-700 dark:text-green-400 flex items-center gap-1.5">
            <CheckCircle2 className="size-4 shrink-0" />
            This lead will be automatically converted to a customer.
          </p>
          <p className="text-xs text-green-600 dark:text-green-500 mt-1">
            They will be removed from the leads list and appear in your Customers section.
          </p>
        </div>
      )}
      {value === "WON" && lead.conversion.isConverted && (
        <p className="text-xs text-muted-foreground rounded-lg border bg-muted/40 px-3 py-2">
          This lead is already converted to a customer.
        </p>
      )}
      <DialogFooter showCloseButton>
        <Button onClick={handleUpdate} disabled={isPending}>
          {isPending && <Loader2 className="size-3.5 animate-spin" />}
          {isPending
            ? (convertMutation.isPending ? "Converting…" : "Updating…")
            : "Update status"}
        </Button>
      </DialogFooter>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Add Note Dialog
// ─────────────────────────────────────────────────────────────────────────────

function AddNoteDialog({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const mutation = useAddLeadNoteMutation()
  const [content, setContent] = React.useState("")
  return (
    <div className="flex flex-col gap-4">
      {lead.engagement.latestNote && (
        <div className="rounded-lg border bg-muted/40 p-3">
          <p className="text-xs font-medium text-muted-foreground mb-1">Latest note</p>
          <p className="text-sm">{lead.engagement.latestNote.content}</p>
          <p className="text-xs text-muted-foreground mt-1">— {lead.engagement.latestNote.author.name} · {fmtDate(lead.engagement.latestNote.createdAt)}</p>
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="note-c" className="text-sm font-medium">New note <span className="text-destructive">*</span></label>
        <textarea id="note-c" placeholder="Add a note…" rows={4} value={content} onChange={(e) => setContent(e.target.value)}
          className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none" />
      </div>
      <DialogFooter showCloseButton>
        <Button onClick={() => mutation.mutate({ id: lead.id, dto: { content: content.trim() } }, { onSuccess: onClose })} disabled={mutation.isPending || !content.trim()}>
          {mutation.isPending && <Loader2 className="size-3.5 animate-spin" />}
          {mutation.isPending ? "Adding…" : "Add note"}
        </Button>
      </DialogFooter>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Single Delete Dialog
// ─────────────────────────────────────────────────────────────────────────────

function DeleteDialog({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const mutation = useDeleteLeadMutation()
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Delete <span className="font-semibold text-foreground">{lead.name}</span> from <span className="font-semibold text-foreground">{lead.companyName}</span>? This cannot be undone.
      </p>
      <DialogFooter showCloseButton>
        <Button variant="destructive" disabled={mutation.isPending} onClick={() => mutation.mutate(lead.id, { onSuccess: onClose })}>
          {mutation.isPending && <Loader2 className="size-3.5 animate-spin" />}
          {mutation.isPending ? "Deleting…" : "Delete lead"}
        </Button>
      </DialogFooter>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Bulk Delete Confirm Dialog
// ─────────────────────────────────────────────────────────────────────────────

function BulkDeleteDialog({
  count,
  onClose,
  onConfirm,
  isDeleting,
  progress,
}: {
  count: number
  onClose: () => void
  onConfirm: () => void
  isDeleting: boolean
  progress: number
}) {
  if (isDeleting) {
    const pct = count > 0 ? Math.round((progress / count) * 100) : 0
    return (
      <div className="flex flex-col items-center gap-4 py-4">
        <Loader2 className="size-8 animate-spin text-destructive" />
        <div className="text-center">
          <p className="text-sm font-semibold">Deleting contacts…</p>
          <p className="text-xs text-muted-foreground mt-1">{progress} of {count}</p>
        </div>
        <div className="w-full rounded-full bg-muted h-1.5 overflow-hidden">
          <div className="h-full rounded-full bg-destructive transition-all duration-200" style={{ width: `${pct}%` }} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
        <p className="text-sm font-medium text-destructive">This action cannot be undone</p>
        <p className="text-xs text-muted-foreground mt-1">
          You are about to permanently delete <strong>{count} contact{count !== 1 ? "s" : ""}</strong> from your leads pipeline.
        </p>
      </div>
      <DialogFooter showCloseButton>
        <Button variant="destructive" onClick={onConfirm}>
          <Trash2 className="size-3.5" />
          Delete {count} contact{count !== 1 ? "s" : ""}
        </Button>
      </DialogFooter>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Lead Detail Panel (WA imports) — full structured display
// ─────────────────────────────────────────────────────────────────────────────

function LeadDetail({ lead, onOpenWhatsApp }: { lead: Lead; onOpenWhatsApp?: (lead: Lead) => void }) {
  const wa = parseWaMessage(lead.message)
  const isWa = wa !== null

  return (
    <div className="flex flex-col gap-4 w-full min-w-0">
      {/* Status + converted */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_CLASS[lead.status]}`}>
          {STATUS_LABELS[lead.status]}
        </span>
        {lead.conversion.isConverted && (
          <Badge variant="outline" className="text-green-600 border-green-300">Customer</Badge>
        )}
      </div>

      {/* Contact info */}
      <div className="rounded-xl border divide-y w-full overflow-hidden">
        {lead.phone && (
          <div className="flex items-center gap-3 px-3 py-2.5 min-w-0">
            <Phone className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="text-sm flex-1 min-w-0 truncate">{lead.phone}</span>
            <button
              onClick={() => onOpenWhatsApp?.(lead)}
              className="ml-auto flex items-center gap-1 text-xs text-green-600 hover:underline shrink-0"
            >
              <MessageCircle className="size-3" />WhatsApp
            </button>
          </div>
        )}
        <div className="flex items-center gap-3 px-3 py-2.5 min-w-0">
          <Mail className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="text-sm truncate flex-1 min-w-0">{lead.email ?? <span className="text-muted-foreground italic">No email</span>}</span>
        </div>
        {isWa && wa.page && (
          <div className="flex items-center gap-3 px-3 py-2.5 min-w-0">
            <Globe className="size-3.5 shrink-0 text-muted-foreground" />
            <a href={wa.page} target="_blank" rel="noopener noreferrer"
              className="text-sm text-primary underline-offset-4 hover:underline truncate flex-1 min-w-0 flex items-center gap-1">
              Facebook page <ExternalLink className="size-3 shrink-0" />
            </a>
          </div>
        )}
        {isWa && wa.website && (
          <div className="flex items-center gap-3 px-3 py-2.5 min-w-0">
            <LinkIcon className="size-3.5 shrink-0 text-muted-foreground" />
            <a href={wa.website.startsWith("http") ? wa.website : `https://${wa.website}`}
              target="_blank" rel="noopener noreferrer"
              className="text-sm text-primary underline-offset-4 hover:underline truncate flex-1 min-w-0 flex items-center gap-1">
              {wa.website} <ExternalLink className="size-3 shrink-0" />
            </a>
          </div>
        )}
      </div>

      {/* About */}
      {isWa && wa.about && (
        <div className="rounded-xl border bg-muted/30 px-3 py-2.5 w-full min-w-0">
          <p className="text-xs font-medium text-muted-foreground mb-1">About</p>
          <p className="text-sm leading-relaxed break-words">{wa.about}</p>
        </div>
      )}

      {/* Location */}
      {isWa && (wa.province || wa.district || wa.address) && (
        <div className="rounded-xl border divide-y w-full overflow-hidden">
          <div className="px-3 py-2 bg-muted/30">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <MapPin className="size-3" />Location
            </p>
          </div>
          {wa.province && (
            <div className="flex items-center justify-between px-3 py-2.5 gap-3 min-w-0">
              <span className="text-xs text-muted-foreground shrink-0">Province</span>
              <span className="text-sm font-medium text-right truncate">{wa.province}</span>
            </div>
          )}
          {wa.district && (
            <div className="flex items-center justify-between px-3 py-2.5 gap-3 min-w-0">
              <span className="text-xs text-muted-foreground shrink-0">District</span>
              <span className="text-sm font-medium text-right truncate">{wa.district}</span>
            </div>
          )}
          {wa.address && (
            <div className="flex items-start justify-between px-3 py-2.5 gap-3 min-w-0">
              <span className="text-xs text-muted-foreground shrink-0">Full address</span>
              <span className="text-sm text-right text-muted-foreground break-words min-w-0">{wa.address}</span>
            </div>
          )}
        </div>
      )}

      {/* Page stats */}
      {isWa && (wa.likes || wa.talking || wa.created || wa.rank) && (
        <div className="rounded-xl border divide-y w-full overflow-hidden">
          <div className="px-3 py-2 bg-muted/30">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Building2 className="size-3" />Page stats
            </p>
          </div>
          {wa.likes && (
            <div className="flex items-center justify-between px-3 py-2.5 gap-2 min-w-0">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5 shrink-0"><ThumbsUp className="size-3" />Likes</span>
              <span className="text-sm font-medium tabular-nums">{Number(wa.likes).toLocaleString()}</span>
            </div>
          )}
          {wa.talking && (
            <div className="flex items-center justify-between px-3 py-2.5 gap-2 min-w-0">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5 shrink-0"><MessageCircle className="size-3" />Talking about</span>
              <span className="text-sm font-medium tabular-nums">{Number(wa.talking).toLocaleString()}</span>
            </div>
          )}
          {wa.created && (
            <div className="flex items-center justify-between px-3 py-2.5 gap-2 min-w-0">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5 shrink-0"><Calendar className="size-3" />Page created</span>
              <span className="text-sm font-medium">{wa.created}</span>
            </div>
          )}
          {wa.rank && (
            <div className="flex items-center justify-between px-3 py-2.5 gap-2 min-w-0">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5 shrink-0"><Hash className="size-3" />Rank</span>
              <span className="text-sm font-medium tabular-nums">{wa.rank}</span>
            </div>
          )}
        </div>
      )}

      {/* Latest note */}
      {lead.engagement.notesCount > 0 && lead.engagement.latestNote && (
        <div className="rounded-xl border bg-muted/30 p-3 w-full min-w-0">
          <p className="text-xs font-medium text-muted-foreground mb-1.5">
            Latest note ({lead.engagement.notesCount} total)
          </p>
          <p className="text-sm leading-relaxed break-words">{lead.engagement.latestNote.content}</p>
          <p className="text-xs text-muted-foreground mt-1.5">
            — {lead.engagement.latestNote.author.name} · {fmtDate(lead.engagement.latestNote.createdAt)}
          </p>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Added {fmtDate(lead.createdAt)} · {lead.engagement.daysOpen === 0 ? "Today" : `${lead.engagement.daysOpen}d open`}
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// WhatsApp Import Dialog
// ─────────────────────────────────────────────────────────────────────────────

function WhatsAppImportDialog({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const [preview,    setPreview]    = React.useState<PreviewRow[]>([])
  const [parseError, setParseError] = React.useState<string | null>(null)
  const [checking,   setChecking]   = React.useState(false)
  const [importing,  setImporting]  = React.useState(false)
  const [progress,   setProgress]   = React.useState(0)
  const [total,      setTotal]      = React.useState(0)
  const [done,       setDone]       = React.useState(false)
  const [results,    setResults]    = React.useState({ ok: 0, skipped: 0, duplicates: 0 })
  const [fileName,   setFileName]   = React.useState<string | null>(null)
  const fileRef = React.useRef<HTMLInputElement>(null)
  const createMutation = useCreateLeadMutation()

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setParseError(null); setPreview([]); setDone(false); setFileName(file.name)
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const raw = JSON.parse(reader.result as string)
        const entries: FacebookPageEntry[] = Array.isArray(raw) ? raw : [raw]
        const base: PreviewRow[] = entries.map((en, i) => {
          const { province, district } = parseAddress(en.address)
          return {
            ...en, _idx: i,
            _valid: !!en.name?.trim(),
            _reason: en.name?.trim() ? undefined : "Missing name",
            _duplicate: false,
            _province: province,
            _district: district,
          }
        })
        setChecking(true); setPreview(base)

        const existingKeys = new Set<string>()
        let pg = 1
        while (true) {
          const res = await leadService.getAll({ page: pg, limit: 200 })
          res.data.filter((l) => l.message?.includes(WA_SOURCE_TAG))
            .forEach((l) => existingKeys.add(dedupKey(l.name, l.phone)))
          if (pg >= res.meta.totalPages) break
          pg++
        }

        const seenInFile = new Set<string>()
        setPreview(base.map((row) => {
          if (!row._valid) return row
          const key = dedupKey(row.name, firstPhone(row))
          if (existingKeys.has(key) || seenInFile.has(key)) return { ...row, _duplicate: true }
          seenInFile.add(key)
          return row
        }))
        setChecking(false)
      } catch {
        setParseError("Could not parse the file. Make sure it's valid JSON.")
        setChecking(false)
      }
    }
    reader.readAsText(file)
  }

  const validRows     = preview.filter((r) => r._valid && !r._duplicate)
  const invalidRows   = preview.filter((r) => !r._valid)
  const duplicateRows = preview.filter((r) => r._valid && r._duplicate)

  async function handleImport() {
    if (validRows.length === 0) return
    setImporting(true); setProgress(0); setTotal(validRows.length)
    let ok = 0; let skipped = 0

    const tasks = validRows.map((row) => async () => {
      const email = firstEmail(row) || syntheticEmail(row)
      const { province, district, fullAddress } = parseAddress(row.address)

      const msgParts: string[] = [WA_SOURCE_TAG]
      if (row.about?.trim())                 msgParts.push(`About: ${row.about.trim()}`)
      if (province)                           msgParts.push(`Province: ${province}`)
      if (district)                           msgParts.push(`District: ${district}`)
      if (fullAddress)                        msgParts.push(`Address: ${fullAddress}`)
      if (row.url?.trim())                    msgParts.push(`Page: ${row.url.trim()}`)
      if (row.website?.trim())                msgParts.push(`Website: ${row.website.trim()}`)
      if (row.likes != null)                  msgParts.push(`Likes: ${row.likes}`)
      if (row.talking_about != null)          msgParts.push(`Talking: ${row.talking_about}`)
      if (row.page_created_date?.trim())      msgParts.push(`Created: ${row.page_created_date.trim()}`)
      if (row.rank != null)                   msgParts.push(`Rank: ${row.rank}`)

      // Call service directly to skip per-item mutation toasts
      await leadService.create({
        name:        row.name.trim(),
        email,
        phone:       firstPhone(row),
        companyName: row.category?.trim() || row.name.trim(),
        companySize: "MICRO",
        message:     msgParts.join("\n"),
      })
    })

    const settled = await runInBatches(tasks, BATCH_SIZE, (n) => setProgress(n))
    settled.forEach((r) => r.status === "fulfilled" ? ok++ : skipped++)
    setResults({ ok, skipped, duplicates: duplicateRows.length })
    setImporting(false); setDone(true)

    // Single summary toast
    toast.add({
      title: `Import complete — ${ok} leads added`,
      description: [
        duplicateRows.length > 0 ? `${duplicateRows.length} duplicates skipped` : null,
        skipped > 0 ? `${skipped} failed` : null,
      ].filter(Boolean).join(" · ") || undefined,
      type: ok > 0 ? "success" : "warning",
    })

    onImported()
  }

  // ── Done ─────────────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="flex flex-col items-center gap-5 py-2">
        <div className="flex size-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 ring-4 ring-green-100 dark:ring-green-900/20">
          <CheckCircle2 className="size-8 text-green-600 dark:text-green-400" />
        </div>
        <div className="text-center">
          <p className="text-base font-semibold">Import complete</p>
          <p className="text-sm text-muted-foreground mt-1">All contacts have been processed.</p>
        </div>
        <div className="grid grid-cols-3 gap-3 w-full">
          <div className="rounded-xl border bg-green-50 dark:bg-green-900/10 p-3 text-center">
            <p className="text-xl font-bold text-green-700 dark:text-green-400">{results.ok}</p>
            <p className="text-xs text-green-600 dark:text-green-500 mt-0.5">Imported</p>
          </div>
          <div className="rounded-xl border bg-yellow-50 dark:bg-yellow-900/10 p-3 text-center">
            <p className="text-xl font-bold text-yellow-700 dark:text-yellow-400">{results.duplicates}</p>
            <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-0.5">Duplicates</p>
          </div>
          <div className="rounded-xl border bg-red-50 dark:bg-red-900/10 p-3 text-center">
            <p className="text-xl font-bold text-red-700 dark:text-red-400">{results.skipped}</p>
            <p className="text-xs text-red-600 dark:text-red-500 mt-0.5">Failed</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          New contacts are in the <strong>WhatsApp</strong> tab with status <strong>New</strong>.
        </p>
        <DialogFooter><Button onClick={onClose} className="w-full sm:w-auto">Done</Button></DialogFooter>
      </div>
    )
  }

  // ── Progress ─────────────────────────────────────────────────────────────
  if (importing) {
    const pct = total > 0 ? Math.round((progress / total) * 100) : 0
    return (
      <div className="flex flex-col items-center gap-5 py-2">
        <div className="relative flex size-20 items-center justify-center">
          <svg className="absolute inset-0 size-20 -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="34" fill="none" strokeWidth="6" className="stroke-muted" />
            <circle cx="40" cy="40" r="34" fill="none" strokeWidth="6"
              strokeLinecap="round" className="stroke-primary transition-all duration-300"
              strokeDasharray={`${2 * Math.PI * 34}`}
              strokeDashoffset={`${2 * Math.PI * 34 * (1 - pct / 100)}`}
            />
          </svg>
          <span className="text-sm font-bold tabular-nums">{pct}%</span>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold">Importing leads…</p>
          <p className="text-xs text-muted-foreground mt-1">{progress} of {total} contacts</p>
        </div>
        <div className="w-full rounded-full bg-muted h-1.5 overflow-hidden">
          <div className="h-full rounded-full bg-primary transition-all duration-200" style={{ width: `${pct}%` }} />
        </div>
      </div>
    )
  }

  // ── Main form ─────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">
      {/* Drop zone */}
      <div
        role="button" tabIndex={0} aria-label="Upload JSON file"
        className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 gap-3 cursor-pointer transition-colors outline-none
          ${fileName && !parseError ? "border-green-400 bg-green-50 dark:bg-green-900/10" : "border-border hover:border-primary/50 hover:bg-muted/30"}
          focus-visible:ring-2 focus-visible:ring-ring`}
        onClick={() => fileRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          const file = e.dataTransfer.files?.[0]
          if (file && fileRef.current) {
            const dt = new DataTransfer(); dt.items.add(file); fileRef.current.files = dt.files
            fileRef.current.dispatchEvent(new Event("change", { bubbles: true }))
          }
        }}
      >
        <div className={`flex size-12 items-center justify-center rounded-xl ${fileName && !parseError ? "bg-green-100 dark:bg-green-900/30" : "bg-muted"}`}>
          <FileJson className={`size-6 ${fileName && !parseError ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`} />
        </div>
        <div className="text-center">
          {fileName && !parseError ? (
            <><p className="text-sm font-medium text-green-700 dark:text-green-400">{fileName}</p><p className="text-xs text-muted-foreground mt-0.5">Click to replace file</p></>
          ) : (
            <><p className="text-sm font-medium">Drop JSON file here or click to browse</p><p className="text-xs text-muted-foreground mt-0.5">Facebook Pages export format · .json</p></>
          )}
        </div>
        <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={handleFile} />
      </div>

      {parseError && (
        <div className="flex items-start gap-2.5 rounded-xl border border-destructive/40 bg-destructive/5 px-3.5 py-3">
          <AlertCircle className="size-4 shrink-0 text-destructive mt-0.5" />
          <div>
            <p className="text-sm font-medium text-destructive">Failed to parse file</p>
            <p className="text-xs text-destructive/80 mt-0.5">{parseError}</p>
          </div>
        </div>
      )}

      {checking && (
        <div className="flex items-center gap-2.5 rounded-xl border bg-muted/40 px-3.5 py-3">
          <Loader2 className="size-4 animate-spin shrink-0 text-primary" />
          <div>
            <p className="text-sm font-medium">Checking for duplicates…</p>
            <p className="text-xs text-muted-foreground mt-0.5">Scanning existing leads in your database</p>
          </div>
        </div>
      )}

      {!checking && preview.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border bg-green-50 dark:bg-green-900/10 px-3 py-2.5 text-center">
              <p className="text-lg font-bold text-green-700 dark:text-green-400 leading-none">{validRows.length}</p>
              <p className="text-[10px] text-green-600 dark:text-green-500 mt-1 uppercase tracking-wide font-medium">Ready</p>
            </div>
            <div className="rounded-xl border bg-yellow-50 dark:bg-yellow-900/10 px-3 py-2.5 text-center">
              <p className="text-lg font-bold text-yellow-700 dark:text-yellow-400 leading-none">{duplicateRows.length}</p>
              <p className="text-[10px] text-yellow-600 dark:text-yellow-500 mt-1 uppercase tracking-wide font-medium">Duplicate</p>
            </div>
            <div className="rounded-xl border bg-red-50 dark:bg-red-900/10 px-3 py-2.5 text-center">
              <p className="text-lg font-bold text-red-700 dark:text-red-400 leading-none">{invalidRows.length}</p>
              <p className="text-[10px] text-red-600 dark:text-red-500 mt-1 uppercase tracking-wide font-medium">Invalid</p>
            </div>
          </div>

          <div className="rounded-xl border overflow-hidden">
            <div className="bg-muted/50 px-3 py-2 flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Preview — {preview.length} entries</p>
              {preview.length > 100 && <p className="text-[10px] text-muted-foreground">Showing first 100</p>}
            </div>
            <div className="overflow-y-auto max-h-52">
              <table className="w-full table-fixed text-sm">
                <thead className="sticky top-0 bg-background border-b">
                  <tr>
                    <th className="text-left px-3 py-1.5 text-xs font-medium text-muted-foreground w-7">#</th>
                    <th className="text-left px-3 py-1.5 text-xs font-medium text-muted-foreground w-[35%]">Name</th>
                    <th className="text-left px-3 py-1.5 text-xs font-medium text-muted-foreground w-[22%]">Category</th>
                    <th className="text-left px-3 py-1.5 text-xs font-medium text-muted-foreground">Province</th>
                    <th className="text-left px-3 py-1.5 text-xs font-medium text-muted-foreground w-16">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {preview.slice(0, 100).map((row) => (
                    <tr key={row._idx} className={!row._valid || row._duplicate ? "opacity-40" : ""}>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{row._idx + 1}</td>
                      <td className="px-3 py-2">
                        <p className="font-medium truncate text-xs leading-tight">{row.name ?? "—"}</p>
                        <p className="text-[10px] text-muted-foreground truncate leading-tight mt-0.5">{firstPhone(row) ?? firstEmail(row) ?? "—"}</p>
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground truncate">{row.category ?? "—"}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground truncate">{row._province ?? "—"}</td>
                      <td className="px-3 py-2">
                        {!row._valid
                          ? <span className="inline-flex rounded-full bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-1.5 py-0.5 text-[10px] font-medium">Invalid</span>
                          : row._duplicate
                          ? <span className="inline-flex rounded-full bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 px-1.5 py-0.5 text-[10px] font-medium">Dupe</span>
                          : <span className="inline-flex rounded-full bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-1.5 py-0.5 text-[10px] font-medium">New</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {duplicateRows.length > 0 && (
            <div className="flex items-start gap-2 rounded-xl border border-yellow-500/30 bg-yellow-50 dark:bg-yellow-900/10 px-3 py-2.5">
              <AlertCircle className="size-3.5 shrink-0 text-yellow-600 mt-0.5" />
              <p className="text-xs text-yellow-700 dark:text-yellow-400">
                {duplicateRows.length} {duplicateRows.length === 1 ? "entry already exists" : "entries already exist"} in your pipeline and will be skipped.
              </p>
            </div>
          )}
        </div>
      )}

      <DialogFooter showCloseButton>
        <Button onClick={handleImport} disabled={validRows.length === 0 || checking}
          className={validRows.length > 0 ? "bg-green-600 hover:bg-green-700 text-white" : ""}>
          {checking
            ? <><Loader2 className="size-3.5 animate-spin" />Checking…</>
            : <><Upload className="size-3.5" />Import {validRows.length > 0 ? `${validRows.length} leads` : ""}</>
          }
        </Button>
      </DialogFooter>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// WhatsApp Broadcast Dialog
// ─────────────────────────────────────────────────────────────────────────────

function WhatsAppBroadcastDialog({
  leads,
  onClose,
  onOpenWhatsApp,
}: {
  leads: Lead[]
  onClose: () => void
  onOpenWhatsApp: (lead: Lead, message?: string) => void
}) {
  const [message, setMessage] = React.useState("")
  const [sent,    setSent]    = React.useState<Set<number>>(new Set())
  const withPhone = leads.filter((l) => l.phone?.trim())

  function handleOpen(lead: Lead) {
    onOpenWhatsApp(lead, message)
    setSent((prev) => new Set([...prev, lead.id]))
  }

  return (
    <div className="flex flex-col gap-4 w-full min-w-0">
      <p className="text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">{withPhone.length}</span> of {leads.length} selected contacts have a phone number.
      </p>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="wa-msg" className="text-sm font-medium">Message (optional)</label>
        <textarea id="wa-msg" rows={3} placeholder="Type a pre-filled message…" value={message} onChange={(e) => setMessage(e.target.value)}
          className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none" />
      </div>
      <div className="rounded-lg border w-full overflow-hidden">
        <div className="overflow-y-auto max-h-56 divide-y">
          {withPhone.map((lead) => (
            <div key={lead.id} className="flex items-center gap-3 px-3 py-2 min-w-0">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{lead.name}</p>
                <p className="text-xs text-muted-foreground truncate">{lead.phone}</p>
              </div>
              <Button size="sm" variant={sent.has(lead.id) ? "outline" : "default"}
                className={`shrink-0 ${sent.has(lead.id) ? "text-green-600 border-green-300" : "bg-green-600 hover:bg-green-700 text-white"}`}
                onClick={() => handleOpen(lead)}>
                <MessageCircle className="size-3.5" />{sent.has(lead.id) ? "Sent" : "Open"}
              </Button>
            </div>
          ))}
          {withPhone.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No contacts with phone numbers selected.</p>}
        </div>
      </div>
      <DialogFooter showCloseButton>
        <Button onClick={() => withPhone.forEach((l) => handleOpen(l))} disabled={withPhone.length === 0} className="bg-green-600 hover:bg-green-700 text-white">
          <MessageCircle className="size-4" />Open all {withPhone.length} in WhatsApp
        </Button>
      </DialogFooter>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

type Tab = "all" | "whatsapp"
type DialogKind = "edit" | "status" | "note" | "delete" | "detail"
interface ActiveDialog { kind: DialogKind; lead: Lead }

export default function LeadsPage() {
  const [tab,              setTab]            = React.useState<Tab>("all")
  const [search,           setSearch]         = React.useState("")
  const [statusFilter,     setStatusFilter]   = React.useState<LeadStatus | "ALL">("ALL")
  const [categoryFilter,   setCategoryFilter] = React.useState("ALL")
  const [provinceFilter,   setProvinceFilter] = React.useState("ALL")
  const [page,             setPage]           = React.useState(1)
  const [createOpen,       setCreateOpen]     = React.useState(false)
  const [importOpen,       setImportOpen]     = React.useState(false)
  const [broadcastOpen,    setBroadcastOpen]  = React.useState(false)
  const [bulkDeleteOpen,   setBulkDeleteOpen] = React.useState(false)
  const [bulkDeleting,     setBulkDeleting]   = React.useState(false)
  const [bulkProgress,     setBulkProgress]   = React.useState(0)
  const [active,           setActive]         = React.useState<ActiveDialog | null>(null)
  const [selected,         setSelected]       = React.useState<Set<number>>(new Set())
  const closeDialog = () => setActive(null)
  const queryClient = useQueryClient()

  // ── Exhaustive metadata fetch (categories, provinces, districts) ───────────
  const [categories,  setCategories]  = React.useState<string[]>([])
  const [provinces,   setProvinces]   = React.useState<string[]>([])
  const [districts,   setDistricts]   = React.useState<string[]>([])
  const [metaVersion, setMetaVersion] = React.useState(0)

  React.useEffect(() => {
    let cancelled = false
    async function fetchMeta() {
      const cats  = new Set<string>()
      const provs = new Set<string>()
      const dists = new Set<string>()
      let pg = 1
      while (true) {
        const res = await leadService.getAll({ page: pg, limit: 200 })
        if (cancelled) return
        res.data
          .filter((l) => l.message?.includes(WA_SOURCE_TAG))
          .forEach((l) => {
            if (l.companyName?.trim()) cats.add(l.companyName.trim())
            const prov = toTitleCase(extractField(l.message, "Province"))
            const dist = toTitleCase(extractField(l.message, "District"))
            if (prov) provs.add(prov)
            if (dist) dists.add(dist)
          })
        if (pg >= res.meta.totalPages) break
        pg++
      }
      if (!cancelled) {
        setCategories(Array.from(cats).sort((a, b) => a.localeCompare(b)))
        setProvinces(Array.from(provs).sort((a, b) => a.localeCompare(b)))
        setDistricts(Array.from(dists).sort((a, b) => a.localeCompare(b)))
      }
    }
    fetchMeta()
    return () => { cancelled = true }
  }, [metaVersion])

  // Auto-reset district when province changes (only keep districts of selected province)
  // (district filter removed — province filter is sufficient)

  // Reset page on any filter change
  React.useEffect(() => { setPage(1) }, [search, statusFilter, categoryFilter, provinceFilter, tab])

  // Full WA leads dataset — fetched exhaustively when on the WA tab
  // Used for filters that must span all pages (province, district, category, search)
  const [allWaLeads,  setAllWaLeads]  = React.useState<Lead[]>([])
  const [allWaFetching, setAllWaFetching] = React.useState(false)

  React.useEffect(() => {
    if (tab !== "whatsapp") return
    let cancelled = false
    async function fetchAllWa() {
      setAllWaFetching(true)
      const all: Lead[] = []
      let pg = 1
      while (true) {
        const res = await leadService.getAll({ page: pg, limit: 200,
          ...(statusFilter !== "ALL" ? { status: statusFilter } : {}) })
        if (cancelled) return
        all.push(...res.data.filter((l) => l.message?.includes(WA_SOURCE_TAG)))
        if (pg >= res.meta.totalPages) break
        pg++
      }
      if (!cancelled) { setAllWaLeads(all); setAllWaFetching(false) }
    }
    fetchAllWa()
    return () => { cancelled = true }
  // Refetch whenever tab switches to WA, status changes, or meta (import/delete) changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, statusFilter, metaVersion])

  const { data, isLoading } = useListLeadsQuery({
    ...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
    page,
    limit: PAGE_SIZE,
  })

  const changeStatusMutation = useChangeLeadStatusMutation()

  // Opens WhatsApp for a lead and auto-marks them as CONTACTED if still NEW
  function openWhatsAppAndMarkContacted(lead: Lead, message = "") {
    if (!lead.phone) return
    const num = lead.phone.replace(/\D/g, "")
    const url = `https://wa.me/${num}${message.trim() ? `?text=${encodeURIComponent(message.trim())}` : ""}`
    // Use a named target so the browser reuses the same WhatsApp tab instead of opening a new one each time
    window.open(url, "whatsapp_web", "noopener,noreferrer")
    if (lead.status === "NEW") {
      changeStatusMutation.mutate(
        { id: lead.id, dto: { newStatus: "CONTACTED" } },
        { onSuccess: () => setMetaVersion((v) => v + 1) },
      )
    }
  }

  const allLeads = data?.data ?? []

  // Tab filter — for the "All" tab use server data; WA tab uses exhaustive fetch
  const isWaTab = tab === "whatsapp"

  const tabFiltered = React.useMemo(() => {
    if (isWaTab) return allWaLeads  // always use full dataset on WA tab
    return allLeads
  }, [allLeads, allWaLeads, isWaTab])

  // Client-side filters: search + category + province + district
  const filtered = React.useMemo(() => {
    const q    = search.trim().toLowerCase()
    const cat  = categoryFilter  !== "ALL" ? categoryFilter.toLowerCase()  : null
    const prov = provinceFilter  !== "ALL" ? provinceFilter.toLowerCase()  : null

    return tabFiltered.filter((l) => {
      if (cat && l.companyName?.toLowerCase() !== cat) return false
      if (prov) {
        const lProv = toTitleCase(extractField(l.message, "Province")).toLowerCase()
        if (lProv !== prov) return false
      }
      if (!q) return true
      return (
        l.name.toLowerCase().includes(q) ||
        (l.email ?? "").toLowerCase().includes(q) ||
        l.companyName.toLowerCase().includes(q) ||
        (l.phone ?? "").includes(q) ||
        toTitleCase(extractField(l.message, "Province")).toLowerCase().includes(q) ||
        extractField(l.message, "Address").toLowerCase().includes(q)
      )
    })
  }, [tabFiltered, search, categoryFilter, provinceFilter])

  // Stats — for all-leads tab use server data; for WA tab use full dataset
  const total    = isWaTab ? allWaLeads.length : (data?.meta.total ?? 0)
  const wonCount = allLeads.filter((l) => l.status === "WON").length
  const newCount = allLeads.filter((l) => l.status === "NEW").length
  const avgDays  = allLeads.length
    ? (allLeads.reduce((s, l) => s + l.engagement.daysOpen, 0) / allLeads.length).toFixed(0)
    : "0"

  const waContacted = allWaLeads.filter((l) => l.status === "CONTACTED").length
  const waWon       = allWaLeads.filter((l) => l.status === "WON").length
  const waConverted = allWaLeads.filter((l) => l.conversion.isConverted).length

  // Selection
  const selectedLeads = filtered.filter((l) => selected.has(l.id))
  function toggleSelect(id: number) {
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  function toggleAll() {
    if (filtered.every((l) => selected.has(l.id))) {
      setSelected((prev) => { const n = new Set(prev); filtered.forEach((l) => n.delete(l.id)); return n })
    } else {
      setSelected((prev) => new Set([...prev, ...filtered.map((l) => l.id)]))
    }
  }
  function clearSelection() { setSelected(new Set()) }
  const allSelected  = filtered.length > 0 && filtered.every((l) => selected.has(l.id))
  const someSelected = selected.size > 0

  // Bulk delete — call service directly to suppress per-item mutation toasts
  async function handleBulkDelete() {
    setBulkDeleting(true); setBulkProgress(0)
    const ids = Array.from(selected)
    let ok = 0; let failed = 0
    for (let i = 0; i < ids.length; i++) {
      try {
        await leadService.delete(ids[i])
        ok++
      } catch {
        failed++
      }
      setBulkProgress(i + 1)
    }
    setBulkDeleting(false); setBulkDeleteOpen(false)
    clearSelection()
    setMetaVersion((v) => v + 1)
    // Invalidate leads list so table refreshes
    queryClient.invalidateQueries({ queryKey: ["leads"] })
    // Single summary toast
    toast.add({
      title: `${ok} contact${ok !== 1 ? "s" : ""} deleted`,
      description: failed > 0 ? `${failed} could not be deleted` : undefined,
      type: ok > 0 ? "success" : "error",
    })
  }

  const serverMeta    = data?.meta
  const serverPages   = serverMeta?.totalPages ?? 1
  // On WA tab we have all data in memory — paginate client-side
  const waPageCount   = Math.ceil(filtered.length / PAGE_SIZE) || 1
  const totalPages    = isWaTab ? waPageCount : serverPages
  const tableColCount = isWaTab ? 8 : 7

  // Client-side paging slice for WA tab
  const displayLeads = isWaTab
    ? filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    : filtered

  // Districts scoped to selected province — kept for potential future use but not rendered


  return (
    <div className="flex flex-col gap-5">

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your sales pipeline and WhatsApp outreach.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isWaTab && someSelected && (
            <>
              <Button variant="destructive" onClick={() => setBulkDeleteOpen(true)}>
                <Trash2 className="size-4" />Delete ({selected.size})
              </Button>
              <Button onClick={() => setBroadcastOpen(true)} className="bg-green-600 hover:bg-green-700 text-white">
                <MessageCircle className="size-4" />WhatsApp ({selected.size})
              </Button>
            </>
          )}
          {isWaTab && (
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <Upload className="size-4" />Import JSON
            </Button>
          )}
          {!isWaTab && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger render={<Button><Plus className="size-4" />New lead</Button>} />
              <DialogContent className="sm:max-w-lg">
                <DialogHeader><DialogTitle>New lead</DialogTitle></DialogHeader>
                <LeadForm onClose={() => setCreateOpen(false)} />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b">
        {(["all", "whatsapp"] as Tab[]).map((t) => (
          <button key={t}
            onClick={() => { setTab(t); clearSelection(); setCategoryFilter("ALL"); setProvinceFilter("ALL") }}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${tab === t ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            {t === "all" ? "All Leads" : (
              <span className="flex items-center gap-1.5"><MessageCircle className="size-3.5 text-green-500" />WhatsApp</span>
            )}
          </button>
        ))}
      </div>

      {/* Stats */}
      {!isWaTab ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Total leads"   value={total}    icon={Users}        color="text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400" />
          <StatCard label="New"           value={newCount} icon={TrendingUp}   color="text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400" />
          <StatCard label="Won"           value={wonCount} icon={CheckCircle2} color="text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400" />
          <StatCard label="Avg days open" value={avgDays}  icon={Clock}        color="text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="WA contacts" value={allWaLeads.length} icon={Users}        color="text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400" />
          <StatCard label="Contacted"   value={waContacted}       icon={PhoneCall}    color="text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400" />
          <StatCard label="Won"         value={waWon}             icon={TrendingUp}   color="text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400" sub="ready to convert" />
          <StatCard label="Converted"   value={waConverted}       icon={CheckCircle2} color="text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400" sub="now customers" />
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input placeholder={isWaTab ? "Search name, phone, address…" : "Search by name, email or company…"} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
        </div>
        {isWaTab && categories.length > 0 && (
          <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v ?? "ALL")}>
            <SelectTrigger className="w-44"><SelectValue>{categoryFilter === "ALL" ? "All categories" : categoryFilter}</SelectValue></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All categories</SelectItem>
              {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        {isWaTab && provinces.length > 0 && (
          <Select value={provinceFilter} onValueChange={(v) => setProvinceFilter(v ?? "ALL")}>
            <SelectTrigger className="w-40"><SelectValue>{provinceFilter === "ALL" ? "All provinces" : provinceFilter}</SelectValue></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All provinces</SelectItem>
              {provinces.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as LeadStatus | "ALL")}>
          <SelectTrigger className="w-44"><SelectValue>{statusFilter === "ALL" ? "All statuses" : STATUS_LABELS[statusFilter]}</SelectValue></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {ALL_STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Floating selection toolbar */}
      {isWaTab && someSelected && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-2.5 flex-wrap">
          <p className="text-sm font-medium">
            <span className="text-primary">{selected.size}</span> contact{selected.size !== 1 ? "s" : ""} selected
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={clearSelection}>Clear selection</Button>
            <Button variant="outline" size="sm" onClick={toggleAll}>
              {allSelected ? "Deselect all" : "Select all on page"}
            </Button>
            <Button size="sm" variant="destructive" onClick={() => setBulkDeleteOpen(true)}>
              <Trash2 className="size-3.5" />Delete {selected.size}
            </Button>
          </div>
        </div>
      )}

      {/* WA tab loading indicator */}
      {isWaTab && allWaFetching && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground px-1">
          <Loader2 className="size-4 animate-spin shrink-0" />
          Loading all WhatsApp contacts…
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {(isWaTab ? (!allWaFetching && filtered.length === 0) : (!isLoading && filtered.length === 0)) ? (
          <Empty className="border-0 rounded-xl bg-muted/20 min-h-64">
            <EmptyHeader>
              <EmptyMedia variant="icon">{isWaTab ? <MessageCircle className="size-4" /> : <TrendingUp className="size-4" />}</EmptyMedia>
              <EmptyTitle>{isWaTab ? "No WhatsApp contacts" : "No leads found"}</EmptyTitle>
              <EmptyDescription>
                {isWaTab ? "Import a JSON file to add WhatsApp contacts as leads."
                  : search || statusFilter !== "ALL" ? "No leads match your current filters."
                  : "No leads yet. Add your first lead to start the pipeline."}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              {isWaTab
                ? <Button size="sm" onClick={() => setImportOpen(true)}><Upload className="size-3.5" />Import JSON</Button>
                : <Button size="sm" onClick={() => setCreateOpen(true)}><Plus className="size-3.5" />New lead</Button>
              }
            </EmptyContent>
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {isWaTab && (
                  <TableHead className="w-8">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll}
                      className="rounded border-border accent-primary cursor-pointer" aria-label="Select all" />
                  </TableHead>
                )}
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                {isWaTab ? (
                  <>
                    <TableHead>Phone</TableHead>
                    <TableHead>Province</TableHead>
                    <TableHead>District</TableHead>
                  </>
                ) : (
                  <TableHead>Size</TableHead>
                )}
                <TableHead>Notes</TableHead>
                <TableHead className="w-28 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(isWaTab ? allWaFetching : isLoading) ? (
                <TableSkeleton cols={tableColCount} />
              ) : (
                displayLeads.map((lead) => {
                  const province = isWaTab ? toTitleCase(extractField(lead.message, "Province")) : ""
                  const district = isWaTab ? toTitleCase(extractField(lead.message, "District")) : ""
                  return (
                    <TableRow key={lead.id}
                      className={isWaTab ? "cursor-pointer hover:bg-muted/40" : undefined}
                      onClick={isWaTab ? () => setActive({ kind: "detail", lead }) : undefined}
                    >
                      {isWaTab && (
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <input type="checkbox" checked={selected.has(lead.id)} onChange={() => toggleSelect(lead.id)}
                            className="rounded border-border accent-primary cursor-pointer" aria-label="Select row" />
                        </TableCell>
                      )}
                      <TableCell>
                        <p className="font-medium leading-none text-sm">{lead.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[160px]">
                          {lead.email ?? lead.phone ?? "—"}
                        </p>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{lead.companyName}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[lead.status]}`}>
                          {STATUS_LABELS[lead.status]}
                        </span>
                        {lead.conversion.isConverted && (
                          <Badge variant="outline" className="ml-1.5 text-[10px] py-0">Customer</Badge>
                        )}
                      </TableCell>
                      {isWaTab ? (
                        <>
                          <TableCell className="text-sm text-muted-foreground">{lead.phone ?? "—"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{province || "—"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{district || "—"}</TableCell>
                        </>
                      ) : (
                        <TableCell className="text-muted-foreground text-xs">{SIZE_LABELS[lead.companySize]}</TableCell>
                      )}
                      <TableCell className="text-sm text-muted-foreground">{lead.engagement.notesCount}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {!isWaTab && (
                            <Button variant="ghost" size="icon-sm" aria-label="Edit" onClick={() => setActive({ kind: "edit", lead })}>
                              <Pencil className="size-3.5" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon-sm" aria-label="Change status" title="Change status"
                            onClick={() => setActive({ kind: "status", lead })}>
                            <ArrowRightLeft className="size-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" aria-label="Add note" title="Add note"
                            onClick={() => setActive({ kind: "note", lead })}>
                            <StickyNote className="size-3.5" />
                          </Button>
                          {isWaTab && lead.phone && (
                            <Button variant="ghost" size="icon-sm" title="Open in WhatsApp"
                              className="text-green-600 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                              onClick={() => openWhatsAppAndMarkContacted(lead)}>
                              <MessageCircle className="size-3.5" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon-sm" aria-label="Delete"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setActive({ kind: "delete", lead })}>
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      {(isWaTab ? filtered.length > PAGE_SIZE : total > 0) && !isLoading && !allWaFetching && (
        <PaginationBar
          page={page}
          totalPages={totalPages}
          total={isWaTab ? filtered.length : total}
          pageSize={PAGE_SIZE}
          onPage={setPage}
        />
      )}

      {/* Import dialog */}
      <Dialog open={importOpen} onOpenChange={(o) => { if (!o) setImportOpen(false) }}>
        <DialogContent className="w-full max-w-[calc(100%-2rem)] sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="size-4 text-green-500" />Import WhatsApp contacts from JSON
            </DialogTitle>
          </DialogHeader>
          <WhatsAppImportDialog
            onClose={() => setImportOpen(false)}
            onImported={() => setMetaVersion((v) => v + 1)}
          />
        </DialogContent>
      </Dialog>

      {/* Broadcast dialog */}
      <Dialog open={broadcastOpen} onOpenChange={(o) => { if (!o) setBroadcastOpen(false) }}>
        <DialogContent className="sm:max-w-md overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="size-4 text-green-500" />Send WhatsApp message
            </DialogTitle>
          </DialogHeader>
          <WhatsAppBroadcastDialog leads={selectedLeads} onClose={() => setBroadcastOpen(false)} onOpenWhatsApp={openWhatsAppAndMarkContacted} />
        </DialogContent>
      </Dialog>

      {/* Bulk delete confirm */}
      <Dialog open={bulkDeleteOpen} onOpenChange={(o) => { if (!o && !bulkDeleting) setBulkDeleteOpen(false) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete {selected.size} contact{selected.size !== 1 ? "s" : ""}</DialogTitle>
          </DialogHeader>
          <BulkDeleteDialog
            count={selected.size}
            onClose={() => setBulkDeleteOpen(false)}
            onConfirm={handleBulkDelete}
            isDeleting={bulkDeleting}
            progress={bulkProgress}
          />
        </DialogContent>
      </Dialog>

      {/* Unified action dialog */}
      <Dialog open={active !== null} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="w-full max-w-[calc(100%-2rem)] sm:max-w-lg overflow-hidden">
          {active?.kind === "detail" && (
            <><DialogHeader><DialogTitle className="truncate pr-8">{active.lead.name}</DialogTitle></DialogHeader>
            <div className="overflow-y-auto max-h-[70vh] -mx-4 px-4 pb-1">
              <LeadDetail lead={active.lead} onOpenWhatsApp={openWhatsAppAndMarkContacted} />
            </div>
            </>
          )}
          {active?.kind === "edit" && (
            <><DialogHeader><DialogTitle>Edit lead</DialogTitle></DialogHeader>
            <LeadForm initial={active.lead} onClose={closeDialog} /></>
          )}
          {active?.kind === "status" && (
            <><DialogHeader><DialogTitle>Change status — {active.lead.name}</DialogTitle></DialogHeader>
            <ChangeStatusDialog
              lead={active.lead}
              onClose={closeDialog}
              onStatusChanged={(newStatus) => {
                // Bump metaVersion so allWaLeads refetches and stats update immediately
                setMetaVersion((v) => v + 1)
              }}
            /></>
          )}
          {active?.kind === "note" && (
            <><DialogHeader><DialogTitle>Notes — {active.lead.name}</DialogTitle></DialogHeader>
            <AddNoteDialog lead={active.lead} onClose={closeDialog} /></>
          )}
          {active?.kind === "delete" && (
            <><DialogHeader><DialogTitle>Delete lead</DialogTitle></DialogHeader>
            <DeleteDialog lead={active.lead} onClose={closeDialog} /></>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
