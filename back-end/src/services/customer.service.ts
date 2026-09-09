import { Prisma } from "../generated/prisma/index.js";
import {
    toCustomerResponseDto,
    type CreateCustomerDto,
    type ListCustomersQueryDto,
    type UpdateCustomerDto,
    type CustomerResponseDto,
    type CreateContactDto,
    type UpdateContactDto
} from "../dtos/customer.dto.js";
import { customerRepository } from "../repositories/customer.repository.js";
import { AppError } from "../utiles/error-handler.utiles.js";

export const customerService = {
    async getBaseCustomerById(id: number) {
        const customer = await customerRepository.findById(id);
        if (!customer) throw new AppError(404, "Customer not found.");
        return customer;
    },

    async getCustomerProfile(id: number): Promise<CustomerResponseDto> {
        const customer = await customerRepository.findByIdWithDetails(id);
        if (!customer) throw new AppError(404, "Customer not found.");
        return toCustomerResponseDto(customer);
    },

    async getAllCustomers(filters: ListCustomersQueryDto, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const whereClause: Prisma.CustomerWhereInput = {};
        if (filters.status) whereClause.status = filters.status;
        if (filters.ownerId) whereClause.ownerId = filters.ownerId;

        const [totalItems, customers] = await Promise.all([
            customerRepository.count(whereClause),
            customerRepository.findMany(whereClause, skip, limit)
        ]);

        return {
            customers: customers.map(c => toCustomerResponseDto(c)),
            pagination: { page, limit, total: totalItems, totalPages: Math.ceil(totalItems / limit) }
        };
    },

    async countCustomers(filters: ListCustomersQueryDto): Promise<number> {
        const whereClause: Prisma.CustomerWhereInput = {};
        if (filters.status) whereClause.status = filters.status;
        if (filters.ownerId) whereClause.ownerId = filters.ownerId;
        return customerRepository.count(whereClause);
    },

    async createCustomer(data: CreateCustomerDto): Promise<CustomerResponseDto> {
        const customer = await customerRepository.create(data as Prisma.CustomerCreateInput);
        return toCustomerResponseDto(customer);
    },

    async updateCustomer(id: number, data: UpdateCustomerDto): Promise<CustomerResponseDto> {
        const current = await customerRepository.findById(id);
        if (!current) throw new AppError(404, "Customer not found.");
        const updated = await customerRepository.update(id, data as Prisma.CustomerUpdateInput);
        return toCustomerResponseDto(updated);
    },

    async deleteCustomer(id: number): Promise<{ message: string }> {
        const current = await customerRepository.findById(id);
        if (!current) throw new AppError(404, "Customer not found.");
        await customerRepository.delete(id);
        return { message: "Customer successfully deleted." };
    },

    // --- Contacts ---
    async addContact(customerId: number, data: CreateContactDto) {
        const customer = await customerRepository.findById(customerId);
        if (!customer) throw new AppError(404, "Customer not found.");
        return customerRepository.createContact(customerId, {
            name: data.name,
            ...(data.role !== undefined ? { role: data.role } : {}),
            ...(data.email !== undefined ? { email: data.email } : {}),
            ...(data.phone !== undefined ? { phone: data.phone } : {})
        });
    },

    async updateContact(contactId: number, data: UpdateContactDto) {
        const contact = await customerRepository.findContactById(contactId);
        if (!contact) throw new AppError(404, "Contact not found.");
        return customerRepository.updateContact(contactId, {
            ...(data.name !== undefined ? { name: data.name } : {}),
            ...(data.role !== undefined ? { role: data.role } : {}),
            ...(data.email !== undefined ? { email: data.email } : {}),
            ...(data.phone !== undefined ? { phone: data.phone } : {})
        });
    },

    async deleteContact(contactId: number): Promise<{ message: string }> {
        const contact = await customerRepository.findContactById(contactId);
        if (!contact) throw new AppError(404, "Contact not found.");
        await customerRepository.deleteContact(contactId);
        return { message: "Contact successfully deleted." };
    }
};
