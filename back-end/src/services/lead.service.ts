import { Prisma, LeadStatus, CustomerStatus } from "../generated/prisma/index.js";
import {
    toLeadResponseDto,
    toLeadNoteResponseDto,
    type CreateLeadDto,
    type ListLeadsQueryDto,
    type UpdateLeadDto,
    type LeadResponseDto,
    type CreateLeadNoteDto
} from "../dtos/lead.dto.js";
import { leadRepository } from "../repositories/lead.repository.js";
import { customerRepository } from "../repositories/customer.repository.js";
import { AppError } from "../utiles/error-handler.utiles.js";

export const leadService = {
    async getLeadProfile(id: number): Promise<LeadResponseDto> {
        const lead = await leadRepository.findByIdWithDetails(id);
        if (!lead) throw new AppError(404, "Lead not found.");
        return toLeadResponseDto(lead);
    },

    async getAllLeads(filters: ListLeadsQueryDto, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const whereClause: Prisma.LeadWhereInput = {};

        if (filters.status) whereClause.status = filters.status;

        // By default exclude converted leads (status WON + convertedTo set).
        // Pass includeConverted=true to see them.
        if (!filters.includeConverted) {
            whereClause.convertedTo = { is: null };
        }

        const [totalItems, leads] = await Promise.all([
            leadRepository.count(whereClause),
            leadRepository.findMany(whereClause, skip, limit)
        ]);

        return {
            leads: leads.map(l => toLeadResponseDto(l)),
            pagination: { page, limit, total: totalItems, totalPages: Math.ceil(totalItems / limit) }
        };
    },

    async createLead(data: CreateLeadDto): Promise<LeadResponseDto> {
        const inputData: Prisma.LeadCreateInput = {
            name:        data.name,
            email:       data.email?.trim() || null,
            phone:       data.phone?.trim()  || null,
            companyName: data.companyName,
            companySize: data.companySize,
            message:     data.message,
            status:      LeadStatus.NEW,
        };

        const lead = await leadRepository.create(inputData);
        return toLeadResponseDto(lead);
    },

    async updateLead(id: number, data: UpdateLeadDto): Promise<LeadResponseDto> {
        const current = await leadRepository.findById(id);
        if (!current) throw new AppError(404, "Lead not found.");
        const updated = await leadRepository.update(id, data as Prisma.LeadUpdateInput);
        return toLeadResponseDto(updated);
    },

    async changeStatus(id: number, newStatus: LeadStatus, userId: number): Promise<LeadResponseDto> {
        const current = await leadRepository.findById(id);
        if (!current) throw new AppError(404, "Lead not found.");
        if (current.status === newStatus) return this.getLeadProfile(id);

        const [updatedLead] = await Promise.all([
            leadRepository.update(id, { status: newStatus }),
            leadRepository.logStatusChange(id, current.status, newStatus, userId)
        ]);

        return toLeadResponseDto(updatedLead);
    },

    async addNote(id: number, data: CreateLeadNoteDto, userId: number) {
        const current = await leadRepository.findById(id);
        if (!current) throw new AppError(404, "Lead not found.");
        const note = await leadRepository.createNote(id, userId, data.content);
        return toLeadNoteResponseDto(note);
    },

    async deleteLead(id: number): Promise<{ message: string }> {
        const current = await leadRepository.findById(id);
        if (!current) throw new AppError(404, "Lead not found.");
        await leadRepository.delete(id);
        return { message: "Lead successfully removed." };
    },

    /**
     * Convert a WON lead into a Customer record.
     * - Marks lead status = WON
     * - Creates Customer linked via originLeadId
     * - Returns the updated LeadResponseDto (not the raw Customer)
     *   so the frontend cache can update correctly.
     */
    async convertToCustomer(leadId: number, ownerId?: number): Promise<LeadResponseDto> {
        const lead = await leadRepository.findByIdWithDetails(leadId);
        if (!lead) throw new AppError(404, "Lead not found.");
        if (lead.convertedTo) throw new AppError(409, "This lead has already been converted to a customer.");

        // Mark as WON first (status log runs in parallel)
        if (lead.status !== LeadStatus.WON) {
            await Promise.all([
                leadRepository.update(leadId, { status: LeadStatus.WON }),
                leadRepository.logStatusChange(leadId, lead.status, LeadStatus.WON, ownerId ?? 0)
            ]);
        }

        // Create the customer — the originLead connect sets Lead.convertedTo
        await customerRepository.create({
            companyName: lead.companyName,
            size:        lead.companySize,
            status:      CustomerStatus.ACTIVE,
            originLead:  { connect: { id: leadId } },
            ...(ownerId ? { owner: { connect: { id: ownerId } } } : {})
        } as Prisma.CustomerCreateInput);

        // Return the updated lead (now has convertedTo set)
        return this.getLeadProfile(leadId);
    }
};
