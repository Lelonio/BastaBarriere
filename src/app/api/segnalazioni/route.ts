import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo')
    const stato = searchParams.get('stato')
    
    let whereClause = {}
    
    if (tipo && tipo !== 'tutti') {
      whereClause = { ...whereClause, tipo }
    }
    
    if (stato && stato !== 'tutti') {
      whereClause = { ...whereClause, stato }
    }
    
    const segnalazioni = await db.segnalazione.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    return NextResponse.json(segnalazioni)
  } catch (error) {
    console.error('Errore nel recupero delle segnalazioni:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero delle segnalazioni' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      tipo,
      titolo,
      descrizione,
      indirizzo,
      gravita,
      lat,
      lng,
      fotoUrl,
      nomeSegnalante,
      emailSegnalante,
      telefonoSegnalante
    } = body
    
    // Validazione dei campi obbligatori
    if (!tipo || !titolo || !descrizione || !indirizzo || !gravita || !lat || !lng) {
      return NextResponse.json(
        { error: 'Campi obbligatori mancanti' },
        { status: 400 }
      )
    }
    
    const segnalazione = await db.segnalazione.create({
      data: {
        tipo,
        titolo,
        descrizione,
        indirizzo,
        gravita,
        lat,
        lng,
        fotoUrl,
        nomeSegnalante,
        emailSegnalante,
        telefonoSegnalante
      }
    })
    
    return NextResponse.json(segnalazione, { status: 201 })
  } catch (error) {
    console.error('Errore nella creazione della segnalazione:', error)
    return NextResponse.json(
      { error: 'Errore nella creazione della segnalazione' },
      { status: 500 }
    )
  }
}