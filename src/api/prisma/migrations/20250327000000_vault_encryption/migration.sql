-- AlterTable: add vault salt to User for PBKDF2 key derivation
ALTER TABLE "User" ADD COLUMN "vaultSalt" TEXT;

-- AlterTable: add encrypted value column for client-side vault encryption
ALTER TABLE "Alias" ADD COLUMN "encryptedValue" TEXT;
