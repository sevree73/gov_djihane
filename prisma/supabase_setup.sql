-- ============================================================
-- gov_djihane — Complete Supabase Database Setup
-- Run this ONCE in the Supabase SQL Editor before deploying.
-- ============================================================

-- 1. Enable PostGIS (required for geographic columns)
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================
-- 2. Enums
-- ============================================================

DO $$ BEGIN
  CREATE TYPE "Role" AS ENUM (
    'SUPER_ADMIN', 'ADMIN_MINISTERE', 'ADMIN_WILAYA',
    'GESTIONNAIRE_TERRITORIAL', 'AGENT_TECHNIQUE', 'CITOYEN'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "SignalementStatus" AS ENUM (
    'RECU', 'EN_COURS', 'PRIS_EN_CHARGE', 'RESOLU', 'REJETE'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "SignalementCategory" AS ENUM (
    'URBANISME', 'TRANSPORT', 'ENVIRONNEMENT', 'VOIRIE',
    'EAU', 'DECHETS', 'EQUIPEMENTS_PUBLICS', 'SANTE', 'EDUCATION'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ProjectStatus" AS ENUM (
    'EN_ATTENTE', 'EN_COURS', 'SUSPENDU', 'TERMINE', 'ANNULE'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ConsultationStatus" AS ENUM (
    'BROUILLON', 'PUBLIEE', 'CLOTUREE'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "NotificationType" AS ENUM (
    'SIGNALEMENT_STATUS', 'PROJECT_UPDATE', 'GENERAL'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 3. Tables
-- ============================================================

CREATE TABLE IF NOT EXISTS "User" (
    "id"        TEXT NOT NULL,
    "email"     TEXT NOT NULL,
    "name"      TEXT NOT NULL,
    "phone"     TEXT,
    "password"  TEXT NOT NULL,
    "role"      "Role" NOT NULL DEFAULT 'CITOYEN',
    "wilaya"    TEXT,
    "ministere" TEXT,
    "isActive"  BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Signalement" (
    "id"           TEXT NOT NULL,
    "title"        TEXT NOT NULL,
    "description"  TEXT NOT NULL,
    "category"     "SignalementCategory" NOT NULL,
    "status"       "SignalementStatus" NOT NULL DEFAULT 'RECU',
    "wilaya"       TEXT,
    "commune"      TEXT,
    "mediaUrls"    TEXT[] DEFAULT ARRAY[]::TEXT[],
    "location"     geometry(Point, 4326),
    "citizenId"    TEXT NOT NULL,
    "assignedToId" TEXT,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Signalement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SignalementHistory" (
    "id"            TEXT NOT NULL,
    "signalementId" TEXT NOT NULL,
    "oldStatus"     "SignalementStatus",
    "newStatus"     "SignalementStatus" NOT NULL,
    "comment"       TEXT,
    "changedById"   TEXT NOT NULL,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SignalementHistory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Project" (
    "id"              TEXT NOT NULL,
    "title"           TEXT NOT NULL,
    "description"     TEXT NOT NULL,
    "sector"          TEXT NOT NULL,
    "ministere"       TEXT,
    "wilaya"          TEXT,
    "status"          "ProjectStatus" NOT NULL DEFAULT 'EN_ATTENTE',
    "budget"          DECIMAL(15,2),
    "budgetSpent"     DECIMAL(15,2),
    "advancementRate" INTEGER NOT NULL DEFAULT 0,
    "startDate"       TIMESTAMP(3),
    "endDate"         TIMESTAMP(3),
    "location"        geometry(Point, 4326),
    "zone"            geometry(Geometry, 4326),
    "createdById"     TEXT NOT NULL,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ProjectDocument" (
    "id"        TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name"      TEXT NOT NULL,
    "url"       TEXT NOT NULL,
    "mimeType"  TEXT,
    "sizeBytes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProjectDocument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Consultation" (
    "id"            TEXT NOT NULL,
    "title"         TEXT NOT NULL,
    "description"   TEXT NOT NULL,
    "status"        "ConsultationStatus" NOT NULL DEFAULT 'BROUILLON',
    "projectId"     TEXT,
    "publishedById" TEXT NOT NULL,
    "closedAt"      TIMESTAMP(3),
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Consultation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ConsultationQuestion" (
    "id"             TEXT NOT NULL,
    "consultationId" TEXT NOT NULL,
    "text"           TEXT NOT NULL,
    "order"          INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ConsultationQuestion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "QuestionAnswer" (
    "id"         TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "userId"     TEXT NOT NULL,
    "value"      TEXT NOT NULL,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QuestionAnswer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Vote" (
    "id"             TEXT NOT NULL,
    "consultationId" TEXT NOT NULL,
    "userId"         TEXT NOT NULL,
    "value"          INTEGER NOT NULL,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Comment" (
    "id"             TEXT NOT NULL,
    "content"        TEXT NOT NULL,
    "authorId"       TEXT NOT NULL,
    "signalementId"  TEXT,
    "projectId"      TEXT,
    "consultationId" TEXT,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

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

-- ============================================================
-- 4. Unique constraints
-- ============================================================

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key"                  ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "QuestionAnswer_questionId_userId" ON "QuestionAnswer"("questionId", "userId");
CREATE UNIQUE INDEX IF NOT EXISTS "Vote_consultationId_userId"       ON "Vote"("consultationId", "userId");

-- ============================================================
-- 5. Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS "User_role_idx"                          ON "User"("role");
CREATE INDEX IF NOT EXISTS "User_wilaya_idx"                        ON "User"("wilaya");
CREATE INDEX IF NOT EXISTS "Signalement_status_idx"                 ON "Signalement"("status");
CREATE INDEX IF NOT EXISTS "Signalement_category_idx"               ON "Signalement"("category");
CREATE INDEX IF NOT EXISTS "Signalement_wilaya_idx"                 ON "Signalement"("wilaya");
CREATE INDEX IF NOT EXISTS "Signalement_citizenId_idx"              ON "Signalement"("citizenId");
CREATE INDEX IF NOT EXISTS "SignalementHistory_signalementId_idx"   ON "SignalementHistory"("signalementId");
CREATE INDEX IF NOT EXISTS "Project_status_idx"                     ON "Project"("status");
CREATE INDEX IF NOT EXISTS "Project_wilaya_idx"                     ON "Project"("wilaya");
CREATE INDEX IF NOT EXISTS "Project_sector_idx"                     ON "Project"("sector");
CREATE INDEX IF NOT EXISTS "ProjectDocument_projectId_idx"          ON "ProjectDocument"("projectId");
CREATE INDEX IF NOT EXISTS "Consultation_status_idx"                ON "Consultation"("status");
CREATE INDEX IF NOT EXISTS "Consultation_projectId_idx"             ON "Consultation"("projectId");
CREATE INDEX IF NOT EXISTS "ConsultationQuestion_consultationId_idx" ON "ConsultationQuestion"("consultationId");
CREATE INDEX IF NOT EXISTS "QuestionAnswer_questionId_idx"          ON "QuestionAnswer"("questionId");
CREATE INDEX IF NOT EXISTS "Vote_consultationId_idx"                ON "Vote"("consultationId");
CREATE INDEX IF NOT EXISTS "Comment_signalementId_idx"              ON "Comment"("signalementId");
CREATE INDEX IF NOT EXISTS "Comment_projectId_idx"                  ON "Comment"("projectId");
CREATE INDEX IF NOT EXISTS "Comment_consultationId_idx"             ON "Comment"("consultationId");
CREATE INDEX IF NOT EXISTS "Notification_userId_read_idx"           ON "Notification"("userId", "read");
CREATE INDEX IF NOT EXISTS "Notification_userId_idx"                ON "Notification"("userId");

-- ============================================================
-- 6. Foreign keys
-- ============================================================

DO $$ BEGIN
  ALTER TABLE "Signalement" ADD CONSTRAINT "Signalement_citizenId_fkey"
    FOREIGN KEY ("citizenId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Signalement" ADD CONSTRAINT "Signalement_assignedToId_fkey"
    FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "SignalementHistory" ADD CONSTRAINT "SignalementHistory_signalementId_fkey"
    FOREIGN KEY ("signalementId") REFERENCES "Signalement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "SignalementHistory" ADD CONSTRAINT "SignalementHistory_changedById_fkey"
    FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Project" ADD CONSTRAINT "Project_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ProjectDocument" ADD CONSTRAINT "ProjectDocument_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_publishedById_fkey"
    FOREIGN KEY ("publishedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ConsultationQuestion" ADD CONSTRAINT "ConsultationQuestion_consultationId_fkey"
    FOREIGN KEY ("consultationId") REFERENCES "Consultation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "QuestionAnswer" ADD CONSTRAINT "QuestionAnswer_questionId_fkey"
    FOREIGN KEY ("questionId") REFERENCES "ConsultationQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Vote" ADD CONSTRAINT "Vote_consultationId_fkey"
    FOREIGN KEY ("consultationId") REFERENCES "Consultation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Vote" ADD CONSTRAINT "Vote_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Comment" ADD CONSTRAINT "Comment_signalementId_fkey"
    FOREIGN KEY ("signalementId") REFERENCES "Signalement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Comment" ADD CONSTRAINT "Comment_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Comment" ADD CONSTRAINT "Comment_consultationId_fkey"
    FOREIGN KEY ("consultationId") REFERENCES "Consultation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- Done. Run your seed script next:
--   DATABASE_URL="postgres://..." npx tsx prisma/seed.ts
-- ============================================================
