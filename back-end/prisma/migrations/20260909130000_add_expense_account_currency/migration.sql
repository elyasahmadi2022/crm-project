ALTER TABLE `expenses` ADD COLUMN `currency` VARCHAR(191) NOT NULL DEFAULT 'USD';

ALTER TABLE `expenses` ADD COLUMN `accountId` INTEGER NULL;

ALTER TABLE `expenses`
  ADD CONSTRAINT `expenses_accountId_fkey`
  FOREIGN KEY (`accountId`) REFERENCES `accounts`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX `expenses_accountId_idx` ON `expenses`(`accountId`);