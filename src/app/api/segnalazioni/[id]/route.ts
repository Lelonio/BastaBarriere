import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAdminAuthenticated } from '@/lib/admin-auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Per le richieste GET, permettiamo accesso pubblico (sola lettura)
    // ma se c'è un token admin, lo verifichiamo
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      if (!isAdminAuthenticated(request)) {
        return NextResponse.json(
          { error: 'Token non valido' },
          { status: 401 }
        )
      }
    }

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
    // PATCH richiede autenticazione admin
    if (!isAdminAuthenticated(request)) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      )
    }

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
    // DELETE richiede autenticazione admin
    if (!isAdminAuthenticated(request)) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      )
    }

    // Usa deleteMany che ritorna il conteggio invece di findUnique + delete
    const result = await db.segnalazione.deleteMany({
      where: {
        id: params.id
      }
    })
    
    if (result.count === 0) {
      return NextResponse.json(
        { error: 'Segnalazione non trovata' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ message: 'Segnalazione eliminata con successo' })
  } catch (error) {
    console.error('Errore nell\'eliminazione della segnalazione:', error)
    return NextResponse.json(
      { error: 'Errore nell\'eliminazione della segnalazione' },
      { status: 500 }
    )
  }
}