import { Prisma } from "../generated/prisma/index.js";
import { prisma } from "../lib/primsa.js";
// Database relation include configurations
const invoiceDetails = {
    customer: true,
    project: true,
    payments: true
};
const budgetDetails = {
    expenses: { select: { amount: true } },
    _count: { select: { expenses: true } }
};
const expenseDetails = {
    budget: true,
    project: true,
    campaign: true,
    customCategory: true,
};
export const financeRepository = {
    // --- Invoices ---
    findInvoiceById: (id) => {
        return prisma.invoice.findUnique({ where: { id } });
    },
    findInvoiceWithDetails: (id) => {
        return prisma.invoice.findUnique({ where: { id }, include: invoiceDetails });
    },
    findManyInvoices: (where, skip, take) => {
        return prisma.invoice.findMany({ where, skip, take, include: invoiceDetails, orderBy: { createdAt: 'desc' } });
    },
    countInvoices: (where) => {
        return prisma.invoice.count({ where });
    },
    createInvoice: (data) => {
        return prisma.invoice.create({ data, include: invoiceDetails });
    },
    updateInvoice: (id, data) => {
        return prisma.invoice.update({ where: { id }, data, include: invoiceDetails });
    },
    logInvoiceStatusChange: (invoiceId, oldStatus, newStatus, userId) => {
        return prisma.invoiceStatusHistory.create({
            data: { invoiceId, oldStatus, newStatus, changedById: userId }
        });
    },
    // --- Payments ---
    createPayment: (invoiceId, data) => {
        return prisma.payment.create({
            data: { invoiceId, amount: data.amount, method: data.method || null, paidAt: data.paidAt || new Date() }
        });
    },
    // --- Budgets ---
    findBudgetById: (id) => {
        return prisma.budget.findUnique({ where: { id }, include: budgetDetails });
    },
    findManyBudgets: (skip, take) => {
        return prisma.budget.findMany({ skip, take, include: budgetDetails, orderBy: { createdAt: 'desc' } });
    },
    countBudgets: () => {
        return prisma.budget.count();
    },
    createBudget: (data) => {
        return prisma.budget.create({ data, include: budgetDetails });
    },
    updateBudget: (id, data) => {
        return prisma.budget.update({ where: { id }, data, include: budgetDetails });
    },
    // --- Expenses ---
    findExpenseById: (id) => {
        return prisma.expense.findUnique({ where: { id }, include: expenseDetails });
    },
    findManyExpenses: (where, skip, take) => {
        return prisma.expense.findMany({ where, skip, take, include: expenseDetails, orderBy: { spentAt: 'desc' } });
    },
    countExpenses: (where) => {
        return prisma.expense.count({ where });
    },
    createExpense: (data) => {
        return prisma.expense.create({ data, include: expenseDetails });
    },
    updateExpense: (id, data) => {
        return prisma.expense.update({ where: { id }, data, include: expenseDetails });
    }
};
//# sourceMappingURL=finance.Repository.js.map