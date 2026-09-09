"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import {
  ArrowLeft, Building2, Mail, Phone, MapPin, User, Briefcase,
  Calendar, DollarSign, FileText, Users, Pencil, Trash2, UserPlus,
  Loader2, TrendingUp, Package, ExternalLink, Plus, FolderKanban,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle,
} from "@/components/ui/empty"

import { useCustomerQuery, useUpdateCustomerMutation, useDeleteCustomerMutation, useAddContactMutation } from "@/queries/customer.queries"
import type { Customer, CustomerStatus, CompanySize } from "@/services/customer.service"
import { useListProjectsQuery } from "@/queries/project.queries"
import type { ProjectStage } from "@/services/project.service"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

// ── constants ─────────────────────────────────────────────────────────────────
const STATUS_LABELS: Record<CustomerStatus, string> = {
  ACTIVE: "Active", INACTIVE: "Inactive", CHURNED: "Churned", PROSPECT: "Prospect",
}
const STATUS_CLASS: Record<CustomerStatus, string> = {
  ACTIVE:   "bg-green-100 text-green-700 border-transparent dark:bg-green-900/30 dark:text-green-300",
  INACTIVE: "bg-slate-100 text-slate-600 border-transparent dark:bg-slate-800 dark:text-slate-300",
  CHURNED:  "bg-red-100 text-red-700 border-transparent dark:bg-red-900/30 dark:text-red-300",
  PROSPECT: "bg-blue-100 text-blue-700 border-transparent dark:bg-blue-900/30 dark:text-blue-300",
}
const SIZE_LABELS: Record<CompanySize, string> = {
  MICRO: "Micro", SMALL: "Small", MEDIUM: "Medium", LARGE: "Large", ENTERPRISE: "Enterprise",
}
const ALL_STATUSES: CustomerStatus[] = ["ACTIVE", "INACTIVE", "CHURNED", "PROSPECT"]
const ALL_SIZES: CompanySize[] = ["MICRO", "SMALL", "MEDIUM", "LARGE", "ENTERPRISE"]

const STAGE_LABELS: Record<ProjectStage, string> = {
  REQUIREMENTS: "Requirements",
  DESIGN: "Design",
  DEVELOPMENT: "Development",
  TESTING: "Testing",
  DEPLOYMENT: "Deployment",
  LIVE: "Live",
}

const STAGE_CLASS: Record<ProjectStage, string> = {
  REQUIREMENTS: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  DESIGN: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  DEVELOPMENT: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  TESTING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  DEPLOYMENT: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  LIVE: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
}

