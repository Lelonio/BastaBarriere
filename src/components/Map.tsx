'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface Segnalazione {
  id: string
  tipo: 'buca' | 'barriera' | 'illuminazione' | 'altro'
  titolo: string
  descrizione: string
  indirizzo: string
  gravita: 'bassa' | 'media' | 'alta'
  stato: 'aperta' | 'in_lavorazione' | 'risolta'
  lat: number
  lng: number
  createdAt: string
  fotoUrl?: string
  nomeSegnalante?: string
}

interface MapProps {
  segnalazioni: Segnalazione[]
  userLocation?: { lat: number; lng: number } | null
  onSegnalazioneClick?: (segnalazione: Segnalazione) => void
}

// Fix per le icone di Leaflet in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

export default function Map({ segnalazioni, userLocation, onSegnalazioneClick }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Inizializza la mappa centrata su Civitavecchia
    const map = L.map(mapRef.current).setView([42.0909, 11.7935], 13)

    // Aggiunge il tile layer di OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)

    // Imposta lo z-index del tile layer per essere sotto i marker
    map.getPane('tilePane').style.zIndex = '1'
    map.getPane('overlayPane').style.zIndex = '2'
    map.getPane('markerPane').style.zIndex = '3'
    map.getPane('popupPane').style.zIndex = '4'

    mapInstanceRef.current = map

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!mapInstanceRef.current) return

    // Rimuovi i marker esistenti
    markersRef.current.forEach(marker => {
      mapInstanceRef.current?.removeLayer(marker)
    })
    markersRef.current = []

    // Funzione per ottenere l'icona in base al tipo
    const getIcon = (tipo: string, stato: string) => {
      const colorMap = {
        buca: { aperta: '#ef4444', in_lavorazione: '#eab308', risolta: '#22c55e' },
        barriera: { aperta: '#f97316', in_lavorazione: '#eab308', risolta: '#22c55e' },
        illuminazione: { aperta: '#a855f7', in_lavorazione: '#eab308', risolta: '#22c55e' },
        altro: { aperta: '#6b7280', in_lavorazione: '#eab308', risolta: '#22c55e' }
      }

      const color = colorMap[tipo as keyof typeof colorMap]?.[stato as keyof typeof colorMap.buca] || '#6b7280'

      return L.divIcon({
        html: `
          <div style="
            background-color: ${color};
            width: 24px;
            height: 24px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="
              transform: rotate(45deg);
              color: white;
              font-size: 12px;
              font-weight: bold;
            ">
              ${tipo.charAt(0).toUpperCase()}
            </div>
          </div>
        `,
        className: 'custom-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 24],
        popupAnchor: [0, -24],
      })
    }

    // Aggiungi i marker per ogni segnalazione
    segnalazioni.forEach(segnalazione => {
      const marker = L.marker([segnalazione.lat, segnalazione.lng], {
        icon: getIcon(segnalazione.tipo, segnalazione.stato)
      })

      // Crea il popup content
      const popupContent = `
        <div style="min-width: 200px;">
          <h3 style="margin: 0 0 8px 0; font-weight: bold; color: #1f2937;">
            ${segnalazione.titolo}
          </h3>
          <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
            ${segnalazione.descrizione}
          </p>
          <div style="margin: 0 0 4px 0; font-size: 12px; color: #9ca3af;">
            <strong>Tipo:</strong> ${segnalazione.tipo}<br>
            <strong>Gravità:</strong> ${segnalazione.gravita}<br>
            <strong>Stato:</strong> ${segnalazione.stato.replace('_', ' ')}<br>
            <strong>Indirizzo:</strong> ${segnalazione.indirizzo}
          </div>
          <div style="margin: 8px 0 0 0; font-size: 11px; color: #9ca3af;">
            ${new Date(segnalazione.createdAt).toLocaleDateString('it-IT')}
          </div>
        </div>
      `

      marker.bindPopup(popupContent)
      
      marker.on('click', () => {
        if (onSegnalazioneClick) {
          onSegnalazioneClick(segnalazione)
        }
      })

      marker.addTo(mapInstanceRef.current)
      markersRef.current.push(marker)
    })

    // Aggiungi marker per la posizione dell'utente
    if (userLocation) {
      const userMarker = L.marker([userLocation.lat, userLocation.lng], {
        icon: L.divIcon({
          html: `
            <div style="
              background-color: #3b82f6;
              width: 20px;
              height: 20px;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            "></div>
          `,
          className: 'user-location-marker',
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        })
      })

      userMarker.bindPopup('La tua posizione')
      userMarker.addTo(mapInstanceRef.current)
      markersRef.current.push(userMarker)
    }

    // Adatta la mappa per mostrare tutti i marker
    if (segnalazioni.length > 0) {
      const group = new L.FeatureGroup(markersRef.current)
      mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1))
    }

  }, [segnalazioni, userLocation, onSegnalazioneClick])

  return (
    <div 
      ref={mapRef} 
      className="w-full h-96 rounded-lg border-2 border-gray-200"
      style={{ zIndex: 1 }}
    />
  )
}