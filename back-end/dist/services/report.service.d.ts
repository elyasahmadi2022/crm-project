import type { CreateReportDto, UpdateReportDto, GetReportsDto } from "../dtos/report.dto.js";
export declare class ReportService {
    createReport(dto: CreateReportDto): Promise<{
        employee: {
            department: string | null;
            email: string;
            id: number;
            name: string;
            position: string | null;
        };
    } & {
        id: number;
        employeeId: number;
        reportDate: Date;
        type: import("../generated/prisma/index.js").$Enums.ReportType;
        content: string;
        submitted: boolean;
        weekday: number | null;
        weekNumber: number | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    listReports(filters: GetReportsDto): Promise<({
        employee: {
            department: string | null;
            email: string;
            id: number;
            name: string;
            position: string | null;
        };
    } & {
        id: number;
        employeeId: number;
        reportDate: Date;
        type: import("../generated/prisma/index.js").$Enums.ReportType;
        content: string;
        submitted: boolean;
        weekday: number | null;
        weekNumber: number | null;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    getReportById(id: number): Promise<{
        employee: {
            department: string | null;
            email: string;
            id: number;
            name: string;
            position: string | null;
        };
    } & {
        id: number;
        employeeId: number;
        reportDate: Date;
        type: import("../generated/prisma/index.js").$Enums.ReportType;
        content: string;
        submitted: boolean;
        weekday: number | null;
        weekNumber: number | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateReport(id: number, dto: UpdateReportDto): Promise<{
        employee: {
            email: string;
            id: number;
            name: string;
            position: string | null;
        };
    } & {
        id: number;
        employeeId: number;
        reportDate: Date;
        type: import("../generated/prisma/index.js").$Enums.ReportType;
        content: string;
        submitted: boolean;
        weekday: number | null;
        weekNumber: number | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    deleteReport(id: number): Promise<{
        id: number;
        employeeId: number;
        reportDate: Date;
        type: import("../generated/prisma/index.js").$Enums.ReportType;
        content: string;
        submitted: boolean;
        weekday: number | null;
        weekNumber: number | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getWeeklySummary(employeeId: number, year: number, weekNumber: number): Promise<{
        employeeId: number;
        year: number;
        weekNumber: number;
        totalReports: number;
        expectedReports: number;
        missingDays: (string | undefined)[];
        missingCount: number;
        reports: {
            id: number;
            employeeId: number;
            reportDate: Date;
            type: import("../generated/prisma/index.js").$Enums.ReportType;
            content: string;
            submitted: boolean;
            weekday: number | null;
            weekNumber: number | null;
            createdAt: Date;
            updatedAt: Date;
        }[];
    }>;
    getMonthlySummary(employeeId: number, year: number, month: number): Promise<{
        employeeId: number;
        year: number;
        month: number;
        daysInMonth: number;
        expectedWorkDays: number;
        totalReports: number;
        missingDates: string[];
        missingCount: number;
        completionRate: number;
        reports: ({
            employee: {
                department: string | null;
                email: string;
                id: number;
                name: string;
                position: string | null;
            };
        } & {
            id: number;
            employeeId: number;
            reportDate: Date;
            type: import("../generated/prisma/index.js").$Enums.ReportType;
            content: string;
            submitted: boolean;
            weekday: number | null;
            weekNumber: number | null;
            createdAt: Date;
            updatedAt: Date;
        })[];
    }>;
    getAllEmployeesWeeklySummary(year: number, weekNumber: number): Promise<{
        employeeId: number;
        year: number;
        weekNumber: number;
        totalReports: number;
        expectedReports: number;
        missingDays: (string | undefined)[];
        missingCount: number;
        reports: {
            id: number;
            employeeId: number;
            reportDate: Date;
            type: import("../generated/prisma/index.js").$Enums.ReportType;
            content: string;
            submitted: boolean;
            weekday: number | null;
            weekNumber: number | null;
            createdAt: Date;
            updatedAt: Date;
        }[];
        department?: string | null;
        email?: string;
        id?: number;
        name?: string;
        position?: string | null;
    }[]>;
    getAllEmployeesMonthlySummary(year: number, month: number): Promise<{
        employeeId: number;
        year: number;
        month: number;
        daysInMonth: number;
        expectedWorkDays: number;
        totalReports: number;
        missingDates: string[];
        missingCount: number;
        completionRate: number;
        reports: ({
            employee: {
                department: string | null;
                email: string;
                id: number;
                name: string;
                position: string | null;
            };
        } & {
            id: number;
            employeeId: number;
            reportDate: Date;
            type: import("../generated/prisma/index.js").$Enums.ReportType;
            content: string;
            submitted: boolean;
            weekday: number | null;
            weekNumber: number | null;
            createdAt: Date;
            updatedAt: Date;
        })[];
        department?: string | null;
        email?: string;
        id?: number;
        joinDate?: Date | null;
        name?: string;
        position?: string | null;
    }[]>;
    private getWeekStartDate;
    private getWeekEndDate;
    private getWeekNumber;
}
//# sourceMappingURL=report.service.d.ts.map