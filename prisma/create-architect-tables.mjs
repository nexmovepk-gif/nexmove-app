// prisma/create-architect-tables.mjs
// Run: node prisma/create-architect-tables.mjs
// Ensures ArchitectProfile columns, ArchitectProposal, and ArchitectMessage tables exist in Supabase Postgres

import pg from 'pg';
const { Client } = pg;

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL || 'postgresql://postgres.xtwvecumbnmzsafdknvh:0DlOjs8WLWX2E6q6@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres';

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

const sql = `
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Ensure ArchitectProfile columns exist ──────────────────────────────────
ALTER TABLE IF EXISTS "ArchitectProfile" 
  ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "coverImage" TEXT,
  ADD COLUMN IF NOT EXISTS "coverBannerUrl" TEXT;

-- ─── ArchitectProposal ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "ArchitectProposal" (
  "id"                 TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "architectId"        TEXT        NOT NULL,
  "architectName"      TEXT,
  "agencyName"         TEXT        NOT NULL,
  "agencyId"           TEXT,
  "contactEmail"       TEXT,
  "contactPhone"       TEXT,
  "projectType"        TEXT,
  "plotArea"           TEXT,
  "budgetPKR"          FLOAT8,
  "location"           TEXT,
  "message"            TEXT        NOT NULL,
  "status"             TEXT        NOT NULL DEFAULT 'PENDING',
  "propertyListingId"  TEXT,
  "createdAt"          TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── ArchitectMessage ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "ArchitectMessage" (
  "id"           TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "architectId"  TEXT        NOT NULL,
  "senderName"   TEXT        NOT NULL,
  "senderEmail"  TEXT        NOT NULL,
  "senderPhone"  TEXT,
  "subject"      TEXT,
  "message"      TEXT        NOT NULL,
  "isRead"       BOOLEAN     NOT NULL DEFAULT false,
  "repliedAt"    TIMESTAMPTZ,
  "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_architect_proposal_archId ON "ArchitectProposal" ("architectId");
CREATE INDEX IF NOT EXISTS idx_architect_message_archId  ON "ArchitectMessage"  ("architectId");
CREATE INDEX IF NOT EXISTS idx_architect_message_isRead  ON "ArchitectMessage"  ("isRead");
`;

try {
  console.log('🚀 Connecting to Supabase PostgreSQL database...');
  await client.connect();
  console.log('📦 Ensuring Architect portal tables & columns exist...');
  await client.query(sql);
  console.log('✅ SUCCESS: ArchitectProposal & ArchitectMessage tables verified in Supabase DB!');
  await client.end();
} catch (e) {
  console.error('❌ ERROR:', e.message);
  await client.end();
}
