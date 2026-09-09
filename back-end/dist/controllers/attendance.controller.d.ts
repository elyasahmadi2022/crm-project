import type { Request, Response } from "express";
export declare class AttendanceController {
    publicVerifyFace(req: Request, res: Response): Promise<void>;
    publicCheckIn(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    publicCheckOut(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    registerFace(req: Request, res: Response): Promise<void>;
    verifyFace(req: Request, res: Response): Promise<void>;
    checkIn(req: Request, res: Response): Promise<void>;
    checkOut(req: Request, res: Response): Promise<void>;
    createManual(req: Request, res: Response): Promise<void>;
    update(req: Request, res: Response): Promise<void>;
    delete(req: Request, res: Response): Promise<void>;
    getToday(req: Request, res: Response): Promise<void>;
    getByDate(req: Request, res: Response): Promise<void>;
    getEmployeeAttendance(req: Request, res: Response): Promise<void>;
    getMonthlyAttendance(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=attendance.controller.d.ts.map