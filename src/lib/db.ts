import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    // Disabilita prepared statements per evitare conflitti
    __internal: {
      engine: {
        // Disabilita prepared statements che causano problemi in serverless
        useUds: false,
      },
    },
    // Configurazione ottimizzata per PostgreSQL
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Transaction options per production
    ...(process.env.NODE_ENV === 'production' && {
      transactionOptions: {
        timeout: 10000,
        isolationLevel: 'ReadCommitted',
        maxWait: 5000,
      },
    }),
  })

  // Aggiungi gestione errori per prepared statements
  client.$on('error', (e) => {
    console.error('Prisma Error:', e)
  })

  return client
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}

// Funzione helper per retry automatico in caso di prepared statements
export async function prismaWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error: any) {
      // Se è un errore di prepared statement, riprova
      if (
        error.code === '42P05' || 
        (error.message && error.message.includes('prepared statement')) ||
        (error.message && error.message.includes('already exists'))
      ) {
        console.warn(`Prisma prepared statement error (attempt ${attempt}/${maxRetries}):`, error.message)
        
        if (attempt === maxRetries) {
          throw new Error(`Failed after ${maxRetries} attempts: ${error.message}`)
        }
        
        // Attendi prima di riprovare (backoff esponenziale)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100))
        continue
      }
      
      // Per altri errori, lancia subito
      throw error
    }
  }
  
  throw new Error('Unexpected error in prismaWithRetry')
}