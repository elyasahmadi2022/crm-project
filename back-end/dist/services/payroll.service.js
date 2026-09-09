import { PayrollStatus, TransactionType } from "../generated/prisma/index.js";
import { prisma } from "../lib/primsa.js";
export class PayrollService {
    // ────────────────────────────────────────────────────────────────────
    // Payroll Management
    // ────────────────────────────────────────────────────────────────────
    async createPayroll(dto) {
        // Calculate net pay
        const netPay = dto.baseSalary -
            (dto.advances || 0) -
            (dto.deductions || 0) +
            (dto.bonuses || 0);
        const employee = await prisma.user.findUnique({ where: { id: dto.employeeId }, select: { salaryCurrency: true } });
        if (!employee)
            throw new Error("Employee not found");
        return prisma.payroll.create({
            data: {
                employeeId: dto.employeeId,
                month: dto.month,
                year: dto.year,
                baseSalary: dto.baseSalary,
                advances: dto.advances || 0,
                deductions: dto.deductions || 0,
                ...(dto.deductionReason !== undefined ? { deductionReason: dto.deductionReason } : {}),
                bonuses: dto.bonuses || 0,
                netPay,
                salaryCurrency: employee.salaryCurrency,
                ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
            },
            include: {
                employee: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        position: true,
                        department: true,
                    },
                },
                paidFrom: true,
                payments: true,
            },
        });
    }
    async listPayrolls(filters) {
        return prisma.payroll.findMany({
            where: filters ?? {},
            include: {
                employee: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        position: true,
                        department: true,
                    },
                },
                paidFrom: true,
                payments: true,
            },
            orderBy: [{ year: "desc" }, { month: "desc" }],
        });
    }
    async getPayrollById(id) {
        const payroll = await prisma.payroll.findUnique({
            where: { id },
            include: {
                employee: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        position: true,
                        department: true,
                        salary: true,
                    },
                },
                paidFrom: true,
            },
        });
        if (!payroll) {
            throw new Error("Payroll not found");
        }
        return payroll;
    }
    async updatePayroll(id, dto) {
        const payroll = await prisma.payroll.findUnique({ where: { id } });
        if (!payroll) {
            throw new Error("Payroll not found");
        }
        if (payroll.status === PayrollStatus.PAID) {
            throw new Error("Cannot update paid payroll");
        }
        // Recalculate net pay
        const baseSalary = dto.baseSalary ?? Number(payroll.baseSalary);
        const advances = dto.advances ?? Number(payroll.advances);
        const deductions = dto.deductions ?? Number(payroll.deductions);
        const bonuses = dto.bonuses ?? Number(payroll.bonuses);
        const netPay = baseSalary - advances - deductions + bonuses;
        return prisma.payroll.update({
            where: { id },
            data: {
                ...dto,
                netPay,
            }, include: {
                employee: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        position: true,
                        department: true,
                    },
                },
                paidFrom: true,
            },
        });
    }
    async payPayroll(id, dto) {
        return prisma.$transaction(async (tx) => {
            const payroll = await tx.payroll.findUnique({
                where: { id },
                include: { employee: true, payments: true },
            });
            if (!payroll) {
                throw new Error("Payroll not found");
            }
            const paidSalarySoFar = payroll.payments.reduce((sum, payment) => sum + Number(payment.salaryAmount), 0);
            const remainingSalary = Number(payroll.netPay) - paidSalarySoFar;
            const salaryAmount = Number(dto.salaryAmount);
            if (salaryAmount <= 0 || !Number.isFinite(salaryAmount))
                throw new Error("Salary payment amount must be greater than zero");
            if (salaryAmount > remainingSalary + 0.0001)
                throw new Error(`Payment exceeds the remaining salary of ${remainingSalary.toFixed(2)} ${payroll.salaryCurrency}`);
            const account = await tx.account.findUnique({
                where: { id: dto.paidFromId },
            });
            if (!account || !account.isActive)
                throw new Error("Account not found or inactive");
            const exchangeRate = Number(dto.exchangeRate);
            if (!Number.isFinite(exchangeRate) || exchangeRate <= 0)
                throw new Error("Exchange rate must be greater than zero");
            if (payroll.salaryCurrency === account.currency && exchangeRate !== 1) {
                throw new Error("Exchange rate must be 1 when salary and account currencies match");
            }
            const paidAmount = salaryAmount * exchangeRate;
            // Check sufficient balance
            const newBalance = Number(account.balance) - paidAmount;
            if (newBalance < 0) {
                throw new Error("Insufficient funds in account");
            }
            // Update account balance
            await tx.account.update({
                where: { id: dto.paidFromId },
                data: { balance: newBalance },
            });
            // Create transaction record
            await tx.accountTransaction.create({
                data: {
                    accountId: dto.paidFromId,
                    type: TransactionType.DEBIT,
                    amount: paidAmount,
                    balanceAfter: newBalance,
                    description: `Salary payment for ${payroll.employee.name} - ${payroll.month}/${payroll.year}`,
                    reference: `PAYROLL-${payroll.year}-${payroll.month}-${payroll.employeeId}`,
                    referenceType: "payroll",
                    referenceId: payroll.id,
                },
            });
            await tx.expense.create({
                data: {
                    description: `Salary payment for ${payroll.employee.name} - ${payroll.month}/${payroll.year}`,
                    category: "SALARIES",
                    amount: paidAmount,
                    currency: account.currency,
                    spentAt: new Date(),
                    account: { connect: { id: account.id } },
                    payroll: { connect: { id: payroll.id } },
                },
            });
            await tx.payrollPayment.create({
                data: {
                    payrollId: payroll.id,
                    accountId: account.id,
                    salaryAmount,
                    paidAmount,
                    salaryCurrency: payroll.salaryCurrency,
                    paidCurrency: account.currency,
                    exchangeRate,
                    ...(dto.paidBy !== undefined ? { paidBy: dto.paidBy } : {}),
                },
            });
            // Update payroll status
            return tx.payroll.update({
                where: { id },
                data: {
                    status: paidSalarySoFar + salaryAmount >= Number(payroll.netPay) - 0.0001 ? PayrollStatus.PAID : PayrollStatus.PENDING,
                    paidFromId: dto.paidFromId,
                    paidAt: new Date(),
                    ...(dto.paidBy !== undefined ? { paidBy: dto.paidBy } : {}),
                    paidCurrency: account.currency,
                    exchangeRate,
                    paidAmount,
                },
                include: {
                    employee: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            position: true,
                            department: true,
                        },
                    },
                    paidFrom: true,
                },
            });
        });
    }
    async deletePayroll(id) {
        const payroll = await prisma.payroll.findUnique({ where: { id } });
        if (!payroll) {
            throw new Error("Payroll not found");
        }
        if (payroll.status === PayrollStatus.PAID) {
            throw new Error("Cannot delete paid payroll");
        }
        return prisma.payroll.delete({ where: { id } });
    }
    // ────────────────────────────────────────────────────────────────────
    // Advances Management
    // ────────────────────────────────────────────────────────────────────
    async recordAdvance(dto) {
        const employee = await prisma.user.findUnique({ where: { id: dto.employeeId }, select: { salaryCurrency: true } });
        if (!employee)
            throw new Error("Employee not found");
        return prisma.payrollAdvance.create({
            data: {
                employeeId: dto.employeeId,
                amount: dto.amount,
                currency: employee.salaryCurrency,
                ...(dto.reason !== undefined ? { reason: dto.reason } : {}),
                advanceDate: dto.advanceDate ? new Date(dto.advanceDate) : new Date(),
                ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
            },
            include: {
                employee: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        position: true,
                    },
                },
            },
        });
    }
    async listAdvances(employeeId) {
        return prisma.payrollAdvance.findMany({
            where: employeeId ? { employeeId } : {},
            include: {
                employee: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        position: true,
                    },
                },
            },
            orderBy: { advanceDate: "desc" },
        });
    }
    async getAdvanceById(id) {
        const advance = await prisma.payrollAdvance.findUnique({
            where: { id },
            include: {
                employee: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        position: true,
                        salary: true,
                    },
                },
            },
        });
        if (!advance) {
            throw new Error("Advance not found");
        }
        return advance;
    }
    async deductAdvance(dto) {
        const advance = await prisma.payrollAdvance.findUnique({
            where: { id: dto.advanceId },
        });
        if (!advance) {
            throw new Error("Advance not found");
        }
        if (advance.fullyDeducted) {
            throw new Error("Advance already fully deducted");
        }
        const newDeductedAmount = Number(advance.deductedAmount) + dto.amount;
        const fullyDeducted = newDeductedAmount >= Number(advance.amount);
        return prisma.payrollAdvance.update({
            where: { id: dto.advanceId },
            data: {
                deductedAmount: newDeductedAmount,
                fullyDeducted,
            },
            include: {
                employee: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
    }
    // ────────────────────────────────────────────────────────────────────
    // Bulk Operations
    // ────────────────────────────────────────────────────────────────────
    async generateMonthlyPayroll(dto) {
        // Check if payroll already exists for this month/year
        const existing = await prisma.payroll.findMany({
            where: {
                month: dto.month,
                year: dto.year,
            },
        });
        if (existing.length > 0) {
            throw new Error(`Payroll for ${dto.month}/${dto.year} already exists`);
        }
        // Get employees
        const employees = await prisma.user.findMany({
            where: {
                ...(dto.employeeIds ? { id: { in: dto.employeeIds } } : {}),
                isActive: true,
                salary: { not: null },
            },
        });
        if (employees.length === 0) {
            throw new Error("No employees found with salary information");
        }
        // Get pending advances for each employee
        const advances = await prisma.payrollAdvance.findMany({
            where: {
                employeeId: { in: employees.map((e) => e.id) },
                fullyDeducted: false,
            },
        });
        // Create payroll records
        const payrollRecords = employees.map((emp) => {
            const empAdvances = advances.filter((a) => a.employeeId === emp.id);
            const totalAdvances = empAdvances.reduce((sum, a) => sum + (Number(a.amount) - Number(a.deductedAmount)), 0);
            const baseSalary = Number(emp.salary) || 0;
            const netPay = baseSalary - totalAdvances;
            return {
                employeeId: emp.id,
                month: dto.month,
                year: dto.year,
                baseSalary,
                advances: totalAdvances,
                deductions: 0,
                bonuses: 0,
                netPay,
                salaryCurrency: emp.salaryCurrency,
            };
        });
        // Create all payrolls in a transaction
        return prisma.$transaction(payrollRecords.map((record) => prisma.payroll.create({ data: record })));
    }
    // ────────────────────────────────────────────────────────────────────
    // Reports
    // ────────────────────────────────────────────────────────────────────
    async getMonthlyReport(month, year) {
        const payrolls = await prisma.payroll.findMany({
            where: { month, year },
            include: {
                employee: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        position: true,
                        department: true,
                    },
                },
                paidFrom: true,
            },
        });
        const totalBaseSalary = payrolls.reduce((sum, p) => sum + Number(p.baseSalary), 0);
        const totalAdvances = payrolls.reduce((sum, p) => sum + Number(p.advances), 0);
        const totalDeductions = payrolls.reduce((sum, p) => sum + Number(p.deductions), 0);
        const totalBonuses = payrolls.reduce((sum, p) => sum + Number(p.bonuses), 0);
        const totalNetPay = payrolls.reduce((sum, p) => sum + Number(p.netPay), 0);
        const paidCount = payrolls.filter((p) => p.status === PayrollStatus.PAID).length;
        const pendingCount = payrolls.filter((p) => p.status === PayrollStatus.PENDING).length;
        return {
            month,
            year,
            totalEmployees: payrolls.length,
            totalBaseSalary,
            totalAdvances,
            totalDeductions,
            totalBonuses,
            totalNetPay,
            paidCount,
            pendingCount,
            payrolls,
        };
    }
    async getEmployeePayrollHistory(employeeId, limit = 12) {
        return prisma.payroll.findMany({
            where: { employeeId },
            include: {
                paidFrom: true,
            },
            orderBy: [{ year: "desc" }, { month: "desc" }],
            take: limit,
        });
    }
}
//# sourceMappingURL=payroll.service.js.map