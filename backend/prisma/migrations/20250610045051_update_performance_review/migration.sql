/*
  Warnings:

  - You are about to drop the column `rating` on the `performance_reviews` table. All the data in the column will be lost.
  - You are about to drop the column `revieweeId` on the `performance_reviews` table. All the data in the column will be lost.
  - You are about to drop the column `reviewerId` on the `performance_reviews` table. All the data in the column will be lost.
  - Added the required column `reviewee_id` to the `performance_reviews` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `performance_reviews` DROP FOREIGN KEY `performance_reviews_revieweeId_fkey`;

-- DropForeignKey
ALTER TABLE `performance_reviews` DROP FOREIGN KEY `performance_reviews_reviewerId_fkey`;

-- AlterTable
ALTER TABLE `performance_reviews` DROP COLUMN `rating`,
    DROP COLUMN `revieweeId`,
    DROP COLUMN `reviewerId`,
    ADD COLUMN `areas_for_improvement` TEXT NULL,
    ADD COLUMN `finalized_at` DATETIME(3) NULL,
    ADD COLUMN `goals_for_next_period` TEXT NULL,
    ADD COLUMN `is_finalized` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `overall_rating` ENUM('EXCEEDS_EXPECTATIONS', 'MEETS_EXPECTATIONS', 'NEEDS_IMPROVEMENT', 'UNSATISFACTORY') NULL,
    ADD COLUMN `review_period_end` DATETIME(3) NULL,
    ADD COLUMN `review_period_start` DATETIME(3) NULL,
    ADD COLUMN `reviewee_id` VARCHAR(191) NOT NULL,
    ADD COLUMN `reviewer_id` VARCHAR(191) NULL,
    ADD COLUMN `strengths` TEXT NULL,
    MODIFY `feedback` TEXT NULL;

-- AddForeignKey
ALTER TABLE `performance_reviews` ADD CONSTRAINT `performance_reviews_reviewee_id_fkey` FOREIGN KEY (`reviewee_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `performance_reviews` ADD CONSTRAINT `performance_reviews_reviewer_id_fkey` FOREIGN KEY (`reviewer_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
