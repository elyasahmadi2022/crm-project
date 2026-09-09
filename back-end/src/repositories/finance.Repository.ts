import { Prisma, type Invoice, type Payment, type Budget, type Expense } from "../generated/prisma/index.js";
import { prisma } from "../lib/primsa.js";


// Database relation include configurations
const invoiceDetails = {
    customer: true,
    project: true,
    payments: true
} satisfies Prisma.InvoiceInclude;

const budgetDetails = {
    expenses: { select: { amount: true } },
    _count: { select: { expenses: true } }
} satisfies Prisma.BudgetInclude;

const expenseDetails = {
    budget: true,
    project: true,
    campaign: true,
    customCategory: true,
} satisfies Prisma.ExpenseInclude;

export type PrismaInvoiceWithDetail = Prisma.InvoiceGetPayload<{ include: typeof invoiceDetails }>;
export type PrismaBudgetWithDetail = Prisma.BudgetGetPayload<{ include: typeof budgetDetails }>;
export type PrismaExpenseWithDetail = Prisma.ExpenseGetPayload<{ include: typeof expenseDetails }>;

export const financeRepository = {
    // --- Invoices ---
    findInvoiceById: (id: number): Promise<Invoice | null> => {
        return prisma.invoice.findUnique({ where: { id } });
    },
    findInvoiceWithDetails: (id: number): Promise<PrismaInvoiceWithDetail | null> => {
        return prisma.invoice.findUnique({ where: { id }, include: invoiceDetails });
    },
    findManyInvoices: (where: Prisma.InvoiceWhereInput, skip: number, take: number): Promise<PrismaInvoiceWithDetail[]> => {
        return prisma.invoice.findMany({ where, skip, take, include: invoiceDetails, orderBy: { createdAt: 'desc' } });
    },
    countInvoices: (where: Prisma.InvoiceWhereInput): Promise<number> => {
        return prisma.invoice.count({ where });
    },
    createInvoice: (data: Prisma.InvoiceCreateInput): Promise<PrismaInvoiceWithDetail> => {
        return prisma.invoice.create({ data, include: invoiceDetails });
    },
    updateInvoice: (id: number, data: Prisma.InvoiceUpdateInput): Promise<PrismaInvoiceWithDetail> => {
        return prisma.invoice.update({ where: { id }, data, include: invoiceDetails });
    },
    logInvoiceStatusChange: (invoiceId: number, oldStatus: any, newStatus: any, userId: number) => {
        return prisma.invoiceStatusHistory.create({
            data: { invoiceId, oldStatus, newStatus, changedById: userId }
        });
    },

    // --- Payments ---
    createPayment: (invoiceId: number, data: { amount: number; method?: string; paidAt?: Date }): Promise<Payment> => {
        return prisma.payment.create({
            data: { invoiceId, amount: data.amount, method: data.method || null, paidAt: data.paidAt || new Date() }
        });
    },

    // --- Budgets ---
    findBudgetById: (id: number): Promise<PrismaBudgetWithDetail | null> => {
        return prisma.budget.findUnique({ where: { id }, include: budgetDetails });
    },
    findManyBudgets: (skip: number, take: number): Promise<PrismaBudgetWithDetail[]> => {
        return prisma.budget.findMany({ skip, take, include: budgetDetails, orderBy: { createdAt: 'desc' } });
    },
    countBudgets: (): Promise<number> => {
        return prisma.budget.count();
    },
    createBudget: (data: Prisma.BudgetCreateInput): Promise<PrismaBudgetWithDetail> => {
        return prisma.budget.create({ data, include: budgetDetails });
    },
    updateBudget: (id: number, data: Prisma.BudgetUpdateInput): Promise<PrismaBudgetWithDetail> => {
        return prisma.budget.update({ where: { id }, data, include: budgetDetails });
    },

    // --- Expenses ---
    findExpenseById: (id: number): Promise<PrismaExpenseWithDetail | null> => {
        return prisma.expense.findUnique({ where: { id }, include: expenseDetails });
    },
    findManyExpenses: (where: Prisma.ExpenseWhereInput, skip: number, take: number): Promise<PrismaExpenseWithDetail[]> => {
        return prisma.expense.findMany({ where, skip, take, include: expenseDetails, orderBy: { spentAt: 'desc' } });
    },
    countExpenses: (where: Prisma.ExpenseWhereInput): Promise<number> => {
        return prisma.expense.count({ where });
    },
    createExpense: (data: Prisma.ExpenseCreateInput): Promise<PrismaExpenseWithDetail> => {
        return prisma.expense.create({ data, include: expenseDetails });
    },
    updateExpense: (id: number, data: Prisma.ExpenseUpdateInput): Promise<PrismaExpenseWithDetail> => {
        return prisma.expense.update({ where: { id }, data, include: expenseDetails });
    }
};
