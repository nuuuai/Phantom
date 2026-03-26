-- AlterTable
ALTER TABLE "User" ADD COLUMN "stripeCustomerId" TEXT,
ADD COLUMN "stripeSubscriptionId" TEXT,
ADD COLUMN "subscriptionStatus" TEXT DEFAULT 'none';

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeSubscriptionId_key" ON "User"("stripeSubscriptionId");

-- AlterTable
ALTER TABLE "Alias" ADD COLUMN "phoneProvider" TEXT,
ADD COLUMN "phoneProviderSid" TEXT,
ADD COLUMN "phoneForwardTo" TEXT;
