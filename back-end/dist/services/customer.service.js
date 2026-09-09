import { Prisma } from "../generated/prisma/index.js";
import { toCustomerResponseDto } from "../dtos/customer.dto.js";
import { customerRepository } from "../repositories/customer.repository.js";
import { AppError } from "../utiles/error-handler.utiles.js";
export const customerService = {
    async getBaseCustomerById(id) {
        const customer = await customerRepository.findById(id);
        if (!customer)
            throw new AppError(404, "Customer not found.");
        return customer;
    },
    async getCustomerProfile(id) {
        const customer = await customerRepository.findByIdWithDetails(id);
        if (!customer)
            throw new AppError(404, "Customer not found.");
        return toCustomerResponseDto(customer);
    },
    async getAllCustomers(filters, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const whereClause = {};
        if (filters.status)
            whereClause.status = filters.status;
        if (filters.ownerId)
            whereClause.ownerId = filters.ownerId;
        const [totalItems, customers] = await Promise.all([
            customerRepository.count(whereClause),
            customerRepository.findMany(whereClause, skip, limit)
        ]);
        return {
            customers: customers.map(c => toCustomerResponseDto(c)),
            pagination: { page, limit, total: totalItems, totalPages: Math.ceil(totalItems / limit) }
        };
    },
    async countCustomers(filters) {
        const whereClause = {};
        if (filters.status)
            whereClause.status = filters.status;
        if (filters.ownerId)
            whereClause.ownerId = filters.ownerId;
        return customerRepository.count(whereClause);
    },
    async createCustomer(data) {
        const customer = await customerRepository.create(data);
        return toCustomerResponseDto(customer);
    },
    async updateCustomer(id, data) {
        const current = await customerRepository.findById(id);
        if (!current)
            throw new AppError(404, "Customer not found.");
        const updated = await customerRepository.update(id, data);
        return toCustomerResponseDto(updated);
    },
    async deleteCustomer(id) {
        const current = await customerRepository.findById(id);
        if (!current)
            throw new AppError(404, "Customer not found.");
        await customerRepository.delete(id);
        return { message: "Customer successfully deleted." };
    },
    // --- Contacts ---
    async addContact(customerId, data) {
        const customer = await customerRepository.findById(customerId);
        if (!customer)
            throw new AppError(404, "Customer not found.");
        return customerRepository.createContact(customerId, {
            name: data.name,
            ...(data.role !== undefined ? { role: data.role } : {}),
            ...(data.email !== undefined ? { email: data.email } : {}),
            ...(data.phone !== undefined ? { phone: data.phone } : {})
        });
    },
    async updateContact(contactId, data) {
        const contact = await customerRepository.findContactById(contactId);
        if (!contact)
            throw new AppError(404, "Contact not found.");
        return customerRepository.updateContact(contactId, {
            ...(data.name !== undefined ? { name: data.name } : {}),
            ...(data.role !== undefined ? { role: data.role } : {}),
            ...(data.email !== undefined ? { email: data.email } : {}),
            ...(data.phone !== undefined ? { phone: data.phone } : {})
        });
    },
    async deleteContact(contactId) {
        const contact = await customerRepository.findContactById(contactId);
        if (!contact)
            throw new AppError(404, "Contact not found.");
        await customerRepository.deleteContact(contactId);
        return { message: "Contact successfully deleted." };
    }
};
//# sourceMappingURL=customer.service.js.map