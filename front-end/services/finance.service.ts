/**
 * services/finance.service.ts
 * Route prefix: /api/v1/finance
 */
import { api } from "@/lib/api"

interface ApiEnvelope<T> {
  status: number
  data: T
  pagination?: { page: number; limit: number; total: number; totalPages: number }
}

function unwrap<T>(r: { data: ApiEnvelope<T> }): T {
  return r.data.data
}

function unwrapPaginated<T>(r: { data: ApiEnvelope<T[]> }) {
  return {
    data: r.data.data,
    meta: r.data.pagination ?? { page: 1, limit: 10, total: 0, totalPages: 0 },
  }
}

// ── Enums ─────────────────────────────────────────────────────────────────────
export type InvoiceStatus = "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED"

export type ExpenseCategory =
  | "SOFTWARE"
  | "HARDWARE"
  | "MARKETING"
  | "TRAVEL"
  | "SALARIES"
  | "OFFICE"
  | "OTHER"
  | "CUSTOM"

// ── Shared sub-types ──────────────────────────────────────────────────────────
export interface CustomerSummary { id: number; companyName: string; status: string }
export interface ProjectSummary  { id: number; name: string; stage: string }

// ── Invoices ──────────────────────────────────────────────────────────────────
export interface InvoiceDto {
  id: number
  customer: CustomerSummary
  project: ProjectSummary | null
  amount: string
  currency: string
  status: InvoiceStatus
  payment: {
    amountPaid: string
    balanceDue: string
    paymentsCount: number
    isOverdue: boolean
  }
  issueDate: string | null
  dueDate: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateInvoiceDto {
  customerId: number
  projectId?: number
  amount: number
  currency: string
  issueDate?: string
  dueDate?: string
}

export interface UpdateInvoiceDto {
  amount?: number
  issueDate?: string
  dueDate?: string
}

export interface ChangeInvoiceStatusDto { newStatus: InvoiceStatus }
export interface AddPaymentDto { amount: number; accountId: number; method?: string; paidAt?: string }

export interface ListInvoicesQuery {
  customerId?: number
  status?: InvoiceStatus
  page?: number
  limit?: number
}

// ── Expenses ──────────────────────────────────────────────────────────────────
export interface ExpenseDto {
    currency: string
    accountId: number | null
  id: number
  description: string
  category: ExpenseCategory
  amount: string
  spentAt: string
  project: ProjectSummary | null
  customCategory: { id: number; name: string; color: string } | null
  createdAt: string
}

export interface CreateExpenseDto {
    currency:        string
    accountId:       number
  description:       string
  category:          ExpenseCategory
  amount:            number
  spentAt?:          string
  projectId?:        number
  customCategoryId?: number
}

export type UpdateExpenseDto = Partial<CreateExpenseDto>

export interface ListExpensesQuery {
  category?: ExpenseCategory
  projectId?: number
  page?: number
  limit?: number
}

// ── Service ───────────────────────────────────────────────────────────────────
export const financeService = {
  // Invoices
  getAllInvoices: (params?: ListInvoicesQuery) =>
    api.get<ApiEnvelope<InvoiceDto[]>>("/finance/invoices", { params }).then(unwrapPaginated),

  getInvoiceById: (id: number) =>
    api.get<ApiEnvelope<InvoiceDto>>(`/finance/invoices/${id}`).then(unwrap),

  createInvoice: (dto: CreateInvoiceDto) =>
    api.post<ApiEnvelope<InvoiceDto>>("/finance/invoices", dto).then(unwrap),

  updateInvoice: (id: number, dto: UpdateInvoiceDto) =>
    api.put<ApiEnvelope<InvoiceDto>>(`/finance/invoices/${id}`, dto).then(unwrap),

  changeInvoiceStatus: (id: number, dto: ChangeInvoiceStatusDto) =>
    api.patch<ApiEnvelope<InvoiceDto>>(`/finance/invoices/${id}/status`, dto).then(unwrap),

  addPayment: (id: number, dto: AddPaymentDto) =>
    api.post<ApiEnvelope<unknown>>(`/finance/invoices/${id}/payments`, dto).then(unwrap),

  // Expenses
  getAllExpenses: (params?: ListExpensesQuery) =>
    api.get<ApiEnvelope<ExpenseDto[]>>("/finance/expenses", { params }).then(unwrapPaginated),

  getExpenseById: (id: number) =>
    api.get<ApiEnvelope<ExpenseDto>>(`/finance/expenses/${id}`).then(unwrap),

  createExpense: (dto: CreateExpenseDto) =>
    api.post<ApiEnvelope<ExpenseDto>>("/finance/expenses", dto).then(unwrap),

  updateExpense: (id: number, dto: UpdateExpenseDto) =>
    api.put<ApiEnvelope<ExpenseDto>>(`/finance/expenses/${id}`, dto).then(unwrap),
}
