import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../generated/prisma/index.js';
import "dotenv/config";
import { createPool } from 'mariadb';
// 1. Parse DATABASE_URL for connection details
const dbURL = new URL(process.env.DATABASE_URL);
// 2. Create MariaDB adapter
const adapter = new PrismaMariaDb({
    host: dbURL.hostname,
    port: parseInt(dbURL.port || '3306', 10),
    user: dbURL.username,
    password: decodeURIComponent(dbURL.password),
    database: dbURL.pathname.replace('/', ''),
    connectionLimit: 15
});
// 3. Tell TypeScript about our custom global variable
const globalForPrisma = globalThis;
// 4. Create the client instance or reuse the existing one
export const prisma = globalForPrisma.prisma ??
    new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
// 5. Save the instance to the global object if we are in development mode
if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}
//# sourceMappingURL=primsa.js.map