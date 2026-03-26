-- CreateTable
CREATE TABLE "NotificationPref" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" "NotificationCategory" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "NotificationPref_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPref_userId_category_key" ON "NotificationPref"("userId", "category");

-- AddForeignKey
ALTER TABLE "NotificationPref" ADD CONSTRAINT "NotificationPref_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
