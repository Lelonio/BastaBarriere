import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'Nessun file fornito' },
        { status: 400 }
      )
    }

    // Verifica che sia un'immagine
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Il file deve essere un\'immagine' },
        { status: 400 }
      )
    }

    // Verifica dimensione massima (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'L\'immagine non può superare i 5MB' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Crea la directory uploads se non esiste
    const uploadsDir = join(process.cwd(), 'public', 'uploads')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Genera un nome file unico
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 8)
    const fileName = `${timestamp}_${randomString}_${file.name}`
    const filePath = join(uploadsDir, fileName)

    // Salva il file
    await writeFile(filePath, buffer)

    // Restituisci l'URL pubblico
    const fileUrl = `/uploads/${fileName}`

    return NextResponse.json({
      success: true,
      fileUrl,
      fileName,
      message: 'File caricato con successo'
    })

  } catch (error) {
    console.error('Errore upload file:', error)
    return NextResponse.json(
      { error: 'Errore durante il caricamento del file' },
      { status: 500 }
    )
  }
}