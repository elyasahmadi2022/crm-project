import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { toast } from "@/lib/toast"

// ── Types ─────────────────────────────────────────────────────────────
export interface Payroll {
  id: number
  employeeId: number
  month: number
  year: number
  baseSalary: number
  advances: number
  deductions: number
  deductionReason: string | null
  bonuses: number
  netPay: number
  salaryCurrency: string
  status: "PENDING" | "PAID" | "FAILED"
  paidFromId: number | null
  paidFrom: { id: number; name: string; balance: number; currency: string } | null
  paidAt: string | null
  paidBy: string | null
  paidCurrency: string | null
  exchangeRate: number | null
  paidAmount: number | null
  payments: { salaryAmount: number; paidAmount: number; salaryCurrency: string; paidCurrency: string; exchangeRate: number; paidAt: string; paidBy: string | null }[]
  notes: string | null
  employee: {
    id: number
    name: string
    email: string
    position: string | null
    department: string | null
    salary?: number | null
  }
}

export interface PayrollAdvance {
  id: number
  employeeId: number
  amount: number
  currency: string
  reason: string | null
  advanceDate: string
  deductedAmount: number
  fullyDeducted: boolean
  notes: string | null
  employee: { id: number; name: string; position: string | null }
}

export interface MonthlyReport {
  month: number
  year: number
  totalBaseSalary: number
  totalAdvances: number
  totalDeductions: number
  totalBonuses: number
  totalNetPay: number
  paidCount: number
  pendingCount: number
  payrolls: Payroll[]
}

// ── Helpers ────────────────────────────────────────────────────────────
function unwrap<T>(r: { data: { data: T } | T }): T {
  return (r.data as any).data ?? r.data
}

// ── Query keys ─────────────────────────────────────────────────────────
export const payrollKeys = {
  all:     ["payrolls"] as const,
  list:    (f: object)  => ["payrolls", "list", f] as const,
  report:  (m: number, y: number) => ["payrolls", "report", m, y] as const,
  advances: ["payroll-advances"] as const,
}

// ── Payroll list ───────────────────────────────────────────────────────
export function usePayrolls(filters: { month?: number; year?: number; employeeId?: number; status?: string }) {
  return useQuery({
    queryKey: payrollKeys.list(filters),
    queryFn: async () => {
      const r = await api.get("/payroll", { params: filters })
      return unwrap<Payroll[]>(r)
    },
  })
}

// ── Monthly report (totals + list) ─────────────────────────────────────
export function useMonthlyReport(month: number, year: number) {
  return useQuery({
    queryKey: payrollKeys.report(month, year),
    queryFn: async () => {
      const r = await api.get(`/payroll/report/${year}/${month}`)
      return unwrap<MonthlyReport>(r)
    },
  })
}

// ── Advances ───────────────────────────────────────────────────────────
export function useAdvances(employeeId?: number) {
  return useQuery({
    queryKey: [...payrollKeys.advances, employeeId],
    queryFn: async () => {
      const r = await api.get("/payroll/advances", { params: employeeId ? { employeeId } : {} })
      return unwrap<PayrollAdvance[]>(r)
    },
  })
}

// ── Create single payroll ──────────────────────────────────────────────
export function useCreatePayroll() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      employeeId: number
      month: number
      year: number
      baseSalary: number
      advances?: number
      deductions?: number
      deductionReason?: string
      bonuses?: number
      notes?: string
    }) => {
      const r = await api.post("/payroll", data)
      return unwrap<Payroll>(r)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: payrollKeys.all })
      toast.success("Payroll entry created")
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to create payroll"),
  })
}

// ── Update payroll ─────────────────────────────────────────────────────
export function useUpdatePayroll() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<{ baseSalary: number; advances: number; deductions: number; deductionReason: string; bonuses: number; notes: string }> }) => {
      const r = await api.put(`/payroll/${id}`, data)
      return unwrap<Payroll>(r)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: payrollKeys.all })
      toast.success("Payroll updated")
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to update payroll"),
  })
}

// ── Delete payroll ─────────────────────────────────────────────────────
export function useDeletePayroll() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => { await api.delete(`/payroll/${id}`) },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: payrollKeys.all })
      toast.success("Payroll deleted")
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to delete"),
  })
}

// ── Pay payroll (deducts from account) ─────────────────────────────────
export function usePayPayroll() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, paidFromId, salaryAmount, paidBy, exchangeRate }: { id: number; paidFromId: number; salaryAmount: number; paidBy?: string; exchangeRate: number }) => {
      const r = await api.post(`/payroll/${id}/pay`, { paidFromId, salaryAmount, paidBy, exchangeRate })
      return unwrap<Payroll>(r)
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: payrollKeys.all })
      qc.invalidateQueries({ queryKey: ["accounts"] })    // balance changed
      toast.success(`Payment processed for ${data.employee.name}`)
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Payment failed"),
  })
}

// ── Generate monthly payroll for all employees ─────────────────────────
export function useGenerateMonthly() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { month: number; year: number; employeeIds?: number[] }) => {
      const r = await api.post("/payroll/generate", data)
      return unwrap<Payroll[]>(r)
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: payrollKeys.all })
      toast.success(`Generated payroll for ${data.length} employee${data.length !== 1 ? "s" : ""}`)
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Generation failed"),
  })
}

// ── Record advance ─────────────────────────────────────────────────────
export function useRecordAdvance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { employeeId: number; amount: number; reason?: string; advanceDate?: string; notes?: string }) => {
      const r = await api.post("/payroll/advances", data)
      return unwrap<PayrollAdvance>(r)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: payrollKeys.advances })
      toast.success("Advance recorded")
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to record advance"),
  })
}
