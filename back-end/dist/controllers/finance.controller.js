import { createInvoiceSchema, updateInvoiceSchema, listInvoicesQuerySchema, changeInvoiceStatusSchema, createPaymentSchema, createBudgetSchema, updateBudgetSchema, createExpenseSchema, updateExpenseSchema, listExpensesQuerySchema } from "../dtos/finance.dto.js";
import { paginationSchema } from "../dtos/common.dto.js";
import { sendPaginated, sendSuccess } from "../utiles/api-response.utiles.js";
import { financeService } from "../services/finance.service.js";
;
export const financeController = {
    // --- Invoices ---
    getAllInvoices: async (req, res, next) => {
        try {
            const filters = listInvoicesQuerySchema.parse(req.query);
            const { page, limit } = paginationSchema.parse(req.query);
            const { invoices, pagination } = await financeService.getAllInvoices(filters, page, limit);
            return sendPaginated(res, invoices, pagination.page, pagination.limit, pagination.total);
        }
        catch (error) {
            next(error);
        }
    },
    getInvoiceById: async (req, res, next) => {
        try {
            const id = parseInt(req.params.id, 10);
            const data = await financeService.getInvoiceProfile(id);
            return sendSuccess(res, data);
        }
        catch (error) {
            next(error);
        }
    },
    createInvoice: async (req, res, next) => {
        try {
            const body = createInvoiceSchema.parse(req.body);
            const data = await financeService.createInvoice(body);
            return sendSuccess(res, data, 201);
        }
        catch (error) {
            next(error);
        }
    },
    updateInvoice: async (req, res, next) => {
        try {
            const id = parseInt(req.params.id, 10);
            const body = updateInvoiceSchema.parse(req.body);
            const data = await financeService.updateInvoice(id, body);
            return sendSuccess(res, data);
        }
        catch (error) {
            next(error);
        }
    },
    changeInvoiceStatus: async (req, res, next) => {
        try {
            const id = parseInt(req.params.id, 10);
            const { newStatus } = changeInvoiceStatusSchema.parse(req.body);
            const userId = req.user.id;
            const data = await financeService.changeInvoiceStatus(id, newStatus, userId);
            return sendSuccess(res, data);
        }
        catch (error) {
            next(error);
        }
    },
    // --- Payments ---
    addPayment: async (req, res, next) => {
        try {
            const invoiceId = parseInt(req.params.id, 10);
            const body = createPaymentSchema.parse(req.body);
            const data = await financeService.addPayment(invoiceId, body);
            return sendSuccess(res, data, 201);
        }
        catch (error) {
            next(error);
        }
    },
    // --- Budgets ---
    getAllBudgets: async (req, res, next) => {
        try {
            const { page, limit } = paginationSchema.parse(req.query);
            const { budgets, pagination } = await financeService.getAllBudgets(page, limit);
            return sendPaginated(res, budgets, pagination.page, pagination.limit, pagination.total);
        }
        catch (error) {
            next(error);
        }
    },
    getBudgetById: async (req, res, next) => {
        try {
            const id = parseInt(req.params.id, 10);
            const data = await financeService.getBudgetProfile(id);
            return sendSuccess(res, data);
        }
        catch (error) {
            next(error);
        }
    },
    createBudget: async (req, res, next) => {
        try {
            const body = createBudgetSchema.parse(req.body);
            const data = await financeService.createBudget(body);
            return sendSuccess(res, data, 201);
        }
        catch (error) {
            next(error);
        }
    },
    updateBudget: async (req, res, next) => {
        try {
            const id = parseInt(req.params.id, 10);
            const body = updateBudgetSchema.parse(req.body);
            const data = await financeService.updateBudget(id, body);
            return sendSuccess(res, data);
        }
        catch (error) {
            next(error);
        }
    },
    // --- Expenses ---
    getAllExpenses: async (req, res, next) => {
        try {
            const filters = listExpensesQuerySchema.parse(req.query);
            const { page, limit } = paginationSchema.parse(req.query);
            const { expenses, pagination } = await financeService.getAllExpenses(filters, page, limit);
            return sendPaginated(res, expenses, pagination.page, pagination.limit, pagination.total);
        }
        catch (error) {
            next(error);
        }
    },
    getExpenseById: async (req, res, next) => {
        try {
            const id = parseInt(req.params.id, 10);
            const data = await financeService.getExpenseProfile(id);
            return sendSuccess(res, data);
        }
        catch (error) {
            next(error);
        }
    },
    createExpense: async (req, res, next) => {
        try {
            const body = createExpenseSchema.parse(req.body);
            const data = await financeService.createExpense(body);
            return sendSuccess(res, data, 201);
        }
        catch (error) {
            next(error);
        }
    },
    updateExpense: async (req, res, next) => {
        try {
            const id = parseInt(req.params.id, 10);
            const body = updateExpenseSchema.parse(req.body);
            const data = await financeService.updateExpense(id, body);
            return sendSuccess(res, data);
        }
        catch (error) {
            next(error);
        }
    }
};
//# sourceMappingURL=finance.controller.js.map