import { z } from 'zod';
import {
  type  Invoice,
  type  Payment,
  type  InvoiceStatusHistory,
  type  Budget,
  type  Expense,
  InvoiceStatus,
  BudgetCategory,
  ExpenseCategory,
  type  User,
  type  Customer,
  type  Project,
} from '../generated/prisma/index.js';
import {type Campaign } from '../generated/prisma/index.js';
import { toUserSummaryDto, type UserSummaryDto } from './user.dto.js';
import { toCustomerSummaryDto, type CustomerSummaryDto } from './customer.dto.js';
import { toProjectSummaryDto, type ProjectSummaryDto } from './project.dto.js';
import { toCampaignSummaryDto, type CampaignSummaryDto } from './marketing.dto.js';

// ---------- Invoice requests ----------

export const createInvoiceSchema = z.object({
  customerId: z.number().int().positive(),
  projectId: z.number().int().positive().optional(),
  amount: z.coerce.number().positive(),
  issueDate: z.coerce.date().optional(),
  dueDate: z.coerce.date().optional(),
});
export type CreateInvoiceDto = z.infer<typeof createInvoiceSchema>;

export const updateInvoiceSchema = z.object({
  amount: z.coerce.number().positive().optional(),
  issueDate: z.coerce.date().optional(),
  dueDate: z.coerce.date().optional(),
});
export type UpdateInvoiceDto = z.infer<typeof updateInvoiceSchema>;

export const changeInvoiceStatusSchema = z.object({
  newStatus: z.nativeEnum(InvoiceStatus),
});
export type ChangeInvoiceStatusDto = z.infer<typeof changeInvoiceStatusSchema>;

export const listInvoicesQuerySchema = z.object({
  customerId: z.coerce.number().int().positive().optional(),
  status: z.nativeEnum(InvoiceStatus).optional(),
});
export type ListInvoicesQueryDto = z.infer<typeof listInvoicesQuerySchema>;

// ---------- Payment requests ----------

export const createPaymentSchema = z.object({
  amount: z.coerce.number().positive(),
  method: z.string().optional(),
  paidAt: z.coerce.date().optional(),
});
export type CreatePaymentDto = z.infer<typeof createPaymentSchema>;

export interface PaymentResponseDto {
  id: number;
  invoiceId: number;
  amount: string;
  method: string | null;
  paidAt: Date;
}

export const toPaymentResponseDto = (payment: Payment): PaymentResponseDto => ({
  id: payment.id,
  invoiceId: payment.invoiceId,
  amount: payment.amount.toString(),
  method: payment.method,
  paidAt: payment.paidAt,
});

export interface InvoiceStatusHistoryResponseDto {
  id: number;
  oldStatus: InvoiceStatus | null;
  newStatus: InvoiceStatus;
  changedBy: UserSummaryDto;
  changedAt: Date;
}

export const toInvoiceStatusHistoryResponseDto = (
  history: InvoiceStatusHistory & { changedBy: User },
): InvoiceStatusHistoryResponseDto => ({
  id: history.id,
  oldStatus: history.oldStatus,
  newStatus: history.newStatus,
  changedBy: toUserSummaryDto(history.changedBy),
  changedAt: history.changedAt,
});

// Full invoice detail — fetch with:
// prisma.invoice.findUnique({ where: { id }, include: {
//   customer: true,
//   project: true,
//   payments: true,
// } })
export type InvoiceWithDetail = Invoice & {
  customer: Customer;
  project?: Project | null;
  payments: Payment[];
};

