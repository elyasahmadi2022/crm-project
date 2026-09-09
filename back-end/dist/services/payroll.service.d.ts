import { PayrollStatus } from "../generated/prisma/index.js";
import type { CreatePayrollDto, UpdatePayrollDto, PayPayrollDto, RecordAdvanceDto, DeductAdvanceDto, GenerateMonthlyPayrollDto } from "../dtos/payroll.dto.js";
export declare class PayrollService {
    createPayroll(dto: CreatePayrollDto): Promise<{
        employee: {
            department: string | null;
            email: string;
            id: number;
            name: string;
            position: string | null;
        };
        paidFrom: {
            id: number;
            name: string;
            type: import("../generated/prisma/index.js").$Enums.AccountType;
            balance: import("@prisma/client-runtime-utils").Decimal;
            currency: string;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        } | null;
        payments: {
            id: number;
            payrollId: number;
            accountId: number;
            salaryAmount: import("@prisma/client-runtime-utils").Decimal;
            paidAmount: import("@prisma/client-runtime-utils").Decimal;
            salaryCurrency: string;
            paidCurrency: string;
            exchangeRate: import("@prisma/client-runtime-utils").Decimal;
            paidBy: string | null;
            paidAt: Date;
        }[];
    } & {
        id: number;
        employeeId: number;
        month: number;
        year: number;
        baseSalary: import("@prisma/client-runtime-utils").Decimal;
        advances: import("@prisma/client-runtime-utils").Decimal;
        deductions: import("@prisma/client-runtime-utils").Decimal;
        deductionReason: string | null;
        bonuses: import("@prisma/client-runtime-utils").Decimal;
        netPay: import("@prisma/client-runtime-utils").Decimal;
        salaryCurrency: string;
        status: import("../generated/prisma/index.js").$Enums.PayrollStatus;
        paidFromId: number | null;
        paidCurrency: string | null;
        exchangeRate: import("@prisma/client-runtime-utils").Decimal | null;
        paidAmount: import("@prisma/client-runtime-utils").Decimal | null;
        paidAt: Date | null;
        paidBy: string | null;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    listPayrolls(filters?: {
        month?: number;
        year?: number;
        employeeId?: number;
        status?: PayrollStatus;
    }): Promise<({
        employee: {
            department: string | null;
            email: string;
            id: number;
            name: string;
            position: string | null;
        };
        paidFrom: {
            id: number;
            name: string;
            type: import("../generated/prisma/index.js").$Enums.AccountType;
            balance: import("@prisma/client-runtime-utils").Decimal;
            currency: string;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        } | null;
        payments: {
            id: number;
            payrollId: number;
            accountId: number;
            salaryAmount: import("@prisma/client-runtime-utils").Decimal;
            paidAmount: import("@prisma/client-runtime-utils").Decimal;
            salaryCurrency: string;
            paidCurrency: string;
            exchangeRate: import("@prisma/client-runtime-utils").Decimal;
            paidBy: string | null;
            paidAt: Date;
        }[];
    } & {
        id: number;
        employeeId: number;
        month: number;
        year: number;
        baseSalary: import("@prisma/client-runtime-utils").Decimal;
        advances: import("@prisma/client-runtime-utils").Decimal;
        deductions: import("@prisma/client-runtime-utils").Decimal;
        deductionReason: string | null;
        bonuses: import("@prisma/client-runtime-utils").Decimal;
        netPay: import("@prisma/client-runtime-utils").Decimal;
        salaryCurrency: string;
        status: import("../generated/prisma/index.js").$Enums.PayrollStatus;
        paidFromId: number | null;
        paidCurrency: string | null;
        exchangeRate: import("@prisma/client-runtime-utils").Decimal | null;
        paidAmount: import("@prisma/client-runtime-utils").Decimal | null;
        paidAt: Date | null;
        paidBy: string | null;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    getPayrollById(id: number): Promise<{
        employee: {
            department: string | null;
            email: string;
            id: number;
            name: string;
            position: string | null;
            salary: import("@prisma/client-runtime-utils").Decimal | null;
        };
        paidFrom: {
            id: number;
            name: string;
            type: import("../generated/prisma/index.js").$Enums.AccountType;
            balance: import("@prisma/client-runtime-utils").Decimal;
            currency: string;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        } | null;
    } & {
        id: number;
        employeeId: number;
        month: number;
        year: number;
        baseSalary: import("@prisma/client-runtime-utils").Decimal;
        advances: import("@prisma/client-runtime-utils").Decimal;
        deductions: import("@prisma/client-runtime-utils").Decimal;
        deductionReason: string | null;
        bonuses: import("@prisma/client-runtime-utils").Decimal;
        netPay: import("@prisma/client-runtime-utils").Decimal;
        salaryCurrency: string;
        status: import("../generated/prisma/index.js").$Enums.PayrollStatus;
        paidFromId: number | null;
        paidCurrency: string | null;
        exchangeRate: import("@prisma/client-runtime-utils").Decimal | null;
        paidAmount: import("@prisma/client-runtime-utils").Decimal | null;
        paidAt: Date | null;
        paidBy: string | null;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updatePayroll(id: number, dto: UpdatePayrollDto): Promise<{
        employee: {
            department: string | null;
            email: string;
            id: number;
            name: string;
            position: string | null;
        };
        paidFrom: {
            id: number;
            name: string;
            type: import("../generated/prisma/index.js").$Enums.AccountType;
            balance: import("@prisma/client-runtime-utils").Decimal;
            currency: string;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        } | null;
    } & {
        id: number;
        employeeId: number;
        month: number;
        year: number;
        baseSalary: import("@prisma/client-runtime-utils").Decimal;
        advances: import("@prisma/client-runtime-utils").Decimal;
        deductions: import("@prisma/client-runtime-utils").Decimal;
        deductionReason: string | null;
        bonuses: import("@prisma/client-runtime-utils").Decimal;
        netPay: import("@prisma/client-runtime-utils").Decimal;
        salaryCurrency: string;
        status: import("../generated/prisma/index.js").$Enums.PayrollStatus;
        paidFromId: number | null;
        paidCurrency: string | null;
        exchangeRate: import("@prisma/client-runtime-utils").Decimal | null;
        paidAmount: import("@prisma/client-runtime-utils").Decimal | null;
        paidAt: Date | null;
        paidBy: string | null;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    payPayroll(id: number, dto: PayPayrollDto): Promise<{
        employee: {
            department: string | null;
            email: string;
            id: number;
            name: string;
            position: string | null;
        };
        paidFrom: {
            id: number;
            name: string;
            type: import("../generated/prisma/index.js").$Enums.AccountType;
            balance: import("@prisma/client-runtime-utils").Decimal;
            currency: string;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        } | null;
    } & {
        id: number;
        employeeId: number;
        month: number;
        year: number;
        baseSalary: import("@prisma/client-runtime-utils").Decimal;
        advances: import("@prisma/client-runtime-utils").Decimal;
        deductions: import("@prisma/client-runtime-utils").Decimal;
        deductionReason: string | null;
        bonuses: import("@prisma/client-runtime-utils").Decimal;
        netPay: import("@prisma/client-runtime-utils").Decimal;
        salaryCurrency: string;
        status: import("../generated/prisma/index.js").$Enums.PayrollStatus;
        paidFromId: number | null;
        paidCurrency: string | null;
        exchangeRate: import("@prisma/client-runtime-utils").Decimal | null;
        paidAmount: import("@prisma/client-runtime-utils").Decimal | null;
        paidAt: Date | null;
        paidBy: string | null;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    deletePayroll(id: number): Promise<{
        id: number;
        employeeId: number;
        month: number;
        year: number;
        baseSalary: import("@prisma/client-runtime-utils").Decimal;
        advances: import("@prisma/client-runtime-utils").Decimal;
        deductions: import("@prisma/client-runtime-utils").Decimal;
        deductionReason: string | null;
        bonuses: import("@prisma/client-runtime-utils").Decimal;
        netPay: import("@prisma/client-runtime-utils").Decimal;
        salaryCurrency: string;
        status: import("../generated/prisma/index.js").$Enums.PayrollStatus;
        paidFromId: number | null;
        paidCurrency: string | null;
        exchangeRate: import("@prisma/client-runtime-utils").Decimal | null;
        paidAmount: import("@prisma/client-runtime-utils").Decimal | null;
        paidAt: Date | null;
        paidBy: string | null;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    recordAdvance(dto: RecordAdvanceDto): Promise<{
        employee: {
            email: string;
            id: number;
            name: string;
            position: string | null;
        };
    } & {
        id: number;
        employeeId: number;
        amount: import("@prisma/client-runtime-utils").Decimal;
        currency: string;
        reason: string | null;
        advanceDate: Date;
        deductedAmount: import("@prisma/client-runtime-utils").Decimal;
        fullyDeducted: boolean;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    listAdvances(employeeId?: number): Promise<({
        employee: {
            email: string;
            id: number;
            name: string;
            position: string | null;
        };
    } & {
        id: number;
        employeeId: number;
        amount: import("@prisma/client-runtime-utils").Decimal;
        currency: string;
        reason: string | null;
        advanceDate: Date;
        deductedAmount: import("@prisma/client-runtime-utils").Decimal;
        fullyDeducted: boolean;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    getAdvanceById(id: number): Promise<{
        employee: {
            email: string;
            id: number;
            name: string;
            position: string | null;
            salary: import("@prisma/client-runtime-utils").Decimal | null;
        };
    } & {
        id: number;
        employeeId: number;
        amount: import("@prisma/client-runtime-utils").Decimal;
        currency: string;
        reason: string | null;
        advanceDate: Date;
        deductedAmount: import("@prisma/client-runtime-utils").Decimal;
        fullyDeducted: boolean;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    deductAdvance(dto: DeductAdvanceDto): Promise<{
        employee: {
            email: string;
            id: number;
            name: string;
        };
    } & {
        id: number;
        employeeId: number;
        amount: import("@prisma/client-runtime-utils").Decimal;
        currency: string;
        reason: string | null;
        advanceDate: Date;
        deductedAmount: import("@prisma/client-runtime-utils").Decimal;
        fullyDeducted: boolean;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    generateMonthlyPayroll(dto: GenerateMonthlyPayrollDto): Promise<{
        id: number;
        employeeId: number;
        month: number;
        year: number;
        baseSalary: import("@prisma/client-runtime-utils").Decimal;
        advances: import("@prisma/client-runtime-utils").Decimal;
        deductions: import("@prisma/client-runtime-utils").Decimal;
        deductionReason: string | null;
        bonuses: import("@prisma/client-runtime-utils").Decimal;
        netPay: import("@prisma/client-runtime-utils").Decimal;
        salaryCurrency: string;
        status: import("../generated/prisma/index.js").$Enums.PayrollStatus;
        paidFromId: number | null;
        paidCurrency: string | null;
        exchangeRate: import("@prisma/client-runtime-utils").Decimal | null;
        paidAmount: import("@prisma/client-runtime-utils").Decimal | null;
        paidAt: Date | null;
        paidBy: string | null;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    getMonthlyReport(month: number, year: number): Promise<{
        month: number;
        year: number;
        totalEmployees: number;
        totalBaseSalary: number;
        totalAdvances: number;
        totalDeductions: number;
        totalBonuses: number;
        totalNetPay: number;
        paidCount: number;
        pendingCount: number;
        payrolls: ({
            employee: {
                department: string | null;
                email: string;
                id: number;
                name: string;
                position: string | null;
            };
            paidFrom: {
                id: number;
                name: string;
                type: import("../generated/prisma/index.js").$Enums.AccountType;
                balance: import("@prisma/client-runtime-utils").Decimal;
                currency: string;
                description: string | null;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
            } | null;
        } & {
            id: number;
            employeeId: number;
            month: number;
            year: number;
            baseSalary: import("@prisma/client-runtime-utils").Decimal;
            advances: import("@prisma/client-runtime-utils").Decimal;
            deductions: import("@prisma/client-runtime-utils").Decimal;
            deductionReason: string | null;
            bonuses: import("@prisma/client-runtime-utils").Decimal;
            netPay: import("@prisma/client-runtime-utils").Decimal;
            salaryCurrency: string;
            status: import("../generated/prisma/index.js").$Enums.PayrollStatus;
            paidFromId: number | null;
            paidCurrency: string | null;
            exchangeRate: import("@prisma/client-runtime-utils").Decimal | null;
            paidAmount: import("@prisma/client-runtime-utils").Decimal | null;
            paidAt: Date | null;
            paidBy: string | null;
            notes: string | null;
            createdAt: Date;
            updatedAt: Date;
        })[];
    }>;
    getEmployeePayrollHistory(employeeId: number, limit?: number): Promise<({
        paidFrom: {
            id: number;
            name: string;
            type: import("../generated/prisma/index.js").$Enums.AccountType;
            balance: import("@prisma/client-runtime-utils").Decimal;
            currency: string;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        } | null;
    } & {
        id: number;
        employeeId: number;
        month: number;
        year: number;
        baseSalary: import("@prisma/client-runtime-utils").Decimal;
        advances: import("@prisma/client-runtime-utils").Decimal;
        deductions: import("@prisma/client-runtime-utils").Decimal;
        deductionReason: string | null;
        bonuses: import("@prisma/client-runtime-utils").Decimal;
        netPay: import("@prisma/client-runtime-utils").Decimal;
        salaryCurrency: string;
        status: import("../generated/prisma/index.js").$Enums.PayrollStatus;
        paidFromId: number | null;
        paidCurrency: string | null;
        exchangeRate: import("@prisma/client-runtime-utils").Decimal | null;
        paidAmount: import("@prisma/client-runtime-utils").Decimal | null;
        paidAt: Date | null;
        paidBy: string | null;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
}
//# sourceMappingURL=payroll.service.d.ts.map