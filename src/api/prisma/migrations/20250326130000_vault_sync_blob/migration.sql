-- AlterTable
ALTER TABLE "User" ADD COLUMN     "vaultSyncCiphertext" TEXT,
ADD COLUMN     "vaultSyncVersion" INTEGER NOT NULL DEFAULT 0;
