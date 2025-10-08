import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const segnalazione = await db.segnalazione.findUnique({
      where: {
        id: params.id
      }
    })
    
    if (!segnalazione) {
      return NextResponse.json(
        { error: 'Segnalazione non trovata' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(segnalazione)
  } catch (error) {
    console.error('Errore nel recupero della segnalazione:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero della segnalazione' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { stato } = body
    
    if (!stato || !['aperta', 'in_lavorazione', 'risolta'].includes(stato)) {
      return NextResponse.json(
        { error: 'Stato non valido' },
        { status: 400 }
      )
    }
    
    const segnalazione = await db.segnalazione.update({
      where: {
        id: params.id
      },
      data: {
        stato
      }
    })
    
    return NextResponse.json(segnalazione)
  } catch (error) {
    console.error('Errore nell\'aggiornamento della segnalazione:', error)
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento della segnalazione' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const segnalazione = await db.segnalazione.findUnique({
      where: {
        id: params.id
      }
    })
    
    if (!segnalazione) {
      return NextResponse.json(
        { error: 'Segnalazione non trovata' },
        { status: 404 }
      )
    }
    
    await db.segnalazione.delete({
      where: {
        id: params.id
      }
    })
    
    return NextResponse.json({ message: 'Segnalazione eliminata con successo' })
  } catch (error) {
    console.error('Errore nell\'eliminazione della segnalazione:', error)
    return NextResponse.json(
      { error: 'Errore nell\'eliminazione della segnalazione' },
      { status: 500 }
    )
  }
}