import type { CheckInDto, CheckOutDto, ManualAttendanceDto, UpdateAttendanceDto, RegisterFaceDto, VerifyFaceDto, VerifyFaceWithEmployeeDto } from "../dtos/attendance.dto.js";
export declare class AttendanceService {
    private uploadDir;
    registerFace(dto: RegisterFaceDto): Promise<{
        avatarUrl: string | null;
        email: string;
        faceEmbedding: string | null;
        id: number;
        name: string;
    }>;
    verifyFace(dto: VerifyFaceDto): Promise<{
        verified: boolean;
        employeeId: number | null;
        employeeName: string | null;
        similarity: number;
    }>;
    verifyFaceForEmployee(dto: VerifyFaceWithEmployeeDto): Promise<{
        verified: boolean;
        similarity: number;
    }>;
    private euclideanDistance;
    checkIn(dto: CheckInDto): Promise<{
        employee: {
            email: string;
            id: number;
            name: string;
            position: string | null;
        };
    } & {
        id: number;
        employeeId: number;
        date: Date;
        checkIn: Date | null;
        checkOut: Date | null;
        checkInImage: string | null;
        checkOutImage: string | null;
        status: import("../generated/prisma/index.js").$Enums.AttendanceStatus;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    checkOut(dto: CheckOutDto): Promise<{
        employee: {
            email: string;
            id: number;
            name: string;
            position: string | null;
        };
    } & {
        id: number;
        employeeId: number;
        date: Date;
        checkIn: Date | null;
        checkOut: Date | null;
        checkInImage: string | null;
        checkOutImage: string | null;
        status: import("../generated/prisma/index.js").$Enums.AttendanceStatus;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    createManualAttendance(dto: ManualAttendanceDto): Promise<{
        employee: {
            email: string;
            id: number;
            name: string;
            position: string | null;
        };
    } & {
        id: number;
        employeeId: number;
        date: Date;
        checkIn: Date | null;
        checkOut: Date | null;
        checkInImage: string | null;
        checkOutImage: string | null;
        status: import("../generated/prisma/index.js").$Enums.AttendanceStatus;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateAttendance(id: number, dto: UpdateAttendanceDto): Promise<{
        employee: {
            email: string;
            id: number;
            name: string;
            position: string | null;
        };
    } & {
        id: number;
        employeeId: number;
        date: Date;
        checkIn: Date | null;
        checkOut: Date | null;
        checkInImage: string | null;
        checkOutImage: string | null;
        status: import("../generated/prisma/index.js").$Enums.AttendanceStatus;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    deleteAttendance(id: number): Promise<{
        id: number;
        employeeId: number;
        date: Date;
        checkIn: Date | null;
        checkOut: Date | null;
        checkInImage: string | null;
        checkOutImage: string | null;
        status: import("../generated/prisma/index.js").$Enums.AttendanceStatus;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getTodayAttendance(): Promise<({
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
        date: Date;
        checkIn: Date | null;
        checkOut: Date | null;
        checkInImage: string | null;
        checkOutImage: string | null;
        status: import("../generated/prisma/index.js").$Enums.AttendanceStatus;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    getAttendanceByDate(date: string): Promise<({
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
        date: Date;
        checkIn: Date | null;
        checkOut: Date | null;
        checkInImage: string | null;
        checkOutImage: string | null;
        status: import("../generated/prisma/index.js").$Enums.AttendanceStatus;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    getEmployeeAttendance(employeeId: number, startDate?: string, endDate?: string): Promise<{
        id: number;
        employeeId: number;
        date: Date;
        checkIn: Date | null;
        checkOut: Date | null;
        checkInImage: string | null;
        checkOutImage: string | null;
        status: import("../generated/prisma/index.js").$Enums.AttendanceStatus;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    getMonthlyAttendance(employeeId: number, year: number, month: number): Promise<{
        employeeId: number;
        year: number;
        month: number;
        daysInMonth: number;
        expectedWorkDays: number;
        presentDays: number;
        absentDays: number;
        leaveDays: number;
        halfDays: number;
        attendanceRate: number;
        attendance: {
            id: number;
            employeeId: number;
            date: Date;
            checkIn: Date | null;
            checkOut: Date | null;
            checkInImage: string | null;
            checkOutImage: string | null;
            status: import("../generated/prisma/index.js").$Enums.AttendanceStatus;
            notes: string | null;
            createdAt: Date;
            updatedAt: Date;
        }[];
    }>;
    private saveFaceImage;
    /**
     * Process and normalize image for face comparison
     * Uses Sharp to ensure consistent image quality
     */
    private processImageForComparison;
    /**
     * Extract simple face features using image histogram
     * This is a simplified approach - in production use face-api.js or similar
     */
    private extractSimpleFaceFeatures;
}
//# sourceMappingURL=attendance.service.d.ts.map