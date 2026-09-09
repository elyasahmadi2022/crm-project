import type { Request, Response } from "express"
import { ReportService } from "../services/report.service.js"
import type { CreateReportDto, UpdateReportDto, GetReportsDto } from "../dtos/report.dto.js"

const reportService = new ReportService()

export class ReportController {
  // CRUD
  async create(req: Request, res: Response) {
    try {
      // employeeId comes from the authenticated user, not the request body
      const dto: CreateReportDto = {
        ...req.body,
        employeeId: req.user!.id,
      }
      const report = await reportService.createReport(dto)
      res.status(201).json({ success: true, data: report })
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message })
    }
  }

  async list(req: Request, res: Response) {
    try {
      const filters: GetReportsDto = {
        employeeId: req.query.employeeId
          ? parseInt(req.query.employeeId as string)
          : req.user!.role !== "ADMIN"
          ? req.user!.id
          : undefined,
        ...(req.query.startDate && { startDate: req.query.startDate as string }),
        ...(req.query.endDate && { endDate: req.query.endDate as string }),
        ...(req.query.type && { type: req.query.type as any }),
        ...(req.query.weekNumber && { weekNumber: parseInt(req.query.weekNumber as string) }),
        ...(req.query.month && { month: parseInt(req.query.month as string) }),
        ...(req.query.year && { year: parseInt(req.query.year as string) }),
      } as GetReportsDto
      const reports = await reportService.listReports(filters)
      res.json({ success: true, data: reports })
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message })
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id)
      const report = await reportService.getReportById(id)
      res.json({ success: true, data: report })
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message })
    }
  }

  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id)
      const dto = req.body as UpdateReportDto
      const report = await reportService.updateReport(id, dto)
      res.json({ success: true, data: report })
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message })
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id)
      await reportService.deleteReport(id)
      res.json({ success: true, message: "Report deleted successfully" })
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message })
    }
  }

  // Summaries
  async getWeeklySummary(req: Request, res: Response) {
    try {
      const employeeId = parseInt(req.params.employeeId)
      const year = parseInt(req.params.year)
      const weekNumber = parseInt(req.params.weekNumber)
      const summary = await reportService.getWeeklySummary(employeeId, year, weekNumber)
      res.json({ success: true, data: summary })
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message })
    }
  }

  async getMonthlySummary(req: Request, res: Response) {
    try {
      const employeeId = parseInt(req.params.employeeId)
      const year = parseInt(req.params.year)
      const month = parseInt(req.params.month)
      const summary = await reportService.getMonthlySummary(employeeId, year, month)
      res.json({ success: true, data: summary })
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message })
    }
  }

  async getAllEmployeesWeeklySummary(req: Request, res: Response) {
    try {
      const year = parseInt(req.params.year)
      const weekNumber = parseInt(req.params.weekNumber)
      const summaries = await reportService.getAllEmployeesWeeklySummary(year, weekNumber)
      res.json({ success: true, data: summaries })
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message })
    }
  }

  async getAllEmployeesMonthlySummary(req: Request, res: Response) {
    try {
      const year = parseInt(req.params.year)
      const month = parseInt(req.params.month)
      const summaries = await reportService.getAllEmployeesMonthlySummary(year, month)
      res.json({ success: true, data: summaries })
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message })
    }
  }
}
