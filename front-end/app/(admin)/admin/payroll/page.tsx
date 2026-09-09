"use client"

import { useState, useEffect } from "react"
import {
  Plus, CreditCard, DollarSign, CheckCircle2, Clock, AlertCircle,
  ChevronDown, Wallet, User, Loader2, Trash2, Edit, Eye,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/lib/toast"
import { useEmployees } from "@/queries/employee.queries"
import { useAccounts } from "@/queries/account.queries"
import {
  usePayrolls, useMonthlyReport, useAdvances,
  useCreatePayroll, useUpdatePayroll, useDeletePayroll, usePayPayroll,
  useGenerateMonthly, useRecordAdvance,
  type Payroll,
} from "@/queries/payroll.queries"

// ── Constants ────────────────────────────────────────────────────────
const MONTHS = [
  {v:1,l:"January"},{v:2,l:"February"},{v:3,l:"March"},{v:4,l:"April"},
  {v:5,l:"May"},{v:6,l:"June"},{v:7,l:"July"},{v:8,l:"August"},
  {v:9,l:"September"},{v:10,l:"October"},{v:11,l:"November"},{v:12,l:"December"},
]
const YEARS = Array.from({length:4},(_,i)=>new Date().getFullYear()-i)
const M = (v:number) => MONTHS.find(m=>m.v===v)?.l ?? ""

// ── Status badge ─────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  if (status === "PAID")    return <Badge className="bg-green-600 gap-1"><CheckCircle2 className="h-3 w-3"/>Paid</Badge>
  if (status === "FAILED")  return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3"/>Failed</Badge>
  return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3"/>Pending</Badge>
}

