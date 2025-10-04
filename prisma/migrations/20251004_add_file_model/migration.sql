-- Migration: add File model and reference columns (SAFE DELTA)

-- CreateTable: File (if not exists already)
CREATE TABLE IF NOT EXISTS "File" (
  "id" SERIAL NOT NULL,
  "fileName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "data" BYTEA NOT NULL,
  "size" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- Add columns (if not exists)
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "fileId" INTEGER;
ALTER TABLE "Schedule" ADD COLUMN IF NOT EXISTS "fileId" INTEGER;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarFileId" INTEGER;

-- Note: Foreign key constraints intentionally omitted to avoid conflicts with existing schema.
-- Migration: add File model and reference columns (SAFE DELTA)

-- CreateTable: File (if not exists already)
CREATE TABLE IF NOT EXISTS "File" (
    "id" SERIAL NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- Add columns (if not exists)
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "fileId" INTEGER;
ALTER TABLE "Schedule" ADD COLUMN IF NOT EXISTS "fileId" INTEGER;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarFileId" INTEGER;

-- Note: Foreign key constraints intentionally omitted to avoid conflicts with existing schema.


-- Migration: add File model and reference columns

-- CreateTable: File
CREATE TABLE IF NOT EXISTS "File" (
    "id" SERIAL NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- Add columns if they don't already exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Message' AND column_name='fileId') THEN
        ALTER TABLE "Message" ADD COLUMN "fileId" INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Schedule' AND column_name='fileId') THEN
        ALTER TABLE "Schedule" ADD COLUMN "fileId" INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='avatarFileId') THEN
        ALTER TABLE "User" ADD COLUMN "avatarFileId" INTEGER;
    END IF;
-- Migration: add File model and reference columns (SAFE DELTA)

-- CreateTable: File (if not exists already)
CREATE TABLE IF NOT EXISTS "File" (
    "id" SERIAL NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- Add columns (if not exists)
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "fileId" INTEGER;
ALTER TABLE "Schedule" ADD COLUMN IF NOT EXISTS "fileId" INTEGER;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarFileId" INTEGER;

-- Note: Foreign key constraints intentionally omitted to avoid conflicts with existing schema.
    "messageId" INTEGER NOT NULL,