function fmt(val: string | null | undefined, prefix = "") {
  if (val == null) return "—"
  const n = parseFloat(val)
  return isNaN(n) ? "—" : `${prefix}${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// ── shared helpers ────────────────────────────────────────────────────────────
function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1 text-xs text-destructive">{message}</p>
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════════
const customerSchema = z.object({
  companyName: z.string().min(1, "Company name is required."),
  industry:    z.string().optional(),
  size:        z.enum(["MICRO", "SMALL", "MEDIUM", "LARGE", "ENTERPRISE"] as const, {
    error: "Please select a company size.",
  }),
  address:     z.string().optional(),
  status:      z.enum(["ACTIVE", "INACTIVE", "CHURNED", "PROSPECT"] as const).optional(),
})
type CustomerFormValues = z.infer<typeof customerSchema>

const contactSchema = z.object({
  name:  z.string().min(1, "Contact name is required."),
  role:  z.string().optional(),
  email: z.string().optional().refine((v) => !v || /\S+@\S+\.\S+/.test(v), "Enter a valid email."),
  phone: z.string().optional(),
})
type ContactFormValues = z.infer<typeof contactSchema>

// ═══════════════════════════════════════════════════════════════════════════════
// EDIT CUSTOMER FORM
// ═══════════════════════════════════════════════════════════════════════════════
function EditCustomerDialog({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  const updateMutation = useUpdateCustomerMutation()

  const { register, handleSubmit, control, formState: { errors } } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      companyName: customer.companyName,
      industry:    customer.industry ?? "",
      size:        customer.size,
      address:     customer.address ?? "",
      status:      customer.status,
    },
    mode: "onTouched",
  })

  function onSubmit(values: CustomerFormValues) {
    updateMutation.mutate(
      { id: customer.id, dto: { ...values, status: values.status } },
      { onSuccess: onClose },
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="cu-name" className="text-sm font-medium">
          Company name <span className="text-destructive">*</span>
        </label>
        <Input id="cu-name" placeholder="Acme Corp" aria-invalid={!!errors.companyName} {...register("companyName")} />
        <FieldError message={errors.companyName?.message} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="cu-industry" className="text-sm font-medium">Industry</label>
          <Input id="cu-industry" placeholder="e.g. Technology" {...register("industry")} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Company size <span className="text-destructive">*</span></label>
          <Controller
            control={control}
            name="size"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full" aria-invalid={!!errors.size}>
                  <SelectValue>
                    {field.value ? SIZE_LABELS[field.value] : "Select size"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {ALL_SIZES.map((s) => <SelectItem key={s} value={s}>{SIZE_LABELS[s]}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError message={errors.size?.message} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="cu-address" className="text-sm font-medium">Address</label>
        <Input id="cu-address" placeholder="123 Main St, City, Country" {...register("address")} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Status</label>
        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full">
                <SelectValue>
                  {field.value ? STATUS_LABELS[field.value] : "Select status"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {ALL_STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <DialogFooter showCloseButton>
        <Button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending && <Loader2 className="size-3.5 animate-spin" />}
          {updateMutation.isPending ? "Saving…" : "Save changes"}
        </Button>
      </DialogFooter>
    </form>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADD CONTACT DIALOG
// ═══════════════════════════════════════════════════════════════════════════════
function AddContactDialog({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  const mutation = useAddContactMutation()
  const { register, handleSubmit, formState: { errors } } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", role: "", email: "", phone: "" },
    mode: "onTouched",
  })

  function onSubmit(values: ContactFormValues) {
    mutation.mutate(
      {
        customerId: customer.id,
        dto: {
          name:  values.name,
          role:  values.role  || undefined,
          email: values.email || undefined,
          phone: values.phone || undefined,
        },
      },
      { onSuccess: onClose },
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="ct-name" className="text-sm font-medium">
            Name <span className="text-destructive">*</span>
          </label>
          <Input id="ct-name" placeholder="Jane Doe" aria-invalid={!!errors.name} {...register("name")} />
          <FieldError message={errors.name?.message} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="ct-role" className="text-sm font-medium">Role / title</label>
          <Input id="ct-role" placeholder="CEO" {...register("role")} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="ct-email" className="text-sm font-medium">Email</label>
          <Input id="ct-email" type="email" placeholder="jane@company.com" aria-invalid={!!errors.email} {...register("email")} />
          <FieldError message={errors.email?.message} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="ct-phone" className="text-sm font-medium">Phone</label>
          <Input id="ct-phone" placeholder="+1 555 000 0000" {...register("phone")} />
        </div>
      </div>

      <DialogFooter showCloseButton>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="size-3.5 animate-spin" />}
          {mutation.isPending ? "Adding…" : "Add contact"}
        </Button>
      </DialogFooter>
    </form>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// DELETE DIALOG
// ═══════════════════════════════════════════════════════════════════════════════
function DeleteDialog({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  const router = useRouter()
  const mutation = useDeleteCustomerMutation()
  
  const handleDelete = () => {
    mutation.mutate(customer.id, { 
      onSuccess: () => {
        onClose()
        router.push("/admin/customers")
      } 
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Are you sure you want to delete{" "}
        <span className="font-semibold text-foreground">{customer.companyName}</span>?
        This will also remove associated contacts and interactions. This cannot be undone.
      </p>
      <DialogFooter showCloseButton>
        <Button variant="destructive" disabled={mutation.isPending} onClick={handleDelete}>
          {mutation.isPending && <Loader2 className="size-3.5 animate-spin" />}
          {mutation.isPending ? "Deleting…" : "Delete customer"}
        </Button>
      </DialogFooter>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function CustomerDetailPage() {
  const router = useRouter()
  const params = useParams()
  const customerId = params?.id ? parseInt(params.id as string, 10) : null

  const { data: customer, isLoading } = useCustomerQuery(customerId)
  const { data: projectsData, isLoading: projectsLoading } = useListProjectsQuery(
    customerId ? { customerId } : undefined
  )
  const projects = projectsData?.data ?? []

  const [editOpen, setEditOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [addContactOpen, setAddContactOpen] = React.useState(false)

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10" />
          <div className="flex-1">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="py-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Building2 className="size-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Customer not found</h2>
        <p className="text-muted-foreground mb-4">The customer you're looking for doesn't exist.</p>
        <Button onClick={() => router.push("/admin/customers")}>
          <ArrowLeft className="size-4" />
          Back to customers
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/admin/customers")}
            className="mt-1"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold">{customer.companyName}</h1>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASS[customer.status]}`}>
                {STATUS_LABELS[customer.status]}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {customer.industry && (
                <span className="flex items-center gap-1.5">
                  <Briefcase className="size-3.5" />
                  {customer.industry}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Users className="size-3.5" />
                {SIZE_LABELS[customer.size]} company
              </span>
              {customer.owner && (
                <span className="flex items-center gap-1.5">
                  <User className="size-3.5" />
                  Owner: {customer.owner.name}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push(`/admin/customers/${customer.id}/contract`)}>
            <FileText className="size-3.5" />
            New Contract
          </Button>
          <Button variant="outline" size="sm" onClick={() => setAddContactOpen(true)}>
            <UserPlus className="size-3.5" />
            Add contact
          </Button>
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="size-3.5" />
            Edit
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setDeleteOpen(true)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
            Delete
          </Button>
        </div>
      </div>

      {/* Financial Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
              <DollarSign className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Invoiced</p>
              <p className="text-xl font-bold">{fmt(customer.financials.totalInvoiced, "$")}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
              <TrendingUp className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Paid</p>
              <p className="text-xl font-bold">{fmt(customer.financials.totalPaid, "$")}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
              <FileText className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Outstanding</p>
              <p className="text-xl font-bold">{fmt(customer.financials.outstandingBalance, "$")}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="size-4" />
                Company Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Company Name</p>
                <p className="font-medium">{customer.companyName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Industry</p>
                <p className="font-medium">{customer.industry || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Company Size</p>
                <p className="font-medium">{SIZE_LABELS[customer.size]}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[customer.status]}`}>
                  {STATUS_LABELS[customer.status]}
                </span>
              </div>
              {customer.address && (
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <MapPin className="size-3" />
                    Address
                  </p>
                  <p className="font-medium">{customer.address}</p>
                </div>
              )}
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Calendar className="size-3" />
                  Created
                </p>
                <p className="font-medium">
                  {new Date(customer.createdAt).toLocaleDateString("en-US", { 
                    year: "numeric", 
                    month: "long", 
                    day: "numeric" 
                  })}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Lead Source */}
          {customer.originLead && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="size-4" />
                  Lead Source
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border bg-muted/30 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-sm mb-1">{customer.originLead.name}</p>
                      <Badge variant="secondary" className="text-[10px]">Original Lead</Badge>
                    </div>
                  </div>
                  <Separator className="my-3" />
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {customer.originLead.email && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="size-3.5" />
                        <span className="truncate">{customer.originLead.email}</span>
                      </div>
                    )}
                    {customer.originLead.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="size-3.5" />
                        <span>{customer.originLead.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Activity Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="size-4" />
                Activity Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{customer.stats.contactsCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">Contacts</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{customer.stats.projectsCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">Projects</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{customer.stats.activeProjectsCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">Active</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{customer.stats.interactionsCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">Interactions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Primary Contact */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="size-4" />
                Primary Contact
              </CardTitle>
            </CardHeader>
            <CardContent>
              {customer.primaryContact ? (
                <div className="space-y-4">
                  <div>
                    <p className="font-medium text-lg mb-1">{customer.primaryContact.name}</p>
                    {customer.primaryContact.role && (
                      <p className="text-sm text-muted-foreground">{customer.primaryContact.role}</p>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    {customer.primaryContact.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="size-4 text-muted-foreground" />
                        <a href={`mailto:${customer.primaryContact.email}`} className="text-blue-600 hover:underline dark:text-blue-400">
                          {customer.primaryContact.email}
                        </a>
                      </div>
                    )}
                    {customer.primaryContact.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="size-4 text-muted-foreground" />
                        <a href={`tel:${customer.primaryContact.phone}`} className="hover:underline">
                          {customer.primaryContact.phone}
                        </a>
                      </div>
                    )}
                    {!customer.primaryContact.email && !customer.primaryContact.phone && (
                      <p className="text-sm text-muted-foreground">No contact information available</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <User className="size-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground mb-3">No primary contact assigned</p>
                  <Button size="sm" variant="outline" onClick={() => setAddContactOpen(true)}>
                    <UserPlus className="size-3.5" />
                    Add contact
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Projects Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FolderKanban className="size-4" />
              Projects ({projects.length})
            </CardTitle>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => router.push(`/admin/projects?customerId=${customer.id}`)}
            >
              <Plus className="size-3.5" />
              Assign Project
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {projectsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : projects.length === 0 ? (
            <Empty className="border-0 min-h-48">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FolderKanban className="size-4" />
                </EmptyMedia>
                <EmptyTitle>No projects assigned</EmptyTitle>
                <EmptyDescription>
                  This customer doesn't have any projects yet. Assign a project to get started.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => router.push(`/admin/projects?customerId=${customer.id}`)}
                >
                  <Plus className="size-3.5" />
                  Assign Project
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project Name</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Timeline</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project) => {
                    const isOverdue = project.timeline.isOverdue
                    const daysRemaining = project.timeline.daysRemaining

                    return (
                      <TableRow 
                        key={project.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => router.push(`/admin/projects/${project.id}`)}
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium leading-none">{project.name}</p>
                            {project.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                {project.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${STAGE_CLASS[project.stage]}`}>
                            {STAGE_LABELS[project.stage]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                              <div 
                                className="bg-blue-600 h-full transition-all"
                                style={{ width: `${project.progress.percentComplete}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-muted-foreground min-w-[3ch]">
                              {Math.round(project.progress.percentComplete)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {project.timeline.startDate && project.timeline.endDate ? (
                            <div className="text-sm">
                              <p className={isOverdue ? "text-red-600 dark:text-red-400 font-medium" : ""}>
                                {isOverdue ? "Overdue" : daysRemaining !== null && daysRemaining >= 0 
                                  ? `${daysRemaining} days left`
                                  : "In progress"
                                }
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(project.timeline.endDate).toLocaleDateString("en-US", { 
                                  month: "short", 
                                  day: "numeric" 
                                })}
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">No timeline</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {project.team.length > 0 ? (
                              <>
                                <Users className="size-3.5 text-muted-foreground" />
                                <span className="text-sm">{project.team.length}</span>
                              </>
                            ) : (
                              <span className="text-xs text-muted-foreground">No team</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => router.push(`/admin/projects/${project.id}`)}
                          >
                            <ExternalLink className="size-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
          </DialogHeader>
          <EditCustomerDialog customer={customer} onClose={() => setEditOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Delete Customer</DialogTitle>
          </DialogHeader>
          <DeleteDialog customer={customer} onClose={() => setDeleteOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={addContactOpen} onOpenChange={setAddContactOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Contact — {customer.companyName}</DialogTitle>
          </DialogHeader>
          <AddContactDialog customer={customer} onClose={() => setAddContactOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
