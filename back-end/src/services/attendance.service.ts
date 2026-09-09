import { AttendanceStatus } from "../generated/prisma/index.js"
import { prisma } from "../lib/primsa.js"
import type {
  CheckInDto,
  CheckOutDto,
  ManualAttendanceDto,
  UpdateAttendanceDto,
  RegisterFaceDto,
  VerifyFaceDto,
  VerifyFaceWithEmployeeDto,
} from "../dtos/attendance.dto.js"
import fs from "fs/promises"
import path from "path"
import sharp from "sharp"

export class AttendanceService {
  private uploadDir = process.env.UPLOAD_DIR || "uploads/faces"

  // ────────────────────────────────────────────────────────────────────
  // Face Recognition
  // ────────────────────────────────────────────────────────────────────

  async registerFace(dto: RegisterFaceDto) {
    const employee = await prisma.user.findUnique({
      where: { id: dto.employeeId },
    })

    if (!employee) {
      throw new Error("Employee not found")
    }

    // Validate descriptor is 128-dimension
    if (!dto.faceDescriptor || dto.faceDescriptor.length !== 128) {
      throw new Error("Invalid face descriptor. Must be 128-dimension array.")
    }

    // ── Duplicate face check ──────────────────────────────────────────
    // Reject if this face already belongs to a different employee
    const others = await prisma.user.findMany({
      where: {
        faceEmbedding: { not: null },
        isActive: true,
        id: { not: dto.employeeId }, // exclude self (allow re-registration)
      },
      select: { id: true, name: true, faceEmbedding: true },
    })

    const DUPLICATE_THRESHOLD = 0.50 // same threshold as verification
    for (const other of others) {
      if (!other.faceEmbedding) continue
      const stored = JSON.parse(other.faceEmbedding) as number[]
      if (stored.length !== 128) continue
      const distance = this.euclideanDistance(stored, dto.faceDescriptor)
      if (distance < DUPLICATE_THRESHOLD) {
        throw new Error(
          `This face is already registered to another employee (${other.name}). Each employee must register their own face.`
        )
      }
    }
    // ─────────────────────────────────────────────────────────────────

    // Store face descriptor as JSON string
    const faceEmbedding = JSON.stringify(dto.faceDescriptor)

    // Save ONE face image per employee (overwrites previous registration)
    let faceImageUrl: string | undefined
    if (dto.faceImageBase64) {
      faceImageUrl = await this.saveFaceImage(dto.employeeId, dto.faceImageBase64, "registered")
    }

    // Update employee with face embedding
    return prisma.user.update({
      where: { id: dto.employeeId },
      data: {
        faceEmbedding,
        avatarUrl: faceImageUrl || employee.avatarUrl,
      },
      select: {
        id: true,
        name: true,
        email: true,
        faceEmbedding: true,
        avatarUrl: true,
      },
    })
  }

  async verifyFace(dto: VerifyFaceDto): Promise<{ verified: boolean; employeeId: number | null; employeeName: string | null; similarity: number }> {
    // Get all employees with registered faces
    const employees = await prisma.user.findMany({
      where: {
        faceEmbedding: { not: null },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        faceEmbedding: true,
      },
    })

    if (employees.length === 0) {
      return { verified: false, employeeId: null, employeeName: null, similarity: 0 }
    }

    // Score every enrolled employee
    const ACCEPT_THRESHOLD  = 0.50  // distance < 0.50 → confident match
    const AMBIGUOUS_MAX     = 0.60  // distance < 0.60 → possible match (needs gap check)
    const MIN_GAP           = 0.05  // top-2 must differ by at least this

    type Candidate = { employeeId: number; employeeName: string; distance: number; similarity: number }
    const candidates: Candidate[] = []

    for (const emp of employees) {
      if (!emp.faceEmbedding) continue
      const stored = JSON.parse(emp.faceEmbedding) as number[]
      if (stored.length !== 128) continue
      const distance = this.euclideanDistance(stored, dto.faceDescriptor)
      candidates.push({
        employeeId: emp.id,
        employeeName: emp.name,
        distance,
        similarity: Math.max(0, 1 - distance),
      })
    }

    // Sort ascending by distance (closest = best match)
    candidates.sort((a, b) => a.distance - b.distance)
    const [top, second] = candidates

    if (!top) return { verified: false, employeeId: null, employeeName: null, similarity: 0 }

    // Reject outright if best match is too far
    if (top.distance >= AMBIGUOUS_MAX) {
      return { verified: false, employeeId: null, employeeName: null, similarity: top.similarity }
    }

    // Auto-accept if below accept threshold
    if (top.distance < ACCEPT_THRESHOLD) {
      return { verified: true, employeeId: top.employeeId, employeeName: top.employeeName, similarity: top.similarity }
    }

    // Ambiguous zone: require a clear gap between #1 and #2
    if (second && (second.distance - top.distance) < MIN_GAP) {
      return { verified: false, employeeId: null, employeeName: null, similarity: top.similarity }
    }

    return { verified: true, employeeId: top.employeeId, employeeName: top.employeeName, similarity: top.similarity }
  }

