/*
  Warnings:

  - You are about to drop the column `audio_url` on the `NameEntry` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "NameEntry" DROP COLUMN "audio_url",
ADD COLUMN     "audio_key" TEXT;
