const { PrismaClient } = require('@prisma/client')

// Script per migrare dati da SQLite a Supabase
async function migrateToSupabase() {
  console.log('🚀 Inizio migrazione a Supabase...')
  
  // 1. Connetti al database SQLite locale
  const sqlitePrisma = new PrismaClient({
    datasources: {
      db: {
        url: 'file:./db/custom.db'
      }
    }
  })
  
  try {
    // 2. Leggi dati da SQLite
    console.log('📖 Lettura dati da SQLite...')
    const segnalazioni = await sqlitePrisma.segnalazione.findMany()
    console.log(`📊 Trovate ${segnalazioni.length} segnalazioni`)
    
    if (segnalazioni.length === 0) {
      console.log('✅ Nessun dato da migrare')
      return
    }
    
    // 3. Mostra dati da migrare
    console.log('📋 Dati da migrare:')
    segnalazioni.forEach((s, index) => {
      console.log(`${index + 1}. ${s.titolo} - ${s.tipo} - ${s.indirizzo}`)
    })
    
    console.log(`✅ Pronti a migrare ${segnalazioni.length} segnalazioni`)
    console.log('📝 Copia questi dati per inserirli manualmente in Supabase o usa il dashboard')
    
  } catch (error) {
    console.error('❌ Errore durante la migrazione:', error)
    throw error
  } finally {
    await sqlitePrisma.$disconnect()
  }
}

// Esegui migrazione
if (require.main === module) {
  migrateToSupabase()
    .then(() => {
      console.log('🎉 Analisi completata!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Analisi fallita:', error)
      process.exit(1)
    })
}

module.exports = { migrateToSupabase }