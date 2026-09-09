import type { Request, Response, NextFunction } from 'express';
export declare const companyController: {
    get: (_req: Request, res: Response, next: NextFunction) => Promise<Response<import("../utiles/api-response.utiles.js").ApiSuccessResponse<import("../dtos/company.dto.js").CompanySettingsResponseDto>, Record<string, any>> | undefined>;
    update: (req: Request, res: Response, next: NextFunction) => Promise<Response<import("../utiles/api-response.utiles.js").ApiSuccessResponse<import("../dtos/company.dto.js").CompanySettingsResponseDto>, Record<string, any>> | undefined>;
    uploadLogo: (req: Request, res: Response, next: NextFunction) => Promise<Response<import("../utiles/api-response.utiles.js").ApiSuccessResponse<import("../dtos/company.dto.js").CompanySettingsResponseDto>, Record<string, any>> | undefined>;
    deleteLogo: (req: Request, res: Response, next: NextFunction) => Promise<Response<import("../utiles/api-response.utiles.js").ApiSuccessResponse<import("../dtos/company.dto.js").CompanySettingsResponseDto>, Record<string, any>> | undefined>;
};
export declare const contractTemplateController: {
    getAll: (_req: Request, res: Response, next: NextFunction) => Promise<Response<import("../utiles/api-response.utiles.js").ApiSuccessResponse<import("../dtos/company.dto.js").ContractTemplateResponseDto[]>, Record<string, any>> | undefined>;
    getDefault: (_req: Request, res: Response, next: NextFunction) => Promise<Response<import("../utiles/api-response.utiles.js").ApiSuccessResponse<import("../dtos/company.dto.js").ContractTemplateResponseDto | null>, Record<string, any>> | undefined>;
    getById: (req: Request, res: Response, next: NextFunction) => Promise<Response<import("../utiles/api-response.utiles.js").ApiSuccessResponse<import("../dtos/company.dto.js").ContractTemplateResponseDto>, Record<string, any>> | undefined>;
    create: (req: Request, res: Response, next: NextFunction) => Promise<Response<import("../utiles/api-response.utiles.js").ApiSuccessResponse<import("../dtos/company.dto.js").ContractTemplateResponseDto>, Record<string, any>> | undefined>;
    update: (req: Request, res: Response, next: NextFunction) => Promise<Response<import("../utiles/api-response.utiles.js").ApiSuccessResponse<import("../dtos/company.dto.js").ContractTemplateResponseDto>, Record<string, any>> | undefined>;
    setDefault: (req: Request, res: Response, next: NextFunction) => Promise<Response<import("../utiles/api-response.utiles.js").ApiSuccessResponse<import("../dtos/company.dto.js").ContractTemplateResponseDto>, Record<string, any>> | undefined>;
    delete: (req: Request, res: Response, next: NextFunction) => Promise<Response<import("../utiles/api-response.utiles.js").ApiSuccessResponse<{
        success: boolean;
    }>, Record<string, any>> | undefined>;
    /** PATCH /templates/:id/layout — saves the canvas JSON blob only */
    saveLayout: (req: Request, res: Response, next: NextFunction) => Promise<Response<import("../utiles/api-response.utiles.js").ApiSuccessResponse<import("../dtos/company.dto.js").ContractTemplateResponseDto>, Record<string, any>> | undefined>;
};
//# sourceMappingURL=company.controller.d.ts.map