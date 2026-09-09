import { Prisma, CampaignStatus } from "../generated/prisma/index.js";
import { toCampaignResponseDto } from "../dtos/marketing.dto.js";
import { marketingRepository } from "../repositories/marketing.repository.js";
import { AppError } from "../utiles/error-handler.utiles.js";
export const marketingService = {
    async getCampaignProfile(id) {
        const campaign = await marketingRepository.findByIdWithStats(id);
        if (!campaign)
            throw new AppError(404, "Campaign not found.");
        return toCampaignResponseDto(campaign);
    },
    async getAllCampaigns(filters, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const whereClause = {};
        if (filters.status)
            whereClause.status = filters.status;
        const [totalItems, campaigns] = await Promise.all([
            marketingRepository.count(whereClause),
            marketingRepository.findMany(whereClause, skip, limit)
        ]);
        return {
            campaigns: campaigns.map(c => toCampaignResponseDto(c)),
            pagination: { page, limit, total: totalItems, totalPages: Math.ceil(totalItems / limit) }
        };
    },
    async createCampaign(data) {
        const inputData = {
            name: data.name,
            channel: data.channel || null,
            budget: data.budget || null,
            startDate: data.startDate || null,
            endDate: data.endDate || null,
            status: CampaignStatus.PLANNED
        };
        const campaign = await marketingRepository.create(inputData);
        return toCampaignResponseDto(campaign);
    },
    async updateCampaign(id, data) {
        const current = await marketingRepository.findById(id);
        if (!current)
            throw new AppError(404, "Campaign not found.");
        const campaign = await marketingRepository.update(id, data);
        return toCampaignResponseDto(campaign);
    },
    async deleteCampaign(id) {
        const current = await marketingRepository.findById(id);
        if (!current)
            throw new AppError(404, "Campaign not found.");
        await marketingRepository.delete(id);
        return { message: "Campaign successfully removed." };
    }
};
//# sourceMappingURL=marketing.service.js.map