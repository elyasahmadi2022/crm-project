import { z } from 'zod';
import { CompanySize, CustomerStatus, InteractionType, ProjectStage, } from '../generated/prisma/index.js';
import { toUserSummaryDto } from './user.dto.js';
// ---------- Requests ----------
export const createCustomerSchema = z.object({
    companyName: z.string().min(1),
    industry: z.string().optional(),
    size: z.nativeEnum(CompanySize),
    address: z.string().optional(),
    ownerId: z.number().int().positive().optional(),
    originLeadId: z.number().int().positive().optional(),
});
export const updateCustomerSchema = z.object({
    companyName: z.string().min(1).optional(),
    industry: z.string().optional(),
    size: z.nativeEnum(CompanySize).optional(),
    address: z.string().optional(),
    status: z.nativeEnum(CustomerStatus).optional(),
    ownerId: z.number().int().positive().nullable().optional(),
});
export const listCustomersQuerySchema = z.object({
    status: z.nativeEnum(CustomerStatus).optional(),
    ownerId: z.coerce.number().int().positive().optional(),
});
export const createContactSchema = z.object({
    name: z.string().min(1),
    role: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
});
export const updateContactSchema = createContactSchema.partial();
export const createInteractionSchema = z.object({
    type: z.nativeEnum(InteractionType),
    content: z.string().min(1),
});
export const toCustomerSummaryDto = (customer) => ({
    id: customer.id,
    companyName: customer.companyName,
    status: customer.status,
});
export const toContactResponseDto = (contact) => ({
    id: contact.id,
    customerId: contact.customerId,
    name: contact.name,
    role: contact.role,
    email: contact.email,
    phone: contact.phone,
    createdAt: contact.createdAt,
});
export const toInteractionResponseDto = (interaction) => ({
    id: interaction.id,
    customerId: interaction.customerId,
    type: interaction.type,
    content: interaction.content,
    author: toUserSummaryDto(interaction.author),
    createdAt: interaction.createdAt,
});
export const toCustomerResponseDto = (customer) => {
    const totalInvoiced = customer.invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
    const totalPaid = customer.invoices.reduce((sum, inv) => sum + inv.payments.reduce((s, p) => s + Number(p.amount), 0), 0);
    const primaryContact = customer.contacts[0] ?? null;
    return {
        id: customer.id,
        companyName: customer.companyName,
        industry: customer.industry,
        size: customer.size,
        address: customer.address,
        status: customer.status,
        owner: customer.owner ? toUserSummaryDto(customer.owner) : null,
        primaryContact: primaryContact ? toContactResponseDto(primaryContact) : null,
        originLeadId: customer.originLeadId,
        originLead: customer.originLead
            ? { name: customer.originLead.name, email: customer.originLead.email, phone: customer.originLead.phone }
            : null,
        stats: {
            contactsCount: customer._count.contacts,
            projectsCount: customer._count.projects,
            activeProjectsCount: customer.projects.filter((p) => p.stage !== 'LIVE').length,
            interactionsCount: customer._count.interactions,
        },
        financials: {
            totalInvoiced: totalInvoiced.toFixed(2),
            totalPaid: totalPaid.toFixed(2),
            outstandingBalance: (totalInvoiced - totalPaid).toFixed(2),
        },
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
    };
};
//# sourceMappingURL=customer.dto.js.map