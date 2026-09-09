ALTER TABLE `expenses` DROP FOREIGN KEY `expenses_payrollId_fkey`;
DROP INDEX `expenses_payrollId_key` ON `expenses`;
CREATE INDEX `expenses_payrollId_idx` ON `expenses`(`payrollId`);
ALTER TABLE `expenses`
  ADD CONSTRAINT `expenses_payrollId_fkey`
  FOREIGN KEY (`payrollId`) REFERENCES `payrolls`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `payroll_advances` ADD COLUMN `currency` VARCHAR(191) NOT NULL DEFAULT 'USD';

CREATE TABLE `payroll_payments` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `payrollId` INTEGER NOT NULL,
  `accountId` INTEGER NOT NULL,
  `salaryAmount` DECIMAL(12, 2) NOT NULL,
  `paidAmount` DECIMAL(12, 2) NOT NULL,
  `salaryCurrency` VARCHAR(191) NOT NULL,
  `paidCurrency` VARCHAR(191) NOT NULL,
  `exchangeRate` DECIMAL(18, 8) NOT NULL,
  `paidBy` VARCHAR(191) NULL,
  `paidAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `payroll_payments_payrollId_idx` (`payrollId`),
  INDEX `payroll_payments_accountId_idx` (`accountId`),
  CONSTRAINT `payroll_payments_payrollId_fkey` FOREIGN KEY (`payrollId`) REFERENCES `payrolls`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `payroll_payments_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;