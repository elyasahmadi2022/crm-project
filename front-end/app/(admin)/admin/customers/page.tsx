"use client"

import * as React from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import {
  Plus, Search, Pencil, Trash2, Loader2,
  Building2, DollarSign, Users, TrendingUp, Eye, FileText,
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
  useListCustomersQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
} from "@/queries/customer.queries"
import type {
  Customer, CustomerStatus, CompanySize, ListCustomersQuery,
} from "@/services/customer.service"

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
const ALL_SIZES: CompanySize[]       = ["MICRO", "SMALL", "MEDIUM", "LARGE", "ENTERPRISE"]

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

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: 6 }).map((__, j) => (
            <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-4">
        <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${color}`}>
          <Icon className="size-4" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold leading-none mt-0.5">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════════
const customerSchema = z.object({
  companyName: z.string().min(1, "Company name is required."),
  industry:    z.string().optional(),
  size:        z.enum(["MICRO", "SMALL", "MEDIUM", "LARGE", "ENTERPRISE"] as const, "Please select a company size."),
  address:     z.string().optional(),
  status:      z.enum(["ACTIVE", "INACTIVE", "CHURNED", "PROSPECT"] as const).optional(),
})
type CustomerFormValues = z.infer<typeof customerSchema>

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOMER FORM (create & edit)
// ═══════════════════════════════════════════════════════════════════════════════
function CustomerForm({ initial, onClose }: { initial?: Customer; onClose: () => void }) {
  const isEdit = !!initial
  const createMutation = useCreateCustomerMutation()
  const updateMutation = useUpdateCustomerMutation()
  const isPending = createMutation.isPending || updateMutation.isPending

  const { register, handleSubmit, control, formState: { errors } } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      companyName: initial?.companyName ?? "",
      industry:    initial?.industry    ?? "",
      size:        initial?.size        ?? "SMALL",
      address:     initial?.address     ?? "",
      status:      initial?.status,
    },
    mode: "onTouched",
  })

  function onSubmit(values: CustomerFormValues) {
    if (isEdit) {
      updateMutation.mutate(
        { id: initial.id, dto: { ...values, status: values.status } },
        { onSuccess: onClose },
      )
    } else {
      createMutation.mutate(
        { companyName: values.companyName, industry: values.industry || undefined, size: values.size, address: values.address || undefined },
        { onSuccess: onClose },
      )
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      {/* Company name */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="cu-name" className="text-sm font-medium">
          Company name <span className="text-destructive">*</span>
        </label>
        <Input id="cu-name" placeholder="Acme Corp" aria-invalid={!!errors.companyName} {...register("companyName")} />
        <FieldError message={errors.companyName?.message} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Industry */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="cu-industry" className="text-sm font-medium">Industry</label>
          <Input id="cu-industry" placeholder="e.g. Technology" {...register("industry")} />
        </div>
        {/* Size */}
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

      {/* Address */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="cu-address" className="text-sm font-medium">Address</label>
        <Input id="cu-address" placeholder="123 Main St, City, Country" {...register("address")} />
      </div>

      {/* Status (edit only) */}
      {isEdit && (
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
      )}

      <DialogFooter showCloseButton>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="size-3.5 animate-spin" />}
          {isPending ? "Saving…" : isEdit ? "Save changes" : "Create customer"}
        </Button>
      </DialogFooter>
    </form>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// DELETE DIALOG
// ═══════════════════════════════════════════════════════════════════════════════
function DeleteDialog({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  const mutation = useDeleteCustomerMutation()
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Are you sure you want to delete{" "}
        <span className="font-semibold text-foreground">{customer.companyName}</span>?
        This will also remove associated contacts and interactions. This cannot be undone.
      </p>
      <DialogFooter showCloseButton>
        <Button variant="destructive" disabled={mutation.isPending}
          onClick={() => mutation.mutate(customer.id, { onSuccess: onClose })}>
          {mutation.isPending && <Loader2 className="size-3.5 animate-spin" />}
          {mutation.isPending ? "Deleting…" : "Delete customer"}
        </Button>
      </DialogFooter>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════════
type DialogKind = "edit" | "delete"
interface ActiveDialog { kind: DialogKind; customer: Customer }

export default function CustomersPage() {
  const router = useRouter()
  const [search,       setSearch]       = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<CustomerStatus | "ALL">("ALL")
  const [active,       setActive]       = React.useState<ActiveDialog | null>(null)
  const [createOpen,   setCreateOpen]   = React.useState(false)
  const closeDialog = () => setActive(null)

  const { data, isLoading } = useListCustomersQuery(
    statusFilter !== "ALL" ? { status: statusFilter } : undefined,
  )
  const customers = data?.data ?? []

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return customers
    return customers.filter(
      (c) =>
        c.companyName.toLowerCase().includes(q) ||
        c.industry?.toLowerCase().includes(q) ||
        c.primaryContact?.name.toLowerCase().includes(q) ||
        c.primaryContact?.email?.toLowerCase().includes(q) ||
        c.originLead?.name.toLowerCase().includes(q) ||
        c.originLead?.email?.toLowerCase().includes(q) ||
        c.originLead?.phone?.includes(q),
    )
  }, [customers, search])

  const total            = data?.meta.total ?? 0
  const activeCount      = customers.filter((c) => c.status === "ACTIVE").length
  const totalInvoiced    = customers.reduce((s, c) => s + parseFloat(c.financials.totalInvoiced), 0)
  const totalOutstanding = customers.reduce((s, c) => s + parseFloat(c.financials.outstandingBalance), 0)

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage customer accounts and contacts.</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger render={<Button><Plus className="size-4" />New customer</Button>} />
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>New customer</DialogTitle></DialogHeader>
            <CustomerForm onClose={() => setCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total customers" value={total}         icon={Building2}  color="text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400" />
        <StatCard label="Active"          value={activeCount}   icon={Users}      color="text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400" />
        <StatCard label="Total invoiced"  value={`$${totalInvoiced.toLocaleString("en-US", { minimumFractionDigits: 2 })}`} icon={DollarSign} color="text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400" />
        <StatCard label="Outstanding"     value={`$${totalOutstanding.toLocaleString("en-US", { minimumFractionDigits: 2 })}`} icon={TrendingUp} color="text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400" />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input placeholder="Search by company, industry or contact…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as CustomerStatus | "ALL")}>
          <SelectTrigger className="w-44">
            <SelectValue>
              {statusFilter === "ALL" ? "All statuses" : STATUS_LABELS[statusFilter]}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {ALL_STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {!isLoading && filtered.length === 0 ? (
          <Empty className="border-0 rounded-xl bg-muted/20 min-h-64">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Building2 className="size-4" />
              </EmptyMedia>
              <EmptyTitle>No customers found</EmptyTitle>
              <EmptyDescription>
                {search || statusFilter !== "ALL"
                  ? "No customers match your current filters. Try adjusting the search or status filter."
                  : "No customers yet. Create your first customer account to get started."}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="size-3.5" />
                New customer
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Primary Contact</TableHead>
                <TableHead>Projects</TableHead>
                <TableHead>Outstanding</TableHead>
                <TableHead className="w-32 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableSkeleton />
              ) : (
                filtered.map((customer) => (
                  <TableRow 
                    key={customer.id} 
                    className="cursor-pointer hover:bg-muted/50" 
                    onClick={() => router.push(`/admin/customers/${customer.id}`)}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium leading-none">{customer.companyName}</p>
                        {customer.industry && (
                          <p className="text-xs text-muted-foreground mt-0.5">{customer.industry}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[customer.status]}`}>
                        {STATUS_LABELS[customer.status]}
                      </span>
                    </TableCell>
                    <TableCell>
                      {customer.primaryContact ? (
                        <div>
                          <p className="text-sm font-medium leading-none">{customer.primaryContact.name}</p>
                          {customer.primaryContact.phone && (
                            <p className="text-xs text-muted-foreground mt-0.5">{customer.primaryContact.phone}</p>
                          )}
                        </div>
                      ) : customer.originLead ? (
                        <div>
                          <p className="text-sm font-medium leading-none">{customer.originLead.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {customer.originLead.phone ?? customer.originLead.email ?? "—"}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">No contact</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {customer.stats.projectsCount}
                      {customer.stats.activeProjectsCount > 0 && (
                        <Badge variant="secondary" className="ml-1.5 text-[10px] px-1 h-4">
                          {customer.stats.activeProjectsCount} active
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={parseFloat(customer.financials.outstandingBalance) > 0
                        ? "text-sm font-medium text-orange-600 dark:text-orange-400"
                        : "text-sm text-muted-foreground"}>
                        {fmt(customer.financials.outstandingBalance, "$")}
                      </span>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="View details"
                          title="View details"
                          onClick={() => router.push(`/admin/customers/${customer.id}`)}
                        >
                          <Eye className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="New contract"
                          title="New contract"
                          onClick={() => router.push(`/admin/customers/${customer.id}/contract`)}
                        >
                          <FileText className="size-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" aria-label="Edit customer" onClick={() => setActive({ kind: "edit", customer })}>
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" aria-label="Delete customer"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setActive({ kind: "delete", customer })}>
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {!isLoading && (
        <p className="text-xs text-muted-foreground">
          Showing {filtered.length} of {data?.meta.total ?? filtered.length} customers
        </p>
      )}

      {/* Unified dialog */}
      <Dialog open={active !== null} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="max-w-lg">
          {active?.kind === "edit" && (
            <>
              <DialogHeader><DialogTitle>Edit customer</DialogTitle></DialogHeader>
              <CustomerForm initial={active.customer} onClose={closeDialog} />
            </>
          )}
          {active?.kind === "delete" && (
            <>
              <DialogHeader><DialogTitle>Delete customer</DialogTitle></DialogHeader>
              <DeleteDialog customer={active.customer} onClose={closeDialog} />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
