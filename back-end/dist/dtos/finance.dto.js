import { z } from 'zod';
import { InvoiceStatus, BudgetCategory, ExpenseCategory, } from '../generated/prisma/index.js';
import {} from '../generated/prisma/index.js';
import { toUserSummaryDto } from './user.dto.js';
import { toCustomerSummaryDto } from './customer.dto.js';
import { toProjectSummaryDto } from './project.dto.js';
import { toCampaignSummaryDto } from './marketing.dto.js';
// ---------- Invoice requests ----------
export const createInvoiceSchema = z.object({
    customerId: z.number().int().positive(),
    projectId: z.number().int().positive().optional(),
    amount: z.coerce.number().positive(),
    issueDate: z.coerce.date().optional(),
    dueDate: z.coerce.date().optional(),
});
export const updateInvoiceSchema = z.object({
    amount: z.coerce.number().positive().optional(),
    issueDate: z.coerce.date().optional(),
    dueDate: z.coerce.date().optional(),
});
export const changeInvoiceStatusSchema = z.object({
    newStatus: z.nativeEnum(InvoiceStatus),
});
export const listInvoicesQuerySchema = z.object({
    customerId: z.coerce.number().int().positive().optional(),
    status: z.nativeEnum(InvoiceStatus).optional(),
});
// ---------- Payment requests ----------
export const createPaymentSchema = z.object({
    amount: z.coerce.number().positive(),
    method: z.string().optional(),
    paidAt: z.coerce.date().optional(),
});
export const toPaymentResponseDto = (payment) => ({
    id: payment.id,
    invoiceId: payment.invoiceId,
    amount: payment.amount.toString(),
    method: payment.method,
    paidAt: payment.paidAt,
});
export const toInvoiceStatusHistoryResponseDto = (history) => ({
    id: history.id,
    oldStatus: history.oldStatus,
    newStatus: history.newStatus,
    changedBy: toUserSummaryDto(history.changedBy),
    changedAt: history.changedAt,
});
export const toInvoiceResponseDto = (invoice) => {
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
export const updateBudgetSchema = createBudgetSchema.partial();
export const toBudgetResponseDto = (budget) => {
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
    description: z.string().min(1),
    category: z.nativeEnum(ExpenseCategory),
    amount: z.coerce.number().positive(),
    spentAt: z.coerce.date().optional(),
    budgetId: z.coerce.number().int().positive().optional(),
    projectId: z.coerce.number().int().positive().optional(),
    campaignId: z.coerce.number().int().positive().optional(),
    customCategoryId: z.coerce.number().int().positive().optional(),
});
export const updateExpenseSchema = createExpenseSchema.partial();
export const listExpensesQuerySchema = z.object({
    category: z.nativeEnum(ExpenseCategory).optional(),
    budgetId: z.coerce.number().int().positive().optional(),
    projectId: z.coerce.number().int().positive().optional(),
    campaignId: z.coerce.number().int().positive().optional(),
});
export const toExpenseResponseDto = (expense) => ({
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
//# sourceMappingURL=finance.dto.js.map