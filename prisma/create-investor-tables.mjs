// prisma/create-investor-tables.mjs
// Run: node prisma/create-investor-tables.mjs
// Creates InvestmentDeal, InvestorPortfolio, InvestorCashflow, InvestorWallet tables in Supabase Postgres

import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres.xtwvecumbnmzsafdknvh:-dbnexmove786@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

const sql = `
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Enums ───────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "InvestmentDealStatus" AS ENUM ('ACTIVE', 'RESERVED', 'FUNDED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "InvestorPortfolioStatus" AS ENUM ('ACTIVE', 'PENDING_RENEWAL', 'EXITED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "CashflowType" AS ENUM ('RENTAL_INCOME', 'PROFIT_DISTRIBUTION', 'CAPITAL_EXIT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "CashflowStatus" AS ENUM ('COMPLETED', 'PROCESSING');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── InvestmentDeal ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "InvestmentDeal" (
  "id"                  TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "title"               TEXT        NOT NULL,
  "location"            TEXT        NOT NULL,
  "city"                TEXT        NOT NULL,
  "propertyType"        TEXT        NOT NULL,
  "pricePKR"            FLOAT8      NOT NULL,
  "marketValuationPKR"  FLOAT8      NOT NULL,
  "discountPct"         FLOAT8      NOT NULL DEFAULT 0,
  "rentalYieldPct"      FLOAT8      NOT NULL DEFAULT 0,
  "capitalGrowth3YrPct" FLOAT8      NOT NULL DEFAULT 0,
  "roiScore"            INTEGER     NOT NULL DEFAULT 0,
  "isDistress"          BOOLEAN     NOT NULL DEFAULT false,
  "isOffMarket"         BOOLEAN     NOT NULL DEFAULT false,
  "escrowSecured"       BOOLEAN     NOT NULL DEFAULT true,
  "image"               TEXT,
  "agencyName"          TEXT        NOT NULL,
  "agencyId"            TEXT,
  "status"              "InvestmentDealStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt"           TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── InvestorPortfolio ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "InvestorPortfolio" (
  "id"                  TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId"              TEXT        NOT NULL,
  "dealId"              TEXT        NOT NULL,
  "propertyTitle"       TEXT        NOT NULL,
  "location"            TEXT        NOT NULL,
  "city"                TEXT        NOT NULL,
  "propertyType"        TEXT        NOT NULL,
  "image"               TEXT,
  "status"              "InvestorPortfolioStatus" NOT NULL DEFAULT 'ACTIVE',
  "startDate"           TIMESTAMPTZ NOT NULL DEFAULT now(),
  "maturityDate"        TIMESTAMPTZ NOT NULL,
  "investedAmountPKR"   FLOAT8      NOT NULL,
  "currentValuePKR"     FLOAT8      NOT NULL,
  "equitySharePct"      FLOAT8      NOT NULL,
  "fixedRoiPct"         FLOAT8      NOT NULL,
  "monthlyYieldPKR"     FLOAT8      NOT NULL,
  "agencyName"          TEXT        NOT NULL,
  "contractPdfName"     TEXT,
  "exitDate"            TIMESTAMPTZ,
  "finalSaleValuePKR"   FLOAT8,
  "netCapitalGainsPKR"  FLOAT8,
  "totalRoiPct"         FLOAT8,
  "createdAt"           TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"           TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_portfolio_user FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT fk_portfolio_deal FOREIGN KEY ("dealId") REFERENCES "InvestmentDeal"("id") ON DELETE CASCADE
);

-- ─── InvestorCashflow ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "InvestorCashflow" (
  "id"              TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId"          TEXT        NOT NULL,
  "portfolioId"     TEXT,
  "propertyTitle"   TEXT        NOT NULL,
  "type"            "CashflowType"   NOT NULL,
  "grossAmountPKR"  FLOAT8      NOT NULL,
  "fbrTaxPKR"       FLOAT8      NOT NULL DEFAULT 0,
  "netPayoutPKR"    FLOAT8      NOT NULL,
  "paymentMethod"   TEXT,
  "receiptId"       TEXT,
  "status"          "CashflowStatus" NOT NULL DEFAULT 'COMPLETED',
  "date"            TIMESTAMPTZ NOT NULL DEFAULT now(),
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_cashflow_user      FOREIGN KEY ("userId")      REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT fk_cashflow_portfolio FOREIGN KEY ("portfolioId") REFERENCES "InvestorPortfolio"("id") ON DELETE SET NULL
);

-- ─── InvestorWallet ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "InvestorWallet" (
  "id"          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId"      TEXT        NOT NULL UNIQUE,
  "balancePKR"  FLOAT8      NOT NULL DEFAULT 0,
  "pendingPKR"  FLOAT8      NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_wallet_user FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_investor_portfolio_user ON "InvestorPortfolio" ("userId");
CREATE INDEX IF NOT EXISTS idx_investor_cashflow_user  ON "InvestorCashflow"  ("userId");
CREATE INDEX IF NOT EXISTS idx_investment_deal_status  ON "InvestmentDeal"    ("status");
`;

try {
  console.log('🚀 Connecting to Supabase PostgreSQL database...');
  await client.connect();
  console.log('📦 Creating Investor Portal tables...');
  await client.query(sql);
  console.log('✅ SUCCESS: All Investor Portal tables created in Supabase!');
  console.log('   • InvestmentDeal');
  console.log('   • InvestorPortfolio');
  console.log('   • InvestorCashflow');
  console.log('   • InvestorWallet');
  await client.end();
} catch (e) {
  console.error('❌ ERROR:', e.message);
  await client.end();
}
