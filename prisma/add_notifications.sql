-- Migration: add_notifications
DO $$ BEGIN
  CREATE TYPE "NotificationType" AS ENUM ('SIGNALEMENT_STATUS', 'PROJECT_UPDATE', 'GENERAL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "Notification" (
    "id"            TEXT NOT NULL,
    "userId"        TEXT NOT NULL,
    "type"          "NotificationType" NOT NULL DEFAULT 'GENERAL',
    "title"         TEXT NOT NULL,
    "message"       TEXT NOT NULL,
    "read"          BOOLEAN NOT NULL DEFAULT false,
    "link"          TEXT,
    "signalementId" TEXT,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Notification_userId_read_idx" ON "Notification"("userId", "read");
CREATE INDEX IF NOT EXISTS "Notification_userId_idx"      ON "Notification"("userId");

DO $$ BEGIN
  ALTER TABLE "Notification"
    ADD CONSTRAINT "Notification_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
