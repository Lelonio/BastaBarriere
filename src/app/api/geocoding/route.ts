import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')
    
    if (!address) {
      return NextResponse.json(
        { error: 'Indirizzo mancante' },
        { status: 400 }
      )
    }

    // Estrai il numero civico se presente
    const civicNumberRegex = /^(\d+)\s+(.+)$|^([^\d]+)\s+(\d+)$/
    let streetName = address.trim()
    let civicNumber = ''
    
    const match = address.match(civicNumberRegex)
    if (match) {
      if (match[1] && match[2]) {
        // Numero all'inizio: "123 Via Roma"
        civicNumber = match[1]
        streetName = match[2].trim()
      } else if (match[3] && match[4]) {
        // Numero alla fine: "Via Roma 123"
        civicNumber = match[4]
        streetName = match[3].trim()
      }
    }

    // Prova prima con la query completa
    let searchQuery = `${address}, Civitavecchia, RM, Italia`
    
    // Se non trova con il numero civico, prova senza
    const results = await tryGeocoding(searchQuery)
    
    if (!results.success && civicNumber) {
      // Riprova senza numero civico
      searchQuery = `${streetName}, Civitavecchia, RM, Italia`
      const retryResults = await tryGeocoding(searchQuery)
      
      if (retryResults.success) {
        return NextResponse.json({
          ...retryResults,
          originalAddress: address,
          civicNumber: civicNumber,
          streetName: streetName
        })
      }
    }
    
    if (results.success) {
      return NextResponse.json({
        ...results,
        originalAddress: address,
        civicNumber: civicNumber,
        streetName: streetName
      })
    }
    
    return NextResponse.json(
      { error: 'Indirizzo non trovato a Civitavecchia' },
      { status: 404 }
    )
    
  } catch (error) {
    console.error('Errore geocoding:', error)
    return NextResponse.json(
      { error: 'Errore durante la geolocalizzazione dell\'indirizzo' },
      { status: 500 }
    )
  }
}

// Funzione helper per tentare il geocoding
async function tryGeocoding(query: string) {
  try {
    // Prova diverse strategie di ricerca
    const strategies = [
      // Strategia 1: Query originale
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&accept-language=it&countrycodes=it&addressdetails=1`,
      // Strategia 2: Senza "Cisterna Faro" nella query
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query.replace(/Cisterna Faro,/gi, '').trim())}&limit=5&accept-language=it&countrycodes=it&addressdetails=1`,
      // Strategia 3: Solo nome via + Civitavecchia
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query.split(',')[0] + ', Civitavecchia, RM, Italia')}&limit=5&accept-language=it&countrycodes=it&addressdetails=1`
    ]
    
    let bestResult = null
    let bestScore = 0
    
    for (const strategy of strategies) {
      try {
        const response = await fetch(strategy, {
          headers: {
            'User-Agent': 'BastaBarriere/1.0 (geocoding service)'
          }
        })
        
        if (!response.ok) continue
        
        const data = await response.json()
        
        if (!data || data.length === 0) continue
        
        // Analizza i risultati di questa strategia
        for (const result of data) {
          const displayName = result.display_name || ''
          const addressParts = result.address || {}
          
          // Calcola un punteggio di rilevanza
          let score = 0
          
          // Priorità alta se contiene Civitavecchia
          if (displayName.toLowerCase().includes('civitavecchia')) {
            score += 100
          }
          
          // Priorità alta se la città è Civitavecchia
          if (addressParts.city?.toLowerCase() === 'civitavecchia') {
            score += 80
          }
          
          // Priorità media se è in provincia di Roma
          if (addressParts.state === 'Lazio' || addressParts.county?.includes('Roma')) {
            score += 20
          }
          
          
          // Bonus per risultati che non contengono frazioni
          if (!displayName.match(/\b(Faro|Cisterna|Le Vignole|San Giuliano)\b/)) {
            score += 30
          }
          
          if (score > bestScore) {
            bestScore = score
            bestResult = result
          }
        }
      } catch (error) {
        console.error('Errore strategia geocoding:', error)
        continue
      }
    }
    
    if (!bestResult || bestScore < 80) {
      return { success: false, error: 'Nessun risultato rilevante per Civitavecchia centro' }
    }
    
    // Estrai le coordinate
    const lat = parseFloat(bestResult.lat)
    const lng = parseFloat(bestResult.lon)
    
    // Formatta l'indirizzo completo
    let formattedAddress = bestResult.display_name || query
    
    
    return {
      success: true,
      lat,
      lng,
      address: formattedAddress,
      importance: bestResult.importance,
      type: bestResult.type,
      class: bestResult.class,
      addressParts: bestResult.address
    }
    
  } catch (error) {
    console.error('Errore in tryGeocoding:', error)
    return { success: false, error: error.message }
  }
}

// POST per geocoding batch (per future implementazioni)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { addresses } = body
    
    if (!addresses || !Array.isArray(addresses)) {
      return NextResponse.json(
        { error: 'Array di indirizzi richiesto' },
        { status: 400 }
      )
    }
    
    // Limita a 10 indirizzi per evitare abusi
    const limitedAddresses = addresses.slice(0, 10)
    
    const results = await Promise.allSettled(
      limitedAddresses.map(async (address: string) => {
        const searchQuery = `${address}, Civitavecchia, RM, Italia`
        const result = await tryGeocoding(searchQuery)
        
        if (result.success) {
          return {
            address,
            lat: result.lat,
            lng: result.lng,
            formattedAddress: result.address
          }
        } else {
          return { address, error: 'Indirizzo non trovato a Civitavecchia' }
        }
      })
    )
    
    const successfulResults = results
      .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
      .map(result => result.value)
    
    return NextResponse.json({
      success: true,
      results: successfulResults,
      total: successfulResults.length
    })
    
  } catch (error) {
    console.error('Errore batch geocoding:', error)
    return NextResponse.json(
      { error: 'Errore durante la geolocalizzazione batch' },
      { status: 500 }
    )
  }
}
