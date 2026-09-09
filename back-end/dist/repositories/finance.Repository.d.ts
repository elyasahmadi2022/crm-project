import { Prisma, type Invoice, type Payment } from "../generated/prisma/index.js";
declare const invoiceDetails: {
    customer: true;
    project: true;
    payments: true;
};
declare const budgetDetails: {
    expenses: {
        select: {
            amount: true;
        };
    };
    _count: {
        select: {
            expenses: true;
        };
    };
};
declare const expenseDetails: {
    budget: true;
    project: true;
    campaign: true;
    customCategory: true;
};
export type PrismaInvoiceWithDetail = Prisma.InvoiceGetPayload<{
    include: typeof invoiceDetails;
}>;
export type PrismaBudgetWithDetail = Prisma.BudgetGetPayload<{
    include: typeof budgetDetails;
}>;
export type PrismaExpenseWithDetail = Prisma.ExpenseGetPayload<{
    include: typeof expenseDetails;
}>;
export declare const financeRepository: {
    findInvoiceById: (id: number) => Promise<Invoice | null>;
    findInvoiceWithDetails: (id: number) => Promise<PrismaInvoiceWithDetail | null>;
    findManyInvoices: (where: Prisma.InvoiceWhereInput, skip: number, take: number) => Promise<PrismaInvoiceWithDetail[]>;
    countInvoices: (where: Prisma.InvoiceWhereInput) => Promise<number>;
    createInvoice: (data: Prisma.InvoiceCreateInput) => Promise<PrismaInvoiceWithDetail>;
    updateInvoice: (id: number, data: Prisma.InvoiceUpdateInput) => Promise<PrismaInvoiceWithDetail>;
    logInvoiceStatusChange: (invoiceId: number, oldStatus: any, newStatus: any, userId: number) => Prisma.Prisma__InvoiceStatusHistoryClient<{
        id: number;
        invoiceId: number;
        oldStatus: import("../generated/prisma/index.js").$Enums.InvoiceStatus | null;
        newStatus: import("../generated/prisma/index.js").$Enums.InvoiceStatus;
        changedById: number;
        changedAt: Date;
    }, never, import("../generated/prisma/runtime/client.js").DefaultArgs, Prisma.PrismaClientOptions>;
    createPayment: (invoiceId: number, data: {
        amount: number;
        method?: string;
        paidAt?: Date;
    }) => Promise<Payment>;
    findBudgetById: (id: number) => Promise<PrismaBudgetWithDetail | null>;
    findManyBudgets: (skip: number, take: number) => Promise<PrismaBudgetWithDetail[]>;
    countBudgets: () => Promise<number>;
    createBudget: (data: Prisma.BudgetCreateInput) => Promise<PrismaBudgetWithDetail>;
    updateBudget: (id: number, data: Prisma.BudgetUpdateInput) => Promise<PrismaBudgetWithDetail>;
    findExpenseById: (id: number) => Promise<PrismaExpenseWithDetail | null>;
    findManyExpenses: (where: Prisma.ExpenseWhereInput, skip: number, take: number) => Promise<PrismaExpenseWithDetail[]>;
    countExpenses: (where: Prisma.ExpenseWhereInput) => Promise<number>;
    createExpense: (data: Prisma.ExpenseCreateInput) => Promise<PrismaExpenseWithDetail>;
    updateExpense: (id: number, data: Prisma.ExpenseUpdateInput) => Promise<PrismaExpenseWithDetail>;
};
export {};
//# sourceMappingURL=finance.Repository.d.ts.map