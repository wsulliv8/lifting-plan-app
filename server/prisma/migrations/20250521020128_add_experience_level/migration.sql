/*
  Warnings:

  - You are about to drop the column `description` on the `BaseLifts` table. All the data in the column will be lost.
  - You are about to drop the column `muscle_group` on the `BaseLifts` table. All the data in the column will be lost.
  - The `equipment` column on the `BaseLifts` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `created_at` on the `UserLiftsData` table. All the data in the column will be lost.
  - Added the required column `experience` to the `Users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BaseLifts" DROP COLUMN "description",
DROP COLUMN "muscle_group",
ADD COLUMN     "how_to" TEXT[],
ADD COLUMN     "primary_muscle_groups" TEXT[],
ADD COLUMN     "secondary_muscle_groups" TEXT[],
DROP COLUMN "equipment",
ADD COLUMN     "equipment" TEXT[];

-- AlterTable
ALTER TABLE "UserLiftsData" DROP COLUMN "created_at",
ADD COLUMN     "set_counts" INTEGER[],
ADD COLUMN     "week_starts" TIMESTAMP(3)[],
ADD COLUMN     "weekly_reps" INTEGER[],
ADD COLUMN     "weekly_volume" INTEGER[];

-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "experience" TEXT NOT NULL;
