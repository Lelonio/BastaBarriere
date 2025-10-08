import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const segnalazioneId = params.id
    const body = await request.json()
    const { tipo } = body // 'pertinente' o 'non_pertinente'

    if (!tipo || !['pertinente', 'non_pertinente'].includes(tipo)) {
      return NextResponse.json(
        { error: 'Tipo di valutazione non valido' },
        { status: 400 }
      )
    }

    // Verifica che la segnalazione esista
    const segnalazione = await db.segnalazione.findUnique({
      where: { id: segnalazioneId }
    })

    if (!segnalazione) {
      return NextResponse.json(
        { error: 'Segnalazione non trovata' },
        { status: 404 }
      )
    }

    // Aggiorna il contatore delle valutazioni
    const updateData = tipo === 'pertinente' 
      ? { valutazioniPertinenti: { increment: 1 } }
      : { valutazioniNonPertinenti: { increment: 1 } }

    const updatedSegnalazione = await db.segnalazione.update({
      where: { id: segnalazioneId },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      valutazioniPertinenti: updatedSegnalazione.valutazioniPertinenti,
      valutazioniNonPertinenti: updatedSegnalazione.valutazioniNonPertinenti
    })
  } catch (error) {
    console.error('Errore nella valutazione della segnalazione:', error)
    return NextResponse.json(
      { error: 'Errore nella valutazione della segnalazione' },
      { status: 500 }
    )
  }
}