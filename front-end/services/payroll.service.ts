import { api } from "@/lib/api"

export interface Payroll {
  id: number
  employeeId: number
  month: number
  year: number
  baseSalary: number
  salaryCurrency: string
  bonuses: number
  deductions: number
  advances: number
  netSalary: number
  status: string
  paidFrom: number | null
  paidAt: string | null
  paidCurrency: string | null
  exchangeRate: number | null
  paidAmount: number | null
  payments: { salaryAmount: number; paidAmount: number; salaryCurrency: string; paidCurrency: string; exchangeRate: number; paidAt: string; paidBy: string | null }[]
  notes: string | null
  createdAt: string
  updatedAt: string
  employee?: {
    id: number
    name: string
    email: string
    position: string | null
    department: string | null
  }
  account?: {
    id: number
    name: string
    type: string
  }
}

export interface PayrollAdvance {
  id: number
  employeeId: number
  amount: number
  reason: string | null
  date: string
  deductedInPayrollId: number | null
  createdAt: string
  employee?: {
    id: number
    name: string
    email: string
  }
}

export interface CreatePayrollDto {
  employeeId: number
  month: number
  year: number
  bonuses?: number
  deductions?: number
}

export interface ProcessPayrollDto {
  payrollId: number
  accountId: number
  notes?: string
  exchangeRate: number
}

export interface CreateAdvanceDto {
  employeeId: number
  amount: number
  reason?: string
  date: string
}

export const payrollService = {
  // Payroll
  getAllPayrolls: async (filters?: { month?: number; year?: number; status?: string }): Promise<Payroll[]> => {
    const params = new URLSearchParams()
    if (filters?.month) params.append("month", filters.month.toString())
    if (filters?.year) params.append("year", filters.year.toString())
    if (filters?.status) params.append("status", filters.status)
    
    const response = await api.get(`/payroll?${params.toString()}`)
    return response.data
  },

  getPayrollById: async (id: number): Promise<Payroll> => {
    const response = await api.get(`/payroll/${id}`)
    return response.data
  },

  getEmployeePayrolls: async (employeeId: number): Promise<Payroll[]> => {
    const response = await api.get(`/payroll/employee/${employeeId}`)
    return response.data
  },

  createPayroll: async (data: CreatePayrollDto): Promise<Payroll> => {
    const response = await api.post("/payroll", data)
    return response.data
  },

  processPayroll: async (data: ProcessPayrollDto): Promise<Payroll> => {
    const response = await api.post("/payroll/process", data)
    return response.data
  },

  deletePayroll: async (id: number): Promise<void> => {
    await api.delete(`/payroll/${id}`)
  },

  // Advances
  getAllAdvances: async (): Promise<PayrollAdvance[]> => {
    const response = await api.get("/payroll/advances")
    return response.data
  },

  getEmployeeAdvances: async (employeeId: number): Promise<PayrollAdvance[]> => {
    const response = await api.get(`/payroll/advances/employee/${employeeId}`)
    return response.data
  },

  createAdvance: async (data: CreateAdvanceDto): Promise<PayrollAdvance> => {
    const response = await api.post("/payroll/advances", data)
    return response.data
  },

  deleteAdvance: async (id: number): Promise<void> => {
    await api.delete(`/payroll/advances/${id}`)
  },
}
