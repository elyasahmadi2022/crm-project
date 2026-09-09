import type { Request, Response } from "express"
import { AttendanceService } from "../services/attendance.service.js"
import type {
  CheckInDto,
  CheckOutDto,
  ManualAttendanceDto,
  UpdateAttendanceDto,
  RegisterFaceDto,
  VerifyFaceDto,
} from "../dtos/attendance.dto.js"

const attendanceService = new AttendanceService()

export class AttendanceController {
  // Public Face Verification (no auth required)
  async publicVerifyFace(req: Request, res: Response) {
    try {
      const dto = req.body as VerifyFaceDto
      const result = await attendanceService.verifyFace(dto)
      res.json({ success: true, data: result })
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message })
    }
  }

  // Public Check-in (no auth required)
  async publicCheckIn(req: Request, res: Response) {
    try {
      const { employeeId, faceImageBase64, faceDescriptor } = req.body
      
      // Verify face to get employee ID
      const verification = await attendanceService.verifyFace({
        faceImageBase64,
        faceDescriptor,
      })

      if (!verification.verified || !verification.employeeId) {
        return res.status(401).json({ 
          success: false, 
          message: "Face not recognized. Please ensure you're registered in the system." 
        })
      }

      // Create check-in with verified employee ID
      const attendance = await attendanceService.checkIn({
        employeeId: verification.employeeId,
        faceImageBase64,
        faceDescriptor,
        notes: "Self check-in via face recognition"
      })

      res.status(201).json({ 
        success: true, 
        message: `Welcome, ${verification.employeeName}!`, 
        data: attendance 
      })
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message })
    }
  }

  // Public Check-out (no auth required)
  async publicCheckOut(req: Request, res: Response) {
    try {
      const { employeeId, faceImageBase64, faceDescriptor } = req.body
      
      // Verify face to get employee ID
      const verification = await attendanceService.verifyFace({
        faceImageBase64,
        faceDescriptor,
      })

      if (!verification.verified || !verification.employeeId) {
        return res.status(401).json({ 
          success: false, 
          message: "Face not recognized. Please ensure you're registered in the system." 
        })
      }

      // Check-out with verified employee ID
      const attendance = await attendanceService.checkOut({
        employeeId: verification.employeeId,
        faceImageBase64,
        faceDescriptor,
        notes: "Self check-out via face recognition"
      })

      res.json({ 
        success: true, 
        message: `Goodbye, ${verification.employeeName}! Have a great day!`, 
        data: attendance 
      })
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message })
    }
  }

  // Face Recognition
  async registerFace(req: Request, res: Response) {
    try {
      const dto = req.body as RegisterFaceDto
      const result = await attendanceService.registerFace(dto)
      res.json({ success: true, data: result })
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message })
    }
  }

  async verifyFace(req: Request, res: Response) {
    try {
      const dto = req.body as VerifyFaceDto
      const result = await attendanceService.verifyFace(dto)
      res.json({ success: true, data: result })
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message })
    }
  }

  // Check In/Out
  async checkIn(req: Request, res: Response) {
    try {
      const dto = req.body as CheckInDto
      const attendance = await attendanceService.checkIn(dto)
      res.status(201).json({ success: true, data: attendance })
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message })
    }
  }

  async checkOut(req: Request, res: Response) {
    try {
      const dto = req.body as CheckOutDto
      const attendance = await attendanceService.checkOut(dto)
      res.json({ success: true, data: attendance })
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message })
    }
  }

  // Manual Attendance (Admin)
  async createManual(req: Request, res: Response) {
    try {
      const dto = req.body as ManualAttendanceDto
      const attendance = await attendanceService.createManualAttendance(dto)
      res.status(201).json({ success: true, data: attendance })
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message })
    }
  }

  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id)
      const dto = req.body as UpdateAttendanceDto
      const attendance = await attendanceService.updateAttendance(id, dto)
      res.json({ success: true, data: attendance })
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message })
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id)
      await attendanceService.deleteAttendance(id)
      res.json({ success: true, message: "Attendance deleted successfully" })
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message })
    }
  }

  // Query
  async getToday(req: Request, res: Response) {
    try {
      const attendance = await attendanceService.getTodayAttendance()
      res.json({ success: true, data: attendance })
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message })
    }
  }

  async getByDate(req: Request, res: Response) {
    try {
      const date = req.params.date
      const attendance = await attendanceService.getAttendanceByDate(date)
      res.json({ success: true, data: attendance })
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message })
    }
  }

  async getEmployeeAttendance(req: Request, res: Response) {
    try {
      const employeeId = parseInt(req.params.employeeId)
      const startDate = req.query.startDate as string
      const endDate = req.query.endDate as string
      const attendance = await attendanceService.getEmployeeAttendance(
        employeeId,
        startDate,
        endDate
      )
      res.json({ success: true, data: attendance })
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message })
    }
  }

  async getMonthlyAttendance(req: Request, res: Response) {
    try {
      const employeeId = parseInt(req.params.employeeId)
      const year = parseInt(req.params.year)
      const month = parseInt(req.params.month)
      const summary = await attendanceService.getMonthlyAttendance(employeeId, year, month)
      res.json({ success: true, data: summary })
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message })
    }
  }
}
