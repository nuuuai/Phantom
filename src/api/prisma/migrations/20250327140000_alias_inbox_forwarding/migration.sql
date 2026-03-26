-- AlterTable
ALTER TABLE "User" ADD COLUMN "forwardToEmail" TEXT;

-- CreateTable
CREATE TABLE "AliasInboxMessage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "aliasId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "fromAddress" TEXT NOT NULL,
    "snippet" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "providerMessageId" TEXT,

    CONSTRAINT "AliasInboxMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AliasInboxMessage_providerMessageId_key" ON "AliasInboxMessage"("providerMessageId");

-- CreateIndex
CREATE INDEX "AliasInboxMessage_userId_receivedAt_idx" ON "AliasInboxMessage"("userId", "receivedAt" DESC);

-- CreateIndex
CREATE INDEX "AliasInboxMessage_aliasId_receivedAt_idx" ON "AliasInboxMessage"("aliasId", "receivedAt" DESC);

-- AddForeignKey
ALTER TABLE "AliasInboxMessage" ADD CONSTRAINT "AliasInboxMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AliasInboxMessage" ADD CONSTRAINT "AliasInboxMessage_aliasId_fkey" FOREIGN KEY ("aliasId") REFERENCES "Alias"("id") ON DELETE CASCADE ON UPDATE CASCADE;
