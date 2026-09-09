import { PayrollStatus } from "../generated/prisma/index.js"

// ────────────────────────────────────────────────────────────────────
// Payroll DTOs
// ────────────────────────────────────────────────────────────────────

export interface CreatePayrollDto {
  employeeId: number
  month: number  // 1-12
  year: number  // e.g. 2024
  baseSalary: number
  advances?: number
  deductions?: number
  deductionReason?: string  // why the deduction (absent days, no report, etc.)
  bonuses?: number
  notes?: string
}

export interface UpdatePayrollDto {
  baseSalary?: number
  advances?: number
  deductions?: number
  deductionReason?: string
  bonuses?: number
  notes?: string
}

export interface PayPayrollDto {
  paidFromId: number  // Account ID
  salaryAmount: number
  paidBy?: string  // Name of person processing payment
  exchangeRate: number
}

export interface RecordAdvanceDto {
  employeeId: number
  amount: number
  reason?: string
  advanceDate?: string
  notes?: string
}

export interface DeductAdvanceDto {
  advanceId: number
  amount: number
}

export interface GenerateMonthlyPayrollDto {
  month: number
  year: number
  employeeIds?: number[]  // If not provided, generate for all employees
}
