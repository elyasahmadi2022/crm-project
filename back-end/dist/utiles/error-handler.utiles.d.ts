import type { NextFunction, Request, Response } from "express";
export declare class AppError extends Error {
    statusCode: number;
    constructor(statusCode: number, message: string);
}
export declare const errorHandler: (err: unknown, _req: Request, res: Response, _next: NextFunction) => Response<import("./api-response.utiles.js").ApiErrorResponse, Record<string, any>>;
export declare const asyncHandler: (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) => (req: Request, res: Response, next: NextFunction) => Promise<unknown>;
//# sourceMappingURL=error-handler.utiles.d.ts.map