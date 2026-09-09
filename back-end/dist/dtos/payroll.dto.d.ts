export interface CreatePayrollDto {
    employeeId: number;
    month: number;
    year: number;
    baseSalary: number;
    advances?: number;
    deductions?: number;
    deductionReason?: string;
    bonuses?: number;
    notes?: string;
}
export interface UpdatePayrollDto {
    baseSalary?: number;
    advances?: number;
    deductions?: number;
    deductionReason?: string;
    bonuses?: number;
    notes?: string;
}
export interface PayPayrollDto {
    paidFromId: number;
    paidBy?: string;
}
export interface RecordAdvanceDto {
    employeeId: number;
    amount: number;
    reason?: string;
    advanceDate?: string;
    notes?: string;
}
export interface DeductAdvanceDto {
    advanceId: number;
    amount: number;
}
export interface GenerateMonthlyPayrollDto {
    month: number;
    year: number;
    employeeIds?: number[];
}
//# sourceMappingURL=payroll.dto.d.ts.map