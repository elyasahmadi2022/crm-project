import { type CreateCampaignDto, type ListCampaignsQueryDto, type UpdateCampaignDto, type CampaignResponseDto } from "../dtos/marketing.dto.js";
export declare const marketingService: {
    getCampaignProfile(id: number): Promise<CampaignResponseDto>;
    getAllCampaigns(filters: ListCampaignsQueryDto, page?: number, limit?: number): Promise<{
        campaigns: CampaignResponseDto[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    createCampaign(data: CreateCampaignDto): Promise<CampaignResponseDto>;
    updateCampaign(id: number, data: UpdateCampaignDto): Promise<CampaignResponseDto>;
    deleteCampaign(id: number): Promise<{
        message: string;
    }>;
};
//# sourceMappingURL=marketing.service.d.ts.map