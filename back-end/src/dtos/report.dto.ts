import { ReportType } from "../generated/prisma/index.js"

// ────────────────────────────────────────────────────────────────────
// Employee Report DTOs
// ────────────────────────────────────────────────────────────────────

export interface CreateReportDto {
  employeeId: number
  reportDate: string
  type: ReportType
  content: string  // Rich text content
  weekday?: number  // 0-6 for daily reports
  weekNumber?: number  // Week number for weekly reports
}

export interface UpdateReportDto {
  content?: string
  reportDate?: string
}

export interface GetReportsDto {
  employeeId?: number
  startDate?: string
  endDate?: string
  type?: ReportType
  weekNumber?: number
  month?: number
  year?: number
}
