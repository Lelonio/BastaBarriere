import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : [],
    // Ottimizzazioni per PostgreSQL e Vercel
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Configurazione connection pooling per production
    ...(process.env.NODE_ENV === 'production' && {
      transactionOptions: {
        timeout: 10000,
        isolationLevel: 'ReadCommitted',
      },
    }),
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db