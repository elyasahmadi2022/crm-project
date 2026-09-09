import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/primsa.js";
async function main() {
    const hash = await bcrypt.hash("admin123", 10);
    const result = await prisma.user.updateMany({
        where: { role: { not: "ADMIN" } },
        data: { password: hash },
    });
    console.log(`✅ Updated ${result.count} non-admin users — password is now: admin123`);
    await prisma.$disconnect();
}
main().catch(console.error);
//# sourceMappingURL=reset-passwords.js.map