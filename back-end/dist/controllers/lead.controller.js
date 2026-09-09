import { createLeadSchema, updateLeadSchema, listLeadsQuerySchema, changeLeadStatusSchema, createLeadNoteSchema } from "../dtos/lead.dto.js";
import { paginationSchema } from "../dtos/common.dto.js";
import { leadService } from "../services/lead.service.js";
import { sendPaginated, sendSuccess } from "../utiles/api-response.utiles.js";
const parseId = (param) => parseInt(Array.isArray(param) ? (param[0] ?? "0") : (param ?? "0"), 10);
export const leadController = {
    getAll: async (req, res, next) => {
        try {
            const filters = listLeadsQuerySchema.parse(req.query);
            const { page, limit } = paginationSchema.parse(req.query);
            const { leads, pagination } = await leadService.getAllLeads(filters, page, limit);
            return sendPaginated(res, leads, pagination.page, pagination.limit, pagination.total);
        }
        catch (error) {
            next(error);
        }
    },
    getById: async (req, res, next) => {
        try {
            const id = parseId(req.params.id);
            const lead = await leadService.getLeadProfile(id);
            return sendSuccess(res, lead);
        }
        catch (error) {
            next(error);
        }
    },
    create: async (req, res, next) => {
        try {
            const validatedData = createLeadSchema.parse(req.body);
            const newLead = await leadService.createLead(validatedData);
            return sendSuccess(res, newLead, 201);
        }
        catch (error) {
            next(error);
        }
    },
    update: async (req, res, next) => {
        try {
            const id = parseId(req.params.id);
            const validatedData = updateLeadSchema.parse(req.body);
            const updatedLead = await leadService.updateLead(id, validatedData);
            return sendSuccess(res, updatedLead);
        }
        catch (error) {
            next(error);
        }
    },
    changeStatus: async (req, res, next) => {
        try {
            const id = parseId(req.params.id);
            const { newStatus } = changeLeadStatusSchema.parse(req.body);
            const userId = req.user.id;
            const updatedLead = await leadService.changeStatus(id, newStatus, userId);
            return sendSuccess(res, updatedLead);
        }
        catch (error) {
            next(error);
        }
    },
    addNote: async (req, res, next) => {
        try {
            const id = parseId(req.params.id);
            const validatedData = createLeadNoteSchema.parse(req.body);
            const userId = req.user.id;
            const newNote = await leadService.addNote(id, validatedData, userId);
            return sendSuccess(res, newNote, 201);
        }
        catch (error) {
            next(error);
        }
    },
    convertToCustomer: async (req, res, next) => {
        try {
            const leadId = parseId(req.params.id);
            const ownerId = req.user.id;
            const updatedLead = await leadService.convertToCustomer(leadId, ownerId);
            return sendSuccess(res, updatedLead);
        }
        catch (error) {
            next(error);
        }
    },
    delete: async (req, res, next) => {
        try {
            const id = parseId(req.params.id);
            await leadService.deleteLead(id);
            return sendSuccess(res, { success: true });
        }
        catch (error) {
            next(error);
        }
    }
};
//# sourceMappingURL=lead.controller.js.map