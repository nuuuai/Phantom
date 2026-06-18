-- Autopilot action log + weekly risk snapshots for Brain trend accuracy

CREATE TYPE "AutopilotActionKind" AS ENUM ('alias_rotated', 'alias_warning');

CREATE TABLE "AutopilotActionLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "AutopilotActionKind" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "refId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AutopilotActionLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RiskSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "weekEnding" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AutopilotActionLog_userId_createdAt_idx" ON "AutopilotActionLog"("userId", "createdAt" DESC);

CREATE UNIQUE INDEX "RiskSnapshot_userId_weekEnding_key" ON "RiskSnapshot"("userId", "weekEnding");

CREATE INDEX "RiskSnapshot_userId_weekEnding_idx" ON "RiskSnapshot"("userId", "weekEnding");

ALTER TABLE "AutopilotActionLog" ADD CONSTRAINT "AutopilotActionLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RiskSnapshot" ADD CONSTRAINT "RiskSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
