"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { financeService } from "@/services/finance.service"
import { getApiErrorMessage } from "@/lib/api"
import { toast } from "@/components/ui/toast"
import type {
  CreateInvoiceDto, UpdateInvoiceDto, ChangeInvoiceStatusDto, AddPaymentDto, ListInvoicesQuery,
  CreateExpenseDto, UpdateExpenseDto, ListExpensesQuery,
} from "@/services/finance.service"

const show = (opts: Parameters<typeof toast.add>[0]) => toast.add(opts)

// ── Keys ──────────────────────────────────────────────────────────────────────
export const financeKeys = {
  invoices: {
    all:    ["invoices"] as const,
    lists:  () => ["invoices", "list"] as const,
    list:   (q: ListInvoicesQuery) => ["invoices", "list", q] as const,
    detail: (id: number) => ["invoices", "detail", id] as const,
  },
  expenses: {
    all:    ["expenses"] as const,
    lists:  () => ["expenses", "list"] as const,
    list:   (q: ListExpensesQuery) => ["expenses", "list", q] as const,
    detail: (id: number) => ["expenses", "detail", id] as const,
  },
}

// ── Invoices ──────────────────────────────────────────────────────────────────
export function useListInvoicesQuery(params?: ListInvoicesQuery) {
  return useQuery({
    queryKey: financeKeys.invoices.list(params ?? {}),
    queryFn:  () => financeService.getAllInvoices(params),
    staleTime: 30_000,
  })
}

export function useCreateInvoiceMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateInvoiceDto) => financeService.createInvoice(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: financeKeys.invoices.lists() })
      show({ title: "Invoice created", type: "success" })
    },
    onError: (err) => show({ title: "Failed to create invoice", description: getApiErrorMessage(err), type: "error" }),
  })
}

export function useUpdateInvoiceMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateInvoiceDto }) => financeService.updateInvoice(id, dto),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: financeKeys.invoices.lists() })
      qc.setQueryData(financeKeys.invoices.detail(data.id), data)
      show({ title: "Invoice updated", type: "success" })
    },
    onError: (err) => show({ title: "Failed to update invoice", description: getApiErrorMessage(err), type: "error" }),
  })
}

export function useChangeInvoiceStatusMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: ChangeInvoiceStatusDto }) =>
      financeService.changeInvoiceStatus(id, dto),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: financeKeys.invoices.lists() })
      qc.setQueryData(financeKeys.invoices.detail(data.id), data)
      show({ title: "Invoice status updated", type: "success" })
    },
    onError: (err) => show({ title: "Failed to change status", description: getApiErrorMessage(err), type: "error" }),
  })
}

export function useAddPaymentMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: AddPaymentDto }) => financeService.addPayment(id, dto),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: financeKeys.invoices.lists() })
      qc.invalidateQueries({ queryKey: financeKeys.invoices.detail(id) })
      show({ title: "Payment recorded", type: "success" })
    },
    onError: (err) => show({ title: "Failed to record payment", description: getApiErrorMessage(err), type: "error" }),
  })
}

// ── Expenses ──────────────────────────────────────────────────────────────────
export function useListExpensesQuery(params?: ListExpensesQuery) {
  return useQuery({
    queryKey: financeKeys.expenses.list(params ?? {}),
    queryFn:  () => financeService.getAllExpenses(params),
    staleTime: 30_000,
  })
}

export function useCreateExpenseMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateExpenseDto) => financeService.createExpense(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: financeKeys.expenses.lists() })
      show({ title: "Expense created", type: "success" })
    },
    onError: (err) => show({ title: "Failed to create expense", description: getApiErrorMessage(err), type: "error" }),
  })
}

export function useUpdateExpenseMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateExpenseDto }) => financeService.updateExpense(id, dto),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: financeKeys.expenses.lists() })
      qc.setQueryData(financeKeys.expenses.detail(data.id), data)
      show({ title: "Expense updated", type: "success" })
    },
    onError: (err) => show({ title: "Failed to update expense", description: getApiErrorMessage(err), type: "error" }),
  })
}
