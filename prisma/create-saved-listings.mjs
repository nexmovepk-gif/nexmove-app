import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres.xtwvecumbnmzsafdknvh:-dbnexmove786@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

const sql = `
CREATE TABLE IF NOT EXISTS "SavedListing" (
  "id"              TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"          TEXT        NOT NULL,
  "propertyId"      TEXT,
  "publicListingId" TEXT,
  "note"            TEXT,
  "savedAt"         TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "SavedListing_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SavedListing_userId_propertyId_key" UNIQUE ("userId", "propertyId"),
  CONSTRAINT "SavedListing_userId_publicListingId_key" UNIQUE ("userId", "publicListingId"),
  CONSTRAINT "SavedListing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "SavedListing_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE,
  CONSTRAINT "SavedListing_publicListingId_fkey" FOREIGN KEY ("publicListingId") REFERENCES "PublicListing"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "SavedListing_userId_idx" ON "SavedListing"("userId");
`;

try {
  await client.connect();
  await client.query(sql);
  console.log('SUCCESS: SavedListing table created in Supabase!');
  await client.end();
} catch (e) {
  console.error('ERROR:', e.message);
  await client.end();
}
