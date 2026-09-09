import type { Request, Response, NextFunction } from "express";
import {
    createCampaignSchema,
    updateCampaignSchema,
    listCampaignsQuerySchema
} from "../dtos/marketing.dto.js";
import { paginationSchema } from "../dtos/common.dto.js";
import { marketingService } from "../services/marketing.service.js";
import { sendPaginated, sendSuccess } from "../utiles/api-response.utiles.js";

export const marketingController = {
    getAll: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const filters = listCampaignsQuerySchema.parse(req.query);
            const { page, limit } = paginationSchema.parse(req.query);
            
            const { campaigns, pagination } = await marketingService.getAllCampaigns(filters, page, limit);
            return sendPaginated(res, campaigns, pagination.page, pagination.limit, pagination.total);
        } catch (error) {
            next(error);
        }
    },

    getById: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = parseInt(req.params.id as string, 10);
            const campaign = await marketingService.getCampaignProfile(id);
            return sendSuccess(res, campaign);
        } catch (error) {
            next(error);
        }
    },

    create: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const validatedData = createCampaignSchema.parse(req.body);
            const newCampaign = await marketingService.createCampaign(validatedData);
            return sendSuccess(res, newCampaign, 201);
        } catch (error) {
            next(error);
        }
    },

    update: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = parseInt(req.params.id as string, 10);
            const validatedData = updateCampaignSchema.parse(req.body);
            const updatedCampaign = await marketingService.updateCampaign(id, validatedData);
            return sendSuccess(res, updatedCampaign);
        } catch (error) {
            next(error);
        }
    },

    delete: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = parseInt(req.params.id as string, 10);
            await marketingService.deleteCampaign(id);
            return sendSuccess(res, { success: true }, 200);
        } catch (error) {
            next(error);
        }
    }
};
