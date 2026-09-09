import { Prisma } from "../generated/prisma/index.js";
import { prisma } from "../lib/primsa.js";
// Database relation include configurations
const invoiceDetails = {
    customer: true,
    project: true,
    payments: { include: { account: true } }
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
    account: true,
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
    createPayment: async (invoiceId, data) => {
        return prisma.$transaction(async (tx) => {
            const invoice = await tx.invoice.findUnique({ where: { id: invoiceId } });
            const account = await tx.account.findUnique({ where: { id: data.accountId } });
            if (!invoice)
                throw new Error('Invoice not found.');
            if (!account || !account.isActive)
                throw new Error('Receiving account not found or inactive.');
            if (invoice.currency !== account.currency) {
                throw new Error(`Account currency (${account.currency}) must match invoice currency (${invoice.currency}).`);
            }
            const newBalance = Number(account.balance) + data.amount;
            const payment = await tx.payment.create({
                data: { invoiceId, accountId: data.accountId, amount: data.amount, method: data.method || null, paidAt: data.paidAt || new Date() },
                include: { account: { select: { id: true, name: true, currency: true } } },
            });
            await tx.account.update({ where: { id: data.accountId }, data: { balance: newBalance } });
            await tx.accountTransaction.create({
                data: {
                    accountId: data.accountId,
                    type: 'CREDIT',
                    amount: data.amount,
                    balanceAfter: newBalance,
                    description: `Payment received for invoice #${invoiceId}`,
                    reference: `PAYMENT-INV-${invoiceId}`,
                    referenceType: 'invoice',
                    referenceId: invoiceId,
                },
            });
            return payment;
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
    createExpenseWithDebit: async (data, accountId, amount) => {
        return prisma.$transaction(async (tx) => {
            const account = await tx.account.findUnique({ where: { id: accountId } });
            if (!account || !account.isActive)
                throw new Error('Source account not found or inactive.');
            const newBalance = Number(account.balance) - amount;
            if (newBalance < 0)
                throw new Error('Insufficient funds in source account.');
            const expense = await tx.expense.create({ data, include: expenseDetails });
            await tx.account.update({ where: { id: accountId }, data: { balance: newBalance } });
            await tx.accountTransaction.create({
                data: {
                    accountId,
                    type: 'DEBIT',
                    amount,
                    balanceAfter: newBalance,
                    description: `Expense: ${data.description}`,
                    reference: `EXPENSE-${expense.id}`,
                    referenceType: 'expense',
                    referenceId: expense.id,
                },
            });
            return expense;
        });
    },
    updateExpense: (id, data) => {
        return prisma.expense.update({ where: { id }, data, include: expenseDetails });
    }
};
//# sourceMappingURL=finance.Repository.js.map