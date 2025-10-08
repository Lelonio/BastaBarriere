import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  try {
    if (isAdminAuthenticated(request)) {
      return NextResponse.json({ 
        success: true, 
        message: 'Token valido' 
      })
    } else {
      return NextResponse.json(
        { error: 'Token non valido o mancante' },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Errore verifica token:', error)
    return NextResponse.json(
      { error: 'Errore del server' },
      { status: 500 }
    )
  }
}