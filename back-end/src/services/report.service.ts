import { ReportType } from "../generated/prisma/index.js"
import { prisma } from "../lib/primsa.js"
import type { CreateReportDto, UpdateReportDto, GetReportsDto } from "../dtos/report.dto.js"

export class ReportService {
  // ────────────────────────────────────────────────────────────────────
  // Report CRUD
  // ────────────────────────────────────────────────────────────────────

  async createReport(dto: CreateReportDto) {
    const reportDate = new Date(dto.reportDate)
    reportDate.setHours(0, 0, 0, 0)

    const weekday = dto.weekday !== undefined ? dto.weekday : reportDate.getDay()

    // ── Per-type duplicate check ──────────────────────────────────────
    // DAILY  → max 1 report per calendar day
    // WEEKLY → max 2 reports per calendar day
    // MONTHLY → max 3 reports per calendar day
    const limits: Record<string, number> = { DAILY: 1, WEEKLY: 2, MONTHLY: 3 }
    const limit = limits[dto.type] ?? 1

    const dayStart = new Date(reportDate)
    const dayEnd   = new Date(reportDate); dayEnd.setHours(23, 59, 59, 999)

    const existingCount = await prisma.employeeReport.count({
      where: {
        employeeId: dto.employeeId,
        type: dto.type,
        reportDate: { gte: dayStart, lte: dayEnd },
      },
    })

    if (existingCount >= limit) {
      const labels: Record<string, string> = { DAILY: "daily", WEEKLY: "weekly", MONTHLY: "monthly" }
      const max   = limit === 1 ? "1 report" : `${limit} reports`
      throw new Error(
        `You can only submit ${max} of type "${labels[dto.type] ?? dto.type}" per day. ` +
        `You have already submitted ${existingCount}.`
      )
    }
    // ─────────────────────────────────────────────────────────────────

    return prisma.employeeReport.create({
      data: {
        employeeId: dto.employeeId,
        reportDate,
        type: dto.type,
        content: dto.content,
        weekday,
        ...(dto.weekNumber !== undefined && { weekNumber: dto.weekNumber }),
      } as any,
      include: {
        employee: {
          select: { id: true, name: true, email: true, position: true, department: true },
        },
      },
    })
  }

