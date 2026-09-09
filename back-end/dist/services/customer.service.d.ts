import { type CreateCustomerDto, type ListCustomersQueryDto, type UpdateCustomerDto, type CustomerResponseDto, type CreateContactDto, type UpdateContactDto } from "../dtos/customer.dto.js";
export declare const customerService: {
    getBaseCustomerById(id: number): Promise<{
        id: number;
        companyName: string;
        industry: string | null;
        size: import("../generated/prisma/index.js").$Enums.CompanySize;
        address: string | null;
        status: import("../generated/prisma/index.js").$Enums.CustomerStatus;
        ownerId: number | null;
        originLeadId: number | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getCustomerProfile(id: number): Promise<CustomerResponseDto>;
    getAllCustomers(filters: ListCustomersQueryDto, page?: number, limit?: number): Promise<{
        customers: CustomerResponseDto[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    countCustomers(filters: ListCustomersQueryDto): Promise<number>;
    createCustomer(data: CreateCustomerDto): Promise<CustomerResponseDto>;
    updateCustomer(id: number, data: UpdateCustomerDto): Promise<CustomerResponseDto>;
    deleteCustomer(id: number): Promise<{
        message: string;
    }>;
    addContact(customerId: number, data: CreateContactDto): Promise<{
        id: number;
        customerId: number;
        name: string;
        role: string | null;
        email: string | null;
        phone: string | null;
        createdAt: Date;
    }>;
    updateContact(contactId: number, data: UpdateContactDto): Promise<{
        id: number;
        customerId: number;
        name: string;
        role: string | null;
        email: string | null;
        phone: string | null;
        createdAt: Date;
    }>;
    deleteContact(contactId: number): Promise<{
        message: string;
    }>;
};
//# sourceMappingURL=customer.service.d.ts.map