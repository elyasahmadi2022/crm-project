import { z } from 'zod';
import { toUserSummaryDto } from './user.dto.js';
import { toCustomerSummaryDto } from './customer.dto.js';
// ---------- Requests ----------
export const createContractSchema = z.object({
    customerId: z.number().int().positive(),
    // Invoice meta
    invoiceDate: z.string().optional(),
    invoiceNumber: z.string().optional(),
    orderId: z.string().optional(),
    activationLimit: z.string().optional(),
    activationProcess: z.string().optional(),
    paymentTerms: z.string().optional(),
    // Project / cost
    projectDescription: z.string().min(1, 'Project description is required.'),
    projectDescLine: z.string().optional(),
    lineItemCost: z.coerce.number().min(0).default(0),
    taxPercent: z.coerce.number().min(0).max(100).default(0),
    // Terms
    termsAndConditions: z.string().min(1, 'Terms and conditions are required.'),
    // Signature
    signedByName: z.string().optional(),
    signedAt: z.string().optional(),
    status: z.enum(['DRAFT', 'SENT', 'SIGNED', 'CANCELLED']).optional(),
});
export const updateContractSchema = createContractSchema
    .omit({ customerId: true })
    .partial();
export const listContractsQuerySchema = z.object({
    customerId: z.coerce.number().int().positive().optional(),
    status: z.enum(['DRAFT', 'SENT', 'SIGNED', 'CANCELLED']).optional(),
});
function computeTotals(lineItemCost, taxPercent) {
    const total = lineItemCost;
    const gross = total + total * (taxPercent / 100);
    return { total, gross };
}
export const toContractResponseDto = (c) => {
    const lineItemCost = Number(c.lineItemCost);
    const taxPercent = Number(c.taxPercent);
    const { total, gross } = computeTotals(lineItemCost, taxPercent);
    return {
        id: c.id,
        customer: toCustomerSummaryDto(c.customer),
        createdBy: toUserSummaryDto(c.createdBy),
        invoiceDate: c.invoiceDate ? c.invoiceDate.toISOString().split('T')[0] : null,
        invoiceNumber: c.invoiceNumber,
        orderId: c.orderId,
        activationLimit: c.activationLimit,
        activationProcess: c.activationProcess,
        paymentTerms: c.paymentTerms,
        projectDescription: c.projectDescription,
        projectDescLine: c.projectDescLine,
        lineItemCost: lineItemCost.toFixed(2),
        taxPercent: taxPercent.toFixed(2),
        totalAmount: total.toFixed(2),
        grossTotal: gross.toFixed(2),
        termsAndConditions: c.termsAndConditions,
        signedByName: c.signedByName,
        signedAt: c.signedAt ? c.signedAt.toISOString() : null,
        status: c.status,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
    };
};
//# sourceMappingURL=contract.dto.js.map