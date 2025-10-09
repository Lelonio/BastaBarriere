import { NextRequest, NextResponse } from 'next/server'
import { Client } from '@googlemaps/google-maps-services-js'
import OpenCageApiClient from 'opencage-api-client'

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

    // Prova prima con Google Geocoding API (più precisa)
    let searchQuery = `${address}, Civitavecchia, RM, Italia`
    let results = await tryGoogleGeocoding(searchQuery)
    
    if (!results.success && civicNumber) {
      // Riprova senza numero civico
      searchQuery = `${streetName}, Civitavecchia, RM, Italia`
      const retryResults = await tryGoogleGeocoding(searchQuery)
      
      if (retryResults.success) {
        return NextResponse.json({
          ...retryResults,
          originalAddress: address,
          civicNumber: civicNumber,
          streetName: streetName,
          provider: 'google'
        })
      }
    }
    
    // Se Google fallisce, prova con OpenCage
    if (!results.success) {
      console.log('Google Geocoding fallito, provo con OpenCage...')
      searchQuery = `${address}, Civitavecchia, RM, Italia`
      results = await tryOpenCageGeocoding(searchQuery)
      
      if (!results.success && civicNumber) {
        searchQuery = `${streetName}, Civitavecchia, RM, Italia`
        const retryResults = await tryOpenCageGeocoding(searchQuery)
        
        if (retryResults.success) {
          return NextResponse.json({
            ...retryResults,
            originalAddress: address,
            civicNumber: civicNumber,
            streetName: streetName,
            provider: 'opencage'
          })
        }
      }
    }
    
    // Se anche OpenCage fallisce, prova con Nominatim come ultimo fallback
    if (!results.success) {
      console.log('OpenCage fallito, provo con Nominatim fallback...')
      searchQuery = `${address}, Civitavecchia, RM, Italia`
      results = await tryNominatimGeocoding(searchQuery)
      
      if (!results.success && civicNumber) {
        searchQuery = `${streetName}, Civitavecchia, RM, Italia`
        const retryResults = await tryNominatimGeocoding(searchQuery)
        
        if (retryResults.success) {
          return NextResponse.json({
            ...retryResults,
            originalAddress: address,
            civicNumber: civicNumber,
            streetName: streetName,
            provider: 'nominatim'
          })
        }
      }
    }
    
    if (results.success) {
      return NextResponse.json({
        ...results,
        originalAddress: address,
        civicNumber: civicNumber,
        streetName: streetName,
        provider: results.provider || 'google'
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

// Funzione per Google Geocoding API (più precisa)
async function tryGoogleGeocoding(query: string) {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY'
    
    if (apiKey === 'YOUR_GOOGLE_MAPS_API_KEY') {
      console.log('Google Maps API key non configurata, uso fallback OpenCage')
      return { success: false, error: 'Google Maps non configurato' }
    }
    
    const client = new Client({})
    
    const response = await client.geocode({
      params: {
        address: query,
        key: apiKey,
        language: 'it',
        region: 'it',
        components: 'country:IT|administrative_area:RM|locality:Civitavecchia'
      }
    })
    
    if (!response.data.results || response.data.results.length === 0) {
      return { success: false, error: 'Nessun risultato Google' }
    }
    
    // Cerca il risultato migliore per Civitavecchia
    let bestResult = null
    let bestScore = 0
    
    for (const result of response.data.results) {
      const formatted = result.formatted_address || ''
      const components = result.address_components || []
      
      let score = 0
      
      // Priorità alta se contiene Civitavecchia
      if (formatted.toLowerCase().includes('civitavecchia')) {
        score += 100
      }
      
      // Analizza i componenti dell'indirizzo
      const cityComponent = components.find(c => 
        c.types.includes('locality') && c.long_name.toLowerCase() === 'civitavecchia'
      )
      if (cityComponent) {
        score += 80
      }
      
      // Priorità se è in provincia di Roma
      const provinceComponent = components.find(c => 
        c.types.includes('administrative_area_level_2') && c.long_name.includes('Roma')
      )
      if (provinceComponent) {
        score += 20
      }
      
      // Priorità per indirizzi con numero civico preciso
      const streetNumberComponent = components.find(c => c.types.includes('street_number'))
      if (streetNumberComponent) {
        score += 30
      }
      
      // Priorità per alta precisione
      if (result.geometry.location_type === 'ROOFTOP' || 
          result.geometry.location_type === 'RANGE_INTERPOLATED') {
        score += 40
      }
      
      if (score > bestScore) {
        bestScore = score
        bestResult = result
      }
    }
    
    if (!bestResult || bestScore < 60) {
      return { success: false, error: 'Nessun risultato Google pertinente' }
    }
    
    // Estrai componenti formattati
    const components = bestResult.address_components || []
    const getComponent = (types: string[]) => {
      const component = components.find(c => 
        types.some(type => c.types.includes(type))
      )
      return component ? component.long_name : ''
    }
    
    return {
      success: true,
      lat: bestResult.geometry.location.lat,
      lng: bestResult.geometry.location.lng,
      address: bestResult.formatted_address,
      location_type: bestResult.geometry.location_type,
      confidence: bestResult.geometry.location_type === 'ROOFTOP' ? 10 : 8,
      provider: 'google',
      components: {
        street_number: getComponent(['street_number']),
        route: getComponent(['route']),
        locality: getComponent(['locality']),
        administrative_area_level_2: getComponent(['administrative_area_level_2']),
        administrative_area_level_1: getComponent(['administrative_area_level_1']),
        country: getComponent(['country']),
        postal_code: getComponent(['postal_code'])
      }
    }
    
  } catch (error) {
    console.error('Errore Google Geocoding:', error)
    return { success: false, error: error.message }
  }
}

// Funzione per OpenCage Geocoding (più preciso)
async function tryOpenCageGeocoding(query: string) {
  try {
    // OpenCage API key - dovresti impostarla come environment variable
    const apiKey = process.env.OPENCAGE_API_KEY || 'YOUR_OPENCAGE_API_KEY'
    
    if (apiKey === 'YOUR_OPENCAGE_API_KEY') {
      console.log('OpenCage API key non configurata, uso fallback Nominatim')
      return { success: false, error: 'OpenCage non configurato' }
    }
    
    const data = await OpenCageApiClient.geocode({ 
      q: query, 
      key: apiKey,
      limit: 5,
      countrycode: 'it',
      language: 'it',
      no_annotations: 1
    })
    
    if (!data.results || data.results.length === 0) {
      return { success: false, error: 'Nessun risultato OpenCage' }
    }
    
    // Cerca il risultato migliore per Civitavecchia
    let bestResult = null
    let bestScore = 0
    
    for (const result of data.results) {
      const formatted = result.formatted || ''
      const components = result.components || {}
      
      let score = 0
      
      // Priorità alta se contiene Civitavecchia
      if (formatted.toLowerCase().includes('civitavecchia')) {
        score += 100
      }
      
      // Priorità alta se la città è Civitavecchia
      if (components.city?.toLowerCase() === 'civitavecchia' ||
          components.town?.toLowerCase() === 'civitavecchia' ||
          components.municipality?.toLowerCase() === 'civitavecchia') {
        score += 80
      }
      
      // Priorità se è in provincia di Roma
      if (components.state === 'Lazio' || components.county?.includes('Roma')) {
        score += 20
      }
      
      // Priorità per alta confidence
      if (result.confidence >= 8) {
        score += 30
      }
      
      if (score > bestScore) {
        bestScore = score
        bestResult = result
      }
    }
    
    if (!bestResult || bestScore < 60) {
      return { success: false, error: 'Nessun risultato OpenCage pertinente' }
    }
    
    return {
      success: true,
      lat: bestResult.geometry.lat,
      lng: bestResult.geometry.lng,
      address: bestResult.formatted,
      confidence: bestResult.confidence,
      provider: 'opencage',
      components: bestResult.components
    }
    
  } catch (error) {
    console.error('Errore OpenCage geocoding:', error)
    return { success: false, error: error.message }
  }
}

// Funzione per Nominatim Geocoding (fallback)
async function tryNominatimGeocoding(query: string) {
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
          
          // Riduci penalità per "Cisterna Faro" (è una frazione di Civitavecchia)
          if (displayName.includes('Cisterna Faro')) {
            score -= 50 // Penalità ridotta, non esclusione totale
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
        console.error('Errore strategia Nominatim:', error)
        continue
      }
    }
    
    if (!bestResult || bestScore < 60) {
      return { success: false, error: 'Nessun risultato Nominatim rilevante' }
    }
    
    // Estrai le coordinate
    const lat = parseFloat(bestResult.lat)
    const lng = parseFloat(bestResult.lon)
    
    // Formatta l'indirizzo completo
    let formattedAddress = bestResult.display_name || query
    
    // Non escludere più "Cisterna Faro" - è una frazione valida di Civitavecchia
    // Il frontend si occuperà di pulire l'indirizzo se necessario
    
    return {
      success: true,
      lat,
      lng,
      address: formattedAddress,
      importance: bestResult.importance,
      type: bestResult.type,
      class: bestResult.class,
      addressParts: bestResult.address,
      provider: 'nominatim'
    }
    
  } catch (error) {
    console.error('Errore in tryNominatimGeocoding:', error)
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
        // Prova prima con Google
        let result = await tryGoogleGeocoding(`${address}, Civitavecchia, RM, Italia`)
        
        // Se Google fallisce, prova con OpenCage
        if (!result.success) {
          result = await tryOpenCageGeocoding(`${address}, Civitavecchia, RM, Italia`)
        }
        
        // Se anche OpenCage fallisce, prova con Nominatim
        if (!result.success) {
          result = await tryNominatimGeocoding(`${address}, Civitavecchia, RM, Italia`)
        }
        
        if (result.success) {
          return {
            address,
            lat: result.lat,
            lng: result.lng,
            formattedAddress: result.address,
            provider: result.provider
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