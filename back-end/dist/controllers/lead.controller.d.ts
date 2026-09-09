import type { Request, Response, NextFunction } from "express";
export declare const leadController: {
    getAll: (req: Request, res: Response, next: NextFunction) => Promise<Response<import("../utiles/api-response.utiles.js").ApiSuccessResponse<import("../dtos/lead.dto.js").LeadResponseDto[]>, Record<string, any>> | undefined>;
    getById: (req: Request, res: Response, next: NextFunction) => Promise<Response<import("../utiles/api-response.utiles.js").ApiSuccessResponse<import("../dtos/lead.dto.js").LeadResponseDto>, Record<string, any>> | undefined>;
    create: (req: Request, res: Response, next: NextFunction) => Promise<Response<import("../utiles/api-response.utiles.js").ApiSuccessResponse<import("../dtos/lead.dto.js").LeadResponseDto>, Record<string, any>> | undefined>;
    update: (req: Request, res: Response, next: NextFunction) => Promise<Response<import("../utiles/api-response.utiles.js").ApiSuccessResponse<import("../dtos/lead.dto.js").LeadResponseDto>, Record<string, any>> | undefined>;
    changeStatus: (req: Request, res: Response, next: NextFunction) => Promise<Response<import("../utiles/api-response.utiles.js").ApiSuccessResponse<import("../dtos/lead.dto.js").LeadResponseDto>, Record<string, any>> | undefined>;
    addNote: (req: Request, res: Response, next: NextFunction) => Promise<Response<import("../utiles/api-response.utiles.js").ApiSuccessResponse<import("../dtos/lead.dto.js").LeadNoteResponseDto>, Record<string, any>> | undefined>;
    convertToCustomer: (req: Request, res: Response, next: NextFunction) => Promise<Response<import("../utiles/api-response.utiles.js").ApiSuccessResponse<import("../dtos/lead.dto.js").LeadResponseDto>, Record<string, any>> | undefined>;
    delete: (req: Request, res: Response, next: NextFunction) => Promise<Response<import("../utiles/api-response.utiles.js").ApiSuccessResponse<{
        success: boolean;
    }>, Record<string, any>> | undefined>;
};
//# sourceMappingURL=lead.controller.d.ts.map