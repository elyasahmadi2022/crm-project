import { prisma } from "../src/lib/primsa.js"
import { UserRole } from "../src/generated/prisma/index.js"
import bcrypt from "bcrypt"
import fs from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function createDirectoryStructure() {
  console.log("📁 Creating attendance folder structure...")
  
  const baseDir = path.join(__dirname, "..", "uploads", "attendance")
  
  // Create base attendance directory
  await fs.mkdir(baseDir, { recursive: true })
  console.log(`✅ Created: ${baseDir}`)
  
  return baseDir
}

async function main() {
  console.log("🌱 Starting seed process...")

  // Hash password
  const hashedPassword = await bcrypt.hash("admin123", 10)

  // ──────────────────────────────────────────────────────────────────────
  // 1. Create Admin User
  // ──────────────────────────────────────────────────────────────────────
  console.log("\n👤 Creating admin user...")
  
  const admin = await prisma.user.upsert({
    where: { email: "admin@luilala.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@luilala.com",
      password: hashedPassword,
      role: UserRole.ADMIN,
      isActive: true,
      salary: 5000,
      position: "System Administrator",
      department: "IT",
      joinDate: new Date("2024-01-01"),
      avatarUrl: null,
    },
  })
  console.log(`✅ Admin created: ${admin.email}`)



}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
