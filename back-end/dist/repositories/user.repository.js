import { Prisma } from "../generated/prisma/index.js";
import { prisma } from "../lib/primsa.js";
const withCounts = {
    _count: {
        select: {
            ownedLeads: true,
            ownedCustomers: true,
            projectAssignments: true,
            interactions: true
        }
    }
};
export const userRepository = {
    findById: (id) => {
        return prisma.user.findUnique({ where: { id } });
    },
    findByEmail: (email) => {
        return prisma.user.findUnique({ where: { email } });
    },
    findByIdWithDetails: (id) => {
        return prisma.user.findUnique({ where: { id }, include: withCounts });
    },
    findMany: (where, skip, take) => {
        return prisma.user.findMany({
            where,
            skip,
            take,
            include: withCounts,
            orderBy: { createdAt: "desc" }
        });
    },
    count: (where) => {
        return prisma.user.count({ where });
    },
    create: (data) => {
        return prisma.user.create({ data, include: withCounts });
    },
    update: (id, data) => {
        return prisma.user.update({ where: { id }, data, include: withCounts });
    },
    delete: (id) => {
        return prisma.user.delete({ where: { id } });
    },
    // -------------------------------------------------------
    // Profile helpers (used by the auth / profile endpoints)
    // -------------------------------------------------------
    /** Update only the fields a user can change themselves */
    updateProfile: (id, data) => {
        return prisma.user.update({ where: { id }, data });
    },
    /** Persist a new hashed password and clear the forcePasswordChange flag */
    updatePassword: (id, hashedPassword) => {
        return prisma.user.update({
            where: { id },
            data: { password: hashedPassword, forcePasswordChange: false },
        });
    },
    /** Persist a new avatar URL */
    updateAvatar: (id, avatarUrl) => {
        return prisma.user.update({ where: { id }, data: { avatarUrl } });
    },
};
//# sourceMappingURL=user.repository.js.map