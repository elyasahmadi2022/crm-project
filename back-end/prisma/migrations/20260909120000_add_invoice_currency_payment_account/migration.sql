ALTER TABLE `invoices` ADD COLUMN `currency` VARCHAR(191) NOT NULL DEFAULT 'USD';

ALTER TABLE `payments` ADD COLUMN `accountId` INTEGER NULL;

UPDATE `payments` p
INNER JOIN (SELECT MIN(`id`) AS `id` FROM `accounts` WHERE `isActive` = true) a ON 1 = 1
SET p.`accountId` = a.`id`
WHERE p.`accountId` IS NULL;

ALTER TABLE `payments`
  ADD CONSTRAINT `payments_accountId_fkey`
  FOREIGN KEY (`accountId`) REFERENCES `accounts`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX `payments_accountId_idx` ON `payments`(`accountId`);