// ── Page ─────────────────────────────────────────────────────────────
export default function PayrollPage() {
  const now = new Date()
  const [month, setMonth]   = useState(now.getMonth() + 1)
  const [year,  setYear]    = useState(now.getFullYear())
  const [tab,   setTab]     = useState<"payroll"|"advances">("payroll")

  // dialogs
  const [createOpen,    setCreateOpen]    = useState(false)
  const [editOpen,      setEditOpen]      = useState(false)
  const [payOpen,       setPayOpen]       = useState(false)
  const [advanceOpen,   setAdvanceOpen]   = useState(false)
  const [generateOpen,  setGenerateOpen]  = useState(false)
  const [deleteOpen,    setDeleteOpen]    = useState(false)
  const [viewOpen,      setViewOpen]      = useState(false)
  const [selected,      setSelected]      = useState<Payroll | null>(null)

  // data
  const { data: payrolls = [], isLoading }  = usePayrolls({ month, year })
  const { data: report }                    = useMonthlyReport(month, year)
  const { data: advances = [] }             = useAdvances()
  const { data: employees = [] }            = useEmployees()
  const { data: accounts  = [] }            = useAccounts()

  // mutations
  const createMut   = useCreatePayroll()
  const updateMut   = useUpdatePayroll()
  const deleteMut   = useDeletePayroll()
  const payMut      = usePayPayroll()
  const generateMut = useGenerateMonthly()
  const advanceMut  = useRecordAdvance()

  // ── forms ──────────────────────────────────────────────────────────
  const blankCreate = () => ({
    employeeId: "", month, year,
    baseSalary: "", bonuses: "0", deductions: "0", deductionReason: "", notes: "",
  })
  const [createForm, setCreateForm] = useState(blankCreate())
  const [editForm,   setEditForm]   = useState({ baseSalary:"", bonuses:"0", deductions:"0", deductionReason:"", bonusReason:"", notes:"" })
  const [payForm,    setPayForm]    = useState({ accountId: "", salaryAmount: "", paidBy: "", exchangeRate: "1" })
  const [advForm,    setAdvForm]    = useState({ employeeId:"", amount:"", reason:"", advanceDate: now.toISOString().split("T")[0]!, notes:"" })
  const [genForm,    setGenForm]    = useState({ month, year })

  // Keep the generate month/year default in sync with the filter
  useEffect(() => { setGenForm({ month, year }) }, [month, year])

  // Auto-fill baseSalary from employee when employee changes in create form
  useEffect(() => {
    if (!createForm.employeeId) return
    const emp = employees.find((e: any) => e.id.toString() === createForm.employeeId)
    if (emp?.salary) setCreateForm(f => ({ ...f, baseSalary: String(Number(emp.salary)) }))
  }, [createForm.employeeId, employees])

  // ── stats ──────────────────────────────────────────────────────────
  const totalNet    = payrolls.reduce((s, p) => s + Number(p.netPay), 0)
  const paidCount   = payrolls.filter(p => p.status === "PAID").length
  const pendingCount = payrolls.filter(p => p.status === "PENDING").length
  const outstanding = advances.filter(a => !a.fullyDeducted).reduce((s, a) => s + (Number(a.amount) - Number(a.deductedAmount)), 0)
  const totalPayrollByCurrency = payrolls.reduce<Record<string, number>>((totals, payroll) => {
    totals[payroll.salaryCurrency] = (totals[payroll.salaryCurrency] ?? 0) + Number(payroll.netPay)
    return totals
  }, {})
  const outstandingAdvancesByCurrency = advances.filter(a => !a.fullyDeducted).reduce<Record<string, number>>((totals, advance) => {
    totals[advance.currency] = (totals[advance.currency] ?? 0) + Number(advance.amount) - Number(advance.deductedAmount)
    return totals
  }, {})
  const formatCurrencyTotals = (totals: Record<string, number>) => Object.entries(totals).map(([currency, amount]) => `${amount.toLocaleString()} ${currency}`).join(" / ") || "0"

  // ── handlers ───────────────────────────────────────────────────────
  function handleCreate() {
    if (!createForm.employeeId || !createForm.baseSalary) {
      toast.error("Employee and base salary are required"); return
    }
    createMut.mutate({
      employeeId:      Number(createForm.employeeId),
      month:           createForm.month,
      year:            createForm.year,
      baseSalary:      Number(createForm.baseSalary),
      bonuses:         Number(createForm.bonuses) || 0,
      deductions:      Number(createForm.deductions) || 0,
      deductionReason: createForm.deductionReason || undefined,
      notes:           createForm.notes || undefined,
    }, { onSuccess: () => { setCreateOpen(false); setCreateForm(blankCreate()) } })
  }

  function openEdit(p: Payroll) {
    setSelected(p)
    setEditForm({
      baseSalary:      String(Number(p.baseSalary)),
      bonuses:         String(Number(p.bonuses)),
      deductions:      String(Number(p.deductions)),
      deductionReason: p.deductionReason ?? "",
      bonusReason:     "",
      notes:           p.notes ?? "",
    })
    setEditOpen(true)
  }

  function handleEdit() {
    if (!selected) return
    updateMut.mutate({ id: selected.id, data: {
      baseSalary:      Number(editForm.baseSalary),
      bonuses:         Number(editForm.bonuses) || 0,
      deductions:      Number(editForm.deductions) || 0,
      deductionReason: editForm.deductionReason || undefined,
      notes:           editForm.notes || undefined,
    }}, { onSuccess: () => setEditOpen(false) })
  }

  function openPay(p: Payroll) {
    setSelected(p)
    const paid = p.payments.reduce((sum, payment) => sum + Number(payment.salaryAmount), 0)
    setPayForm({ accountId: "", salaryAmount: Math.max(0, Number(p.netPay) - paid).toString(), paidBy: "", exchangeRate: "1" })
    setPayOpen(true)
  }

  function handlePay() {
    if (!selected || !payForm.accountId || !payForm.salaryAmount) { toast.error("Payment amount and account are required"); return }
    payMut.mutate({ id: selected.id, paidFromId: Number(payForm.accountId), salaryAmount: Number(payForm.salaryAmount), paidBy: payForm.paidBy || undefined, exchangeRate: Number(payForm.exchangeRate) },
      { onSuccess: () => setPayOpen(false) })
  }

  function handleAdvance() {
    if (!advForm.employeeId || !advForm.amount) { toast.error("Employee and amount required"); return }
    advanceMut.mutate({
      employeeId:  Number(advForm.employeeId),
      amount:      Number(advForm.amount),
      reason:      advForm.reason || undefined,
      advanceDate: advForm.advanceDate || undefined,
      notes:       advForm.notes || undefined,
    }, { onSuccess: () => { setAdvanceOpen(false); setAdvForm({ employeeId:"", amount:"", reason:"", advanceDate: now.toISOString().split("T")[0]!, notes:"" }) } })
  }

  function handleGenerate() {
    generateMut.mutate({ month: genForm.month, year: genForm.year },
      { onSuccess: () => setGenerateOpen(false) })
  }

  // ── preview net ────────────────────────────────────────────────────
  const previewNet = (base: string, bon: string, ded: string) =>
    Math.max(0, (Number(base)||0) + (Number(bon)||0) - (Number(ded)||0))

  return (
    <div className="container mx-auto py-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">Payroll Management</h1>
          <p className="text-muted-foreground mt-1">Manage salaries, deductions, advances, and payments</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setAdvanceOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />Advance
          </Button>
          <Button variant="outline" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />Create Payroll
          </Button>
          <Button onClick={() => setGenerateOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />Generate All
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label:"Total Payroll",    value:formatCurrencyTotals(totalPayrollByCurrency),   icon:DollarSign,  color:"text-foreground" },
          { label:"Paid",             value:`${paidCount} employees`,             icon:CheckCircle2, color:"text-green-600" },
          { label:"Pending",          value:`${pendingCount} employees`,          icon:Clock,        color:"text-amber-600" },
          { label:"Outstanding Adv.", value:formatCurrencyTotals(outstandingAdvancesByCurrency), icon:AlertCircle, color:"text-blue-600" },
        ].map(({label,value,icon:Icon,color})=>(
          <Card key={label}>
            <CardContent className="flex items-center gap-3 py-4">
              <div className="p-2.5 rounded-xl bg-muted shrink-0"><Icon className="h-4 w-4 text-muted-foreground"/></div>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className={`text-lg font-bold leading-none mt-0.5 ${color}`}>{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter + Tabs */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={month.toString()} onValueChange={v => setMonth(Number(v))}>
          <SelectTrigger className="w-36"><SelectValue>{M(month)}</SelectValue></SelectTrigger>
          <SelectContent>{MONTHS.map(m=><SelectItem key={m.v} value={m.v.toString()}>{m.l}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={year.toString()} onValueChange={v => setYear(Number(v))}>
          <SelectTrigger className="w-24"><SelectValue/></SelectTrigger>
          <SelectContent>{YEARS.map(y=><SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
        </Select>
        <div className="flex rounded-lg border overflow-hidden">
          <button onClick={() => setTab("payroll")} className={`px-4 py-1.5 text-sm font-medium transition-colors ${tab==="payroll" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
            Payroll
          </button>
          <button onClick={() => setTab("advances")} className={`px-4 py-1.5 text-sm font-medium transition-colors ${tab==="advances" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
            Advances
          </button>
        </div>
      </div>

      {/* ── Payroll list ───────────────────────────────────────────── */}
      {tab === "payroll" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Payroll — {M(month)} {year}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">{[1,2,3].map(i=><Skeleton key={i} className="h-20 w-full"/>)}</div>
            ) : payrolls.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-40"/>
                <p>No payroll records for this period.</p>
                <Button className="mt-3" onClick={() => setGenerateOpen(true)}>
                  Generate Payroll
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {payrolls.map(p => (
                  <div key={p.id} className="flex items-center gap-4 p-4 border rounded-xl hover:bg-muted/30 transition-colors flex-wrap">
                    {/* Employee info */}
                    <div className="min-w-0 w-36 shrink-0">
                      <p className="font-semibold text-sm truncate">{p.employee.name}</p>
                      {p.employee.position && <p className="text-xs text-muted-foreground truncate">{p.employee.position}</p>}
                      <StatusBadge status={p.status}/>
                    </div>

                    <Separator orientation="vertical" className="h-10 hidden sm:block"/>

                    {/* Breakdown */}
                    <div className="flex gap-5 flex-1 flex-wrap text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Base</p>
                        <p className="font-medium">{Number(p.baseSalary).toLocaleString()}</p>
                      </div>
                      {Number(p.bonuses) > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground">Bonuses</p>
                          <p className="font-medium text-green-600">+{Number(p.bonuses).toLocaleString()}</p>
                        </div>
                      )}
                      {Number(p.deductions) > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground">Deductions</p>
                          <p className="font-medium text-red-600">−{Number(p.deductions).toLocaleString()}</p>
                          {p.deductionReason && <p className="text-xs text-muted-foreground max-w-[120px] truncate">{p.deductionReason}</p>}
                        </div>
                      )}
                      {Number(p.advances) > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground">Advances</p>
                          <p className="font-medium text-amber-600">−{Number(p.advances).toLocaleString()}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-muted-foreground">Net Pay</p>
                        <p className="font-bold text-base">{Number(p.netPay).toLocaleString()} {p.salaryCurrency}</p>
                        <p className="text-xs text-muted-foreground">Paid: {p.payments.reduce((sum, payment) => sum + Number(payment.salaryAmount), 0).toLocaleString()} {p.salaryCurrency} · Remaining: {Math.max(0, Number(p.netPay) - p.payments.reduce((sum, payment) => sum + Number(payment.salaryAmount), 0)).toLocaleString()} {p.salaryCurrency}</p>
                      </div>
                    </div>

                    {/* Paid info */}
                    {p.status === "PAID" && p.paidFrom && (
                      <div className="text-xs text-muted-foreground text-right shrink-0">
                        <p className="flex items-center gap-1"><Wallet className="h-3 w-3"/>{p.paidFrom.name}</p>
                        {p.paidAt && <p>{new Date(p.paidAt).toLocaleDateString()}</p>}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-1 shrink-0 ml-auto">
                      <Button size="sm" variant="ghost" onClick={() => { setSelected(p); setViewOpen(true) }}>
                        <Eye className="h-4 w-4"/>
                      </Button>
                      {p.status === "PENDING" && (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => openEdit(p)}>
                            <Edit className="h-4 w-4"/>
                          </Button>
                          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive"
                            onClick={() => { setSelected(p); setDeleteOpen(true) }}>
                            <Trash2 className="h-4 w-4"/>
                          </Button>
                          <Button size="sm" onClick={() => openPay(p)}>
                            Pay
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}

                {/* Month totals */}
                <div className="flex justify-end gap-6 pt-3 border-t text-sm">
                  <span className="text-muted-foreground">Total Net:</span>
                  <span className="font-bold text-base">{formatCurrencyTotals(totalPayrollByCurrency)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Advances list ──────────────────────────────────────────── */}
      {tab === "advances" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Salary Advances</CardTitle>
          </CardHeader>
          <CardContent>
            {advances.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <AlertCircle className="h-10 w-10 mx-auto mb-3 opacity-40"/>
                <p>No advances recorded.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {advances.map(a => (
                  <div key={a.id} className="flex items-center gap-4 p-4 border rounded-xl flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm">{a.employee.name}</p>
                        <Badge variant={a.fullyDeducted ? "secondary" : "outline"} className="text-xs">
                          {a.fullyDeducted ? "Fully Deducted" : "Outstanding"}
                        </Badge>
                      </div>
                      {a.reason && <p className="text-xs text-muted-foreground mt-0.5">{a.reason}</p>}
                      <p className="text-xs text-muted-foreground">{new Date(a.advanceDate).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right text-sm shrink-0">
                      <p className="font-bold">{Number(a.amount).toLocaleString()} {a.currency}</p>
                      <p className="text-xs text-muted-foreground">
                        Deducted: {Number(a.deductedAmount).toLocaleString()} · 
                        Remaining: {(Number(a.amount)-Number(a.deductedAmount)).toLocaleString()} {a.currency}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ══ Dialogs ══════════════════════════════════════════════════ */}

      {/* Create Payroll */}
      <Dialog open={createOpen} onOpenChange={o => { setCreateOpen(o); if(!o) setCreateForm(blankCreate()) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Payroll Entry</DialogTitle>
            <DialogDescription>Add a single employee payroll record</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="space-y-1.5">
              <Label>Employee *</Label>
              <Select value={createForm.employeeId} onValueChange={v => setCreateForm(f=>({...f, employeeId: v ?? ""}))}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select employee"/></SelectTrigger>
                <SelectContent>
                  {employees.map((e: any) => (
                    <SelectItem key={e.id} value={e.id.toString()}>
                      {e.name}{e.salary ? ` — ${Number(e.salary).toLocaleString()} ${e.salaryCurrency}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Month *</Label>
                <Select value={createForm.month.toString()} onValueChange={v => setCreateForm(f=>({...f, month:Number(v)}))}>
                  <SelectTrigger className="w-full"><SelectValue>{M(createForm.month)}</SelectValue></SelectTrigger>
                  <SelectContent>{MONTHS.map(m=><SelectItem key={m.v} value={m.v.toString()}>{m.l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Year *</Label>
                <Select value={createForm.year.toString()} onValueChange={v => setCreateForm(f=>({...f, year:Number(v)}))}>
                  <SelectTrigger className="w-full"><SelectValue/></SelectTrigger>
                  <SelectContent>{YEARS.map(y=><SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Base Salary ({employees.find((e: any) => String(e.id) === createForm.employeeId)?.salaryCurrency ?? "currency"}) *</Label>
              <Input type="number" placeholder="0" value={createForm.baseSalary} onChange={e=>setCreateForm(f=>({...f,baseSalary:e.target.value}))}/>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Bonuses ({employees.find((e: any) => String(e.id) === createForm.employeeId)?.salaryCurrency ?? "currency"})</Label>
                <Input type="number" placeholder="0" value={createForm.bonuses} onChange={e=>setCreateForm(f=>({...f,bonuses:e.target.value}))}/>
              </div>
              <div className="space-y-1.5">
                <Label>Deductions ({employees.find((e: any) => String(e.id) === createForm.employeeId)?.salaryCurrency ?? "currency"})</Label>
                <Input type="number" placeholder="0" value={createForm.deductions} onChange={e=>setCreateForm(f=>({...f,deductions:e.target.value}))}/>
              </div>
            </div>
            {Number(createForm.deductions) > 0 && (
              <div className="space-y-1.5">
                <Label>Deduction Reason <span className="text-muted-foreground text-xs">(why are we charging?)</span></Label>
                <Textarea rows={2} className="resize-none" placeholder="e.g. 3 absent days, no reports for 2 days…"
                  value={createForm.deductionReason} onChange={e=>setCreateForm(f=>({...f,deductionReason:e.target.value}))}/>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea rows={2} className="resize-none" value={createForm.notes} onChange={e=>setCreateForm(f=>({...f,notes:e.target.value}))}/>
            </div>
            {createForm.baseSalary && (
              <div className="flex justify-between text-sm bg-muted rounded-lg px-3 py-2">
                <span className="text-muted-foreground">Preview Net Pay</span>
                <span className="font-bold">{previewNet(createForm.baseSalary, createForm.bonuses, createForm.deductions).toLocaleString()} {employees.find((e: any) => String(e.id) === createForm.employeeId)?.salaryCurrency ?? ""}</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createMut.isPending}>
              {createMut.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin"/>}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Payroll */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Payroll — {selected?.employee.name}</DialogTitle>
            <DialogDescription>{M(selected?.month ?? 0)} {selected?.year}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="space-y-1.5">
              <Label>Base Salary (AFN)</Label>
              <Input type="number" value={editForm.baseSalary} onChange={e=>setEditForm(f=>({...f,baseSalary:e.target.value}))}/>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Bonuses</Label>
                <Input type="number" value={editForm.bonuses} onChange={e=>setEditForm(f=>({...f,bonuses:e.target.value}))}/>
              </div>
              <div className="space-y-1.5">
                <Label>Deductions</Label>
                <Input type="number" value={editForm.deductions} onChange={e=>setEditForm(f=>({...f,deductions:e.target.value}))}/>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Deduction Reason</Label>
              <Textarea rows={2} className="resize-none" placeholder="Reason for charges (absent, no report, etc.)"
                value={editForm.deductionReason} onChange={e=>setEditForm(f=>({...f,deductionReason:e.target.value}))}/>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea rows={2} className="resize-none" value={editForm.notes} onChange={e=>setEditForm(f=>({...f,notes:e.target.value}))}/>
            </div>
            <div className="flex justify-between text-sm bg-muted rounded-lg px-3 py-2">
              <span className="text-muted-foreground">Preview Net Pay</span>
              <span className="font-bold">{previewNet(editForm.baseSalary, editForm.bonuses, editForm.deductions).toLocaleString()} AFN</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={updateMut.isPending}>
              {updateMut.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin"/>}Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pay Payroll */}
      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Process Payment</DialogTitle>
            <DialogDescription>{selected?.employee.name} — {M(selected?.month ?? 0)} {selected?.year}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span className="text-sm text-muted-foreground">Net Salary to Pay</span>
              <span className="text-xl font-bold">{Number(selected?.netPay ?? 0).toLocaleString()} {selected?.salaryCurrency}</span>
              <span className="text-xs text-muted-foreground">Remaining: {selected ? Math.max(0, Number(selected.netPay) - selected.payments.reduce((sum, payment) => sum + Number(payment.salaryAmount), 0)).toLocaleString() : "0"} {selected?.salaryCurrency}</span>
            </div>
            {selected && Number(selected.deductions) > 0 && selected.deductionReason && (
              <div className="p-3 border border-amber-200 rounded-lg bg-amber-50 dark:bg-amber-900/10">
                <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-0.5">Deduction applied</p>
                <p className="text-xs text-muted-foreground">{selected.deductionReason}</p>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Salary amount to pay ({selected?.salaryCurrency}) *</Label>
              <Input type="number" min="0.01" step="0.01" value={payForm.salaryAmount} onChange={e => setPayForm(f => ({ ...f, salaryAmount: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Pay from Account *</Label>
              <Select value={payForm.accountId} onValueChange={v => setPayForm(f=>({...f, accountId: v ?? ""}))}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {accounts.find((account: any) => String(account.id) === payForm.accountId)?.name ?? "Select account"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(accounts as any[]).map((acc) => (
                    <SelectItem key={acc.id} value={acc.id.toString()}
                      disabled={Number(acc.balance) < Number(payForm.salaryAmount || 0) * Number(payForm.exchangeRate || 0)}>
                      <span className="flex items-center gap-2">
                        <Wallet className="h-3.5 w-3.5"/>
                        {acc.name} — {Number(acc.balance).toLocaleString()} {acc.currency}
                        {Number(acc.balance) < Number(payForm.salaryAmount || 0) * Number(payForm.exchangeRate || 0) && (
                          <span className="text-xs text-destructive ml-1">(insufficient)</span>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(() => {
              const selectedAccount = accounts.find((account: any) => String(account.id) === payForm.accountId)
              const currenciesDiffer = !!selectedAccount && selectedAccount.currency !== selected?.salaryCurrency
              return currenciesDiffer ? (
                <div className="space-y-1.5">
                  <Label>Exchange rate (1 {selected?.salaryCurrency} = ? {selectedAccount.currency})</Label>
                  <Input type="number" min="0.00000001" step="0.00000001" value={payForm.exchangeRate} onChange={e => setPayForm(f => ({ ...f, exchangeRate: e.target.value }))} />
                  <p className="text-xs text-muted-foreground">Account debit: {(Number(payForm.salaryAmount || 0) * Number(payForm.exchangeRate || 0)).toLocaleString()} {selectedAccount.currency}</p>
                </div>
              ) : selectedAccount ? (
                <p className="text-xs text-muted-foreground">Same currency payment: {selectedAccount.currency}. No exchange rate required.</p>
              ) : null
            })()}
            <div className="space-y-1.5">
              <Label>Paid By <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input placeholder="Name of person processing" value={payForm.paidBy} onChange={e=>setPayForm(f=>({...f,paidBy:e.target.value}))}/>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayOpen(false)}>Cancel</Button>
            <Button onClick={handlePay} disabled={payMut.isPending || !payForm.accountId}>
              {payMut.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin"/>}
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Advance */}
      <Dialog open={advanceOpen} onOpenChange={setAdvanceOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Salary Advance</DialogTitle>
            <DialogDescription>Give an employee money before the month ends — deducted from next payroll</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="space-y-1.5">
              <Label>Employee *</Label>
              <Select value={advForm.employeeId} onValueChange={v => setAdvForm(f=>({...f, employeeId: v ?? ""}))}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select employee"/></SelectTrigger>
                <SelectContent>
                  {employees.map((e: any) => <SelectItem key={e.id} value={e.id.toString()}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Amount ({employees.find((e: any) => String(e.id) === advForm.employeeId)?.salaryCurrency ?? "currency"}) *</Label>
              <Input type="number" placeholder="0" value={advForm.amount} onChange={e=>setAdvForm(f=>({...f,amount:e.target.value}))}/>
            </div>
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" value={advForm.advanceDate} onChange={e=>setAdvForm(f=>({...f,advanceDate:e.target.value}))}/>
            </div>
            <div className="space-y-1.5">
              <Label>Reason</Label>
              <Textarea rows={2} className="resize-none" placeholder="Why is this advance being given?"
                value={advForm.reason} onChange={e=>setAdvForm(f=>({...f,reason:e.target.value}))}/>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdvanceOpen(false)}>Cancel</Button>
            <Button onClick={handleAdvance} disabled={advanceMut.isPending}>
              {advanceMut.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin"/>}Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Monthly Payroll */}
      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Generate Monthly Payroll</DialogTitle>
            <DialogDescription>
              Creates one payroll entry for every active employee with a salary. 
              Pending advances are automatically deducted.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Month</Label>
                <Select value={genForm.month.toString()} onValueChange={v => setGenForm(f=>({...f,month:Number(v)}))}>
                  <SelectTrigger className="w-full"><SelectValue>{M(genForm.month)}</SelectValue></SelectTrigger>
                  <SelectContent>{MONTHS.map(m=><SelectItem key={m.v} value={m.v.toString()}>{m.l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Year</Label>
                <Select value={genForm.year.toString()} onValueChange={v => setGenForm(f=>({...f,year:Number(v)}))}>
                  <SelectTrigger className="w-full"><SelectValue/></SelectTrigger>
                  <SelectContent>{YEARS.map(y=><SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-muted text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">What happens:</p>
              <p>• One payroll entry per employee (skips if already exists)</p>
              <p>• Base salary pulled from employee profile</p>
              <p>• Pending advances automatically included as deductions</p>
              <p>• All entries created as PENDING — you pay individually</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenerateOpen(false)}>Cancel</Button>
            <Button onClick={handleGenerate} disabled={generateMut.isPending}>
              {generateMut.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin"/>}
              Generate for {M(genForm.month)} {genForm.year}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selected?.employee.name}</DialogTitle>
            <DialogDescription>{M(selected?.month ?? 0)} {selected?.year} payroll</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ["Status",     <StatusBadge status={selected.status}/>],
                    ["Base Salary",`${Number(selected.baseSalary).toLocaleString()} ${selected.salaryCurrency}`],
                  ["Bonuses",    `+${Number(selected.bonuses).toLocaleString()} AFN`],
                  ["Deductions", `−${Number(selected.deductions).toLocaleString()} AFN`],
                  ["Advances",   `−${Number(selected.advances).toLocaleString()} AFN`],
                    ["Net Pay",    <span className="font-bold text-base">{Number(selected.netPay).toLocaleString()} {selected.salaryCurrency}</span>],
                ].map(([k, v]) => (
                  <div key={String(k)}>
                    <p className="text-xs text-muted-foreground mb-0.5">{String(k)}</p>
                    {typeof v === "string" ? <p className="font-medium">{v}</p> : v}
                  </div>
                ))}
              </div>
              {selected.deductionReason && (
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200">
                  <p className="text-xs font-medium mb-0.5 text-amber-700 dark:text-amber-400">Deduction reason</p>
                  <p className="text-sm">{selected.deductionReason}</p>
                </div>
              )}
              {selected.paidFrom && (
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200">
                  <p className="text-xs font-medium mb-0.5 text-green-700 dark:text-green-400">Payment info</p>
                  <p className="text-sm">Account: {selected.paidFrom.name}</p>
                  {selected.paidAt && <p className="text-xs text-muted-foreground">{new Date(selected.paidAt).toLocaleString()}</p>}
                  {selected.paidBy && <p className="text-xs text-muted-foreground">By: {selected.paidBy}</p>}
                  {selected.paidAmount && <p className="text-xs text-muted-foreground">Paid: {Number(selected.paidAmount).toLocaleString()} {selected.paidCurrency} (rate {selected.exchangeRate})</p>}
                </div>
              )}
              {selected.notes && (
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Notes</p>
                  <p className="text-sm">{selected.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setViewOpen(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete payroll entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the {M(selected?.month ?? 0)} {selected?.year} payroll for{" "}
              <strong>{selected?.employee.name}</strong>. Cannot delete a paid record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => selected && deleteMut.mutate(selected.id, { onSuccess: () => setDeleteOpen(false) })}>
              {deleteMut.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
