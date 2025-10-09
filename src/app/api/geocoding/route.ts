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

    // Usa Nominatim di OpenStreetMap per il geocoding limitato a Civitavecchia
    // Aggiunge "Civitavecchia" alla query per limitare la ricerca
    const searchQuery = `${address}, Civitavecchia, Italia`
    const geocodingUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&accept-language=it&countrycodes=it`
    
    const response = await fetch(geocodingUrl, {
      headers: {
        'User-Agent': 'BastaBarriere/1.0 (geocoding service)'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Geocoding service error: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Indirizzo non trovato' },
        { status: 404 }
      )
    }
    
    const result = data[0]
    
    // Verifica che il risultato sia effettivamente a Civitavecchia
    const displayName = result.display_name || ''
    const addressParts = result.address || {}
    
    // Controlla che l'indirizzo contenga Civitavecchia
    const isCivitavecchia = 
      displayName.toLowerCase().includes('civitavecchia') ||
      addressParts.city?.toLowerCase() === 'civitavecchia' ||
      addressParts.town?.toLowerCase() === 'civitavecchia' ||
      addressParts.municipality?.toLowerCase() === 'civitavecchia'
    
    if (!isCivitavecchia) {
      return NextResponse.json(
        { error: 'Indirizzo non trovato a Civitavecchia' },
        { status: 404 }
      )
    }
    
    // Estrai le coordinate
    const lat = parseFloat(result.lat)
    const lng = parseFloat(result.lon)
    
    // Formatta l'indirizzo completo restituito dal servizio
    const formattedAddress = result.display_name || address
    
    return NextResponse.json({
      success: true,
      lat,
      lng,
      address: formattedAddress,
      originalAddress: address,
      // Informazioni aggiuntive
      importance: result.importance,
      type: result.type,
      class: result.class
    })
    
  } catch (error) {
    console.error('Errore geocoding:', error)
    return NextResponse.json(
      { error: 'Errore durante la geolocalizzazione dell\'indirizzo' },
      { status: 500 }
    )
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
        // Limita la ricerca a Civitavecchia
        const searchQuery = `${address}, Civitavecchia, Italia`
        const geocodingUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&accept-language=it&countrycodes=it`
        
        const response = await fetch(geocodingUrl, {
          headers: {
            'User-Agent': 'BastaBarriere/1.0 (geocoding service)'
          }
        })
        
        if (!response.ok) {
          throw new Error(`Geocoding failed for: ${address}`)
        }
        
        const data = await response.json()
        
        if (!data || data.length === 0) {
          return { address, error: 'Indirizzo non trovato a Civitavecchia' }
        }
        
        const result = data[0]
        
        // Verifica che il risultato sia effettivamente a Civitavecchia
        const displayName = result.display_name || ''
        const addressParts = result.address || {}
        
        const isCivitavecchia = 
          displayName.toLowerCase().includes('civitavecchia') ||
          addressParts.city?.toLowerCase() === 'civitavecchia' ||
          addressParts.town?.toLowerCase() === 'civitavecchia' ||
          addressParts.municipality?.toLowerCase() === 'civitavecchia'
        
        if (!isCivitavecchia) {
          return { address, error: 'Indirizzo non trovato a Civitavecchia' }
        }
        
        return {
          address,
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
          formattedAddress: result.display_name || address
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