  async listReports(filters: GetReportsDto) {
    const where: any = {}

    if (filters.employeeId) {
      where.employeeId = filters.employeeId
    }

    if (filters.type) {
      where.type = filters.type
    }

    if (filters.startDate || filters.endDate) {
      where.reportDate = {}
      if (filters.startDate) {
        where.reportDate.gte = new Date(filters.startDate)
      }
      if (filters.endDate) {
        where.reportDate.lte = new Date(filters.endDate)
      }
    }

    if (filters.weekNumber) {
      where.weekNumber = filters.weekNumber
    }

    // Month/Year filtering
    if (filters.month && filters.year) {
      const startDate = new Date(filters.year, filters.month - 1, 1)
      const endDate = new Date(filters.year, filters.month, 0, 23, 59, 59)
      where.reportDate = {
        gte: startDate,
        lte: endDate,
      }
    }

    return prisma.employeeReport.findMany({
      where,
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
      },
      orderBy: { reportDate: "desc" },
    })
  }

  async getReportById(id: number) {
    const report = await prisma.employeeReport.findUnique({
      where: { id },
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
      },
    })

    if (!report) {
      throw new Error("Report not found")
    }

    return report
  }

  async updateReport(id: number, dto: UpdateReportDto) {
    return prisma.employeeReport.update({
      where: { id },
      data: {
        ...(dto.content !== undefined && { content: dto.content }),
        ...(dto.reportDate ? { reportDate: new Date(dto.reportDate) } : {}),
      } as any,
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
    })
  }

  async deleteReport(id: number) {
    return prisma.employeeReport.delete({
      where: { id },
    })
  }

  // ────────────────────────────────────────────────────────────────────
  // Weekly Report Analysis
  // ────────────────────────────────────────────────────────────────────

  async getWeeklySummary(employeeId: number, year: number, weekNumber: number) {
    // Get all daily reports for the week
    const reports = await prisma.employeeReport.findMany({
      where: {
        employeeId,
        type: ReportType.DAILY,
        reportDate: {
          gte: this.getWeekStartDate(year, weekNumber),
          lte: this.getWeekEndDate(year, weekNumber),
        },
      },
      orderBy: { reportDate: "asc" },
    })

    // Check which weekdays are missing (Monday = 1, Sunday = 0)
    const reportedWeekdays = new Set(reports.map((r) => r.weekday))
    const missingWeekdays = [1, 2, 3, 4, 5, 6, 0].filter(
      (day) => !reportedWeekdays.has(day)
    )

    const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    const missingDays = missingWeekdays.map((day) => weekdayNames[day])

    return {
      employeeId,
      year,
      weekNumber,
      totalReports: reports.length,
      expectedReports: 7, // Full week
      missingDays,
      missingCount: missingWeekdays.length,
      reports,
    }
  }

  // ────────────────────────────────────────────────────────────────────
  // Monthly Report Analysis
  // ────────────────────────────────────────────────────────────────────

  async getMonthlySummary(employeeId: number, year: number, month: number) {
    // Fetch employee to get joinDate
    const employee = await prisma.user.findUnique({
      where: { id: employeeId },
      select: { joinDate: true },
    })

    const monthStart = new Date(year, month - 1, 1)
    const monthEnd   = new Date(year, month, 0, 23, 59, 59)
    const daysInMonth = monthEnd.getDate()

    // Effective start: the later of month start and hire date
    // If joined after this month entirely → 0 expected days
    const joinDate = employee?.joinDate ? new Date(employee.joinDate) : null
    const joinDay  = joinDate
      ? new Date(joinDate.getFullYear(), joinDate.getMonth(), joinDate.getDate())
      : null

    // If the employee hadn't joined yet this month at all, return zeroes
    if (joinDay && joinDay > monthEnd) {
      return {
        employeeId,
        year,
        month,
        daysInMonth,
        expectedWorkDays: 0,
        totalReports: 0,
        missingDates: [],
        missingCount: 0,
        completionRate: 100, // nothing expected yet
        reports: [],
      }
    }

    // Effective first day to count (1-based day within the month)
    const effectiveStartDay =
      joinDay && joinDay > monthStart
        ? joinDay.getDate()   // joined mid-month
        : 1                   // joined before or during this month's start

    // Today (for not counting future days as missing)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const effectiveEndDay = Math.min(
      daysInMonth,
      today.getFullYear() === year && today.getMonth() === month - 1
        ? today.getDate()
        : daysInMonth
    )

    // Get all reports for the month
    const reports = await prisma.employeeReport.findMany({
      where: {
        employeeId,
        type: ReportType.DAILY,
        reportDate: { gte: monthStart, lte: monthEnd },
      },
      include: {
        employee: {
          select: { id: true, name: true, email: true, position: true, department: true },
        },
      },
      orderBy: { reportDate: "asc" },
    })

    // Get reported dates
    const reportedDates = new Set(
      reports.map((r) => r.reportDate.toISOString().split("T")[0])
    )

    // Find missing dates — only from hire date, only up to today, skip Fridays
    const missingDates: string[] = []
    let expectedWorkDays = 0

    for (let day = effectiveStartDay; day <= effectiveEndDay; day++) {
      const date = new Date(year, month - 1, day)
      const dayOfWeek = date.getDay()
      if (dayOfWeek === 5) continue // Friday off
      expectedWorkDays++
      const ds = date.toISOString().split("T")[0]!
      if (!reportedDates.has(ds)) {
        missingDates.push(ds)
      }
    }

    return {
      employeeId,
      year,
      month,
      daysInMonth,
      expectedWorkDays,
      totalReports: reports.length,
      missingDates,
      missingCount: missingDates.length,
      completionRate: expectedWorkDays > 0 ? (reports.length / expectedWorkDays) * 100 : 100,
      reports,
    }
  }

  // ────────────────────────────────────────────────────────────────────
  // All Employees Summary
  // ────────────────────────────────────────────────────────────────────

  async getAllEmployeesWeeklySummary(year: number, weekNumber: number) {
    const employees = await prisma.user.findMany({
      where: {
        isActive: true,
        role: { not: "ADMIN" }, // Exclude admins from reporting
      },
      select: {
        id: true,
        name: true,
        email: true,
        position: true,
        department: true,
      },
    })

    const summaries = await Promise.all(
      employees.map((emp) => this.getWeeklySummary(emp.id, year, weekNumber))
    )

    return summaries.map((summary, idx) => ({
      ...employees[idx],
      ...summary,
    }))
  }

  async getAllEmployeesMonthlySummary(year: number, month: number) {
    const employees = await prisma.user.findMany({
      where: {
        isActive: true,
        role: { not: "ADMIN" },
      },
      select: {
        id: true,
        name: true,
        email: true,
        position: true,
        department: true,
        joinDate: true, // needed so getMonthlySummary can use it
      },
    })

    const summaries = await Promise.all(
      employees.map((emp) => this.getMonthlySummary(emp.id, year, month))
    )

    return summaries.map((summary, idx) => ({
      ...employees[idx],
      ...summary,
    }))
  }

  // ────────────────────────────────────────────────────────────────────
  // Helper Methods
  // ────────────────────────────────────────────────────────────────────

  private getWeekStartDate(year: number, weekNumber: number): Date {
    const simple = new Date(year, 0, 1 + (weekNumber - 1) * 7)
    const dow = simple.getDay()
    const ISOweekStart = simple
    if (dow <= 4) {
      ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1)
    } else {
      ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay())
    }
    return ISOweekStart
  }

  private getWeekEndDate(year: number, weekNumber: number): Date {
    const start = this.getWeekStartDate(year, weekNumber)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    end.setHours(23, 59, 59, 999)
    return end
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  }
}
