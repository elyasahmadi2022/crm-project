import { LeadStatus } from "../generated/prisma/index.js";
import { type CreateLeadDto, type ListLeadsQueryDto, type UpdateLeadDto, type LeadResponseDto, type CreateLeadNoteDto } from "../dtos/lead.dto.js";
export declare const leadService: {
    getLeadProfile(id: number): Promise<LeadResponseDto>;
    getAllLeads(filters: ListLeadsQueryDto, page?: number, limit?: number): Promise<{
        leads: LeadResponseDto[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    createLead(data: CreateLeadDto): Promise<LeadResponseDto>;
    updateLead(id: number, data: UpdateLeadDto): Promise<LeadResponseDto>;
    changeStatus(id: number, newStatus: LeadStatus, userId: number): Promise<LeadResponseDto>;
    addNote(id: number, data: CreateLeadNoteDto, userId: number): Promise<import("../dtos/lead.dto.js").LeadNoteResponseDto>;
    deleteLead(id: number): Promise<{
        message: string;
    }>;
    /**
     * Convert a WON lead into a Customer record.
     * - Marks lead status = WON
     * - Creates Customer linked via originLeadId
     * - Returns the updated LeadResponseDto (not the raw Customer)
     *   so the frontend cache can update correctly.
     */
    convertToCustomer(leadId: number, ownerId?: number): Promise<LeadResponseDto>;
};
//# sourceMappingURL=lead.service.d.ts.map