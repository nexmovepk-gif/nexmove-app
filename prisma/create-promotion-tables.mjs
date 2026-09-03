// prisma/create-promotion-tables.mjs
// Run: node prisma/create-promotion-tables.mjs
// Ensures Promotion table and indexes exist in Supabase Postgres

import pg from 'pg';
const { Client } = pg;

const connectionString =
  process.env.DIRECT_URL ||
  process.env.DATABASE_URL ||
  'postgresql://postgres.xtwvecumbnmzsafdknvh:0DlOjs8WLWX2E6q6@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres';

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

const sql = `
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── 1. Ensure Enum Types Exist in PostgreSQL ─────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "PromotionType" AS ENUM ('PROPERTY', 'AGENCY_PROFILE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "PromotionPackage" AS ENUM ('BASIC', 'STANDARD', 'PREMIUM');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "PromotionStatus" AS ENUM ('PENDING', 'ACTIVE', 'PAUSED', 'EXPIRED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ─── 2. Ensure Promotion Table Exists With Correct Enum Types ─────────────────
CREATE TABLE IF NOT EXISTS "Promotion" (
  "id"                    TEXT              PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "type"                  "PromotionType"   NOT NULL DEFAULT 'PROPERTY',
  "entityId"              TEXT              NOT NULL,
  "entityTitle"           TEXT              NOT NULL,
  "entityImage"           TEXT,
  "entityCity"            TEXT,
  "entityPrice"           FLOAT8,

  "ownerId"               TEXT              NOT NULL,
  "ownerType"             TEXT              NOT NULL DEFAULT 'USER',
  "ownerName"             TEXT,
  "ownerEmail"            TEXT,

  "userId"                TEXT,
  "agencyId"              TEXT,

  "package"               "PromotionPackage" NOT NULL DEFAULT 'BASIC',
  "durationDays"          INTEGER           NOT NULL DEFAULT 7,
  "budgetPKR"             FLOAT8            NOT NULL DEFAULT 1000,
  "placements"            TEXT[]            NOT NULL DEFAULT ARRAY['HOMEPAGE', 'SEARCH_TOP'],

  "status"                "PromotionStatus" NOT NULL DEFAULT 'PENDING',
  "startDate"             TIMESTAMPTZ,
  "endDate"               TIMESTAMPTZ,

  "viewsCount"            INTEGER           NOT NULL DEFAULT 0,
  "clicksCount"           INTEGER           NOT NULL DEFAULT 0,
  "searchImpressions"     INTEGER           NOT NULL DEFAULT 0,

  "stripeSessionId"       TEXT              UNIQUE,
  "stripePaymentIntentId" TEXT,

  "adminNote"             TEXT,
  "createdAt"             TIMESTAMPTZ       NOT NULL DEFAULT now(),
  "updatedAt"             TIMESTAMPTZ       NOT NULL DEFAULT now()
);

-- ─── 3. In Case Table Pre-Existed with TEXT columns, Convert to Enum Types ─────
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Promotion' AND column_name = 'type' AND data_type = 'text'
  ) THEN
    ALTER TABLE "Promotion" 
      ALTER COLUMN "type" DROP DEFAULT,
      ALTER COLUMN "type" TYPE "PromotionType" USING "type"::"PromotionType",
      ALTER COLUMN "type" SET DEFAULT 'PROPERTY'::"PromotionType";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Promotion' AND column_name = 'package' AND data_type = 'text'
  ) THEN
    ALTER TABLE "Promotion" 
      ALTER COLUMN "package" DROP DEFAULT,
      ALTER COLUMN "package" TYPE "PromotionPackage" USING "package"::"PromotionPackage",
      ALTER COLUMN "package" SET DEFAULT 'BASIC'::"PromotionPackage";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Promotion' AND column_name = 'status' AND data_type = 'text'
  ) THEN
    ALTER TABLE "Promotion" 
      ALTER COLUMN "status" DROP DEFAULT,
      ALTER COLUMN "status" TYPE "PromotionStatus" USING "status"::"PromotionStatus",
      ALTER COLUMN "status" SET DEFAULT 'PENDING'::"PromotionStatus";
  END IF;
END $$;

-- ─── 4. Indexes for Super Fast Queries ───────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_promotion_ownerId    ON "Promotion" ("ownerId");
CREATE INDEX IF NOT EXISTS idx_promotion_ownerType  ON "Promotion" ("ownerType");
CREATE INDEX IF NOT EXISTS idx_promotion_status     ON "Promotion" ("status");
CREATE INDEX IF NOT EXISTS idx_promotion_entityId   ON "Promotion" ("entityId");
CREATE INDEX IF NOT EXISTS idx_promotion_endDate    ON "Promotion" ("endDate");
CREATE INDEX IF NOT EXISTS idx_promotion_stripeId   ON "Promotion" ("stripeSessionId");
`;

try {
  console.log('🚀 Connecting to Supabase PostgreSQL database...');
  await client.connect();
  console.log('📦 Creating ENUM types and updating Promotion table in PostgreSQL...');
  await client.query(sql);
  console.log('✅ SUCCESS: Promotion ENUM types and table successfully migrated in Supabase PostgreSQL!');
  await client.end();
} catch (e) {
  console.error('❌ ERROR migrating Promotion table:', e.message);
  await client.end();
}

