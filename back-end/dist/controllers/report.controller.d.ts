import type { Request, Response } from "express";
export declare class ReportController {
    create(req: Request, res: Response): Promise<void>;
    list(req: Request, res: Response): Promise<void>;
    getById(req: Request, res: Response): Promise<void>;
    update(req: Request, res: Response): Promise<void>;
    delete(req: Request, res: Response): Promise<void>;
    getWeeklySummary(req: Request, res: Response): Promise<void>;
    getMonthlySummary(req: Request, res: Response): Promise<void>;
    getAllEmployeesWeeklySummary(req: Request, res: Response): Promise<void>;
    getAllEmployeesMonthlySummary(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=report.controller.d.ts.map