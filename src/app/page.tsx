'use client'

import { useState, useEffect } from 'react'
import { MapPin, Plus, AlertTriangle, Navigation, Filter, Camera, Clock, CheckCircle, XCircle, Upload, Map as MapIcon, Settings, Crosshair, ThumbsUp, ThumbsDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'

// Import Map component dynamically to avoid SSR issues
const Map = dynamic(() => import('@/components/Map'), { 
  ssr: false,
  loading: () => (
    <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center border-2 border-dashed border-gray-300">
      <div className="text-center">
        <MapIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Caricamento mappa...</p>
      </div>
    </div>
  )
})

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
  emailSegnalante?: string
  telefonoSegnalante?: string
  valutazioniPertinenti?: number
  valutazioniNonPertinenti?: number
}

interface FormData {
  tipo: string
  titolo: string
  descrizione: string
  indirizzo: string
  gravita: string
  nomeSegnalante: string
  emailSegnalante: string
  telefonoSegnalante: string
  foto: File | null
}

export default function Home() {
  const [segnalazioni, setSegnalazioni] = useState<Segnalazione[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [filtroTipo, setFiltroTipo] = useState<string>('tutti')
  const [filtroStato, setFiltroStato] = useState<string>('tutti')
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [locationStatus, setLocationStatus] = useState<string>('')
  const [useCurrentLocation, setUseCurrentLocation] = useState<boolean>(false)
  const [isUploading, setIsUploading] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    tipo: '',
    titolo: '',
    descrizione: '',
    indirizzo: '',
    gravita: '',
    nomeSegnalante: '',
    emailSegnalante: '',
    telefonoSegnalante: '',
    foto: null
  })

  // Carica le segnalazioni dal database
  const loadSegnalazioni = async () => {
    try {
      const params = new URLSearchParams()
      if (filtroTipo !== 'tutti') params.append('tipo', filtroTipo)
      if (filtroStato !== 'tutti') params.append('stato', filtroStato)
      
      const response = await fetch(`/api/segnalazioni?${params}`)
      if (response.ok) {
        const data = await response.json()
        setSegnalazioni(data)
      }
    } catch (error) {
      console.error('Errore nel caricamento delle segnalazioni:', error)
      toast.error('Errore nel caricamento delle segnalazioni')
    }
  }

  useEffect(() => {
    loadSegnalazioni()
  }, [filtroTipo, filtroStato])

  useEffect(() => {
    // Ottieni la posizione dell'utente
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.error('Errore nel ottenere la posizione:', error)
        }
      )
    }
  }, [])

  const handleInputChange = (field: keyof FormData, value: string | File) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Funzione per ottenere la posizione attuale
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('La geolocalizzazione non è supportata dal tuo browser')
      return
    }

    setIsGettingLocation(true)
    setLocationStatus('Rilevamento posizione in corso...')

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        setUserLocation({ lat: latitude, lng: longitude })
        setUseCurrentLocation(true)
        setLocationStatus('Rilevamento posizione in corso...')
        
        try {
          // Reverse geocoding per ottenere l'indirizzo
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=it`,
            {
              headers: {
                'User-Agent': 'BastaBarriere/1.0'
              }
            }
          )
          
          if (response.ok) {
            const data = await response.json()
            const address = data.display_name || `Posizione GPS (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`
            
            setFormData(prev => ({
              ...prev,
              indirizzo: address
            }))
            
            setLocationStatus('Posizione e indirizzo rilevati con successo!')
            toast.success('Posizione e indirizzo rilevati con successo!')
          } else {
            // Fallback alle coordinate se il reverse geocoding fallisce
            setFormData(prev => ({
              ...prev,
              indirizzo: `Posizione GPS (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`
            }))
            
            setLocationStatus('Posizione rilevata (indirizzo non disponibile)')
            toast.success('Posizione rilevata con successo!')
          }
        } catch (error) {
          // Fallback alle coordinate in caso di errore
          setFormData(prev => ({
            ...prev,
            indirizzo: `Posizione GPS (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`
          }))
          
          setLocationStatus('Posizione rilevata (indirizzo non disponibile)')
          toast.success('Posizione rilevata con successo!')
        }
        
        setTimeout(() => {
          setIsGettingLocation(false)
          setLocationStatus('')
        }, 2000)
      },
      (error) => {
        console.error('Errore nel rilevare la posizione:', error)
        let errorMessage = 'Impossibile rilevare la posizione'
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Permesso di geolocalizzazione negato. Per favore abilita la posizione nel tuo browser.'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Informazioni sulla posizione non disponibili.'
            break
          case error.TIMEOUT:
            errorMessage = 'Timeout nel rilevare la posizione.'
            break
        }
        
        setLocationStatus(errorMessage)
        toast.error(errorMessage)
        setIsGettingLocation(false)
        setUseCurrentLocation(false)
        
        setTimeout(() => {
          setLocationStatus('')
        }, 3000)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }

  // Funzione per resettare l'uso della posizione attuale
  const resetLocationUsage = () => {
    setUseCurrentLocation(false)
    setLocationStatus('')
    setFormData(prev => ({
      ...prev,
      indirizzo: ''
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Usa le coordinate dell'utente se disponibili, altrimenti usa quelle di Civitavecchia
      let lat = 42.0909 // Default Civitavecchia
      let lng = 11.7935  // Default Civitavecchia
      
      if (useCurrentLocation && userLocation) {
        lat = userLocation.lat
        lng = userLocation.lng
      } else if (userLocation) {
        // Se abbiamo la posizione utente ma non stiamo usando esplicitamente quella attuale
        lat = userLocation.lat
        lng = userLocation.lng
      }

      let fotoUrl = undefined
      if (formData.foto) {
        // Carica la foto usando l'API di upload
        setIsUploading(true)
        const uploadFormData = new FormData()
        uploadFormData.append('file', formData.foto)
        
        try {
          const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: uploadFormData
          })
          
          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json()
            fotoUrl = uploadData.fileUrl
            toast.success('Foto caricata con successo!')
          } else {
            const errorData = await uploadResponse.json()
            toast.error(errorData.error || 'Errore nel caricamento della foto')
            console.error('Errore upload foto:', errorData)
          }
        } catch (error) {
          toast.error('Errore nel caricamento della foto')
          console.error('Errore upload foto:', error)
        } finally {
          setIsUploading(false)
        }
      }

      const response = await fetch('/api/segnalazioni', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tipo: formData.tipo,
          titolo: formData.titolo,
          descrizione: formData.descrizione,
          indirizzo: formData.indirizzo,
          gravita: formData.gravita,
          lat,
          lng,
          fotoUrl,
          nomeSegnalante: formData.nomeSegnalante || undefined,
          emailSegnalante: formData.emailSegnalante || undefined,
          telefonoSegnalante: formData.telefonoSegnalante || undefined
        })
      })

      if (response.ok) {
        toast.success('Segnalazione inviata con successo!')
        setIsFormOpen(false)
        // Resetta il form
        setFormData({
          tipo: '',
          titolo: '',
          descrizione: '',
          indirizzo: '',
          gravita: '',
          nomeSegnalante: '',
          emailSegnalante: '',
          telefonoSegnalante: '',
          foto: null
        })
        // Resetta anche lo stato della posizione
        setUseCurrentLocation(false)
        setLocationStatus('')
        // Ricarica le segnalazioni
        loadSegnalazioni()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Errore nell\'invio della segnalazione')
      }
    } catch (error) {
      console.error('Errore nell\'invio della segnalazione:', error)
      toast.error('Errore nell\'invio della segnalazione')
    } finally {
      setIsLoading(false)
    }
  }

  const handleValuta = async (segnalazioneId: string, tipo: 'pertinente' | 'non_pertinente') => {
    try {
      const response = await fetch(`/api/segnalazioni/${segnalazioneId}/valuta`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tipo })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`Valutazione registrata: ${tipo === 'pertinente' ? 'Pertinente' : 'Non pertinente'}`)
        
        // Aggiorna le segnalazioni con i nuovi conteggi
        setSegnalazioni(prev => prev.map(s => 
          s.id === segnalazioneId 
            ? { 
                ...s, 
                valutazioniPertinenti: data.valutazioniPertinenti,
                valutazioniNonPertinenti: data.valutazioniNonPertinenti
              }
            : s
        ))
      } else {
        const error = await response.json()
        toast.error(error.error || 'Errore nella valutazione')
      }
    } catch (error) {
      console.error('Errore nella valutazione:', error)
      toast.error('Errore nella valutazione')
    }
  }

  const getTipoIcon = (tipo: string) => {
    switch(tipo) {
      case 'buca': return <AlertTriangle className="h-4 w-4" />
      case 'barriera': return <Navigation className="h-4 w-4" />
      case 'illuminazione': return <Camera className="h-4 w-4" />
      default: return <MapPin className="h-4 w-4" />
    }
  }

  const getGravitaColor = (gravita: string) => {
    switch(gravita) {
      case 'alta': return 'bg-red-100 text-red-800 border-red-200'
      case 'media': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'bassa': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatoIcon = (stato: string) => {
    switch(stato) {
      case 'aperta': return <XCircle className="h-4 w-4 text-red-500" />
      case 'in_lavorazione': return <Clock className="h-4 w-4 text-yellow-500" />
      case 'risolta': return <CheckCircle className="h-4 w-4 text-green-500" />
      default: return null
    }
  }

  const getStatoColor = (stato: string) => {
    switch(stato) {
      case 'aperta': return 'bg-red-50 text-red-700 border-red-200'
      case 'in_lavorazione': return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      case 'risolta': return 'bg-green-50 text-green-700 border-green-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const segnalazioniFiltrate = segnalazioni.filter(s => {
    const tipoMatch = filtroTipo === 'tutti' || s.tipo === filtroTipo
    const statoMatch = filtroStato === 'tutti' || s.stato === filtroStato
    return tipoMatch && statoMatch
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 sm:py-6 space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <img
                  src="/logo.png"
                  alt="BastaBarriere Logo"
                  className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">BastaBarriere</h1>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Segnala buche e barriere architettoniche</p>
                <p className="text-xs sm:text-sm text-gray-600 sm:hidden">Segnala barriere architettoniche</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 w-fit mx-auto sm:mx-0">
                {segnalazioni.length} segnalazioni
              </Badge>
              <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Nuova Segnalazione</span>
                    <span className="sm:hidden">Segnala</span>
              
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto dialog-z-index">
                  <DialogHeader>
                    <DialogTitle>Nuova Segnalazione</DialogTitle>
                  </DialogHeader>
                  {useCurrentLocation && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                      <div className="flex items-center space-x-2">
                        <Crosshair className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-blue-800">
                          Stai usando la tua posizione attuale per questa segnalazione
                        </span>
                      </div>
                    </div>
                  )}
                  <form onSubmit={handleSubmit} className="grid gap-4 py-4" onClick={(e) => e.stopPropagation()}>
                    <div className="grid gap-2">
                      <Label htmlFor="tipo">Tipo di problema *</Label>
                      <Select value={formData.tipo} onValueChange={(value) => handleInputChange('tipo', value)}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Seleziona il tipo" />
                        </SelectTrigger>
                        <SelectContent className="dialog-select-content">
                          <SelectItem value="buca">Buca</SelectItem>
                          <SelectItem value="barriera">Barriera architettonica</SelectItem>
                          <SelectItem value="illuminazione">Illuminazione difettosa</SelectItem>
                          <SelectItem value="altro">Altro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="titolo">Titolo *</Label>
                      <Input 
                        id="titolo" 
                        placeholder="Breve descrizione del problema"
                        value={formData.titolo}
                        onChange={(e) => handleInputChange('titolo', e.target.value)}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="descrizione">Descrizione dettagliata *</Label>
                      <Textarea 
                        id="descrizione" 
                        placeholder="Descrivi il problema in dettaglio"
                        value={formData.descrizione}
                        onChange={(e) => handleInputChange('descrizione', e.target.value)}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="indirizzo">Indirizzo *</Label>
                      <div className="space-y-2">
                        <Input 
                          id="indirizzo" 
                          placeholder="Via, piazza o luogo esatto"
                          value={formData.indirizzo}
                          onChange={(e) => handleInputChange('indirizzo', e.target.value)}
                          disabled={useCurrentLocation}
                          required
                        />
                        <div className="flex items-center space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={getCurrentLocation}
                            disabled={isGettingLocation}
                            className="flex items-center space-x-2"
                          >
                            <Crosshair className="h-4 w-4" />
                            <span>
                              {isGettingLocation ? 'Rilevamento...' : useCurrentLocation ? 'Usa posizione attuale ✓' : 'Usa posizione attuale'}
                            </span>
                          </Button>
                          {useCurrentLocation && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={resetLocationUsage}
                              className="text-red-600 hover:text-red-700"
                            >
                              Rimuovi posizione
                            </Button>
                          )}
                        </div>
                        {locationStatus && (
                          <div className={`text-sm ${locationStatus.includes('successo') ? 'text-green-600' : 'text-red-600'}`}>
                            {locationStatus}
                          </div>
                        )}
                        {useCurrentLocation && userLocation && (
                          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                            📍 Coordinate: {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="gravita">Gravità *</Label>
                      <Select value={formData.gravita} onValueChange={(value) => handleInputChange('gravita', value)}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Seleziona la gravità" />
                        </SelectTrigger>
                        <SelectContent className="dialog-select-content">
                          <SelectItem value="bassa">Bassa</SelectItem>
                          <SelectItem value="media">Media</SelectItem>
                          <SelectItem value="alta">Alta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="border-t pt-4">
                      <h3 className="font-medium mb-3">Dati del segnalante (opzionali)</h3>
                      <div className="grid gap-2">
                        <Label htmlFor="nome">Nome</Label>
                        <Input 
                          id="nome" 
                          placeholder="Il tuo nome"
                          value={formData.nomeSegnalante}
                          onChange={(e) => handleInputChange('nomeSegnalante', e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2 mt-2">
                        <Label htmlFor="email">Email</Label>
                        <Input 
                          id="email" 
                          type="email"
                          placeholder="La tua email"
                          value={formData.emailSegnalante}
                          onChange={(e) => handleInputChange('emailSegnalante', e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2 mt-2">
                        <Label htmlFor="telefono">Telefono</Label>
                        <Input 
                          id="telefono" 
                          placeholder="Il tuo numero di telefono"
                          value={formData.telefonoSegnalante}
                          onChange={(e) => handleInputChange('telefonoSegnalante', e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="foto">Foto (opzionale)</Label>
                      <Input 
                        id="foto" 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => handleInputChange('foto', e.target.files?.[0] || null)}
                      />
                      {formData.foto && (
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">
                            File selezionato: {formData.foto.name}
                          </p>
                          <div className="mt-2">
                            <img 
                              src={URL.createObjectURL(formData.foto)} 
                              alt="Anteprima"
                              className="w-full h-32 object-cover rounded-md border"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                        Annulla
                      </Button>
                      <Button type="submit" disabled={isLoading || isUploading}>
                        {isLoading ? 'Invio in corso...' : isUploading ? 'Caricamento foto...' : 'Invia Segnalazione'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtri */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap gap-2 sm:gap-4 items-center">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filtri:</span>
            </div>
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tutti">Tutti i tipi</SelectItem>
                <SelectItem value="buca">Buche</SelectItem>
                <SelectItem value="barriera">Barriere</SelectItem>
                <SelectItem value="illuminazione">Illuminazione</SelectItem>
                <SelectItem value="altro">Altro</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filtroStato} onValueChange={setFiltroStato}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Stato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tutti">Tutti gli stati</SelectItem>
                <SelectItem value="aperta">Aperte</SelectItem>
                <SelectItem value="in_lavorazione">In lavorazione</SelectItem>
                <SelectItem value="risolta">Risolte</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Mappa Interattiva */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              <span>Mappa delle Segnalazioni</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Map 
              segnalazioni={segnalazioniFiltrate} 
              userLocation={userLocation}
              onSegnalazioneClick={(segnalazione) => {
                // Qui potresti mostrare un dialog con i dettagli
                console.log('Segnalazione cliccata:', segnalazione)
              }}
            />
          </CardContent>
        </Card>

        {/* Lista Segnalazioni */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Segnalazioni Recenti ({segnalazioniFiltrate.length})
          </h2>
          {segnalazioniFiltrate.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Nessuna segnalazione trovata</p>
                <p className="text-sm text-gray-500">Sii il primo a segnalare un problema!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {segnalazioniFiltrate.map((segnalazione) => (
                <Card key={segnalazione.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2 flex-wrap">
                        {getTipoIcon(segnalazione.tipo)}
                        <CardTitle className="text-base sm:text-lg">{segnalazione.titolo}</CardTitle>
                      </div>
                      {getStatoIcon(segnalazione.stato)}
                    </div>
                    <div className="flex flex-wrap gap-1 sm:gap-2 mt-2">
                      <Badge className={`text-xs ${getGravitaColor(segnalazione.gravita)}`}>
                        {segnalazione.gravita}
                      </Badge>
                      <Badge className={`text-xs ${getStatoColor(segnalazione.stato)}`}>
                        {segnalazione.stato.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-xs sm:text-sm mb-3 line-clamp-2">
                      {segnalazione.descrizione}
                    </p>
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <MapPin className="h-3 w-3 mr-1" />
                      {segnalazione.indirizzo}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(segnalazione.createdAt).toLocaleDateString('it-IT')}
                    </div>
                    
                    {/* Sistema di valutazione */}
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-600 font-medium">Questa segnalazione è pertinente?</span>
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <ThumbsUp className="h-3 w-3" />
                          <span>{segnalazione.valutazioniPertinenti || 0}</span>
                          <span className="mx-1">/</span>
                          <ThumbsDown className="h-3 w-3" />
                          <span>{segnalazione.valutazioniNonPertinenti || 0}</span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleValuta(segnalazione.id, 'pertinente')}
                          className="flex-1 h-7 text-xs bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
                        >
                          <ThumbsUp className="h-3 w-3 mr-1" />
                          Sì
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleValuta(segnalazione.id, 'non_pertinente')}
                          className="flex-1 h-7 text-xs bg-red-50 hover:bg-red-100 border-red-200 text-red-700"
                        >
                          <ThumbsDown className="h-3 w-3 mr-1" />
                          No
                        </Button>
                      </div>
                    </div>
                    {segnalazione.fotoUrl && (
                      <div className="mt-3">
                        <img 
                          src={segnalazione.fotoUrl} 
                          alt={segnalazione.titolo}
                          className="w-full h-32 object-cover rounded-md"
                        />
                      </div>
                    )}
                    {segnalazione.nomeSegnalante && (
                      <div className="mt-2 text-xs text-gray-400">
                        Segnalato da: {segnalazione.nomeSegnalante}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
