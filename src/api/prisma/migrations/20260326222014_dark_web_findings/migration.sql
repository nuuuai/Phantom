-- CreateEnum
CREATE TYPE "DarkWebFindingStatus" AS ENUM ('open', 'dismissed');

-- CreateEnum
CREATE TYPE "DarkWebSeverity" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateTable
CREATE TABLE "DarkWebFinding" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "severity" "DarkWebSeverity" NOT NULL,
    "status" "DarkWebFindingStatus" NOT NULL DEFAULT 'open',
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "sourceLabel" TEXT NOT NULL,
    "breachName" TEXT,
    "identifierType" TEXT NOT NULL,
    "identifierDisplay" TEXT NOT NULL,
    "recommendedAction" TEXT NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL,
    "dismissedAt" TIMESTAMP(3),
    "dedupeKey" TEXT NOT NULL,

    CONSTRAINT "DarkWebFinding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DarkWebFinding_userId_status_detectedAt_idx" ON "DarkWebFinding"("userId", "status", "detectedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "DarkWebFinding_userId_dedupeKey_key" ON "DarkWebFinding"("userId", "dedupeKey");

-- AddForeignKey
ALTER TABLE "DarkWebFinding" ADD CONSTRAINT "DarkWebFinding_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
