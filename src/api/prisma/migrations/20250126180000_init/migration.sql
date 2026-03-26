-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AliasType" AS ENUM ('email', 'phone', 'username', 'password');

-- CreateEnum
CREATE TYPE "AliasCategory" AS ENUM ('shopping', 'social', 'finance', 'work', 'dating', 'newsletter', 'temp');

-- CreateEnum
CREATE TYPE "HealthStatus" AS ENUM ('healthy', 'warning', 'compromised', 'quarantined');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "hashedPassword" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alias" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "AliasType" NOT NULL,
    "value" TEXT NOT NULL,
    "category" "AliasCategory" NOT NULL,
    "serviceName" TEXT,
    "serviceUrl" TEXT,
    "healthStatus" "HealthStatus" NOT NULL DEFAULT 'healthy',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivityAt" TIMESTAMP(3),
    "spamCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Alias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Alias_userId_createdAt_idx" ON "Alias"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Alias_userId_category_idx" ON "Alias"("userId", "category");

-- CreateIndex
CREATE INDEX "Alias_userId_healthStatus_idx" ON "Alias"("userId", "healthStatus");

-- AddForeignKey
ALTER TABLE "Alias" ADD CONSTRAINT "Alias_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
