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

    // Usa Nominatim di OpenStreetMap per il geocoding
    const geocodingUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&accept-language=it`
    
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
        const geocodingUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&accept-language=it`
        
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
          return { address, error: 'Indirizzo non trovato' }
        }
        
        const result = data[0]
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