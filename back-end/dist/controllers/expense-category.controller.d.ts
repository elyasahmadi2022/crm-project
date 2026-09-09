import type { Request, Response, NextFunction } from "express";
export declare const expenseCategoryController: {
    getAll: (_req: Request, res: Response, next: NextFunction) => Promise<Response<import("../utiles/api-response.utiles.js").ApiSuccessResponse<import("../services/expense-category.service.js").CustomCategoryDto[]>, Record<string, any>> | undefined>;
    getById: (req: Request, res: Response, next: NextFunction) => Promise<Response<import("../utiles/api-response.utiles.js").ApiSuccessResponse<import("../services/expense-category.service.js").CustomCategoryDto>, Record<string, any>> | undefined>;
    create: (req: Request, res: Response, next: NextFunction) => Promise<Response<import("../utiles/api-response.utiles.js").ApiSuccessResponse<import("../services/expense-category.service.js").CustomCategoryDto>, Record<string, any>> | undefined>;
    update: (req: Request, res: Response, next: NextFunction) => Promise<Response<import("../utiles/api-response.utiles.js").ApiSuccessResponse<import("../services/expense-category.service.js").CustomCategoryDto>, Record<string, any>> | undefined>;
    delete: (req: Request, res: Response, next: NextFunction) => Promise<Response<import("../utiles/api-response.utiles.js").ApiSuccessResponse<{
        success: boolean;
    }>, Record<string, any>> | undefined>;
};
//# sourceMappingURL=expense-category.controller.d.ts.map