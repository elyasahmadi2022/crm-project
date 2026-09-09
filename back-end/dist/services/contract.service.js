import { Prisma } from '../generated/prisma/index.js';
import { toContractResponseDto, } from '../dtos/contract.dto.js';
import { contractRepository } from '../repositories/contract.repository.js';
import { customerRepository } from '../repositories/customer.repository.js';
import { AppError } from '../utiles/error-handler.utiles.js';
export const contractService = {
    async getAll(filters, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const where = {};
        if (filters.customerId)
            where.customerId = filters.customerId;
        if (filters.status)
            where.status = filters.status;
        const [total, contracts] = await Promise.all([
            contractRepository.count(where),
            contractRepository.findMany(where, skip, limit),
        ]);
        return {
            contracts: contracts.map(toContractResponseDto),
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    },
    async getById(id) {
        const contract = await contractRepository.findById(id);
        if (!contract)
            throw new AppError(404, 'Contract not found.');
        return toContractResponseDto(contract);
    },
    async create(dto, createdById) {
        // Verify customer exists
        const customer = await customerRepository.findById(dto.customerId);
        if (!customer)
            throw new AppError(404, 'Customer not found.');
        const lineItemCost = dto.lineItemCost ?? 0;
        const taxPercent = dto.taxPercent ?? 0;
        const totalAmount = lineItemCost;
        const grossTotal = totalAmount + totalAmount * (taxPercent / 100);
        const data = {
            customer: { connect: { id: dto.customerId } },
            createdBy: { connect: { id: createdById } },
            invoiceDate: dto.invoiceDate ? new Date(dto.invoiceDate) : null,
            invoiceNumber: dto.invoiceNumber ?? null,
            orderId: dto.orderId ?? null,
            activationLimit: dto.activationLimit ?? null,
            activationProcess: dto.activationProcess ?? null,
            paymentTerms: dto.paymentTerms ?? null,
            projectDescription: dto.projectDescription,
            projectDescLine: dto.projectDescLine ?? null,
            lineItemCost: new Prisma.Decimal(lineItemCost),
            taxPercent: new Prisma.Decimal(taxPercent),
            totalAmount: new Prisma.Decimal(totalAmount),
            grossTotal: new Prisma.Decimal(grossTotal),
            termsAndConditions: dto.termsAndConditions,
            signedByName: dto.signedByName ?? null,
            signedAt: dto.signedAt ? new Date(dto.signedAt) : null,
            status: dto.status ?? 'DRAFT',
        };
        const contract = await contractRepository.create(data);
        return toContractResponseDto(contract);
    },
    async update(id, dto) {
        const existing = await contractRepository.findById(id);
        if (!existing)
            throw new AppError(404, 'Contract not found.');
        // Recalculate totals if cost/tax changed
        const lineItemCost = dto.lineItemCost !== undefined ? dto.lineItemCost : Number(existing.lineItemCost);
        const taxPercent = dto.taxPercent !== undefined ? dto.taxPercent : Number(existing.taxPercent);
        const totalAmount = lineItemCost;
        const grossTotal = totalAmount + totalAmount * (taxPercent / 100);
        const data = {
            ...(dto.invoiceDate !== undefined ? { invoiceDate: dto.invoiceDate ? new Date(dto.invoiceDate) : null } : {}),
            ...(dto.invoiceNumber !== undefined ? { invoiceNumber: dto.invoiceNumber } : {}),
            ...(dto.orderId !== undefined ? { orderId: dto.orderId } : {}),
            ...(dto.activationLimit !== undefined ? { activationLimit: dto.activationLimit } : {}),
            ...(dto.activationProcess !== undefined ? { activationProcess: dto.activationProcess } : {}),
            ...(dto.paymentTerms !== undefined ? { paymentTerms: dto.paymentTerms } : {}),
            ...(dto.projectDescription !== undefined ? { projectDescription: dto.projectDescription } : {}),
            ...(dto.projectDescLine !== undefined ? { projectDescLine: dto.projectDescLine } : {}),
            ...(dto.termsAndConditions !== undefined ? { termsAndConditions: dto.termsAndConditions } : {}),
            ...(dto.signedByName !== undefined ? { signedByName: dto.signedByName } : {}),
            ...(dto.signedAt !== undefined ? { signedAt: dto.signedAt ? new Date(dto.signedAt) : null } : {}),
            ...(dto.status !== undefined ? { status: dto.status } : {}),
            lineItemCost: new Prisma.Decimal(lineItemCost),
            taxPercent: new Prisma.Decimal(taxPercent),
            totalAmount: new Prisma.Decimal(totalAmount),
            grossTotal: new Prisma.Decimal(grossTotal),
        };
        const updated = await contractRepository.update(id, data);
        return toContractResponseDto(updated);
    },
    async delete(id) {
        const existing = await contractRepository.findById(id);
        if (!existing)
            throw new AppError(404, 'Contract not found.');
        await contractRepository.delete(id);
    },
};
//# sourceMappingURL=contract.service.js.map