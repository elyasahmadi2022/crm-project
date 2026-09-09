import { z } from 'zod';
import { type Invoice, type Payment, type InvoiceStatusHistory, type Budget, type Expense, InvoiceStatus, BudgetCategory, ExpenseCategory, type User, type Customer, type Project } from '../generated/prisma/index.js';
import { type Campaign } from '../generated/prisma/index.js';
import { type UserSummaryDto } from './user.dto.js';
import { type CustomerSummaryDto } from './customer.dto.js';
import { type ProjectSummaryDto } from './project.dto.js';
import { type CampaignSummaryDto } from './marketing.dto.js';
export declare const createInvoiceSchema: z.ZodObject<{
    customerId: z.ZodNumber;
    projectId: z.ZodOptional<z.ZodNumber>;
    amount: z.ZodCoercedNumber<unknown>;
    issueDate: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    dueDate: z.ZodOptional<z.ZodCoercedDate<unknown>>;
}, z.core.$strip>;
export type CreateInvoiceDto = z.infer<typeof createInvoiceSchema>;
export declare const updateInvoiceSchema: z.ZodObject<{
    amount: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    issueDate: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    dueDate: z.ZodOptional<z.ZodCoercedDate<unknown>>;
}, z.core.$strip>;
export type UpdateInvoiceDto = z.infer<typeof updateInvoiceSchema>;
export declare const changeInvoiceStatusSchema: z.ZodObject<{
    newStatus: z.ZodEnum<{
        DRAFT: 'DRAFT';
        SENT: 'SENT';
        PAID: 'PAID';
        OVERDUE: 'OVERDUE';
        CANCELLED: 'CANCELLED';
    }>;
}, z.core.$strip>;
export type ChangeInvoiceStatusDto = z.infer<typeof changeInvoiceStatusSchema>;
export declare const listInvoicesQuerySchema: z.ZodObject<{
    customerId: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    status: z.ZodOptional<z.ZodEnum<{
        DRAFT: 'DRAFT';
        SENT: 'SENT';
        PAID: 'PAID';
        OVERDUE: 'OVERDUE';
        CANCELLED: 'CANCELLED';
    }>>;
}, z.core.$strip>;
export type ListInvoicesQueryDto = z.infer<typeof listInvoicesQuerySchema>;
export declare const createPaymentSchema: z.ZodObject<{
    amount: z.ZodCoercedNumber<unknown>;
    method: z.ZodOptional<z.ZodString>;
    paidAt: z.ZodOptional<z.ZodCoercedDate<unknown>>;
}, z.core.$strip>;
export type CreatePaymentDto = z.infer<typeof createPaymentSchema>;
export interface PaymentResponseDto {
    id: number;
    invoiceId: number;
    amount: string;
    method: string | null;
    paidAt: Date;
}
export declare const toPaymentResponseDto: (payment: Payment) => PaymentResponseDto;
export interface InvoiceStatusHistoryResponseDto {
    id: number;
    oldStatus: InvoiceStatus | null;
    newStatus: InvoiceStatus;
    changedBy: UserSummaryDto;
    changedAt: Date;
}
export declare const toInvoiceStatusHistoryResponseDto: (history: InvoiceStatusHistory & {
    changedBy: User;
}) => InvoiceStatusHistoryResponseDto;
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
        isOverdue: boolean;
    };
    issueDate: Date | null;
    dueDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
