'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, AlertTriangle, Navigation, Camera, Clock, CheckCircle, XCircle, Filter, Search, Edit, Trash2, Eye, Settings, LogOut, Shield, Map, ThumbsUp, ThumbsDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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

export default function AdminPage() {
  const [segnalazioni, setSegnalazioni] = useState<Segnalazione[]>([])
  const [filtroTipo, setFiltroTipo] = useState<string>('tutti')
  const [filtroStato, setFiltroStato] = useState<string>('tutti')
  const [filtroGravita, setFiltroGravita] = useState<string>('tutti')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [selectedSegnalazione, setSelectedSegnalazione] = useState<Segnalazione | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const router = useRouter()

  // Verifica autenticazione
  useEffect(() => {
    const checkAuth = () => {
      const token = sessionStorage.getItem('adminToken')
      if (!token) {
        router.push('/admin/login')
        return
      }
      
      // Verifica il token con il server
      fetch('/api/admin/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => {
        if (response.ok) {
          setIsAuthenticated(true)
        } else {
          sessionStorage.removeItem('adminToken')
          router.push('/admin/login')
        }
      })
      .catch(() => {
        sessionStorage.removeItem('adminToken')
        router.push('/admin/login')
      })
      .finally(() => {
        setIsCheckingAuth(false)
      })
    }

    checkAuth()
  }, [router])

  // Funzione per logout
  const handleLogout = () => {
    sessionStorage.removeItem('adminToken')
    router.push('/admin/login')
  }

  // Funzione per reverse geocoding
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=it`,
        {
          headers: {
            'User-Agent': 'BastaBarriere/1.0'
          }
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        return data.display_name || `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`
      }
    } catch (error) {
      console.error('Errore reverse geocoding:', error)
    }
    
    return `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`
  }

  // Funzione per migliorare indirizzo con reverse geocoding
  const improveAddress = async (segnalazione: Segnalazione) => {
    if (segnalazione.indirizzo.includes('Lat:') && segnalazione.indirizzo.includes('Lng:')) {
      const improvedAddress = await reverseGeocode(segnalazione.lat, segnalazione.lng)
      if (improvedAddress !== segnalazione.indirizzo) {
        // Aggiorna l'indirizzo nella segnalazione visualizzata
        setSelectedSegnalazione(prev => prev ? {...prev, indirizzo: improvedAddress} : null)
      }
    }
  }

  // Carica le segnalazioni dal database
  const loadSegnalazioni = async () => {
    const token = sessionStorage.getItem('adminToken')
    if (!token) return

    try {
      const response = await fetch('/api/segnalazioni', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
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
    if (isAuthenticated) {
      loadSegnalazioni()
    }
  }, [isAuthenticated])

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

  const updateStato = async (id: string, nuovoStato: string) => {
    const token = sessionStorage.getItem('adminToken')
    if (!token) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/segnalazioni/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ stato: nuovoStato })
      })

      if (response.ok) {
        toast.success('Stato aggiornato con successo!')
        loadSegnalazioni()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Errore nell\'aggiornamento dello stato')
      }
    } catch (error) {
      console.error('Errore nell\'aggiornamento dello stato:', error)
      toast.error('Errore nell\'aggiornamento dello stato')
    } finally {
      setIsLoading(false)
    }
  }

  const deleteSegnalazione = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa segnalazione?')) return

    const token = sessionStorage.getItem('adminToken')
    if (!token) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/segnalazioni/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        toast.success('Segnalazione eliminata con successo!')
        loadSegnalazioni()
        setIsDetailOpen(false)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Errore nell\'eliminazione della segnalazione')
      }
    } catch (error) {
      console.error('Errore nell\'eliminazione della segnalazione:', error)
      toast.error('Errore nell\'eliminazione della segnalazione')
    } finally {
      setIsLoading(false)
    }
  }

  // Filtra le segnalazioni
  const segnalazioniFiltrate = segnalazioni.filter(s => {
    const tipoMatch = filtroTipo === 'tutti' || s.tipo === filtroTipo
    const statoMatch = filtroStato === 'tutti' || s.stato === filtroStato
    const gravitaMatch = filtroGravita === 'tutti' || s.gravita === filtroGravita
    const searchMatch = searchTerm === '' || 
      s.titolo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.descrizione.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.indirizzo.toLowerCase().includes(searchTerm.toLowerCase())
    
    return tipoMatch && statoMatch && gravitaMatch && searchMatch
  })

  // Statistiche
  const stats = {
    totali: segnalazioni.length,
    aperte: segnalazioni.filter(s => s.stato === 'aperta').length,
    inLavorazione: segnalazioni.filter(s => s.stato === 'in_lavorazione').length,
    risolte: segnalazioni.filter(s => s.stato === 'risolta').length,
    altaGravita: segnalazioni.filter(s => s.gravita === 'alta').length,
  }

  // Mostra schermata di caricamento durante verifica autenticazione
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-brand-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Verifica autenticazione...</p>
        </div>
      </div>
    )
  }

  // Reindirizza se non autenticato
  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Admin */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-red-600 p-2 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Pannello Admin</h1>
                <p className="text-sm text-gray-600">Gestione segnalazioni BastaBarriere</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => window.location.href = '/'}>
                <Settings className="h-4 w-4 mr-2" />
                Torna al sito
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistiche */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-gray-900">{stats.totali}</div>
              <div className="text-sm text-gray-600">Totali</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{stats.aperte}</div>
              <div className="text-sm text-gray-600">Aperte</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">{stats.inLavorazione}</div>
              <div className="text-sm text-gray-600">In lavorazione</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.risolte}</div>
              <div className="text-sm text-gray-600">Risolte</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-700">{stats.altaGravita}</div>
              <div className="text-sm text-gray-600">Alta gravità</div>
            </CardContent>
          </Card>
        </div>

        {/* Filtri */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filtri e Ricerca</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <Label htmlFor="search">Cerca</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Cerca segnalazioni..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="filtro-tipo">Tipo</Label>
                <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                  <SelectTrigger id="filtro-tipo" className="w-full">
                    <SelectValue placeholder="Seleziona tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tutti">Tutti i tipi</SelectItem>
                    <SelectItem value="buca">Buche</SelectItem>
                    <SelectItem value="barriera">Barriere</SelectItem>
                    <SelectItem value="illuminazione">Illuminazione</SelectItem>
                    <SelectItem value="altro">Altro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="filtro-stato">Stato</Label>
                <Select value={filtroStato} onValueChange={setFiltroStato}>
                  <SelectTrigger id="filtro-stato" className="w-full">
                    <SelectValue placeholder="Seleziona stato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tutti">Tutti gli stati</SelectItem>
                    <SelectItem value="aperta">Aperte</SelectItem>
                    <SelectItem value="in_lavorazione">In lavorazione</SelectItem>
                    <SelectItem value="risolta">Risolte</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="filtro-gravita">Gravità</Label>
                <Select value={filtroGravita} onValueChange={setFiltroGravita}>
                  <SelectTrigger id="filtro-gravita" className="w-full">
                    <SelectValue placeholder="Seleziona gravità" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tutti">Tutte le gravità</SelectItem>
                    <SelectItem value="bassa">Bassa</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setFiltroTipo('tutti')
                    setFiltroStato('tutti')
                    setFiltroGravita('tutti')
                    setSearchTerm('')
                  }}
                  className="w-full"
                >
                  Resetta filtri
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista Segnalazioni */}
        <Card>
          <CardHeader>
            <CardTitle>Segnalazioni ({segnalazioniFiltrate.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Tipo</th>
                    <th className="text-left py-3 px-4">Titolo</th>
                    <th className="text-left py-3 px-4">Indirizzo</th>
                    <th className="text-left py-3 px-4">Gravità</th>
                    <th className="text-left py-3 px-4">Stato</th>
                    <th className="text-left py-3 px-4">Data</th>
                    <th className="text-left py-3 px-4">Valutazioni</th>
                    <th className="text-left py-3 px-4">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {segnalazioniFiltrate.map((segnalazione) => (
                    <tr key={segnalazione.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          {getTipoIcon(segnalazione.tipo)}
                          <span className="capitalize">{segnalazione.tipo}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium">{segnalazione.titolo}</div>
                        <div className="text-sm text-gray-600 truncate max-w-xs">
                          {segnalazione.descrizione}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {segnalazione.indirizzo}
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getGravitaColor(segnalazione.gravita)}>
                          {segnalazione.gravita}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          {getStatoIcon(segnalazione.stato)}
                          <Badge className={getStatoColor(segnalazione.stato)}>
                            {segnalazione.stato.replace('_', ' ')}
                          </Badge>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(segnalazione.createdAt).toLocaleDateString('it-IT')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2 text-sm">
                          <div className="flex items-center space-x-1 text-green-600">
                            <ThumbsUp className="h-3 w-3" />
                            <span>{segnalazione.valutazioniPertinenti || 0}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-red-600">
                            <ThumbsDown className="h-3 w-3" />
                            <span>{segnalazione.valutazioniNonPertinenti || 0}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <Dialog open={isDetailOpen && selectedSegnalazione?.id === segnalazione.id} onOpenChange={setIsDetailOpen}>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setSelectedSegnalazione(segnalazione)
                                  // Prova a migliorare l'indirizzo se sono coordinate
                                  improveAddress(segnalazione)
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto dialog-z-index">
                              <DialogHeader>
                                <DialogTitle>Dettagli Segnalazione</DialogTitle>
                              </DialogHeader>
                              {selectedSegnalazione && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label>Tipo</Label>
                                      <div className="flex items-center space-x-2 mt-1">
                                        {getTipoIcon(selectedSegnalazione.tipo)}
                                        <span className="capitalize">{selectedSegnalazione.tipo}</span>
                                      </div>
                                    </div>
                                    <div>
                                      <Label>Gravità</Label>
                                      <div className="mt-1">
                                        <Badge className={getGravitaColor(selectedSegnalazione.gravita)}>
                                          {selectedSegnalazione.gravita}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <Label>Titolo</Label>
                                    <p className="mt-1 font-medium">{selectedSegnalazione.titolo}</p>
                                  </div>
                                  
                                  <div>
                                    <Label>Descrizione</Label>
                                    <p className="mt-1 text-gray-700">{selectedSegnalazione.descrizione}</p>
                                  </div>
                                  
                                  <div>
                                    <Label>Indirizzo</Label>
                                    <div className="mt-1 space-y-2">
                                      <p className="text-gray-700">{selectedSegnalazione.indirizzo}</p>
                                      <div className="flex items-center space-x-2">
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          onClick={() => {
                                            const url = `https://www.openstreetmap.org/?mlat=${selectedSegnalazione.lat}&mlon=${selectedSegnalazione.lng}&zoom=18`
                                            window.open(url, '_blank')
                                          }}
                                        >
                                          <Map className="h-4 w-4 mr-2" />
                                          Vedi su mappa
                                        </Button>
                                        <span className="text-xs text-gray-500">
                                          {selectedSegnalazione.lat.toFixed(6)}, {selectedSegnalazione.lng.toFixed(6)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label>Stato attuale</Label>
                                      <div className="flex items-center space-x-2 mt-1">
                                        {getStatoIcon(selectedSegnalazione.stato)}
                                        <Badge className={getStatoColor(selectedSegnalazione.stato)}>
                                          {selectedSegnalazione.stato.replace('_', ' ')}
                                        </Badge>
                                      </div>
                                    </div>
                                    <div>
                                      <Label>Cambia stato</Label>
                                      <Select 
                                        value={selectedSegnalazione.stato} 
                                        onValueChange={(value) => updateStato(selectedSegnalazione.id, value)}
                                      >
                                        <SelectTrigger className="mt-1">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="aperta">Aperta</SelectItem>
                                          <SelectItem value="in_lavorazione">In lavorazione</SelectItem>
                                          <SelectItem value="risolta">Risolta</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                  
                                  {selectedSegnalazione.nomeSegnalante && (
                                    <div>
                                      <Label>Segnalante</Label>
                                      <p className="mt-1 text-gray-700">{selectedSegnalazione.nomeSegnalante}</p>
                                      {selectedSegnalazione.emailSegnalante && (
                                        <p className="text-sm text-gray-600">{selectedSegnalazione.emailSegnalante}</p>
                                      )}
                                    </div>
                                  )}
                                  
                                  <div>
                                    <Label>Data segnalazione</Label>
                                    <p className="mt-1 text-gray-700">
                                      {new Date(selectedSegnalazione.createdAt).toLocaleString('it-IT')}
                                    </p>
                                  </div>
                                  
                                  <div>
                                    <Label>Valutazioni della community</Label>
                                    <div className="mt-1 flex items-center space-x-4">
                                      <div className="flex items-center space-x-1 text-green-600">
                                        <ThumbsUp className="h-4 w-4" />
                                        <span className="font-medium">{selectedSegnalazione.valutazioniPertinenti || 0}</span>
                                        <span className="text-sm text-gray-600">pertinente</span>
                                      </div>
                                      <div className="flex items-center space-x-1 text-red-600">
                                        <ThumbsDown className="h-4 w-4" />
                                        <span className="font-medium">{selectedSegnalazione.valutazioniNonPertinenti || 0}</span>
                                        <span className="text-sm text-gray-600">non pertinente</span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {selectedSegnalazione.fotoUrl && (
                                    <div>
                                      <Label>Foto</Label>
                                      <img 
                                        src={selectedSegnalazione.fotoUrl} 
                                        alt={selectedSegnalazione.titolo}
                                        className="mt-2 w-full h-48 object-cover rounded-md"
                                      />
                                    </div>
                                  )}
                                  
                                  <div className="flex justify-end space-x-2 pt-4 border-t">
                                    <Button 
                                      variant="destructive" 
                                      onClick={() => deleteSegnalazione(selectedSegnalazione.id)}
                                      disabled={isLoading}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Elimina
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          
                          <Select 
                            value={segnalazione.stato} 
                            onValueChange={(value) => updateStato(segnalazione.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="aperta">Aperta</SelectItem>
                              <SelectItem value="in_lavorazione">In lavorazione</SelectItem>
                              <SelectItem value="risolta">Risolta</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {segnalazioniFiltrate.length === 0 && (
                <div className="text-center py-12">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Nessuna segnalazione trovata</p>
                  <p className="text-sm text-gray-500">Prova a modificare i filtri di ricerca</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}