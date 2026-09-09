import { Prisma, InvoiceStatus } from "../generated/prisma/index.js";
import { toInvoiceResponseDto, toPaymentResponseDto, toBudgetResponseDto, toExpenseResponseDto } from "../dtos/finance.dto.js";
import { financeRepository } from "../repositories/finance.Repository.js";
import { AppError } from "../utiles/error-handler.utiles.js";
export const financeService = {
    // ==========================================
    // INVOICES
    // ==========================================
    async getInvoiceProfile(id) {
        const invoice = await financeRepository.findInvoiceWithDetails(id);
        if (!invoice)
            throw new AppError(404, "Invoice not found.");
        return toInvoiceResponseDto(invoice);
    },
    async getAllInvoices(filters, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const whereClause = {};
        if (filters.customerId)
            whereClause.customerId = filters.customerId;
        if (filters.status)
            whereClause.status = filters.status;
        const [totalItems, invoices] = await Promise.all([
            financeRepository.countInvoices(whereClause),
            financeRepository.findManyInvoices(whereClause, skip, limit)
        ]);
        return {
            invoices: invoices.map(i => toInvoiceResponseDto(i)),
            pagination: { page, limit, total: totalItems, totalPages: Math.ceil(totalItems / limit) }
        };
    },
    async createInvoice(data) {
        const invoice = await financeRepository.createInvoice({
            amount: data.amount,
            issueDate: data.issueDate || new Date(),
            dueDate: data.dueDate || null,
            status: InvoiceStatus.DRAFT,
            customer: { connect: { id: data.customerId } },
            project: data.projectId ? { connect: { id: data.projectId } } : undefined
        });
        return toInvoiceResponseDto(invoice);
    },
    async updateInvoice(id, data) {
        const current = await financeRepository.findInvoiceById(id);
        if (!current)
            throw new AppError(404, "Invoice not found.");
        const updated = await financeRepository.updateInvoice(id, data);
        return toInvoiceResponseDto(updated);
    },
    async changeInvoiceStatus(id, newStatus, userId) {
        const current = await financeRepository.findInvoiceById(id);
        if (!current)
            throw new AppError(404, "Invoice not found.");
        if (current.status === newStatus)
            return this.getInvoiceProfile(id);
        const [updatedInvoice] = await Promise.all([
            financeRepository.updateInvoice(id, { status: newStatus }),
            financeRepository.logInvoiceStatusChange(id, current.status, newStatus, userId)
        ]);
        return toInvoiceResponseDto(updatedInvoice);
    },
    // ==========================================
    // PAYMENTS
    // ==========================================
    async addPayment(invoiceId, data) {
        const invoice = await financeRepository.findInvoiceWithDetails(invoiceId);
        if (!invoice)
            throw new AppError(404, "Invoice not found.");
        // Prevent adding payments to already-cancelled or fully paid invoices
        if (invoice.status === InvoiceStatus.PAID) {
            throw new AppError(409, "This invoice is already fully paid.");
        }
        const payment = await financeRepository.createPayment(invoiceId, {
            amount: data.amount,
            ...(data.method !== undefined ? { method: data.method } : {}),
            ...(data.paidAt !== undefined ? { paidAt: data.paidAt } : {})
        });
        // Recalculate total paid including the new payment
        const previouslyPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
        const totalPaid = previouslyPaid + Number(data.amount);
        const invoiceAmount = Number(invoice.amount);
        // Determine new status based on balance — handles all current states including OVERDUE
        let newStatus = null;
        if (totalPaid >= invoiceAmount) {
            newStatus = InvoiceStatus.PAID;
        }
        else if (invoice.status === InvoiceStatus.DRAFT || invoice.status === InvoiceStatus.OVERDUE) {
            // Partial payment on a DRAFT or OVERDUE invoice moves it to SENT (in-progress)
            newStatus = InvoiceStatus.SENT;
        }
        if (newStatus && newStatus !== invoice.status) {
            await financeRepository.updateInvoice(invoiceId, { status: newStatus });
        }
        return toPaymentResponseDto(payment);
    },
    // ==========================================
    // BUDGETS
    // ==========================================
    async getBudgetProfile(id) {
        const budget = await financeRepository.findBudgetById(id);
        if (!budget)
            throw new AppError(404, "Budget not found.");
        return toBudgetResponseDto(budget);
    },
    async getAllBudgets(page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const [totalItems, budgets] = await Promise.all([
            financeRepository.countBudgets(),
            financeRepository.findManyBudgets(skip, limit)
        ]);
        return {
            budgets: budgets.map(b => toBudgetResponseDto(b)),
            pagination: { page, limit, total: totalItems, totalPages: Math.ceil(totalItems / limit) }
        };
    },
    async createBudget(data) {
        const budget = await financeRepository.createBudget(data);
        return toBudgetResponseDto(budget);
    },
    async updateBudget(id, data) {
        // Existence check added — previously missing
        const current = await financeRepository.findBudgetById(id);
        if (!current)
            throw new AppError(404, "Budget not found.");
        const updated = await financeRepository.updateBudget(id, data);
        return toBudgetResponseDto(updated);
    },
    // ==========================================
    // EXPENSES
    // ==========================================
    async getExpenseProfile(id) {
        const expense = await financeRepository.findExpenseById(id);
        if (!expense)
            throw new AppError(404, "Expense not found.");
        return toExpenseResponseDto(expense);
    },
    async getAllExpenses(filters, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const whereClause = {};
        if (filters.category)
            whereClause.category = filters.category;
        if (filters.budgetId)
            whereClause.budgetId = filters.budgetId;
        if (filters.projectId)
            whereClause.projectId = filters.projectId;
        if (filters.campaignId)
            whereClause.campaignId = filters.campaignId;
        const [totalItems, expenses] = await Promise.all([
            financeRepository.countExpenses(whereClause),
            financeRepository.findManyExpenses(whereClause, skip, limit)
        ]);
        return {
            expenses: expenses.map(e => toExpenseResponseDto(e)),
            pagination: { page, limit, total: totalItems, totalPages: Math.ceil(totalItems / limit) }
        };
    },
    async createExpense(data) {
        const expense = await financeRepository.createExpense({
            description: data.description,
            category: data.category,
            amount: data.amount,
            spentAt: data.spentAt || new Date(),
            budget: data.budgetId ? { connect: { id: data.budgetId } } : undefined,
            project: data.projectId ? { connect: { id: data.projectId } } : undefined,
            campaign: data.campaignId ? { connect: { id: data.campaignId } } : undefined,
            customCategory: data.customCategoryId ? { connect: { id: data.customCategoryId } } : undefined,
        });
        return toExpenseResponseDto(expense);
    },
    async updateExpense(id, data) {
        const current = await financeRepository.findExpenseById(id);
        if (!current)
            throw new AppError(404, "Expense not found.");
        const updated = await financeRepository.updateExpense(id, {
            ...(data.description !== undefined ? { description: data.description } : {}),
            ...(data.category !== undefined ? { category: data.category } : {}),
            ...(data.amount !== undefined ? { amount: data.amount } : {}),
            ...(data.spentAt !== undefined ? { spentAt: data.spentAt } : {}),
            budget: data.budgetId !== undefined
                ? (data.budgetId ? { connect: { id: data.budgetId } } : { disconnect: true })
                : undefined,
            project: data.projectId !== undefined
                ? (data.projectId ? { connect: { id: data.projectId } } : { disconnect: true })
                : undefined,
            campaign: data.campaignId !== undefined
                ? (data.campaignId ? { connect: { id: data.campaignId } } : { disconnect: true })
                : undefined,
            customCategory: data.customCategoryId !== undefined
                ? (data.customCategoryId ? { connect: { id: data.customCategoryId } } : { disconnect: true })
                : undefined,
        });
        return toExpenseResponseDto(updated);
    }
};
//# sourceMappingURL=finance.service.js.map