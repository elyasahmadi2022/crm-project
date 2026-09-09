import { Prisma } from '../generated/prisma/index.js';
import { prisma } from '../lib/primsa.js';

const withRelations = {
  customer: true,
  createdBy: true,
} satisfies Prisma.ContractInclude;

export type PrismaContractWithRelations = Prisma.ContractGetPayload<{
  include: typeof withRelations;
}>;

export const contractRepository = {
  findById: (id: number): Promise<PrismaContractWithRelations | null> =>
    prisma.contract.findUnique({ where: { id }, include: withRelations }),

  findMany: (
    where: Prisma.ContractWhereInput,
    skip: number,
    take: number,
  ): Promise<PrismaContractWithRelations[]> =>
    prisma.contract.findMany({
      where,
      skip,
      take,
      include: withRelations,
      orderBy: { createdAt: 'desc' },
    }),

  count: (where: Prisma.ContractWhereInput): Promise<number> =>
    prisma.contract.count({ where }),

  create: (data: Prisma.ContractCreateInput): Promise<PrismaContractWithRelations> =>
    prisma.contract.create({ data, include: withRelations }),

  update: (
    id: number,
    data: Prisma.ContractUpdateInput,
  ): Promise<PrismaContractWithRelations> =>
    prisma.contract.update({ where: { id }, data, include: withRelations }),

  delete: (id: number) => prisma.contract.delete({ where: { id } }),
};
