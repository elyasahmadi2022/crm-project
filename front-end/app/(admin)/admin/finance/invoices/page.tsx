"use client"

import * as React from "react"
import Link from "next/link"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Plus, Search, Pencil, Loader2, DollarSign,
  ArrowRightLeft, CreditCard, AlertTriangle, CheckCircle2,
  Clock, FileText,
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
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"
import { DatePicker } from "@/components/ui/date-picker"
import {
  Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle,
} from "@/components/ui/empty"

import {
  useListInvoicesQuery,
  useCreateInvoiceMutation,
  useUpdateInvoiceMutation,
  useChangeInvoiceStatusMutation,
  useAddPaymentMutation,
} from "@/queries/finance.queries"
import { useListCustomersQuery } from "@/queries/customer.queries"
import { useListProjectsQuery }  from "@/queries/project.queries"
import { useAccounts } from "@/queries/account.queries"
import type { InvoiceDto, InvoiceStatus, ListInvoicesQuery } from "@/services/finance.service"

// ── constants ─────────────────────────────────────────────────────────────────
const ALL_STATUSES: InvoiceStatus[] = ["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"]

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  DRAFT: "Draft", SENT: "Sent", PAID: "Paid", OVERDUE: "Overdue", CANCELLED: "Cancelled",
}

const STATUS_CLASS: Record<InvoiceStatus, string> = {
  DRAFT:     "bg-slate-100 text-slate-700 border-transparent dark:bg-slate-800 dark:text-slate-300",
  SENT:      "bg-blue-100 text-blue-700 border-transparent dark:bg-blue-900/30 dark:text-blue-300",
  PAID:      "bg-green-100 text-green-700 border-transparent dark:bg-green-900/30 dark:text-green-300",
  OVERDUE:   "bg-red-100 text-red-700 border-transparent dark:bg-red-900/30 dark:text-red-300",
  CANCELLED: "bg-zinc-100 text-zinc-500 border-transparent dark:bg-zinc-800 dark:text-zinc-400",
}

function fmtMoney(v: string | number | null | undefined, currency = "USD") {
  if (v == null) return "—"
  const n = typeof v === "string" ? parseFloat(v) : v
  return isNaN(n) ? "—" : `${n.toLocaleString("en-US", { minimumFractionDigits: 2 })} ${currency}`
}
function fmtDate(v: string | null | undefined) {
  if (!v) return "—"
  return new Date(v).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
}
function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1 text-xs text-destructive">{message}</p>
}

