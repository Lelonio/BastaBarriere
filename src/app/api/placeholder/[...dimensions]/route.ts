import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { dimensions: string[] } }
) {
  try {
    const [width, height] = params.dimensions
    
    // Create a simple SVG placeholder
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Arial, sans-serif" font-size="14" fill="#6b7280">
          ${width} × ${height}
        </text>
      </svg>
    `
    
    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=86400', // Cache for 1 day
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid dimensions' },
      { status: 400 }
    )
  }
}