"use client"

import * as React from "react"
import Link from "next/link"
import {
  DollarSign, FileText, TrendingDown,
  AlertTriangle, ArrowUpRight, CheckCircle2, Clock,
  CalendarDays, ArrowDownLeft, ArrowUpRight as ArrowIncome,
  Filter,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button }    from "@/components/ui/button"
import { Skeleton }  from "@/components/ui/skeleton"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { DatePicker } from "@/components/ui/date-picker"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"

import { useListInvoicesQuery }  from "@/queries/finance.queries"
import { useListExpensesQuery }  from "@/queries/finance.queries"
import type { InvoiceStatus, ExpenseCategory } from "@/services/finance.service"

// ── helpers ───────────────────────────────────────────────────────────────────
function fmtMoney(n: number) {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
}
function fmtDate(v: string | Date | null | undefined) {
  if (!v) return "—"
  return new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

const STATUS_CLASS: Record<InvoiceStatus, string> = {
  DRAFT:     "bg-slate-100 text-slate-700",
  SENT:      "bg-blue-100 text-blue-700",
  PAID:      "bg-green-100 text-green-700",
  OVERDUE:   "bg-red-100 text-red-700",
  CANCELLED: "bg-zinc-100 text-zinc-500",
}
const STATUS_LABELS: Record<InvoiceStatus, string> = {
  DRAFT: "Draft", SENT: "Sent", PAID: "Paid", OVERDUE: "Overdue", CANCELLED: "Cancelled",
}
const CAT_LABELS: Record<ExpenseCategory, string> = {
  SOFTWARE: "Software", HARDWARE: "Hardware", MARKETING: "Marketing",
  TRAVEL: "Travel", SALARIES: "Salaries", OFFICE: "Office", OTHER: "Other",
  CUSTOM: "Custom",
}

// ── Quick date preset ranges ──────────────────────────────────────────────────
type Preset = "7d" | "30d" | "90d" | "ytd" | "custom"

function getPresetRange(preset: Preset): { from: Date; to: Date } {
  const now = new Date()
  const to  = new Date(now); to.setHours(23, 59, 59, 999)
  switch (preset) {
    case "7d":  { const f = new Date(now); f.setDate(f.getDate() - 6);  f.setHours(0,0,0,0); return { from: f, to } }
    case "30d": { const f = new Date(now); f.setDate(f.getDate() - 29); f.setHours(0,0,0,0); return { from: f, to } }
    case "90d": { const f = new Date(now); f.setDate(f.getDate() - 89); f.setHours(0,0,0,0); return { from: f, to } }
    case "ytd": return { from: new Date(now.getFullYear(), 0, 1), to }
    default:    return { from: new Date(now.getFullYear(), 0, 1), to }
  }
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, sub }: {
  label: string; value: string; icon: React.ElementType; color: string; sub?: string
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-5">
        <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${color}`}>
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold leading-none mt-0.5">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

// ── Unified transaction row ───────────────────────────────────────────────────
type TxType = "income" | "expense"

interface Transaction {
  id:          string
  type:        TxType
  date:        Date
  description: string
  party:       string
  category:    string
  amount:      number
  status?:     InvoiceStatus
  href:        string
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function FinancePage() {
  const [preset,   setPreset]   = React.useState<Preset>("30d")
  const [fromDate, setFromDate] = React.useState<Date | undefined>(() => getPresetRange("30d").from)
  const [toDate,   setToDate]   = React.useState<Date | undefined>(() => getPresetRange("30d").to)
  const [txType,   setTxType]   = React.useState<"all" | "income" | "expense">("all")

  function applyPreset(p: Preset) {
    setPreset(p)
    if (p !== "custom") {
      const { from, to } = getPresetRange(p)
      setFromDate(from); setToDate(to)
    }
  }

  const { data: invData, isLoading: invLoading } = useListInvoicesQuery()
  const { data: expData, isLoading: expLoading } = useListExpensesQuery()

  const invoices  = invData?.data ?? []
  const expenses  = expData?.data ?? []
  const isLoading = invLoading || expLoading

  // ── Build unified transaction list ────────────────────────────────────────
  const allTransactions = React.useMemo((): Transaction[] => {
    const txs: Transaction[] = []
    invoices.forEach((inv) => {
      txs.push({
        id:          `inv-${inv.id}`,
        type:        "income",
        date:        new Date(inv.issueDate ?? inv.createdAt),
        description: `Invoice #${inv.id}`,
        party:       inv.customer.companyName,
        category:    inv.project?.name ? `Project: ${inv.project.name}` : "Invoice",
        amount:      parseFloat(inv.amount),
        status:      inv.status,
        href:        "/admin/finance/invoices",
      })
    })
    expenses.forEach((exp) => {
      txs.push({
        id:          `exp-${exp.id}`,
        type:        "expense",
        date:        new Date(exp.spentAt),
        description: exp.description,
        party:       exp.project?.name ?? "—",
        category:    exp.customCategory?.name ?? CAT_LABELS[exp.category] ?? exp.category,
        amount:      parseFloat(exp.amount),
        href:        "/admin/finance/expenses",
      })
    })
    return txs.sort((a, b) => b.date.getTime() - a.date.getTime())
  }, [invoices, expenses])

  // ── Apply filters ─────────────────────────────────────────────────────────
  const filtered = React.useMemo(() => {
    return allTransactions.filter((tx) => {
      if (fromDate && tx.date < fromDate) return false
      if (toDate   && tx.date > toDate)   return false
      if (txType !== "all" && tx.type !== txType) return false
      return true
    })
  }, [allTransactions, fromDate, toDate, txType])

  const filteredIncome   = filtered.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0)
  const filteredExpenses = filtered.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0)
  const filteredNet      = filteredIncome - filteredExpenses

  // All-time KPIs
  const totalCollected   = invoices.reduce((s, i) => s + parseFloat(i.payment.amountPaid), 0)
  const totalOutstanding = invoices.reduce((s, i) => s + parseFloat(i.payment.balanceDue), 0)
  const overdueInvoices  = invoices.filter((i) => i.payment.isOverdue)
  const totalExpensesAll = expenses.reduce((s, e) => s + parseFloat(e.amount), 0)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Finance</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Overview of invoices and expenses.
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="py-5"><Skeleton className="h-12 w-full" /></CardContent></Card>
          ))
        ) : (
          <>
            <StatCard label="Collected"      value={fmtMoney(totalCollected)}
              icon={CheckCircle2} color="text-green-600 bg-green-100" />
            <StatCard label="Outstanding"    value={fmtMoney(totalOutstanding)}
              icon={Clock} color="text-orange-600 bg-orange-100"
              sub={`${overdueInvoices.length} overdue`} />
            <StatCard label="Total expenses" value={fmtMoney(totalExpensesAll)}
              icon={TrendingDown} color="text-red-600 bg-red-100" />
            <StatCard label="Net (all time)" value={fmtMoney(totalCollected - totalExpensesAll)}
              icon={DollarSign} color="text-blue-600 bg-blue-100" />
          </>
        )}
      </div>

      {/* Date range filter */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-3">
            <Filter className="size-4 text-muted-foreground shrink-0" />
            <div className="flex gap-1 flex-wrap">
              {(["7d", "30d", "90d", "ytd", "custom"] as Preset[]).map((p) => (
                <button key={p} type="button" onClick={() => applyPreset(p)}
                  className={`h-7 px-3 rounded text-xs font-medium transition-colors border ${
                    preset === p
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/60 border-muted hover:bg-muted text-muted-foreground"
                  }`}>
                  {p === "7d" ? "Last 7 days" : p === "30d" ? "Last 30 days" : p === "90d" ? "Last 90 days" : p === "ytd" ? "Year to date" : "Custom"}
                </button>
              ))}
            </div>
            {preset === "custom" && (
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">From</span>
                  <DatePicker value={fromDate} onChange={(d) => setFromDate(d ?? undefined)} placeholder="Start date" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">To</span>
                  <DatePicker value={toDate} onChange={(d) => setToDate(d ?? undefined)} placeholder="End date" />
                </div>
              </div>
            )}
            <div className="ml-auto">
              <Select value={txType} onValueChange={(v) => setTxType(v as typeof txType)}>
                <SelectTrigger className="h-7 text-xs w-36">
                  <SelectValue>
                    {txType === "all" ? "All types" : txType === "income" ? "Income only" : "Expenses only"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="income">Income only</SelectItem>
                  <SelectItem value="expense">Expenses only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {!isLoading && (
            <div className="mt-3 pt-3 border-t flex flex-wrap items-center gap-6 text-sm">
              <div className="flex items-center gap-1.5">
                <ArrowIncome className="size-3.5 text-green-600" />
                <span className="text-muted-foreground">Income:</span>
                <span className="font-semibold text-green-600">{fmtMoney(filteredIncome)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ArrowDownLeft className="size-3.5 text-red-500" />
                <span className="text-muted-foreground">Expenses:</span>
                <span className="font-semibold text-red-500">{fmtMoney(filteredExpenses)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <DollarSign className="size-3.5 text-blue-600" />
                <span className="text-muted-foreground">Net:</span>
                <span className={`font-semibold ${filteredNet >= 0 ? "text-blue-600" : "text-destructive"}`}>
                  {fmtMoney(filteredNet)}
                </span>
              </div>
              <span className="text-xs text-muted-foreground ml-auto">
                {filtered.length} transaction{filtered.length !== 1 ? "s" : ""}
                {fromDate && toDate ? ` · ${fmtDate(fromDate)} – ${fmtDate(toDate)}` : ""}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Transactions table */}
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Invoices and expenses, newest first</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/admin/finance/invoices" />}>
              Invoices <ArrowUpRight className="size-3.5 ml-1" />
            </Button>
            <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/admin/finance/expenses" />}>
              Expenses <ArrowUpRight className="size-3.5 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col gap-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-10 text-center">
              No transactions found for this period.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10 pl-4">Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Party / Source</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right pr-4">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.slice(0, 50).map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="pl-4">
                        {tx.type === "income" ? (
                          <div className="flex size-7 items-center justify-center rounded-full bg-green-100">
                            <ArrowIncome className="size-3.5 text-green-600" />
                          </div>
                        ) : (
                          <div className="flex size-7 items-center justify-center rounded-full bg-red-100">
                            <ArrowDownLeft className="size-3.5 text-red-500" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {fmtDate(tx.date)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Link href={tx.href}
                            className="text-sm font-medium hover:text-primary hover:underline transition-colors">
                            {tx.description}
                          </Link>
                          {tx.status && (
                            <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${STATUS_CLASS[tx.status]}`}>
                              {STATUS_LABELS[tx.status]}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground truncate max-w-40">
                        {tx.party}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">{tx.category}</span>
                      </TableCell>
                      <TableCell className={`text-right pr-4 font-semibold ${tx.type === "income" ? "text-green-600" : "text-red-500"}`}>
                        {tx.type === "income" ? "+" : "−"}{fmtMoney(tx.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filtered.length > 50 && (
                <p className="text-xs text-muted-foreground text-center py-3 border-t">
                  Showing 50 of {filtered.length} — use the sub-pages to see all.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick links */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[
          { href: "/admin/finance/invoices", icon: FileText,     label: "Invoices",  description: "Create, send and track customer invoices" },
          { href: "/admin/finance/expenses", icon: TrendingDown, label: "Expenses",  description: "Record and categorise all spending" },
        ].map(({ href, icon: Icon, label, description }) => (
          <Link key={href} href={href}>
            <Card className="cursor-pointer hover:border-primary/50 transition-colors">
              <CardContent className="flex items-center gap-4 py-4">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Icon className="size-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="text-xs text-muted-foreground truncate">{description}</p>
                </div>
                <ArrowUpRight className="size-4 shrink-0 text-muted-foreground ml-auto" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Overdue alert */}
      {!invLoading && overdueInvoices.length > 0 && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="size-5 text-destructive shrink-0" />
              <div>
                <p className="text-sm font-semibold text-destructive">
                  {overdueInvoices.length} overdue invoice{overdueInvoices.length !== 1 ? "s" : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  Outstanding: {fmtMoney(overdueInvoices.reduce((s, i) => s + parseFloat(i.payment.balanceDue), 0))}
                </p>
              </div>
            </div>
            <Button variant="destructive" size="sm" nativeButton={false}
              render={<Link href="/admin/finance/invoices?status=OVERDUE" />}>
              Review
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
