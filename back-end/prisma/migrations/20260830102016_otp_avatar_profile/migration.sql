-- AlterTable
ALTER TABLE `users` ADD COLUMN `avatarUrl` VARCHAR(191) NULL,
    ADD COLUMN `forcePasswordChange` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `otp_codes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `purpose` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `usedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `otp_codes_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `otp_codes` ADD CONSTRAINT `otp_codes_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
