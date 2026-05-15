/*
  Warnings:

  - You are about to drop the column `birdDate` on the `Doctor` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Doctor" DROP COLUMN "birdDate",
ADD COLUMN     "speciality" TEXT;
