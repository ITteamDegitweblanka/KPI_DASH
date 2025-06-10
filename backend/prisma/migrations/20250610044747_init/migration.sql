/*
  Warnings:

  - You are about to drop the column `contactEmail` on the `branches` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `branches` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `branches` table. All the data in the column will be lost.
  - You are about to drop the column `phoneNumber` on the `branches` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `branches` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `goals` table. All the data in the column will be lost.
  - You are about to drop the column `currentValue` on the `goals` table. All the data in the column will be lost.
  - You are about to drop the column `dueDate` on the `goals` table. All the data in the column will be lost.
  - You are about to drop the column `employeeId` on the `goals` table. All the data in the column will be lost.
  - You are about to drop the column `targetValue` on the `goals` table. All the data in the column will be lost.
  - You are about to drop the column `teamId` on the `goals` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `goals` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `key_results` table. All the data in the column will be lost.
  - You are about to drop the column `currentValue` on the `key_results` table. All the data in the column will be lost.
  - You are about to drop the column `goalId` on the `key_results` table. All the data in the column will be lost.
  - You are about to drop the column `ownerId` on the `key_results` table. All the data in the column will be lost.
  - You are about to drop the column `targetValue` on the `key_results` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `key_results` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `isRead` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `areasForImprovement` on the `performance_reviews` table. All the data in the column will be lost.
  - You are about to drop the column `comments` on the `performance_reviews` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `performance_reviews` table. All the data in the column will be lost.
  - You are about to drop the column `employeeId` on the `performance_reviews` table. All the data in the column will be lost.
  - You are about to drop the column `finalizedAt` on the `performance_reviews` table. All the data in the column will be lost.
  - You are about to drop the column `goalsForNextPeriod` on the `performance_reviews` table. All the data in the column will be lost.
  - You are about to drop the column `isFinalized` on the `performance_reviews` table. All the data in the column will be lost.
  - You are about to drop the column `overallRating` on the `performance_reviews` table. All the data in the column will be lost.
  - You are about to drop the column `reviewPeriodEnd` on the `performance_reviews` table. All the data in the column will be lost.
  - You are about to drop the column `reviewPeriodStart` on the `performance_reviews` table. All the data in the column will be lost.
  - You are about to drop the column `strengths` on the `performance_reviews` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `performance_reviews` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `refresh_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `refresh_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `refresh_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `branchId` on the `teams` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `teams` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `teams` table. All the data in the column will be lost.
  - You are about to drop the column `leaderId` on the `teams` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `teams` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `user_settings` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `user_settings` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `hireDate` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `lastLogin` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[leader_id]` on the table `teams` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[work_email]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updated_at` to the `branches` table without a default value. This is not possible if the table is not empty.
  - Added the required column `employee_id` to the `goals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `target_value` to the `goals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `goals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `goal_id` to the `key_results` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `key_results` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `notifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `revieweeId` to the `performance_reviews` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `performance_reviews` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expires_at` to the `refresh_tokens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `refresh_tokens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `branch_id` to the `teams` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `teams` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `user_settings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `goals` DROP FOREIGN KEY `goals_employeeId_fkey`;

-- DropForeignKey
ALTER TABLE `goals` DROP FOREIGN KEY `goals_teamId_fkey`;

-- DropForeignKey
ALTER TABLE `key_results` DROP FOREIGN KEY `key_results_goalId_fkey`;

-- DropForeignKey
ALTER TABLE `key_results` DROP FOREIGN KEY `key_results_ownerId_fkey`;

-- DropForeignKey
ALTER TABLE `notifications` DROP FOREIGN KEY `notifications_userId_fkey`;

-- DropForeignKey
ALTER TABLE `performance_reviews` DROP FOREIGN KEY `performance_reviews_employeeId_fkey`;

-- DropForeignKey
ALTER TABLE `performance_reviews` DROP FOREIGN KEY `performance_reviews_reviewerId_fkey`;

-- DropForeignKey
ALTER TABLE `refresh_tokens` DROP FOREIGN KEY `refresh_tokens_userId_fkey`;

-- DropForeignKey
ALTER TABLE `teams` DROP FOREIGN KEY `teams_branchId_fkey`;

-- DropForeignKey
ALTER TABLE `teams` DROP FOREIGN KEY `teams_leaderId_fkey`;

-- DropIndex
DROP INDEX `teams_leaderId_key` ON `teams`;

-- AlterTable
ALTER TABLE `branches` DROP COLUMN `contactEmail`,
    DROP COLUMN `createdAt`,
    DROP COLUMN `isActive`,
    DROP COLUMN `phoneNumber`,
    DROP COLUMN `updatedAt`,
    ADD COLUMN `contact_email` VARCHAR(191) NULL,
    ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `is_active` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `phone_number` VARCHAR(191) NULL,
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `goals` DROP COLUMN `createdAt`,
    DROP COLUMN `currentValue`,
    DROP COLUMN `dueDate`,
    DROP COLUMN `employeeId`,
    DROP COLUMN `targetValue`,
    DROP COLUMN `teamId`,
    DROP COLUMN `updatedAt`,
    ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `current_value` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `due_date` DATETIME(3) NULL,
    ADD COLUMN `employee_id` VARCHAR(191) NOT NULL,
    ADD COLUMN `target_value` DOUBLE NOT NULL,
    ADD COLUMN `team_id` VARCHAR(191) NULL,
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `key_results` DROP COLUMN `createdAt`,
    DROP COLUMN `currentValue`,
    DROP COLUMN `goalId`,
    DROP COLUMN `ownerId`,
    DROP COLUMN `targetValue`,
    DROP COLUMN `updatedAt`,
    ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `current_value` DOUBLE NULL DEFAULT 0,
    ADD COLUMN `goal_id` VARCHAR(191) NOT NULL,
    ADD COLUMN `owner_id` VARCHAR(191) NULL,
    ADD COLUMN `target_value` DOUBLE NULL,
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `notifications` DROP COLUMN `createdAt`,
    DROP COLUMN `isRead`,
    DROP COLUMN `userId`,
    ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `is_read` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `user_id` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `performance_reviews` DROP COLUMN `areasForImprovement`,
    DROP COLUMN `comments`,
    DROP COLUMN `createdAt`,
    DROP COLUMN `employeeId`,
    DROP COLUMN `finalizedAt`,
    DROP COLUMN `goalsForNextPeriod`,
    DROP COLUMN `isFinalized`,
    DROP COLUMN `overallRating`,
    DROP COLUMN `reviewPeriodEnd`,
    DROP COLUMN `reviewPeriodStart`,
    DROP COLUMN `strengths`,
    DROP COLUMN `updatedAt`,
    ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `due_date` DATETIME(3) NULL,
    ADD COLUMN `feedback` VARCHAR(191) NULL,
    ADD COLUMN `rating` ENUM('EXCEEDS_EXPECTATIONS', 'MEETS_EXPECTATIONS', 'NEEDS_IMPROVEMENT', 'UNSATISFACTORY') NULL,
    ADD COLUMN `review_date` DATETIME(3) NULL,
    ADD COLUMN `revieweeId` VARCHAR(191) NOT NULL,
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL,
    MODIFY `reviewerId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `refresh_tokens` DROP COLUMN `createdAt`,
    DROP COLUMN `expiresAt`,
    DROP COLUMN `userId`,
    ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `expires_at` DATETIME(3) NOT NULL,
    ADD COLUMN `user_id` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `teams` DROP COLUMN `branchId`,
    DROP COLUMN `createdAt`,
    DROP COLUMN `isActive`,
    DROP COLUMN `leaderId`,
    DROP COLUMN `updatedAt`,
    ADD COLUMN `branch_id` VARCHAR(191) NOT NULL,
    ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `is_active` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `leader_id` VARCHAR(191) NULL,
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `user_settings` DROP COLUMN `createdAt`,
    DROP COLUMN `updatedAt`,
    ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `users` DROP COLUMN `createdAt`,
    DROP COLUMN `hireDate`,
    DROP COLUMN `lastLogin`,
    DROP COLUMN `updatedAt`,
    ADD COLUMN `accessibilityNeeds` TEXT NULL,
    ADD COLUMN `city` VARCHAR(191) NULL,
    ADD COLUMN `country` VARCHAR(191) NULL,
    ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `date_of_birth` DATETIME(3) NULL,
    ADD COLUMN `hire_date` DATETIME(3) NULL,
    ADD COLUMN `last_login` DATETIME(3) NULL,
    ADD COLUMN `nationality` VARCHAR(191) NULL,
    ADD COLUMN `postal_code` VARCHAR(191) NULL,
    ADD COLUMN `state` VARCHAR(191) NULL,
    ADD COLUMN `street` VARCHAR(191) NULL,
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL,
    ADD COLUMN `work_email` VARCHAR(191) NULL,
    MODIFY `role` ENUM('SUPER_ADMIN', 'ADMIN', 'LEADER', 'SUB_LEADER', 'STAFF', 'GUEST') NOT NULL DEFAULT 'STAFF';

-- CreateTable
CREATE TABLE `emergency_contacts` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `relationship` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `identity_documents` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `number` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'VERIFIED', 'REJECTED', 'NOT_UPLOADED') NOT NULL DEFAULT 'NOT_UPLOADED',
    `file_name` VARCHAR(191) NULL,
    `expiry_date` DATETIME(3) NULL,
    `issued_by` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `teams_leader_id_key` ON `teams`(`leader_id`);

-- CreateIndex
CREATE UNIQUE INDEX `users_work_email_key` ON `users`(`work_email`);

-- AddForeignKey
ALTER TABLE `emergency_contacts` ADD CONSTRAINT `emergency_contacts_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `identity_documents` ADD CONSTRAINT `identity_documents_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teams` ADD CONSTRAINT `teams_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teams` ADD CONSTRAINT `teams_leader_id_fkey` FOREIGN KEY (`leader_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `goals` ADD CONSTRAINT `goals_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `goals` ADD CONSTRAINT `goals_team_id_fkey` FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `key_results` ADD CONSTRAINT `key_results_goal_id_fkey` FOREIGN KEY (`goal_id`) REFERENCES `goals`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `key_results` ADD CONSTRAINT `key_results_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `performance_reviews` ADD CONSTRAINT `performance_reviews_revieweeId_fkey` FOREIGN KEY (`revieweeId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `performance_reviews` ADD CONSTRAINT `performance_reviews_reviewerId_fkey` FOREIGN KEY (`reviewerId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
