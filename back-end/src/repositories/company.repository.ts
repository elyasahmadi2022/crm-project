import { Prisma } from '../generated/prisma/index.js';
import { prisma } from '../lib/primsa.js';

// ── Company Settings (singleton id=1) ─────────────────────────────────────────

export const companyRepository = {
  /** Always returns the single row, creating it with defaults if absent. */
  get: () =>
    prisma.companySettings.upsert({
      where:  { id: 1 },
      create: { id: 1 },
      update: {},
    }),

  update: (data: Prisma.CompanySettingsUpdateInput) =>
    prisma.companySettings.upsert({
      where:  { id: 1 },
      create: { id: 1, ...data as Prisma.CompanySettingsCreateInput },
      update: data,
    }),

  updateLogo: (logoUrl: string | null) =>
    prisma.companySettings.upsert({
      where:  { id: 1 },
      create: { id: 1, logoUrl },
      update: { logoUrl },
    }),
};

// ── Contract Templates ────────────────────────────────────────────────────────

export const contractTemplateRepository = {
  findAll: () =>
    prisma.contractTemplate.findMany({ orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }] }),

  findById: (id: number) =>
    prisma.contractTemplate.findUnique({ where: { id } }),

  findDefault: () =>
    prisma.contractTemplate.findFirst({ where: { isDefault: true } }),

  create: (data: Prisma.ContractTemplateCreateInput) =>
    prisma.contractTemplate.create({ data }),

  update: (id: number, data: Prisma.ContractTemplateUpdateInput) =>
    prisma.contractTemplate.update({ where: { id }, data }),

  setDefault: async (id: number) => {
    // Clear existing default then set new one — in a transaction
    await prisma.$transaction([
      prisma.contractTemplate.updateMany({ where: { isDefault: true }, data: { isDefault: false } }),
      prisma.contractTemplate.update({ where: { id }, data: { isDefault: true } }),
    ]);
    return prisma.contractTemplate.findUnique({ where: { id } });
  },

  delete: (id: number) =>
    prisma.contractTemplate.delete({ where: { id } }),
};
