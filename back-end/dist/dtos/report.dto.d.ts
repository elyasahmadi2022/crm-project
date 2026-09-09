import { ReportType } from "../generated/prisma/index.js";
export interface CreateReportDto {
    employeeId: number;
    reportDate: string;
    type: ReportType;
    content: string;
    weekday?: number;
    weekNumber?: number;
}
export interface UpdateReportDto {
    content?: string;
    reportDate?: string;
}
export interface GetReportsDto {
    employeeId?: number;
    startDate?: string;
    endDate?: string;
    type?: ReportType;
    weekNumber?: number;
    month?: number;
    year?: number;
}
//# sourceMappingURL=report.dto.d.ts.map