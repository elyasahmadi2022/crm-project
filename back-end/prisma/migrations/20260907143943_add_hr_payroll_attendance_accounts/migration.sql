-- AlterTable
ALTER TABLE `expenses` ADD COLUMN `customCategoryId` INTEGER NULL,
    MODIFY `category` ENUM('SOFTWARE', 'HARDWARE', 'MARKETING', 'TRAVEL', 'SALARIES', 'OFFICE', 'OTHER', 'CUSTOM') NOT NULL;

-- AlterTable
ALTER TABLE `leads` MODIFY `email` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `department` VARCHAR(191) NULL,
    ADD COLUMN `faceEmbedding` TEXT NULL,
    ADD COLUMN `joinDate` DATETIME(3) NULL,
    ADD COLUMN `position` VARCHAR(191) NULL,
    ADD COLUMN `salary` DECIMAL(12, 2) NULL;

-- CreateTable
CREATE TABLE `expense_custom_categories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `color` VARCHAR(191) NOT NULL DEFAULT '#6366f1',
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `expense_category_configs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `category` ENUM('SOFTWARE', 'HARDWARE', 'MARKETING', 'TRAVEL', 'SALARIES', 'OFFICE', 'OTHER', 'CUSTOM') NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `color` VARCHAR(191) NOT NULL DEFAULT '#6366f1',
    `icon` VARCHAR(191) NOT NULL DEFAULT 'tag',

    UNIQUE INDEX `expense_category_configs_category_key`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contracts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `customerId` INTEGER NOT NULL,
    `invoiceDate` DATETIME(3) NULL,
    `invoiceNumber` VARCHAR(191) NULL,
    `orderId` VARCHAR(191) NULL,
    `activationLimit` VARCHAR(191) NULL,
    `activationProcess` VARCHAR(191) NULL,
    `paymentTerms` VARCHAR(191) NULL,
    `projectDescription` TEXT NOT NULL,
    `projectDescLine` VARCHAR(191) NULL,
    `lineItemCost` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `taxPercent` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `totalAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `grossTotal` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `termsAndConditions` LONGTEXT NOT NULL,
    `signedByName` VARCHAR(191) NULL,
    `signedAt` DATETIME(3) NULL,
    `status` ENUM('DRAFT', 'SENT', 'SIGNED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    `createdById` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `company_settings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL DEFAULT '',
    `tagline` VARCHAR(191) NOT NULL DEFAULT '',
    `logoUrl` VARCHAR(191) NULL,
    `mobile` VARCHAR(191) NOT NULL DEFAULT '',
    `email` VARCHAR(191) NOT NULL DEFAULT '',
    `phone` VARCHAR(191) NOT NULL DEFAULT '',
    `website` VARCHAR(191) NOT NULL DEFAULT '',
    `whatsapp` VARCHAR(191) NOT NULL DEFAULT '',
    `address` VARCHAR(191) NOT NULL DEFAULT '',
    `footerText` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contract_templates` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `logoPosition` VARCHAR(191) NOT NULL DEFAULT 'left',
    `headerBg` VARCHAR(191) NOT NULL DEFAULT '#ffffff',
    `headerTextColor` VARCHAR(191) NOT NULL DEFAULT '#111111',
    `showMobile` BOOLEAN NOT NULL DEFAULT true,
    `showEmail` BOOLEAN NOT NULL DEFAULT true,
    `showPhone` BOOLEAN NOT NULL DEFAULT true,
    `showWebsite` BOOLEAN NOT NULL DEFAULT true,
    `showWhatsapp` BOOLEAN NOT NULL DEFAULT true,
    `showAddress` BOOLEAN NOT NULL DEFAULT true,
    `showTagline` BOOLEAN NOT NULL DEFAULT true,
    `bodyBg` VARCHAR(191) NOT NULL DEFAULT '#ffffff',
    `bodyTextColor` VARCHAR(191) NOT NULL DEFAULT '#111111',
    `accentColor` VARCHAR(191) NOT NULL DEFAULT '#2563eb',
    `borderColor` VARCHAR(191) NOT NULL DEFAULT '#e5e7eb',
    `fontSizeBase` INTEGER NOT NULL DEFAULT 13,
    `showCustomerBlock` BOOLEAN NOT NULL DEFAULT true,
    `showCostTable` BOOLEAN NOT NULL DEFAULT true,
    `showTermsBlock` BOOLEAN NOT NULL DEFAULT true,
    `showSignatureBlock` BOOLEAN NOT NULL DEFAULT true,
    `showFooter` BOOLEAN NOT NULL DEFAULT true,
    `layoutJson` LONGTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `accounts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `type` ENUM('DAKHAL', 'TAJIRI', 'BANK', 'CASH', 'OTHER') NOT NULL,
    `balance` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'USD',
    `description` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `account_transactions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `accountId` INTEGER NOT NULL,
    `type` ENUM('CREDIT', 'DEBIT', 'TRANSFER') NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `balanceAfter` DECIMAL(12, 2) NOT NULL,
    `description` TEXT NULL,
    `reference` VARCHAR(191) NULL,
    `referenceType` VARCHAR(191) NULL,
    `referenceId` INTEGER NULL,
    `transactionDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `account_transactions_accountId_idx`(`accountId`),
    INDEX `account_transactions_referenceType_referenceId_idx`(`referenceType`, `referenceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payrolls` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `employeeId` INTEGER NOT NULL,
    `month` INTEGER NOT NULL,
    `year` INTEGER NOT NULL,
    `baseSalary` DECIMAL(12, 2) NOT NULL,
    `advances` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `deductions` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `bonuses` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `netPay` DECIMAL(12, 2) NOT NULL,
    `status` ENUM('PENDING', 'PAID', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `paidFromId` INTEGER NULL,
    `paidAt` DATETIME(3) NULL,
    `paidBy` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `payrolls_month_year_idx`(`month`, `year`),
    INDEX `payrolls_status_idx`(`status`),
    UNIQUE INDEX `payrolls_employeeId_month_year_key`(`employeeId`, `month`, `year`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payroll_advances` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `employeeId` INTEGER NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `reason` TEXT NULL,
    `advanceDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deductedAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `fullyDeducted` BOOLEAN NOT NULL DEFAULT false,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `payroll_advances_employeeId_idx`(`employeeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employee_reports` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `employeeId` INTEGER NOT NULL,
    `reportDate` DATETIME(3) NOT NULL,
    `type` ENUM('DAILY', 'WEEKLY') NOT NULL,
    `content` LONGTEXT NOT NULL,
    `submitted` BOOLEAN NOT NULL DEFAULT true,
    `weekday` INTEGER NULL,
    `weekNumber` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `employee_reports_employeeId_idx`(`employeeId`),
    INDEX `employee_reports_reportDate_idx`(`reportDate`),
    INDEX `employee_reports_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attendances` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `employeeId` INTEGER NOT NULL,
    `date` DATE NOT NULL,
    `checkIn` DATETIME(3) NULL,
    `checkOut` DATETIME(3) NULL,
    `checkInImage` VARCHAR(191) NULL,
    `checkOutImage` VARCHAR(191) NULL,
    `status` ENUM('PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE', 'HOLIDAY') NOT NULL DEFAULT 'PRESENT',
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `attendances_employeeId_idx`(`employeeId`),
    INDEX `attendances_date_idx`(`date`),
    UNIQUE INDEX `attendances_employeeId_date_key`(`employeeId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_customCategoryId_fkey` FOREIGN KEY (`customCategoryId`) REFERENCES `expense_custom_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contracts` ADD CONSTRAINT `contracts_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contracts` ADD CONSTRAINT `contracts_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `account_transactions` ADD CONSTRAINT `account_transactions_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `accounts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payrolls` ADD CONSTRAINT `payrolls_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payrolls` ADD CONSTRAINT `payrolls_paidFromId_fkey` FOREIGN KEY (`paidFromId`) REFERENCES `accounts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payroll_advances` ADD CONSTRAINT `payroll_advances_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employee_reports` ADD CONSTRAINT `employee_reports_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
