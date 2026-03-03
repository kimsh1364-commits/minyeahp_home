-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "username" TEXT NOT NULL,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Character" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skinTone" TEXT NOT NULL DEFAULT 'light',
    "hairStyle" TEXT NOT NULL DEFAULT 'short',
    "hairColor" TEXT NOT NULL DEFAULT 'black',
    "eyeColor" TEXT NOT NULL DEFAULT 'brown',
    "top" TEXT NOT NULL DEFAULT 'default_top',
    "bottom" TEXT NOT NULL DEFAULT 'default_bottom',
    "shoes" TEXT NOT NULL DEFAULT 'default_shoes',
    "hat" TEXT NOT NULL DEFAULT 'none',
    "accessory" TEXT NOT NULL DEFAULT 'none',

    CONSTRAINT "Character_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "wallpaper" TEXT NOT NULL DEFAULT 'white',
    "floor" TEXT NOT NULL DEFAULT 'wood',
    "furniture" TEXT NOT NULL DEFAULT '[]',

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Friendship" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Friendship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Character_userId_key" ON "Character"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Room_userId_key" ON "Room"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Friendship_senderId_receiverId_key" ON "Friendship"("senderId", "receiverId");

-- AddForeignKey
ALTER TABLE "Character" ADD CONSTRAINT "Character_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