export interface InvoiceResponseDto {
  id: number;
  customer: CustomerSummaryDto;
  project: ProjectSummaryDto | null;
  amount: string;
  status: InvoiceStatus;
  payment: {
    amountPaid: string;
    balanceDue: string;
    paymentsCount: number;
    isOverdue: boolean; // dueDate passed and status !== PAID
  };
  issueDate: Date | null;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const toInvoiceResponseDto = (invoice: InvoiceWithDetail): InvoiceResponseDto => {
  const amount = Number(invoice.amount);
  const amountPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const isOverdue = !!invoice.dueDate && invoice.dueDate < new Date() && invoice.status !== 'PAID';

  return {
    id: invoice.id,
    customer: toCustomerSummaryDto(invoice.customer),
    project: invoice.project ? toProjectSummaryDto(invoice.project) : null,
    amount: invoice.amount.toString(),
    status: invoice.status,
    payment: {
      amountPaid: amountPaid.toFixed(2),
      balanceDue: (amount - amountPaid).toFixed(2),
      paymentsCount: invoice.payments.length,
      isOverdue,
    },
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    createdAt: invoice.createdAt,
    updatedAt: invoice.updatedAt,
  };
};

// ---------- Budget ----------

export const createBudgetSchema = z.object({
  name: z.string().min(1),
  category: z.nativeEnum(BudgetCategory),
  amount: z.coerce.number().positive(),
  periodStart: z.coerce.date().optional(),
  periodEnd: z.coerce.date().optional(),
});
export type CreateBudgetDto = z.infer<typeof createBudgetSchema>;

export const updateBudgetSchema = createBudgetSchema.partial();
export type UpdateBudgetDto = z.infer<typeof updateBudgetSchema>;

// Full detail — fetch with:
// prisma.budget.findUnique({ where: { id }, include: {
//   expenses: { select: { amount: true } },
//   _count: { select: { expenses: true } },
// } })
export type BudgetWithDetail = Budget & {
  expenses: { amount: { toString(): string } }[];
  _count: { expenses: number };
};

export interface BudgetResponseDto {
  id: number;
  name: string;
  category: BudgetCategory;
  amount: string;
  spending: {
    spentAmount: string;
    remainingAmount: string;
    percentUsed: number; // 0-100+ (can exceed 100 if over budget)
    isOverBudget: boolean;
    expensesCount: number;
  };
  periodStart: Date | null;
  periodEnd: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const toBudgetResponseDto = (budget: BudgetWithDetail): BudgetResponseDto => {
  const amount = Number(budget.amount);
  const spentAmount = budget.expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return {
    id: budget.id,
    name: budget.name,
    category: budget.category,
    amount: budget.amount.toString(),
    spending: {
      spentAmount: spentAmount.toFixed(2),
      remainingAmount: (amount - spentAmount).toFixed(2),
      percentUsed: amount > 0 ? Math.round((spentAmount / amount) * 1000) / 10 : 0,
      isOverBudget: spentAmount > amount,
      expensesCount: budget._count.expenses,
    },
    periodStart: budget.periodStart,
    periodEnd: budget.periodEnd,
    createdAt: budget.createdAt,
    updatedAt: budget.updatedAt,
  };
};

// ---------- Expense ----------

export const createExpenseSchema = z.object({
  description:      z.string().min(1),
  category:         z.nativeEnum(ExpenseCategory),
  amount:           z.coerce.number().positive(),
  spentAt:          z.coerce.date().optional(),
  budgetId:         z.coerce.number().int().positive().optional(),
  projectId:        z.coerce.number().int().positive().optional(),
  campaignId:       z.coerce.number().int().positive().optional(),
  customCategoryId: z.coerce.number().int().positive().optional(),
});
export type CreateExpenseDto = z.infer<typeof createExpenseSchema>;

export const updateExpenseSchema = createExpenseSchema.partial();
export type UpdateExpenseDto = z.infer<typeof updateExpenseSchema>;

export const listExpensesQuerySchema = z.object({
  category: z.nativeEnum(ExpenseCategory).optional(),
  budgetId: z.coerce.number().int().positive().optional(),
  projectId: z.coerce.number().int().positive().optional(),
  campaignId: z.coerce.number().int().positive().optional(),
});
export type ListExpensesQueryDto = z.infer<typeof listExpensesQuerySchema>;

// Full detail — fetch with:
// prisma.expense.findUnique({ where: { id }, include: { budget: true, project: true, campaign: true } })
export type ExpenseWithDetail = Expense & {
  budget?: Budget | null;
  project?: Project | null;
  campaign?: Campaign | null;
  customCategory?: { id: number; name: string; color: string } | null;
};

export interface ExpenseResponseDto {
  id: number;
  description: string;
  category: ExpenseCategory;
  amount: string;
  spentAt: Date;
  budget: { id: number; name: string } | null;
  project: ProjectSummaryDto | null;
  campaign: CampaignSummaryDto | null;
  customCategory: { id: number; name: string; color: string } | null;
  createdAt: Date;
}

export const toExpenseResponseDto = (expense: ExpenseWithDetail): ExpenseResponseDto => ({
  id: expense.id,
  description: expense.description,
  category: expense.category,
  amount: expense.amount.toString(),
  spentAt: expense.spentAt,
  budget: expense.budget ? { id: expense.budget.id, name: expense.budget.name } : null,
  project: expense.project ? toProjectSummaryDto(expense.project) : null,
  campaign: expense.campaign ? toCampaignSummaryDto(expense.campaign) : null,
  customCategory: expense.customCategory
    ? { id: expense.customCategory.id, name: expense.customCategory.name, color: expense.customCategory.color }
    : null,
  createdAt: expense.createdAt,
});