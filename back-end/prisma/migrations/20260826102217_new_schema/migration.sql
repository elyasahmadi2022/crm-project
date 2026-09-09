/*
  Warnings:

  - You are about to drop the `Customer` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE `Customer`;

-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'SALES', 'DEVELOPER', 'DESIGNER', 'FINANCE', 'EMPLOYEE') NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `leads` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `companyName` VARCHAR(191) NOT NULL,
    `companySize` ENUM('SMALL', 'LARGE') NOT NULL,
    `message` TEXT NOT NULL,
    `status` ENUM('NEW', 'CONTACTED', 'PENDING', 'ON_HOLD', 'WON', 'LOST') NOT NULL DEFAULT 'NEW',
    `ownerId` INTEGER NULL,
    `campaignId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lead_notes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `leadId` INTEGER NOT NULL,
    `authorId` INTEGER NOT NULL,
    `content` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lead_status_history` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `leadId` INTEGER NOT NULL,
    `oldStatus` ENUM('NEW', 'CONTACTED', 'PENDING', 'ON_HOLD', 'WON', 'LOST') NULL,
    `newStatus` ENUM('NEW', 'CONTACTED', 'PENDING', 'ON_HOLD', 'WON', 'LOST') NOT NULL,
    `changedById` INTEGER NOT NULL,
    `changedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `companyName` VARCHAR(191) NOT NULL,
    `industry` VARCHAR(191) NULL,
    `size` ENUM('SMALL', 'LARGE') NOT NULL,
    `address` VARCHAR(191) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'CHURNED') NOT NULL DEFAULT 'ACTIVE',
    `ownerId` INTEGER NULL,
    `originLeadId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `customers_originLeadId_key`(`originLeadId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contacts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `customerId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `interactions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `customerId` INTEGER NOT NULL,
    `authorId` INTEGER NOT NULL,
    `type` ENUM('CALL', 'MEETING', 'EMAIL', 'NOTE') NOT NULL,
    `content` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `projects` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `customerId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `stage` ENUM('REQUIREMENTS', 'DESIGN', 'IMPLEMENTATION', 'TESTING', 'DEPLOYMENT', 'LIVE') NOT NULL DEFAULT 'REQUIREMENTS',
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `milestones` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `projectId` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `dueDate` DATETIME(3) NULL,
    `status` ENUM('PENDING', 'DONE') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `project_assignments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `projectId` INTEGER NOT NULL,
    `employeeId` INTEGER NOT NULL,
    `roleOnProject` VARCHAR(191) NULL,
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `project_assignments_projectId_employeeId_key`(`projectId`, `employeeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `project_stage_history` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `projectId` INTEGER NOT NULL,
    `oldStage` ENUM('REQUIREMENTS', 'DESIGN', 'IMPLEMENTATION', 'TESTING', 'DEPLOYMENT', 'LIVE') NULL,
    `newStage` ENUM('REQUIREMENTS', 'DESIGN', 'IMPLEMENTATION', 'TESTING', 'DEPLOYMENT', 'LIVE') NOT NULL,
    `changedById` INTEGER NOT NULL,
    `changedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invoices` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `customerId` INTEGER NOT NULL,
    `projectId` INTEGER NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `status` ENUM('DRAFT', 'SENT', 'PAID', 'OVERDUE') NOT NULL DEFAULT 'DRAFT',
    `issueDate` DATETIME(3) NULL,
    `dueDate` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `invoiceId` INTEGER NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `method` VARCHAR(191) NULL,
    `paidAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invoice_status_history` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `invoiceId` INTEGER NOT NULL,
    `oldStatus` ENUM('DRAFT', 'SENT', 'PAID', 'OVERDUE') NULL,
    `newStatus` ENUM('DRAFT', 'SENT', 'PAID', 'OVERDUE') NOT NULL,
    `changedById` INTEGER NOT NULL,
    `changedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `campaigns` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `channel` VARCHAR(191) NULL,
    `status` ENUM('PLANNED', 'ACTIVE', 'PAUSED', 'COMPLETED') NOT NULL DEFAULT 'PLANNED',
    `budget` DECIMAL(12, 2) NULL,
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `budgets` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `category` ENUM('PROJECT', 'MARKETING', 'GENERAL') NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `periodStart` DATETIME(3) NULL,
    `periodEnd` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `expenses` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `description` VARCHAR(191) NOT NULL,
    `category` ENUM('MARKETING', 'PROJECT', 'OPERATIONS', 'OTHER') NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `spentAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `budgetId` INTEGER NULL,
    `projectId` INTEGER NULL,
    `campaignId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `leads` ADD CONSTRAINT `leads_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leads` ADD CONSTRAINT `leads_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `campaigns`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lead_notes` ADD CONSTRAINT `lead_notes_leadId_fkey` FOREIGN KEY (`leadId`) REFERENCES `leads`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lead_notes` ADD CONSTRAINT `lead_notes_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lead_status_history` ADD CONSTRAINT `lead_status_history_leadId_fkey` FOREIGN KEY (`leadId`) REFERENCES `leads`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lead_status_history` ADD CONSTRAINT `lead_status_history_changedById_fkey` FOREIGN KEY (`changedById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `customers` ADD CONSTRAINT `customers_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `customers` ADD CONSTRAINT `customers_originLeadId_fkey` FOREIGN KEY (`originLeadId`) REFERENCES `leads`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contacts` ADD CONSTRAINT `contacts_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `interactions` ADD CONSTRAINT `interactions_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `interactions` ADD CONSTRAINT `interactions_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `projects` ADD CONSTRAINT `projects_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `milestones` ADD CONSTRAINT `milestones_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_assignments` ADD CONSTRAINT `project_assignments_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_assignments` ADD CONSTRAINT `project_assignments_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_stage_history` ADD CONSTRAINT `project_stage_history_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_stage_history` ADD CONSTRAINT `project_stage_history_changedById_fkey` FOREIGN KEY (`changedById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `invoices`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoice_status_history` ADD CONSTRAINT `invoice_status_history_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `invoices`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoice_status_history` ADD CONSTRAINT `invoice_status_history_changedById_fkey` FOREIGN KEY (`changedById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_budgetId_fkey` FOREIGN KEY (`budgetId`) REFERENCES `budgets`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `campaigns`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
