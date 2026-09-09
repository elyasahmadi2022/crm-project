import type { Request, Response, NextFunction } from "express";
import {
    createCustomerSchema,
    updateCustomerSchema,
    listCustomersQuerySchema,
    createContactSchema,
    updateContactSchema
} from "../dtos/customer.dto.js";
import { paginationSchema } from "../dtos/common.dto.js";
import { customerService } from "../services/customer.service.js";
import { sendPaginated, sendSuccess } from "../utiles/api-response.utiles.js";

const parseId = (param: string | string[] | undefined): number => parseInt(Array.isArray(param) ? (param[0] ?? "0") : (param ?? "0"), 10);

export const customerController = {
    getAll: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const filters = listCustomersQuerySchema.parse(req.query);
            const { page, limit } = paginationSchema.parse(req.query);
            const { customers, pagination } = await customerService.getAllCustomers(filters, page, limit);
            return sendPaginated(res, customers, pagination.page, pagination.limit, pagination.total);
        } catch (error) { next(error); }
    },

    getById: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = parseId(req.params.id);
            const customer = await customerService.getCustomerProfile(id);
            return sendSuccess(res, customer);
        } catch (error) { next(error); }
    },

    create: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const validatedData = createCustomerSchema.parse(req.body);
            const newCustomer = await customerService.createCustomer(validatedData);
            return sendSuccess(res, newCustomer, 201);
        } catch (error) { next(error); }
    },

    update: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = parseId(req.params.id);
            const validatedData = updateCustomerSchema.parse(req.body);
            const updatedCustomer = await customerService.updateCustomer(id, validatedData);
            return sendSuccess(res, updatedCustomer);
        } catch (error) { next(error); }
    },

    delete: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = parseId(req.params.id);
            await customerService.deleteCustomer(id);
            return sendSuccess(res, { success: true });
        } catch (error) { next(error); }
    },

    // --- Contacts ---
    addContact: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const customerId = parseId(req.params.id);
            const data = createContactSchema.parse(req.body);
            const contact = await customerService.addContact(customerId, data);
            return sendSuccess(res, contact, 201);
        } catch (error) { next(error); }
    },

    updateContact: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const contactId = parseId(req.params.contactId);
            const data = updateContactSchema.parse(req.body);
            const contact = await customerService.updateContact(contactId, data);
            return sendSuccess(res, contact);
        } catch (error) { next(error); }
    },

    deleteContact: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const contactId = parseId(req.params.contactId);
            const result = await customerService.deleteContact(contactId);
            return sendSuccess(res, result);
        } catch (error) { next(error); }
    }
};
