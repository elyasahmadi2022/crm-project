import type { Request, Response, NextFunction } from "express";
export declare const marketingController: {
    getAll: (req: Request, res: Response, next: NextFunction) => Promise<Response<import("../utiles/api-response.utiles.js").ApiSuccessResponse<import("../dtos/marketing.dto.js").CampaignResponseDto[]>, Record<string, any>> | undefined>;
    getById: (req: Request, res: Response, next: NextFunction) => Promise<Response<import("../utiles/api-response.utiles.js").ApiSuccessResponse<import("../dtos/marketing.dto.js").CampaignResponseDto>, Record<string, any>> | undefined>;
    create: (req: Request, res: Response, next: NextFunction) => Promise<Response<import("../utiles/api-response.utiles.js").ApiSuccessResponse<import("../dtos/marketing.dto.js").CampaignResponseDto>, Record<string, any>> | undefined>;
    update: (req: Request, res: Response, next: NextFunction) => Promise<Response<import("../utiles/api-response.utiles.js").ApiSuccessResponse<import("../dtos/marketing.dto.js").CampaignResponseDto>, Record<string, any>> | undefined>;
    delete: (req: Request, res: Response, next: NextFunction) => Promise<Response<import("../utiles/api-response.utiles.js").ApiSuccessResponse<{
        success: boolean;
    }>, Record<string, any>> | undefined>;
};
//# sourceMappingURL=marketing.controller.d.ts.map