// ── skeleton / stat card ──────────────────────────────────────────────────────
function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: 8 }).map((__, j) => (
            <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}
function StatCard({ label, value, icon: Icon, color, sub }: { label: string; value: string; icon: React.ElementType; color: string; sub?: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-4">
        <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${color}`}><Icon className="size-4" /></div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold leading-none mt-0.5">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════════
const createSchema = z.object({
  customerId: z.coerce.number().min(1, "Customer is required."),
  projectId:  z.coerce.number().positive().optional().or(z.literal("")),
  amount:     z.coerce.number().min(0.01, "Amount is required."),
  currency:   z.string().length(3),
  issueDate:  z.string().optional(),
  dueDate:    z.string().optional(),
})
type CreateForm = z.infer<typeof createSchema>

const editSchema = z.object({
  amount:    z.coerce.number().min(0.01, "Amount is required."),
  issueDate: z.string().optional(),
  dueDate:   z.string().optional(),
})
type EditForm = z.infer<typeof editSchema>

const statusSchema = z.object({
  newStatus: z.enum(["DRAFT","SENT","PAID","OVERDUE","CANCELLED"] as const, {
    error: "Please select a status.",
  }),
})
type StatusForm = z.infer<typeof statusSchema>

const paymentSchema = z.object({
  amount: z.coerce.number().min(0.01, "Amount is required."),
  accountId: z.coerce.number().min(1, "Receiving account is required."),
  method: z.string().optional(),
  paidAt: z.string().optional(),
})
type PaymentForm = z.infer<typeof paymentSchema>

// ═══════════════════════════════════════════════════════════════════════════════
// CREATE FORM
// ═══════════════════════════════════════════════════════════════════════════════
function CreateInvoiceForm({ onClose }: { onClose: () => void }) {
  const mutation  = useCreateInvoiceMutation()
  const { data: cData } = useListCustomersQuery()
  const { data: pData } = useListProjectsQuery()
  const customers = cData?.data ?? []
  const projects  = pData?.data ?? []

  const { register, handleSubmit, control, formState: { errors } } = useForm<CreateForm>({
    resolver: zodResolver(createSchema) as any,
    defaultValues: { customerId: undefined as unknown as number, projectId: "", amount: undefined as unknown as number, currency: "USD", issueDate: "", dueDate: "" },
    mode: "onTouched",
  })

  function onSubmit(v: CreateForm) {
    mutation.mutate({
      customerId: v.customerId,
      projectId:  v.projectId ? Number(v.projectId) : undefined,
      amount:     v.amount,
      currency:   v.currency,
      issueDate:  v.issueDate || undefined,
      dueDate:    v.dueDate   || undefined,
    }, { onSuccess: onClose })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Customer <span className="text-destructive">*</span></label>
        <Controller control={control} name="customerId" render={({ field }) => {
          const selected = customers.find(c => c.id === field.value)
          return (
            <Select value={field.value ? String(field.value) : ""} onValueChange={(v) => field.onChange(Number(v))}>
              <SelectTrigger className="w-full" aria-invalid={!!errors.customerId}>
                <SelectValue>{selected ? selected.companyName : "Select customer"}</SelectValue>
              </SelectTrigger>
              <SelectContent>{customers.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.companyName}</SelectItem>)}</SelectContent>
            </Select>
          )
        }} />
        <FieldError message={errors.customerId?.message} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Invoice currency</label>
        <Controller control={control} name="currency" render={({ field }) => (
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {['AFN', 'USD', 'EUR'].map((currency) => <SelectItem key={currency} value={currency}>{currency}</SelectItem>)}
            </SelectContent>
          </Select>
        )} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Project (optional)</label>
        <Controller control={control} name="projectId" render={({ field }) => {
          const selected = projects.find(p => String(p.id) === String(field.value))
          return (
            <Select value={field.value ? String(field.value) : ""} onValueChange={(v) => field.onChange(v === "_none" ? "" : Number(v))}>
              <SelectTrigger className="w-full">
                <SelectValue>{selected ? selected.name : "No project"}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">No project</SelectItem>
                {projects.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )
        }} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="inv-amount" className="text-sm font-medium">Amount ($) <span className="text-destructive">*</span></label>
        <Input id="inv-amount" type="number" min="0.01" step="0.01" placeholder="0.00" aria-invalid={!!errors.amount} {...register("amount")} />
        <FieldError message={errors.amount?.message} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Issue date</label>
          <Controller control={control} name="issueDate" render={({ field }) => (
            <DatePicker
              value={field.value ? new Date(field.value) : undefined}
              onChange={(d) => field.onChange(d ? d.toISOString().split("T")[0] : "")}
              placeholder="Pick issue date"
            />
          )} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Due date</label>
          <Controller control={control} name="dueDate" render={({ field }) => (
            <DatePicker
              value={field.value ? new Date(field.value) : undefined}
              onChange={(d) => field.onChange(d ? d.toISOString().split("T")[0] : "")}
              placeholder="Pick due date"
            />
          )} />
        </div>
      </div>

      <DialogFooter showCloseButton>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="size-3.5 animate-spin" />}
          {mutation.isPending ? "Creating…" : "Create invoice"}
        </Button>
      </DialogFooter>
    </form>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// EDIT FORM
// ═══════════════════════════════════════════════════════════════════════════════
function EditInvoiceForm({ invoice, onClose }: { invoice: InvoiceDto; onClose: () => void }) {
  const mutation = useUpdateInvoiceMutation()
  const { register, handleSubmit, control, formState: { errors } } = useForm<EditForm>({
    resolver: zodResolver(editSchema) as any,
    defaultValues: {
      amount:    parseFloat(invoice.amount),
      issueDate: invoice.issueDate ? invoice.issueDate.slice(0, 10) : "",
      dueDate:   invoice.dueDate   ? invoice.dueDate.slice(0, 10)   : "",
    },
    mode: "onTouched",
  })
  function onSubmit(v: EditForm) {
    mutation.mutate({ id: invoice.id, dto: { amount: v.amount, issueDate: v.issueDate || undefined, dueDate: v.dueDate || undefined } }, { onSuccess: onClose })
  }
  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="e-amount" className="text-sm font-medium">Amount ($) <span className="text-destructive">*</span></label>
        <Input id="e-amount" type="number" min="0.01" step="0.01" aria-invalid={!!errors.amount} {...register("amount")} />
        <FieldError message={errors.amount?.message} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Issue date</label>
          <Controller control={control} name="issueDate" render={({ field }) => (
            <DatePicker
              value={field.value ? new Date(field.value) : undefined}
              onChange={(d) => field.onChange(d ? d.toISOString().split("T")[0] : "")}
              placeholder="Pick issue date"
            />
          )} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Due date</label>
          <Controller control={control} name="dueDate" render={({ field }) => (
            <DatePicker
              value={field.value ? new Date(field.value) : undefined}
              onChange={(d) => field.onChange(d ? d.toISOString().split("T")[0] : "")}
              placeholder="Pick due date"
            />
          )} />
        </div>
      </div>
      <DialogFooter showCloseButton>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="size-3.5 animate-spin" />}
          {mutation.isPending ? "Saving…" : "Save changes"}
        </Button>
      </DialogFooter>
    </form>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATUS CHANGE
// ═══════════════════════════════════════════════════════════════════════════════
function ChangeStatusForm({ invoice, onClose }: { invoice: InvoiceDto; onClose: () => void }) {
  const mutation = useChangeInvoiceStatusMutation()
  const { control, handleSubmit, formState: { errors } } = useForm<StatusForm>({
    resolver: zodResolver(statusSchema),
    defaultValues: { newStatus: invoice.status },
    mode: "onTouched",
  })
  function onSubmit(v: StatusForm) {
    if (v.newStatus === invoice.status) { onClose(); return }
    mutation.mutate({ id: invoice.id, dto: { newStatus: v.newStatus } }, { onSuccess: onClose })
  }
  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Current: <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[invoice.status]}`}>{STATUS_LABELS[invoice.status]}</span>
      </p>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">New status</label>
        <Controller control={control} name="newStatus" render={({ field }) => (
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger className="w-full" aria-invalid={!!errors.newStatus}>
              <SelectValue>{field.value ? STATUS_LABELS[field.value] : "Select status"}</SelectValue>
            </SelectTrigger>
            <SelectContent>{ALL_STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}</SelectContent>
          </Select>
        )} />
        <FieldError message={errors.newStatus?.message} />
      </div>
      <DialogFooter showCloseButton>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="size-3.5 animate-spin" />}
          {mutation.isPending ? "Updating…" : "Update status"}
        </Button>
      </DialogFooter>
    </form>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADD PAYMENT
// ═══════════════════════════════════════════════════════════════════════════════
function AddPaymentForm({ invoice, onClose }: { invoice: InvoiceDto; onClose: () => void }) {
  const mutation = useAddPaymentMutation()
  const { data: accounts = [] } = useAccounts()
  const { register, handleSubmit, control, formState: { errors } } = useForm<PaymentForm>({
    resolver: zodResolver(paymentSchema) as any,
    defaultValues: { amount: undefined as unknown as number, accountId: undefined as unknown as number, method: "", paidAt: "" },
    mode: "onTouched",
  })
  function onSubmit(v: PaymentForm) {
    mutation.mutate({ id: invoice.id, dto: { amount: v.amount, accountId: v.accountId, method: v.method || undefined, paidAt: v.paidAt || undefined } }, { onSuccess: onClose })
  }
  const balanceDue = parseFloat(invoice.payment.balanceDue)
  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-3 text-sm">
        <div><p className="text-xs text-muted-foreground">Invoice total</p><p className="font-semibold">{fmtMoney(invoice.amount, invoice.currency)}</p></div>
        <div><p className="text-xs text-muted-foreground">Amount paid</p><p className="font-semibold text-green-600">{fmtMoney(invoice.payment.amountPaid, invoice.currency)}</p></div>
        <div><p className="text-xs text-muted-foreground">Balance due</p><p className={`font-semibold ${balanceDue > 0 ? "text-destructive" : "text-muted-foreground"}`}>{fmtMoney(invoice.payment.balanceDue, invoice.currency)}</p></div>
        <div><p className="text-xs text-muted-foreground">Payments</p><p className="font-semibold">{invoice.payment.paymentsCount}</p></div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="pay-amount" className="text-sm font-medium">Payment amount ({invoice.currency}) <span className="text-destructive">*</span></label>
        <Input id="pay-amount" type="number" min="0.01" step="0.01" placeholder="0.00" aria-invalid={!!errors.amount} {...register("amount")} />
        <FieldError message={errors.amount?.message} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Receive into account ({invoice.currency})</label>
        <Controller control={control} name="accountId" render={({ field }) => (
          <Select value={field.value ? String(field.value) : ""} onValueChange={(value) => field.onChange(Number(value))}>
            <SelectTrigger className="w-full" aria-invalid={!!errors.accountId}><SelectValue placeholder="Select receiving account" /></SelectTrigger>
            <SelectContent>
              {accounts.filter((account) => account.isActive && account.currency === invoice.currency).map((account) => (
                <SelectItem key={account.id} value={String(account.id)}>{account.name} ({account.currency})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )} />
        <FieldError message={errors.accountId?.message} />
        {!accounts.some((account) => account.isActive && account.currency === invoice.currency) && <p className="text-xs text-destructive">Create an active {invoice.currency} account before recording this payment.</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="pay-method" className="text-sm font-medium">Method</label>
          <Input id="pay-method" placeholder="e.g. Bank transfer" {...register("method")} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Payment date</label>
          <Controller control={control} name="paidAt" render={({ field }) => (
            <DatePicker
              value={field.value ? new Date(field.value) : undefined}
              onChange={(d) => field.onChange(d ? d.toISOString().split("T")[0] : "")}
              placeholder="Pick payment date"
            />
          )} />
        </div>
      </div>
      <DialogFooter showCloseButton>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="size-3.5 animate-spin" />}
          {mutation.isPending ? "Recording…" : "Record payment"}
        </Button>
      </DialogFooter>
    </form>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════════
type DialogKind = "edit" | "status" | "payment"
interface ActiveDialog { kind: DialogKind; invoice: InvoiceDto }

export default function InvoicesPage() {
  const [search,       setSearch]       = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<InvoiceStatus | "ALL">("ALL")
  const [createOpen,   setCreateOpen]   = React.useState(false)
  const [active,       setActive]       = React.useState<ActiveDialog | null>(null)
  const closeDialog = () => setActive(null)

  const queryParams: ListInvoicesQuery = {}
  if (statusFilter !== "ALL") queryParams.status = statusFilter

  const { data, isLoading } = useListInvoicesQuery(queryParams)
  const invoices = data?.data ?? []

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return invoices
    return invoices.filter((inv) =>
      inv.customer.companyName.toLowerCase().includes(q) ||
      inv.project?.name.toLowerCase().includes(q) ||
      String(inv.id).includes(q),
    )
  }, [invoices, search])

  // aggregate stats
  const totalsByCurrency = invoices.reduce<Record<string, { invoiced: number; paid: number; outstanding: number }>>((totals, invoice) => {
    const current = totals[invoice.currency] ?? { invoiced: 0, paid: 0, outstanding: 0 }
    current.invoiced += parseFloat(invoice.amount)
    current.paid += parseFloat(invoice.payment.amountPaid)
    current.outstanding += parseFloat(invoice.payment.balanceDue)
    totals[invoice.currency] = current
    return totals
  }, {})
  const overdueCount   = invoices.filter((i) => i.payment.isOverdue).length

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Create and manage customer invoices.</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger render={<Button><Plus className="size-4" />New invoice</Button>} />
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>New invoice</DialogTitle></DialogHeader>
            <CreateInvoiceForm onClose={() => setCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Object.entries(totalsByCurrency).map(([currency, totals]) => <React.Fragment key={currency}>
          <StatCard label={`Invoiced (${currency})`} value={fmtMoney(totals.invoiced, currency)} icon={FileText} color="text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400" />
          <StatCard label={`Collected (${currency})`} value={fmtMoney(totals.paid, currency)} icon={CheckCircle2} color="text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400" />
          <StatCard label={`Outstanding (${currency})`} value={fmtMoney(totals.outstanding, currency)} icon={Clock} color="text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400" />
        </React.Fragment>)}
        <StatCard label="Overdue"         value={String(overdueCount)}      icon={AlertTriangle}  color="text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400" sub="invoices past due" />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input placeholder="Search by customer, project or ID…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as InvoiceStatus | "ALL")}>
          <SelectTrigger className="w-40">
            <SelectValue>{statusFilter === "ALL" ? "All statuses" : STATUS_LABELS[statusFilter]}</SelectValue>
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
          <Empty className="border-0 bg-muted/20 min-h-64">
            <EmptyHeader>
              <EmptyMedia variant="icon"><FileText className="size-4" /></EmptyMedia>
              <EmptyTitle>No invoices found</EmptyTitle>
              <EmptyDescription>
                {search || statusFilter !== "ALL"
                  ? "No invoices match your filters. Try adjusting the search or status."
                  : "No invoices yet. Create one to start billing customers."}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button size="sm" onClick={() => setCreateOpen(true)}><Plus className="size-3.5" />New invoice</Button>
            </EmptyContent>
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">#</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Due date</TableHead>
                <TableHead className="w-28 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableSkeleton />
              ) : (
                filtered.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="text-muted-foreground font-mono text-xs">#{inv.id}</TableCell>
                    <TableCell className="font-medium">{inv.customer.companyName}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {inv.project
                        ? <Link href={`/admin/projects/${inv.project.id}`} className="hover:text-primary hover:underline transition-colors">{inv.project.name}</Link>
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[inv.status]}`}>
                        {STATUS_LABELS[inv.status]}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">{fmtMoney(inv.amount, inv.currency)}</TableCell>
                    <TableCell className="text-green-600 dark:text-green-400 text-sm">{fmtMoney(inv.payment.amountPaid, inv.currency)}</TableCell>
                    <TableCell>
                      <span className={parseFloat(inv.payment.balanceDue) > 0 ? "text-sm font-medium text-destructive" : "text-sm text-muted-foreground"}>
                        {fmtMoney(inv.payment.balanceDue, inv.currency)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs">
                        <p className={inv.payment.isOverdue ? "text-destructive font-medium" : "text-muted-foreground"}>
                          {fmtDate(inv.dueDate)}
                        </p>
                        {inv.payment.isOverdue && <p className="text-destructive flex items-center gap-0.5"><AlertTriangle className="size-3" />Overdue</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" title="Edit invoice" onClick={() => setActive({ kind: "edit", invoice: inv })}><Pencil className="size-3.5" /></Button>
                        <Button variant="ghost" size="icon-sm" title="Change status" onClick={() => setActive({ kind: "status", invoice: inv })}><ArrowRightLeft className="size-3.5" /></Button>
                        <Button variant="ghost" size="icon-sm" title="Record payment"
                          disabled={inv.status === "PAID" || inv.status === "CANCELLED"}
                          onClick={() => setActive({ kind: "payment", invoice: inv })}>
                          <CreditCard className="size-3.5" />
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

      {!isLoading && <p className="text-xs text-muted-foreground">Showing {filtered.length} of {data?.meta.total ?? filtered.length} invoices</p>}

      {/* Unified dialog */}
      <Dialog open={active !== null} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="sm:max-w-md">
          {active?.kind === "edit" && (
            <><DialogHeader><DialogTitle>Edit invoice #{active.invoice.id}</DialogTitle></DialogHeader>
              <EditInvoiceForm invoice={active.invoice} onClose={closeDialog} /></>
          )}
          {active?.kind === "status" && (
            <><DialogHeader><DialogTitle>Change status — #{active.invoice.id}</DialogTitle></DialogHeader>
              <ChangeStatusForm invoice={active.invoice} onClose={closeDialog} /></>
          )}
          {active?.kind === "payment" && (
            <><DialogHeader><DialogTitle>Record payment — #{active.invoice.id}</DialogTitle></DialogHeader>
              <AddPaymentForm invoice={active.invoice} onClose={closeDialog} /></>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
