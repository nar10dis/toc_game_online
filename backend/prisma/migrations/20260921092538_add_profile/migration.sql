-- CreateTable
CREATE TABLE "Profile" (
    "userId" INTEGER NOT NULL,
    "bio" TEXT,
    "avatarUrl" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
