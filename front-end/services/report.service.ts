import { api } from "@/lib/api"

function unwrap<T>(r: { data: { data: T } | T }): T {
  return (r.data as any).data ?? r.data
}

export interface EmployeeReport {
  id: number
  employeeId: number
  reportDate: string
  type: string
  content: string
  weekday: number
  weekNumber: number | null
  employee: {
    id: number
    name: string
    email: string
    position: string | null
    department: string | null
  }
}

export interface MonthlySummaryItem {
  id: number
  name: string
  email: string
  position: string | null
  department: string | null
  employeeId: number
  year: number
  month: number
  daysInMonth: number
  expectedWorkDays: number
  totalReports: number
  missingDates: string[]
  missingCount: number
  completionRate: number
  reports: EmployeeReport[]
}

export interface EmployeeMonthlySummary {
  employeeId: number
  year: number
  month: number
  daysInMonth: number
  expectedWorkDays: number
  totalReports: number
  missingDates: string[]
  missingCount: number
  completionRate: number
  reports: EmployeeReport[]
}

export const reportService = {
  /** All employees summary for a given month */
  getAllMonthlySummary: async (year: number, month: number): Promise<MonthlySummaryItem[]> => {
    const r = await api.get(`/reports/summary/monthly/${year}/${month}`)
    return unwrap(r)
  },

  /** Single employee monthly summary */
  getEmployeeMonthlySummary: async (
    employeeId: number,
    year: number,
    month: number
  ): Promise<EmployeeMonthlySummary> => {
    const r = await api.get(`/reports/employee/${employeeId}/monthly/${year}/${month}`)
    return unwrap(r)
  },

  /** List reports with optional filters */
  listReports: async (params: {
    employeeId?: number
    year?: number
    month?: number
    type?: string
  }): Promise<EmployeeReport[]> => {
    const q = new URLSearchParams()
    if (params.employeeId) q.set("employeeId", String(params.employeeId))
    if (params.year) q.set("year", String(params.year))
    if (params.month) q.set("month", String(params.month))
    if (params.type) q.set("type", params.type)
    const r = await api.get(`/reports?${q}`)
    return unwrap(r)
  },

  /** Single report */
  getById: async (id: number): Promise<EmployeeReport> => {
    const r = await api.get(`/reports/${id}`)
    return unwrap(r)
  },
}
