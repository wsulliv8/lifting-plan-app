/*
  Warnings:

  - The `progression_rule` column on the `Lifts` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Lifts" DROP COLUMN "progression_rule",
ADD COLUMN     "progression_rule" JSONB;
