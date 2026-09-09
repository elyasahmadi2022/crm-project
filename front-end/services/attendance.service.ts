import { api } from "@/lib/api"

export interface Attendance {
  id: number
  employeeId: number
  date: string
  checkIn: string | null
  checkOut: string | null
  status: string
  faceVerified: boolean
  notes: string | null
  createdAt: string
  updatedAt: string
  employee?: {
    id: number
    name: string
    email: string
    position: string | null
    department: string | null
  }
}

export interface FaceRegistration {
  employeeId: number
  faceImageBase64: string
  faceDescriptor: number[]
}

export interface FaceVerification {
  faceImageBase64: string
  faceDescriptor: number[]
}

export interface CheckInDto {
  faceImageBase64: string
  faceDescriptor: number[]
  notes?: string
}

export interface CheckOutDto {
  attendanceId: number
  faceImageBase64: string
  faceDescriptor: number[]
  notes?: string
}

export interface ManualAttendanceDto {
  employeeId: number
  date: string
  checkIn: string
  checkOut?: string
  status: string
  notes?: string
}

export interface MonthlySummary {
  year: number
  month: number
  totalDays: number
  presentDays: number
  absentDays: number
  halfDays: number
  leaves: number
  attendanceRate: number
}

export const attendanceService = {
  // Public face verification (no auth required)
  publicVerifyFace: async (data: FaceVerification): Promise<{ 
    verified: boolean
    employeeName?: string
    employeeId?: number
    similarity?: number 
  }> => {
    const response = await api.post("/attendance/public/verify-face", data)
    return response.data.data || response.data
  },

  // Public check-in (no auth required)
  publicCheckIn: async (employeeId: number, faceImageBase64: string, faceDescriptor: number[]): Promise<{
    success: boolean
    message: string
    attendance?: Attendance
  }> => {
    const response = await api.post("/attendance/public/checkin", {
      employeeId,
      faceImageBase64,
      faceDescriptor
    })
    return response.data.data || response.data
  },

  // Public check-out (no auth required)
  publicCheckOut: async (employeeId: number, faceImageBase64: string, faceDescriptor: number[]): Promise<{
    success: boolean
    message: string
    attendance?: Attendance
  }> => {
    const response = await api.post("/attendance/public/checkout", {
      employeeId,
      faceImageBase64,
      faceDescriptor
    })
    return response.data.data || response.data
  },

  // Face Management
  registerFace: async (data: FaceRegistration): Promise<{ message: string }> => {
    const response = await api.post("/attendance/face/register", data)
    return response.data
  },

  verifyFace: async (data: FaceVerification): Promise<{ verified: boolean; employeeId?: number; similarity?: number }> => {
    const response = await api.post("/attendance/face/verify", data)
    return response.data
  },

  // Attendance
  checkIn: async (data: CheckInDto): Promise<Attendance> => {
    const response = await api.post("/attendance/checkin", data)
    return response.data
  },

  checkOut: async (data: CheckOutDto): Promise<Attendance> => {
    const response = await api.post("/attendance/checkout", data)
    return response.data
  },

  getTodayAttendance: async (): Promise<Attendance[]> => {
    const response = await api.get("/attendance/today")
    return response.data.data ?? response.data
  },

  getAttendanceByDate: async (date: string): Promise<Attendance[]> => {
    const response = await api.get(`/attendance/date/${date}`)
    return response.data.data ?? response.data
  },

  getEmployeeAttendance: async (employeeId: number, startDate?: string, endDate?: string): Promise<Attendance[]> => {
    const params = new URLSearchParams()
    if (startDate) params.append("startDate", startDate)
    if (endDate) params.append("endDate", endDate)
    const response = await api.get(`/attendance/employee/${employeeId}?${params.toString()}`)
    return response.data.data ?? response.data
  },

  getMyAttendance: async (startDate?: string, endDate?: string): Promise<Attendance[]> => {
    const params = new URLSearchParams()
    if (startDate) params.append("startDate", startDate)
    if (endDate) params.append("endDate", endDate)
    
    const response = await api.get(`/attendance/my?${params.toString()}`)
    return response.data
  },

  getMyTodayAttendance: async (): Promise<Attendance | null> => {
    const response = await api.get("/attendance/my/today")
    return response.data
  },

  getMonthlySummary: async (employeeId: number, year: number, month: number): Promise<MonthlySummary> => {
    const response = await api.get(`/attendance/employee/${employeeId}/monthly/${year}/${month}`)
    return response.data
  },

  getMyMonthlySummary: async (year: number, month: number): Promise<MonthlySummary> => {
    const response = await api.get(`/attendance/my/monthly/${year}/${month}`)
    return response.data
  },

  // Admin functions
  createManualAttendance: async (data: ManualAttendanceDto): Promise<Attendance> => {
    const response = await api.post("/attendance/manual", data)
    return response.data
  },

  updateAttendance: async (id: number, data: Partial<ManualAttendanceDto>): Promise<Attendance> => {
    const response = await api.put(`/attendance/${id}`, data)
    return response.data
  },

  deleteAttendance: async (id: number): Promise<void> => {
    await api.delete(`/attendance/${id}`)
  },

  // Alias used by attendance page
  manualEntry: async (data: {
    employeeId: string
    date: string
    checkIn: string
    checkOut: string
    status: string
    notes: string
  }): Promise<Attendance> => {
    const response = await api.post("/attendance/manual", {
      employeeId: data.employeeId,
      date: data.date,
      checkIn: data.checkIn,
      checkOut: data.checkOut || undefined,
      status: data.status,
      notes: data.notes || undefined,
    })
    return response.data.data || response.data
  },
}
