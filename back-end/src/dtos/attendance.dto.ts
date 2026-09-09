import { AttendanceStatus } from "../generated/prisma/index.js"

// ────────────────────────────────────────────────────────────────────
// Attendance DTOs
// ────────────────────────────────────────────────────────────────────

export interface CheckInDto {
  employeeId: number
  faceImageBase64?: string  // Base64 encoded face image
  faceDescriptor?: number[]  // Face descriptor array for verification
  notes?: string
}

export interface CheckOutDto {
  employeeId: number
  faceImageBase64?: string
  faceDescriptor?: number[]
  notes?: string
}

export interface ManualAttendanceDto {
  employeeId: number
  date: string
  checkIn?: string
  checkOut?: string
  status: AttendanceStatus
  notes?: string
}

export interface UpdateAttendanceDto {
  checkIn?: string
  checkOut?: string
  status?: AttendanceStatus
  notes?: string
}

export interface RegisterFaceDto {
  employeeId: number
  faceImageBase64: string
  faceDescriptor: number[]  // Face descriptor from face-api.js
}

export interface VerifyFaceDto {
  faceImageBase64: string
  faceDescriptor: number[]
}

export interface VerifyFaceWithEmployeeDto {
  employeeId: number
  faceDescriptor: number[]
}
