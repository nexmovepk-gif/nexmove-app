// prisma/seed-investor-deals.mjs
// Run: node prisma/seed-investor-deals.mjs
import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres.xtwvecumbnmzsafdknvh:-dbnexmove786@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

const sampleDeals = [
  {
    title: 'Luxury 3-Bed Penthouse — Goldcrest Executive',
    location: 'DHA Phase 5, Sector C',
    city: 'Lahore',
    propertyType: 'APARTMENT',
    pricePKR: 42000000,
    marketValuationPKR: 48000000,
    discountPct: 12.5,
    rentalYieldPct: 9.8,
    capitalGrowth3YrPct: 28.5,
    roiScore: 92,
    isDistress: true,
    isOffMarket: false,
    escrowSecured: true,
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=60',
    agencyName: 'Zameen Experts & Advisory',
    status: 'ACTIVE'
  },
  {
    title: 'High-Yield Commercial Floor — Blue Area Towers',
    location: 'Jinnah Avenue, Blue Area',
    city: 'Islamabad',
    propertyType: 'COMMERCIAL',
    pricePKR: 85000000,
    marketValuationPKR: 98000000,
    discountPct: 13.2,
    rentalYieldPct: 11.2,
    capitalGrowth3YrPct: 34.0,
    roiScore: 96,
    isDistress: false,
    isOffMarket: true,
    escrowSecured: true,
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=60',
    agencyName: 'Islamabad Capital Realty',
    status: 'ACTIVE'
  },
  {
    title: '1 Kanal Modern Designer Villa — Phase 6',
    location: 'Block L, DHA Phase 6',
    city: 'Lahore',
    propertyType: 'VILLA',
    pricePKR: 95000000,
    marketValuationPKR: 110000000,
    discountPct: 13.6,
    rentalYieldPct: 8.4,
    capitalGrowth3YrPct: 31.0,
    roiScore: 89,
    isDistress: true,
    isOffMarket: true,
    escrowSecured: true,
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop&q=60',
    agencyName: 'Premier Royal Estate',
    status: 'ACTIVE'
  }
];

async function seed() {
  await client.connect();
  const check = await client.query('SELECT COUNT(*) FROM "InvestmentDeal"');
  if (parseInt(check.rows[0].count, 10) === 0) {
    for (const d of sampleDeals) {
      await client.query(`
        INSERT INTO "InvestmentDeal" 
        ("title", "location", "city", "propertyType", "pricePKR", "marketValuationPKR", "discountPct", "rentalYieldPct", "capitalGrowth3YrPct", "roiScore", "isDistress", "isOffMarket", "escrowSecured", "image", "agencyName", "status")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      `, [
        d.title, d.location, d.city, d.propertyType, d.pricePKR, d.marketValuationPKR,
        d.discountPct, d.rentalYieldPct, d.capitalGrowth3YrPct, d.roiScore,
        d.isDistress, d.isOffMarket, d.escrowSecured, d.image, d.agencyName, d.status
      ]);
    }
    console.log('✅ Seeded 3 active verified investment deals into Supabase!');
  } else {
    console.log('ℹ️ Deals already present in database:', check.rows[0].count);
  }
  await client.end();
}

seed().catch(console.error);
