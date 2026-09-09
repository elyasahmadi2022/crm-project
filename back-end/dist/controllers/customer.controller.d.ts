import type { Request, Response, NextFunction } from "express";
export declare const customerController: {
    getAll: (req: Request, res: Response, next: NextFunction) => Promise<Response<import("../utiles/api-response.utiles.js").ApiSuccessResponse<import("../dtos/customer.dto.js").CustomerResponseDto[]>, Record<string, any>> | undefined>;
    getById: (req: Request, res: Response, next: NextFunction) => Promise<Response<import("../utiles/api-response.utiles.js").ApiSuccessResponse<import("../dtos/customer.dto.js").CustomerResponseDto>, Record<string, any>> | undefined>;
    create: (req: Request, res: Response, next: NextFunction) => Promise<Response<import("../utiles/api-response.utiles.js").ApiSuccessResponse<import("../dtos/customer.dto.js").CustomerResponseDto>, Record<string, any>> | undefined>;
    update: (req: Request, res: Response, next: NextFunction) => Promise<Response<import("../utiles/api-response.utiles.js").ApiSuccessResponse<import("../dtos/customer.dto.js").CustomerResponseDto>, Record<string, any>> | undefined>;
    delete: (req: Request, res: Response, next: NextFunction) => Promise<Response<import("../utiles/api-response.utiles.js").ApiSuccessResponse<{
        success: boolean;
    }>, Record<string, any>> | undefined>;
    addContact: (req: Request, res: Response, next: NextFunction) => Promise<Response<import("../utiles/api-response.utiles.js").ApiSuccessResponse<{
        id: number;
        customerId: number;
        name: string;
        role: string | null;
        email: string | null;
        phone: string | null;
        createdAt: Date;
    }>, Record<string, any>> | undefined>;
    updateContact: (req: Request, res: Response, next: NextFunction) => Promise<Response<import("../utiles/api-response.utiles.js").ApiSuccessResponse<{
        id: number;
        customerId: number;
        name: string;
        role: string | null;
        email: string | null;
        phone: string | null;
        createdAt: Date;
    }>, Record<string, any>> | undefined>;
    deleteContact: (req: Request, res: Response, next: NextFunction) => Promise<Response<import("../utiles/api-response.utiles.js").ApiSuccessResponse<{
        message: string;
    }>, Record<string, any>> | undefined>;
};
//# sourceMappingURL=customer.controller.d.ts.map