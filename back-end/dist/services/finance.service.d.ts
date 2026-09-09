import { InvoiceStatus } from "../generated/prisma/index.js";
import { type CreateInvoiceDto, type UpdateInvoiceDto, type ListInvoicesQueryDto, type InvoiceResponseDto, type CreatePaymentDto, type PaymentResponseDto, type CreateBudgetDto, type UpdateBudgetDto, type BudgetResponseDto, type CreateExpenseDto, type UpdateExpenseDto, type ListExpensesQueryDto, type ExpenseResponseDto } from "../dtos/finance.dto.js";
export declare const financeService: {
    getInvoiceProfile(id: number): Promise<InvoiceResponseDto>;
    getAllInvoices(filters: ListInvoicesQueryDto, page?: number, limit?: number): Promise<{
        invoices: InvoiceResponseDto[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    createInvoice(data: CreateInvoiceDto): Promise<InvoiceResponseDto>;
    updateInvoice(id: number, data: UpdateInvoiceDto): Promise<InvoiceResponseDto>;
    changeInvoiceStatus(id: number, newStatus: InvoiceStatus, userId: number): Promise<InvoiceResponseDto>;
    addPayment(invoiceId: number, data: CreatePaymentDto): Promise<PaymentResponseDto>;
    getBudgetProfile(id: number): Promise<BudgetResponseDto>;
    getAllBudgets(page?: number, limit?: number): Promise<{
        budgets: BudgetResponseDto[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    createBudget(data: CreateBudgetDto): Promise<BudgetResponseDto>;
    updateBudget(id: number, data: UpdateBudgetDto): Promise<BudgetResponseDto>;
    getExpenseProfile(id: number): Promise<ExpenseResponseDto>;
    getAllExpenses(filters: ListExpensesQueryDto, page?: number, limit?: number): Promise<{
        expenses: ExpenseResponseDto[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    createExpense(data: CreateExpenseDto): Promise<ExpenseResponseDto>;
    updateExpense(id: number, data: UpdateExpenseDto): Promise<ExpenseResponseDto>;
};
//# sourceMappingURL=finance.service.d.ts.map