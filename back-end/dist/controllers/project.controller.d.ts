import type { Request, Response, NextFunction } from "express";
export declare const projectController: {
    getAll: (req: Request, res: Response, next: NextFunction) => Promise<Response<import("../utiles/api-response.utiles.js").ApiSuccessResponse<import("../dtos/project.dto.js").ProjectResponseDto[]>, Record<string, any>> | undefined>;
    getById: (req: Request, res: Response, next: NextFunction) => Promise<Response<import("../utiles/api-response.utiles.js").ApiSuccessResponse<import("../dtos/project.dto.js").ProjectResponseDto>, Record<string, any>> | undefined>;
    create: (req: Request, res: Response, next: NextFunction) => Promise<Response<import("../utiles/api-response.utiles.js").ApiSuccessResponse<import("../dtos/project.dto.js").ProjectResponseDto>, Record<string, any>> | undefined>;
    update: (req: Request, res: Response, next: NextFunction) => Promise<Response<import("../utiles/api-response.utiles.js").ApiSuccessResponse<import("../dtos/project.dto.js").ProjectResponseDto>, Record<string, any>> | undefined>;
    changeStage: (req: Request, res: Response, next: NextFunction) => Promise<Response<import("../utiles/api-response.utiles.js").ApiSuccessResponse<import("../dtos/project.dto.js").ProjectResponseDto>, Record<string, any>> | undefined>;
    addMilestone: (req: Request, res: Response, next: NextFunction) => Promise<Response<import("../utiles/api-response.utiles.js").ApiSuccessResponse<import("../dtos/project.dto.js").MilestoneResponseDto>, Record<string, any>> | undefined>;
    updateMilestone: (req: Request, res: Response, next: NextFunction) => Promise<Response<import("../utiles/api-response.utiles.js").ApiSuccessResponse<import("../dtos/project.dto.js").MilestoneResponseDto>, Record<string, any>> | undefined>;
    assignTeamMember: (req: Request, res: Response, next: NextFunction) => Promise<Response<import("../utiles/api-response.utiles.js").ApiSuccessResponse<import("../dtos/project.dto.js").ProjectAssignmentResponseDto>, Record<string, any>> | undefined>;
    unassignTeamMember: (req: Request, res: Response, next: NextFunction) => Promise<Response<import("../utiles/api-response.utiles.js").ApiSuccessResponse<{
        message: string;
    }>, Record<string, any>> | undefined>;
    deleteProject: (req: Request, res: Response, next: NextFunction) => Promise<Response<import("../utiles/api-response.utiles.js").ApiSuccessResponse<{
        success: boolean;
    }>, Record<string, any>> | undefined>;
};
//# sourceMappingURL=project.controller.d.ts.map