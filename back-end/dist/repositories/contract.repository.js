import { Prisma } from '../generated/prisma/index.js';
import { prisma } from '../lib/primsa.js';
const withRelations = {
    customer: true,
    createdBy: true,
};
export const contractRepository = {
    findById: (id) => prisma.contract.findUnique({ where: { id }, include: withRelations }),
    findMany: (where, skip, take) => prisma.contract.findMany({
        where,
        skip,
        take,
        include: withRelations,
        orderBy: { createdAt: 'desc' },
    }),
    count: (where) => prisma.contract.count({ where }),
    create: (data) => prisma.contract.create({ data, include: withRelations }),
    update: (id, data) => prisma.contract.update({ where: { id }, data, include: withRelations }),
    delete: (id) => prisma.contract.delete({ where: { id } }),
};
//# sourceMappingURL=contract.repository.js.map