export declare const toInvoiceResponseDto: (invoice: InvoiceWithDetail) => InvoiceResponseDto;
export declare const createBudgetSchema: z.ZodObject<{
    name: z.ZodString;
    category: z.ZodEnum<{
        MARKETING: 'MARKETING';
        DEVELOPMENT: 'DEVELOPMENT';
        OPERATIONS: 'OPERATIONS';
        SALES: 'SALES';
        HUMAN_RESOURCES: 'HUMAN_RESOURCES';
        OTHER: 'OTHER';
    }>;
    amount: z.ZodCoercedNumber<unknown>;
    periodStart: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    periodEnd: z.ZodOptional<z.ZodCoercedDate<unknown>>;
}, z.core.$strip>;
export type CreateBudgetDto = z.infer<typeof createBudgetSchema>;
export declare const updateBudgetSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodEnum<{
        MARKETING: 'MARKETING';
        DEVELOPMENT: 'DEVELOPMENT';
        OPERATIONS: 'OPERATIONS';
        SALES: 'SALES';
        HUMAN_RESOURCES: 'HUMAN_RESOURCES';
        OTHER: 'OTHER';
    }>>;
    amount: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    periodStart: z.ZodOptional<z.ZodOptional<z.ZodCoercedDate<unknown>>>;
    periodEnd: z.ZodOptional<z.ZodOptional<z.ZodCoercedDate<unknown>>>;
}, z.core.$strip>;
export type UpdateBudgetDto = z.infer<typeof updateBudgetSchema>;
export type BudgetWithDetail = Budget & {
    expenses: {
        amount: {
            toString(): string;
        };
    }[];
    _count: {
        expenses: number;
    };
};
export interface BudgetResponseDto {
    id: number;
    name: string;
    category: BudgetCategory;
    amount: string;
    spending: {
        spentAmount: string;
        remainingAmount: string;
        percentUsed: number;
        isOverBudget: boolean;
        expensesCount: number;
    };
    periodStart: Date | null;
    periodEnd: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
export declare const toBudgetResponseDto: (budget: BudgetWithDetail) => BudgetResponseDto;
export declare const createExpenseSchema: z.ZodObject<{
    description: z.ZodString;
    category: z.ZodEnum<{
        SOFTWARE: 'SOFTWARE';
        HARDWARE: 'HARDWARE';
        MARKETING: 'MARKETING';
        TRAVEL: 'TRAVEL';
        SALARIES: 'SALARIES';
        OFFICE: 'OFFICE';
        OTHER: 'OTHER';
        CUSTOM: 'CUSTOM';
    }>;
    amount: z.ZodCoercedNumber<unknown>;
    spentAt: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    budgetId: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    projectId: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    campaignId: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    customCategoryId: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export type CreateExpenseDto = z.infer<typeof createExpenseSchema>;
export declare const updateExpenseSchema: z.ZodObject<{
    description: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodEnum<{
        SOFTWARE: 'SOFTWARE';
        HARDWARE: 'HARDWARE';
        MARKETING: 'MARKETING';
        TRAVEL: 'TRAVEL';
        SALARIES: 'SALARIES';
        OFFICE: 'OFFICE';
        OTHER: 'OTHER';
        CUSTOM: 'CUSTOM';
    }>>;
    amount: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    spentAt: z.ZodOptional<z.ZodOptional<z.ZodCoercedDate<unknown>>>;
    budgetId: z.ZodOptional<z.ZodOptional<z.ZodCoercedNumber<unknown>>>;
    projectId: z.ZodOptional<z.ZodOptional<z.ZodCoercedNumber<unknown>>>;
    campaignId: z.ZodOptional<z.ZodOptional<z.ZodCoercedNumber<unknown>>>;
    customCategoryId: z.ZodOptional<z.ZodOptional<z.ZodCoercedNumber<unknown>>>;
}, z.core.$strip>;
export type UpdateExpenseDto = z.infer<typeof updateExpenseSchema>;
export declare const listExpensesQuerySchema: z.ZodObject<{
    category: z.ZodOptional<z.ZodEnum<{
        SOFTWARE: 'SOFTWARE';
        HARDWARE: 'HARDWARE';
        MARKETING: 'MARKETING';
        TRAVEL: 'TRAVEL';
        SALARIES: 'SALARIES';
        OFFICE: 'OFFICE';
        OTHER: 'OTHER';
        CUSTOM: 'CUSTOM';
    }>>;
    budgetId: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    projectId: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    campaignId: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export type ListExpensesQueryDto = z.infer<typeof listExpensesQuerySchema>;
export type ExpenseWithDetail = Expense & {
    budget?: Budget | null;
    project?: Project | null;
    campaign?: Campaign | null;
    customCategory?: {
        id: number;
        name: string;
        color: string;
    } | null;
};
export interface ExpenseResponseDto {
    id: number;
    description: string;
    category: ExpenseCategory;
    amount: string;
    spentAt: Date;
    budget: {
        id: number;
        name: string;
    } | null;
    project: ProjectSummaryDto | null;
    campaign: CampaignSummaryDto | null;
    customCategory: {
        id: number;
        name: string;
        color: string;
    } | null;
    createdAt: Date;
}
export declare const toExpenseResponseDto: (expense: ExpenseWithDetail) => ExpenseResponseDto;
//# sourceMappingURL=finance.dto.d.ts.map