  async verifyFaceForEmployee(dto: VerifyFaceWithEmployeeDto): Promise<{ verified: boolean; similarity: number }> {
    const employee = await prisma.user.findUnique({
      where: { id: dto.employeeId },
      select: { faceEmbedding: true },
    })

    if (!employee || !employee.faceEmbedding) {
      throw new Error("No face registered for this employee")
    }

    // Parse stored face descriptor
    const storedDescriptor = JSON.parse(employee.faceEmbedding) as number[]

    // Calculate euclidean distance
    const distance = this.euclideanDistance(storedDescriptor, dto.faceDescriptor)

    // Threshold for face verification (typically 0.6 or lower means same person)
    const threshold = 0.6
    const verified = distance < threshold
    const similarity = Math.max(0, 1 - distance) // Convert distance to similarity (0-1)

    return { verified, similarity }
  }

  private euclideanDistance(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error("Descriptors must have same length")
    }
    return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - (b[i] ?? 0), 2), 0))
  }

  // ────────────────────────────────────────────────────────────────────
  // Check In/Out
  // ────────────────────────────────────────────────────────────────────

  async checkIn(dto: CheckInDto) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Verify face if descriptor provided
    if (dto.faceDescriptor) {
      const verification = await this.verifyFaceForEmployee({
        employeeId: dto.employeeId,
        faceDescriptor: dto.faceDescriptor,
      })

      if (!verification.verified) {
        throw new Error("Face verification failed. Please try again or contact admin.")
      }
    }

    // Check if already checked in today
    const existing = await prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId: dto.employeeId,
          date: today,
        },
      },
    })

    if (existing && existing.checkIn) {
      throw new Error("Already checked in today")
    }

    // Save face image if provided
    let checkInImage: string | undefined
    if (dto.faceImageBase64) {
      checkInImage = await this.saveFaceImage(
        dto.employeeId,
        dto.faceImageBase64,
        `checkin-${Date.now()}`
      )
    }

    if (existing) {
      return prisma.attendance.update({
        where: { id: existing.id },
        data: {
          checkIn: new Date(),
          ...(checkInImage !== undefined && { checkInImage }),
          status: AttendanceStatus.PRESENT,
          ...(dto.notes !== undefined && { notes: dto.notes }),
        },
        include: {
          employee: {
            select: { id: true, name: true, email: true, position: true },
          },
        },
      })
    }

    return prisma.attendance.create({
      data: {
        employeeId: dto.employeeId,
        date: today,
        checkIn: new Date(),
        ...(checkInImage !== undefined && { checkInImage }),
        status: AttendanceStatus.PRESENT,
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
      include: {
        employee: {
          select: { id: true, name: true, email: true, position: true },
        },
      },
    })
  }

  async checkOut(dto: CheckOutDto) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Verify face if descriptor provided
    if (dto.faceDescriptor) {
      const verification = await this.verifyFaceForEmployee({
        employeeId: dto.employeeId,
        faceDescriptor: dto.faceDescriptor,
      })

      if (!verification.verified) {
        throw new Error("Face verification failed. Please try again or contact admin.")
      }
    }

    // Find today's attendance
    const attendance = await prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId: dto.employeeId,
          date: today,
        },
      },
    })

    if (!attendance) {
      throw new Error("No check-in record found for today")
    }

    if (attendance.checkOut) {
      throw new Error("Already checked out today")
    }

    // Save face image if provided
    let checkOutImage: string | undefined
    if (dto.faceImageBase64) {
      checkOutImage = await this.saveFaceImage(
        dto.employeeId,
        dto.faceImageBase64,
        `checkout-${Date.now()}`
      )
    }

    return prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOut: new Date(),
        ...(checkOutImage !== undefined && { checkOutImage }),
        notes: dto.notes
          ? `${attendance.notes || ""}\n${dto.notes}`.trim()
          : (attendance.notes ?? undefined),
      } as any,
      include: {
        employee: {
          select: { id: true, name: true, email: true, position: true },
        },
      },
    })
  }

  // ────────────────────────────────────────────────────────────────────
  // Manual Attendance (Admin)
  // ────────────────────────────────────────────────────────────────────

  async createManualAttendance(dto: ManualAttendanceDto) {
    const date = new Date(dto.date)
    date.setHours(0, 0, 0, 0)

    return prisma.attendance.create({
      data: {
        employeeId: dto.employeeId,
        date,
        ...(dto.checkIn ? { checkIn: new Date(`${dto.date}T${dto.checkIn}`) } : {}),
        ...(dto.checkOut ? { checkOut: new Date(`${dto.date}T${dto.checkOut}`) } : {}),
        status: dto.status,
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
      include: {
        employee: {
          select: { id: true, name: true, email: true, position: true },
        },
      },
    })
  }

  async updateAttendance(id: number, dto: UpdateAttendanceDto) {
    return prisma.attendance.update({
      where: { id },
      data: {
        ...(dto.checkIn ? { checkIn: new Date(dto.checkIn) } : {}),
        ...(dto.checkOut ? { checkOut: new Date(dto.checkOut) } : {}),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
      include: {
        employee: {
          select: { id: true, name: true, email: true, position: true },
        },
      },
    })
  }

  async deleteAttendance(id: number) {
    return prisma.attendance.delete({
      where: { id },
    })
  }

  // ────────────────────────────────────────────────────────────────────
  // Query Attendance
  // ────────────────────────────────────────────────────────────────────

  async getTodayAttendance() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return prisma.attendance.findMany({
      where: { date: today },
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
      orderBy: { checkIn: "asc" },
    })
  }

  async getAttendanceByDate(date: string) {
    const targetDate = new Date(date)
    targetDate.setHours(0, 0, 0, 0)

    return prisma.attendance.findMany({
      where: { date: targetDate },
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
      orderBy: { checkIn: "asc" },
    })
  }

  async getEmployeeAttendance(
    employeeId: number,
    startDate?: string,
    endDate?: string
  ) {
    const where: any = { employeeId }

    if (startDate || endDate) {
      where.date = {}
      if (startDate) {
        const start = new Date(startDate)
        start.setHours(0, 0, 0, 0)
        where.date.gte = start
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        where.date.lte = end
      }
    }

    return prisma.attendance.findMany({
      where,
      orderBy: { date: "desc" },
    })
  }

  async getMonthlyAttendance(employeeId: number, year: number, month: number) {
    // Respect hire date — only count days from joinDate onwards
    const employee = await prisma.user.findUnique({
      where: { id: employeeId },
      select: { joinDate: true },
    })

    const monthStart = new Date(year, month - 1, 1)
    const monthEnd   = new Date(year, month, 0, 23, 59, 59)
    const daysInMonth = monthEnd.getDate()

    const joinDay = employee?.joinDate
      ? new Date(
          employee.joinDate.getFullYear(),
          employee.joinDate.getMonth(),
          employee.joinDate.getDate()
        )
      : null

    // Effective start day within the month (1-based)
    const effectiveStartDay =
      joinDay && joinDay > monthStart ? joinDay.getDate() : 1

    // Don't count future days
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const effectiveEndDay = Math.min(
      daysInMonth,
      today.getFullYear() === year && today.getMonth() === month - 1
        ? today.getDate()
        : daysInMonth
    )

    // Expected work days from hire date (exclude Fridays)
    let expectedWorkDays = 0
    for (let d = effectiveStartDay; d <= effectiveEndDay; d++) {
      if (new Date(year, month - 1, d).getDay() !== 5) expectedWorkDays++
    }

    const attendance = await prisma.attendance.findMany({
      where: {
        employeeId,
        date: { gte: monthStart, lte: monthEnd },
      },
      orderBy: { date: "asc" },
    })

    const presentDays  = attendance.filter((a) => a.status === AttendanceStatus.PRESENT).length
    const absentDays   = attendance.filter((a) => a.status === AttendanceStatus.ABSENT).length
    const leaveDays    = attendance.filter((a) => a.status === AttendanceStatus.LEAVE).length
    const halfDays     = attendance.filter((a) => a.status === AttendanceStatus.HALF_DAY).length

    return {
      employeeId,
      year,
      month,
      daysInMonth,
      expectedWorkDays,
      presentDays,
      absentDays,
      leaveDays,
      halfDays,
      attendanceRate: expectedWorkDays > 0 ? (presentDays / expectedWorkDays) * 100 : 100,
      attendance,
    }
  }

  // ────────────────────────────────────────────────────────────────────
  // Helper Methods
  // ────────────────────────────────────────────────────────────────────

  private async saveFaceImage(
    employeeId: number,
    base64Image: string,
    suffix: string
  ): Promise<string> {
    // Remove data URL prefix if present
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "")
    const buffer = Buffer.from(base64Data, "base64")

    // Process image with Sharp for optimization
    const processedBuffer = await sharp(buffer)
      .resize(800, 800, { 
        fit: 'inside', 
        withoutEnlargement: true 
      })
      .jpeg({ quality: 90 })
      .toBuffer()

    // Create upload directory if it doesn't exist
    const uploadPath = path.join(process.cwd(), this.uploadDir)
    await fs.mkdir(uploadPath, { recursive: true })

    // Generate filename
    const filename = `employee-${employeeId}-${suffix}.jpg`
    const filepath = path.join(uploadPath, filename)

    // Save file
    await fs.writeFile(filepath, processedBuffer)

    // Return relative URL
    return `/${this.uploadDir}/${filename}`
  }

  /**
   * Process and normalize image for face comparison
   * Uses Sharp to ensure consistent image quality
   */
  private async processImageForComparison(base64Image: string): Promise<Buffer> {
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "")
    const buffer = Buffer.from(base64Data, "base64")

    return sharp(buffer)
      .resize(224, 224, { fit: 'cover' }) // Standard size for face recognition
      .normalize() // Normalize contrast/brightness
      .toFormat('jpeg')
      .toBuffer()
  }

  /**
   * Extract simple face features using image histogram
   * This is a simplified approach - in production use face-api.js or similar
   */
  private async extractSimpleFaceFeatures(imageBuffer: Buffer): Promise<number[]> {
    const metadata = await sharp(imageBuffer).metadata()
    const { data, info } = await sharp(imageBuffer)
      .raw()
      .toBuffer({ resolveWithObject: true })

    // Create a simple 128-dimension feature vector from image data
    const features: number[] = []
    const blockSize = Math.floor(data.length / 128)

    for (let i = 0; i < 128; i++) {
      const start = i * blockSize
      const end = start + blockSize
      let sum = 0
      for (let j = start; j < end && j < data.length; j++) {
        sum += data[j] ?? 0
      }
      features.push(sum / blockSize / 255) // Normalize to 0-1
    }

    return features
  }
}
