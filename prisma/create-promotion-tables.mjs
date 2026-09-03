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

-- ─── Ensure Promotion Table Exists ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Promotion" (
  "id"                    TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "type"                  TEXT        NOT NULL DEFAULT 'PROPERTY',
  "entityId"              TEXT        NOT NULL,
  "entityTitle"           TEXT        NOT NULL,
  "entityImage"           TEXT,
  "entityCity"            TEXT,
  "entityPrice"           FLOAT8,

  "ownerId"               TEXT        NOT NULL,
  "ownerType"             TEXT        NOT NULL DEFAULT 'USER',
  "ownerName"             TEXT,
  "ownerEmail"            TEXT,

  "userId"                TEXT,
  "agencyId"              TEXT,

  "package"               TEXT        NOT NULL DEFAULT 'BASIC',
  "durationDays"          INTEGER     NOT NULL DEFAULT 7,
  "budgetPKR"             FLOAT8      NOT NULL DEFAULT 1000,
  "placements"            TEXT[]      NOT NULL DEFAULT ARRAY['HOMEPAGE', 'SEARCH_TOP'],

  "status"                TEXT        NOT NULL DEFAULT 'PENDING',
  "startDate"             TIMESTAMPTZ,
  "endDate"               TIMESTAMPTZ,

  "viewsCount"            INTEGER     NOT NULL DEFAULT 0,
  "clicksCount"           INTEGER     NOT NULL DEFAULT 0,
  "searchImpressions"     INTEGER     NOT NULL DEFAULT 0,

  "stripeSessionId"       TEXT        UNIQUE,
  "stripePaymentIntentId" TEXT,

  "adminNote"             TEXT,
  "createdAt"             TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"             TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Indexes for Super Fast Queries ─────────────────────────────────────────
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
  console.log('📦 Ensuring Promotion table & indexes exist in PostgreSQL...');
  await client.query(sql);
  console.log('✅ SUCCESS: Promotion table verified in Supabase PostgreSQL!');
  await client.end();
} catch (e) {
  console.error('❌ ERROR creating Promotion table:', e.message);
  await client.end();
}
