import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

// Password admin - in produzione dovresti usare variabili d'ambiente
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (!password) {
      return NextResponse.json(
        { error: 'Password richiesta' },
        { status: 400 }
      )
    }

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Password errata' },
        { status: 401 }
      )
    }

    // Genera token JWT
    const token = jwt.sign(
      { isAdmin: true, timestamp: Date.now() },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    return NextResponse.json({
      success: true,
      token,
      message: 'Login effettuato con successo'
    })

  } catch (error) {
    console.error('Errore login admin:', error)
    return NextResponse.json(
      { error: 'Errore del server' },
      { status: 500 }
    )
  }
}