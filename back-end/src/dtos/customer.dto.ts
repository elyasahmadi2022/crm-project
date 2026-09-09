import { z } from 'zod';
import {
  type Customer,
  type Contact,
  type Interaction,
  CompanySize,
  CustomerStatus,
  InteractionType,
  ProjectStage,
  type User,
} from '../generated/prisma/index.js';
import { toUserSummaryDto, type UserSummaryDto } from './user.dto.js';

// ---------- Requests ----------

export const createCustomerSchema = z.object({
  companyName: z.string().min(1),
  industry: z.string().optional(),
  size: z.nativeEnum(CompanySize),
  address: z.string().optional(),
  ownerId: z.number().int().positive().optional(),
  originLeadId: z.number().int().positive().optional(),
});
export type CreateCustomerDto = z.infer<typeof createCustomerSchema>;

export const updateCustomerSchema = z.object({
  companyName: z.string().min(1).optional(),
  industry: z.string().optional(),
  size: z.nativeEnum(CompanySize).optional(),
  address: z.string().optional(),
  status: z.nativeEnum(CustomerStatus).optional(),
  ownerId: z.number().int().positive().nullable().optional(),
});
export type UpdateCustomerDto = z.infer<typeof updateCustomerSchema>;

export const listCustomersQuerySchema = z.object({
  status: z.nativeEnum(CustomerStatus).optional(),
  ownerId: z.coerce.number().int().positive().optional(),
});
export type ListCustomersQueryDto = z.infer<typeof listCustomersQuerySchema>;

export const createContactSchema = z.object({
  name: z.string().min(1),
  role: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});
export type CreateContactDto = z.infer<typeof createContactSchema>;

export const updateContactSchema = createContactSchema.partial();
export type UpdateContactDto = z.infer<typeof updateContactSchema>;

export const createInteractionSchema = z.object({
  type: z.nativeEnum(InteractionType),
  content: z.string().min(1),
});
export type CreateInteractionDto = z.infer<typeof createInteractionSchema>;

// ---------- Response ----------

// Minimal shape for embedding (Project.customer, Invoice.customer)
export interface CustomerSummaryDto {
  id: number;
  companyName: string;
  status: CustomerStatus;
}

export const toCustomerSummaryDto = (customer: Customer): CustomerSummaryDto => ({
  id: customer.id,
  companyName: customer.companyName,
  status: customer.status,
});

export interface ContactResponseDto {
  id: number;
  customerId: number;
  name: string;
  role: string | null;
  email: string | null;
  phone: string | null;
  createdAt: Date;
}

export const toContactResponseDto = (contact: Contact): ContactResponseDto => ({
  id: contact.id,
  customerId: contact.customerId,
  name: contact.name,
  role: contact.role,
  email: contact.email,
  phone: contact.phone,
  createdAt: contact.createdAt,
});

export interface InteractionResponseDto {
  id: number;
  customerId: number;
  type: InteractionType;
  content: string;
  author: UserSummaryDto;
  createdAt: Date;
}

export const toInteractionResponseDto = (
  interaction: Interaction & { author: User },
): InteractionResponseDto => ({
  id: interaction.id,
  customerId: interaction.customerId,
  type: interaction.type,
  content: interaction.content,
  author: toUserSummaryDto(interaction.author),
  createdAt: interaction.createdAt,
});

// Full detail — fetch with:
// prisma.customer.findUnique({ where: { id }, include: {
//   owner: true,
//   contacts: { orderBy: { createdAt: 'asc' }, take: 1 },
//   projects: { select: { stage: true } },
//   invoices: { select: { amount: true, status: true, payments: { select: { amount: true } } } },
//   _count: { select: { contacts: true, projects: true, interactions: true } },
// } })
export type CustomerWithDetail = Customer & {
  owner?: User | null;
  originLead?: { name: string; email: string | null; phone: string | null } | null;
  contacts: Contact[]; // first contact only, used as primaryContact
  projects: { stage: ProjectStage }[];
  invoices: { amount: { toString(): string }; status: string; payments: { amount: { toString(): string } }[] }[];
  _count: { contacts: number; projects: number; interactions: number };
};

export interface CustomerResponseDto {
  id: number;
  companyName: string;
  industry: string | null;
  size: CompanySize;
  address: string | null;
  status: CustomerStatus;
  owner: UserSummaryDto | null;
  primaryContact: ContactResponseDto | null;
  originLeadId: number | null;
  originLead: { name: string; email: string | null; phone: string | null } | null;
  stats: {
    contactsCount: number;
    projectsCount: number;
    activeProjectsCount: number; // stage !== LIVE
    interactionsCount: number;
  };
  financials: {
    totalInvoiced: string;
    totalPaid: string;
    outstandingBalance: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export const toCustomerResponseDto = (customer: CustomerWithDetail): CustomerResponseDto => {
  const totalInvoiced = customer.invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
  const totalPaid = customer.invoices.reduce(
    (sum, inv) => sum + inv.payments.reduce((s, p) => s + Number(p.amount), 0),
    0,
  );
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