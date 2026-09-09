import type { Request, Response } from "express"
import { PayrollService } from "../services/payroll.service.js"
import type {
  CreatePayrollDto,
  UpdatePayrollDto,
  PayPayrollDto,
  RecordAdvanceDto,
  DeductAdvanceDto,
  GenerateMonthlyPayrollDto,
} from "../dtos/payroll.dto.js"

const payrollService = new PayrollService()

export class PayrollController {
  // ────────────────────────────────────────────────────────────────────
  // Payroll CRUD
  // ────────────────────────────────────────────────────────────────────

  async create(req: Request, res: Response) {
    try {
      const dto = req.body as CreatePayrollDto
      const payroll = await payrollService.createPayroll(dto)
      res.status(201).json({ success: true, data: payroll })
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message })
    }
  }

  async list(req: Request, res: Response) {
    try {
      const filters = {
        month: req.query.month ? parseInt(req.query.month as string) : undefined,
        year: req.query.year ? parseInt(req.query.year as string) : undefined,
        employeeId: req.query.employeeId ? parseInt(req.query.employeeId as string) : undefined,
        status: req.query.status as any,
      }
      const payrolls = await payrollService.listPayrolls(filters)
      res.json({ success: true, data: payrolls })
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message })
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id)
      const payroll = await payrollService.getPayrollById(id)
      res.json({ success: true, data: payroll })
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message })
    }
  }

  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id)
      const dto = req.body as UpdatePayrollDto
      const payroll = await payrollService.updatePayroll(id, dto)
      res.json({ success: true, data: payroll })
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message })
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id)
      await payrollService.deletePayroll(id)
      res.json({ success: true, message: "Payroll deleted successfully" })
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message })
    }
  }

  async pay(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id)
      const dto = req.body as PayPayrollDto
      const payroll = await payrollService.payPayroll(id, dto)
      res.json({ success: true, data: payroll })
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message })
    }
  }

  // ────────────────────────────────────────────────────────────────────
  // Advances
  // ────────────────────────────────────────────────────────────────────

  async recordAdvance(req: Request, res: Response) {
    try {
      const dto = req.body as RecordAdvanceDto
      const advance = await payrollService.recordAdvance(dto)
      res.status(201).json({ success: true, data: advance })
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message })
    }
  }

  async listAdvances(req: Request, res: Response) {
    try {
      const employeeId = req.query.employeeId ? parseInt(req.query.employeeId as string) : undefined
      const advances = await payrollService.listAdvances(employeeId)
      res.json({ success: true, data: advances })
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message })
    }
  }

  async getAdvanceById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id)
      const advance = await payrollService.getAdvanceById(id)
      res.json({ success: true, data: advance })
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message })
    }
  }

  async deductAdvance(req: Request, res: Response) {
    try {
      const dto = req.body as DeductAdvanceDto
      const advance = await payrollService.deductAdvance(dto)
      res.json({ success: true, data: advance })
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message })
    }
  }

  // ────────────────────────────────────────────────────────────────────
  // Bulk & Reports
  // ────────────────────────────────────────────────────────────────────

  async generateMonthly(req: Request, res: Response) {
    try {
      const dto = req.body as GenerateMonthlyPayrollDto
      const payrolls = await payrollService.generateMonthlyPayroll(dto)
      res.status(201).json({ success: true, data: payrolls })
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message })
    }
  }

  async getMonthlyReport(req: Request, res: Response) {
    try {
      const month = parseInt(req.params.month)
      const year = parseInt(req.params.year)
      const report = await payrollService.getMonthlyReport(month, year)
      res.json({ success: true, data: report })
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message })
    }
  }

  async getEmployeeHistory(req: Request, res: Response) {
    try {
      const employeeId = parseInt(req.params.employeeId)
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 12
      const history = await payrollService.getEmployeePayrollHistory(employeeId, limit)
      res.json({ success: true, data: history })
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message })
    }
  }
}
