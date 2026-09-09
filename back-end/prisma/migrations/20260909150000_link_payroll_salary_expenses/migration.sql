ALTER TABLE `expenses` ADD COLUMN `payrollId` INTEGER NULL;

ALTER TABLE `expenses`
  ADD CONSTRAINT `expenses_payrollId_fkey`
  FOREIGN KEY (`payrollId`) REFERENCES `payrolls`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE UNIQUE INDEX `expenses_payrollId_key` ON `expenses`(`payrollId`);