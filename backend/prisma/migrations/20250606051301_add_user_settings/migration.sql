/*
  Warnings:

  - You are about to drop the column `completedAt` on the `goals` table. All the data in the column will be lost.
  - You are about to drop the column `progress` on the `goals` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `goals` table. All the data in the column will be lost.
  - You are about to drop the column `targetDate` on the `goals` table. All the data in the column will be lost.
  - You are about to alter the column `role` on the `users` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(5))` to `Enum(EnumId(3))`.
  - You are about to drop the `performancereview` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `targetValue` to the `goals` table without a default value. This is not possible if the table is not empty.
  - Made the column `employeeId` on table `goals` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `goals` DROP FOREIGN KEY `goals_employeeId_fkey`;

-- DropForeignKey
ALTER TABLE `performancereview` DROP FOREIGN KEY `PerformanceReview_employeeId_fkey`;

-- DropForeignKey
ALTER TABLE `performancereview` DROP FOREIGN KEY `PerformanceReview_reviewerId_fkey`;

-- AlterTable
ALTER TABLE `goals` DROP COLUMN `completedAt`,
    DROP COLUMN `progress`,
    DROP COLUMN `startDate`,
    DROP COLUMN `targetDate`,
    ADD COLUMN `currentValue` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `dueDate` DATETIME(3) NULL,
    ADD COLUMN `targetValue` DOUBLE NOT NULL,
    MODIFY `description` VARCHAR(191) NULL,
    MODIFY `type` ENUM('PERFORMANCE', 'DEVELOPMENT', 'PROJECT', 'PERSONAL') NOT NULL DEFAULT 'PERFORMANCE',
    MODIFY `employeeId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `users` MODIFY `role` ENUM('SUPER_ADMIN', 'ADMIN', 'LEADER', 'SUB_LEADER', 'STAFF') NOT NULL DEFAULT 'STAFF';

-- DropTable
DROP TABLE `performancereview`;

-- CreateTable
CREATE TABLE `performance_reviews` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `reviewerId` VARCHAR(191) NOT NULL,
    `reviewPeriodStart` DATETIME(3) NOT NULL,
    `reviewPeriodEnd` DATETIME(3) NOT NULL,
    `status` ENUM('DRAFT', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    `overallRating` ENUM('EXCEEDS_EXPECTATIONS', 'MEETS_EXPECTATIONS', 'NEEDS_IMPROVEMENT', 'UNSATISFACTORY') NULL,
    `strengths` VARCHAR(191) NULL,
    `areasForImprovement` VARCHAR(191) NULL,
    `goalsForNextPeriod` VARCHAR(191) NULL,
    `comments` VARCHAR(191) NULL,
    `isFinalized` BOOLEAN NOT NULL DEFAULT false,
    `finalizedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `performance_reviews_employeeId_idx`(`employeeId`),
    INDEX `performance_reviews_reviewerId_idx`(`reviewerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `performance_metrics` (
    `id` VARCHAR(191) NOT NULL,
    `reviewId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `rating` ENUM('EXCEEDS_EXPECTATIONS', 'MEETS_EXPECTATIONS', 'NEEDS_IMPROVEMENT', 'UNSATISFACTORY') NOT NULL,
    `weight` DOUBLE NOT NULL DEFAULT 1.0,
    `comments` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_settings` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `theme` VARCHAR(191) NOT NULL DEFAULT 'system',
    `darkMode` BOOLEAN NOT NULL DEFAULT false,
    `highContrast` BOOLEAN NOT NULL DEFAULT false,
    `fontSize` VARCHAR(191) NOT NULL DEFAULT 'medium',
    `emailNotifications` BOOLEAN NOT NULL DEFAULT true,
    `pushNotifications` BOOLEAN NOT NULL DEFAULT true,
    `performanceUpdates` BOOLEAN NOT NULL DEFAULT true,
    `newsletter` BOOLEAN NOT NULL DEFAULT false,
    `language` VARCHAR(191) NOT NULL DEFAULT 'en',
    `timezone` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `user_settings_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `performance_reviews` ADD CONSTRAINT `performance_reviews_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `performance_reviews` ADD CONSTRAINT `performance_reviews_reviewerId_fkey` FOREIGN KEY (`reviewerId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `performance_metrics` ADD CONSTRAINT `performance_metrics_reviewId_fkey` FOREIGN KEY (`reviewId`) REFERENCES `performance_reviews`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_settings` ADD CONSTRAINT `user_settings_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `goals` ADD CONSTRAINT `goals_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
