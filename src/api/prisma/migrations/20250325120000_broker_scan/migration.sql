-- CreateEnum
CREATE TYPE "UserTier" AS ENUM ('free', 'paid', 'enterprise');

-- CreateEnum
CREATE TYPE "BrokerCategory" AS ENUM ('people_search', 'marketing', 'data_aggregator', 'background_check', 'public_records');

-- CreateEnum
CREATE TYPE "RemovalMethod" AS ENUM ('api', 'form', 'email', 'manual');

-- CreateEnum
CREATE TYPE "BrokerScanStatus" AS ENUM ('not_found', 'found', 'removal_submitted', 'removal_confirmed', 're_listed');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "tier" "UserTier" NOT NULL DEFAULT 'free';

-- CreateTable
CREATE TABLE "DataBroker" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "category" "BrokerCategory" NOT NULL,
    "removalMethod" "RemovalMethod" NOT NULL,
    "avgRemovalDays" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "DataBroker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrokerScanRun" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "totalBrokers" INTEGER NOT NULL,
    "foundCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "BrokerScanRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrokerScanResult" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "brokerScanRunId" TEXT NOT NULL,
    "brokerId" TEXT NOT NULL,
    "dataTypesFound" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "scanDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "BrokerScanStatus" NOT NULL,
    "removalSubmittedAt" TIMESTAMP(3),
    "removalConfirmedAt" TIMESTAMP(3),
    "relistDetectedAt" TIMESTAMP(3),

    CONSTRAINT "BrokerScanResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DataBroker_domain_key" ON "DataBroker"("domain");

-- CreateIndex
CREATE INDEX "BrokerScanRun_userId_startedAt_idx" ON "BrokerScanRun"("userId", "startedAt" DESC);

-- CreateIndex
CREATE INDEX "BrokerScanResult_userId_brokerScanRunId_idx" ON "BrokerScanResult"("userId", "brokerScanRunId");

-- CreateIndex
CREATE INDEX "BrokerScanResult_userId_status_idx" ON "BrokerScanResult"("userId", "status");

-- CreateIndex
CREATE INDEX "BrokerScanResult_brokerScanRunId_status_idx" ON "BrokerScanResult"("brokerScanRunId", "status");

-- AddForeignKey
ALTER TABLE "BrokerScanRun" ADD CONSTRAINT "BrokerScanRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrokerScanResult" ADD CONSTRAINT "BrokerScanResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrokerScanResult" ADD CONSTRAINT "BrokerScanResult_brokerScanRunId_fkey" FOREIGN KEY ("brokerScanRunId") REFERENCES "BrokerScanRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrokerScanResult" ADD CONSTRAINT "BrokerScanResult_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "DataBroker"("id") ON DELETE CASCADE ON UPDATE CASCADE;
