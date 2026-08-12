// src/lib/prisma.ts
import { PrismaClient } from '../generated/client/client'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/nexmove'

const adapter = new PrismaPg({
  connectionString: dbUrl,
})

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma
