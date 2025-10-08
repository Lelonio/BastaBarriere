import { NextRequest, NextResponse } from 'next/server'

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

    // Verifica dimensione massima (3MB per base64 - più piccolo del precedente)
    if (file.size > 3 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'L\'immagine non può superare i 3MB' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Converti in base64
    const base64String = buffer.toString('base64')
    
    // Crea il data URL completo
    const dataUrl = `data:${file.type};base64,${base64String}`

    // Genera un ID unico per il file
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 8)
    const fileId = `${timestamp}_${randomString}`

    return NextResponse.json({
      success: true,
      fileUrl: dataUrl,
      fileId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
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