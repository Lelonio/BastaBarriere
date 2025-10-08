import { createClient } from '@supabase/supabase-js'

// Configurazione Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Client per operazioni server-side (con privilegi admin)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// Client per operazioni client-side (con privilegi limitati)
export const supabaseClient = createClient(
  supabaseUrl,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Helper per verificare la connessione
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabaseAdmin.from('segnalazioni').select('count').single()
    
    if (error) {
      console.error('Errore connessione Supabase:', error)
      return false
    }
    
    console.log('✅ Connessione Supabase funzionante')
    return true
  } catch (error) {
    console.error('❌ Errore test connessione Supabase:', error)
    return false
  }
}