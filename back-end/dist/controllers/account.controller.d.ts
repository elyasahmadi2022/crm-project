import type { Request, Response } from "express";
export declare class AccountController {
    create(req: Request, res: Response): Promise<void>;
    list(req: Request, res: Response): Promise<void>;
    getById(req: Request, res: Response): Promise<void>;
    update(req: Request, res: Response): Promise<void>;
    delete(req: Request, res: Response): Promise<void>;
    deposit(req: Request, res: Response): Promise<void>;
    withdraw(req: Request, res: Response): Promise<void>;
    transfer(req: Request, res: Response): Promise<void>;
    getTransactions(req: Request, res: Response): Promise<void>;
    getBalanceSummary(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=account.controller.d.ts.map