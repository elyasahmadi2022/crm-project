import type { Request, Response } from "express";
export declare class PayrollController {
    create(req: Request, res: Response): Promise<void>;
    list(req: Request, res: Response): Promise<void>;
    getById(req: Request, res: Response): Promise<void>;
    update(req: Request, res: Response): Promise<void>;
    delete(req: Request, res: Response): Promise<void>;
    pay(req: Request, res: Response): Promise<void>;
    recordAdvance(req: Request, res: Response): Promise<void>;
    listAdvances(req: Request, res: Response): Promise<void>;
    getAdvanceById(req: Request, res: Response): Promise<void>;
    deductAdvance(req: Request, res: Response): Promise<void>;
    generateMonthly(req: Request, res: Response): Promise<void>;
    getMonthlyReport(req: Request, res: Response): Promise<void>;
    getEmployeeHistory(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=payroll.controller.d.ts.map