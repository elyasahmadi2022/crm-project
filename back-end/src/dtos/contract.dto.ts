import { z } from 'zod';
import type { Contract, User, Customer, ContractStatus } from '../generated/prisma/index.js';
import { toUserSummaryDto, type UserSummaryDto } from './user.dto.js';
import { toCustomerSummaryDto, type CustomerSummaryDto } from './customer.dto.js';

// ---------- Requests ----------

export const createContractSchema = z.object({
  customerId: z.number().int().positive(),

  // Invoice meta
  invoiceDate:       z.string().optional(),
  invoiceNumber:     z.string().optional(),
  orderId:           z.string().optional(),
  activationLimit:   z.string().optional(),
  activationProcess: z.string().optional(),
  paymentTerms:      z.string().optional(),

  // Project / cost
  projectDescription: z.string().min(1, 'Project description is required.'),
  projectDescLine:    z.string().optional(),
  lineItemCost:       z.coerce.number().min(0).default(0),
  taxPercent:         z.coerce.number().min(0).max(100).default(0),

  // Terms
  termsAndConditions: z.string().min(1, 'Terms and conditions are required.'),

  // Signature
  signedByName: z.string().optional(),
  signedAt:     z.string().optional(),

  status: z.enum(['DRAFT', 'SENT', 'SIGNED', 'CANCELLED'] as const).optional(),
});
export type CreateContractDto = z.infer<typeof createContractSchema>;

export const updateContractSchema = createContractSchema
  .omit({ customerId: true })
  .partial();
export type UpdateContractDto = z.infer<typeof updateContractSchema>;

export const listContractsQuerySchema = z.object({
  customerId: z.coerce.number().int().positive().optional(),
  status:     z.enum(['DRAFT', 'SENT', 'SIGNED', 'CANCELLED'] as const).optional(),
});
export type ListContractsQueryDto = z.infer<typeof listContractsQuerySchema>;

// ---------- Response ----------

export interface ContractResponseDto {
  id: number;
  customer: CustomerSummaryDto;
  createdBy: UserSummaryDto;

  invoiceDate:       string | null;
  invoiceNumber:     string | null;
  orderId:           string | null;
  activationLimit:   string | null;
  activationProcess: string | null;
  paymentTerms:      string | null;

  projectDescription: string;
  projectDescLine:    string | null;
  lineItemCost:       string;
  taxPercent:         string;
  totalAmount:        string;
  grossTotal:         string;

  termsAndConditions: string;

  signedByName: string | null;
  signedAt:     string | null;

  status:    ContractStatus;
  createdAt: string;
  updatedAt: string;
}

export type ContractWithRelations = Contract & {
  customer: Customer;
  createdBy: User;
};

function computeTotals(lineItemCost: number, taxPercent: number) {
  const total = lineItemCost;
  const gross = total + total * (taxPercent / 100);
  return { total, gross };
}

export const toContractResponseDto = (c: ContractWithRelations): ContractResponseDto => {
  const lineItemCost = Number(c.lineItemCost);
  const taxPercent   = Number(c.taxPercent);
  const { total, gross } = computeTotals(lineItemCost, taxPercent);

  return {
    id:       c.id,
    customer: toCustomerSummaryDto(c.customer),
    createdBy: toUserSummaryDto(c.createdBy),

    invoiceDate:       c.invoiceDate ? c.invoiceDate.toISOString().split('T')[0]! : null,
    invoiceNumber:     c.invoiceNumber,
    orderId:           c.orderId,
    activationLimit:   c.activationLimit,
    activationProcess: c.activationProcess,
    paymentTerms:      c.paymentTerms,

    projectDescription: c.projectDescription,
    projectDescLine:    c.projectDescLine,
    lineItemCost:       lineItemCost.toFixed(2),
    taxPercent:         taxPercent.toFixed(2),
    totalAmount:        total.toFixed(2),
    grossTotal:         gross.toFixed(2),

    termsAndConditions: c.termsAndConditions,

    signedByName: c.signedByName,
    signedAt:     c.signedAt ? c.signedAt.toISOString() : null,

    status:    c.status,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
};
