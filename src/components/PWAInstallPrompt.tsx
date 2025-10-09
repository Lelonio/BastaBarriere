'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, X, Smartphone } from 'lucide-react'
import { toast } from 'sonner'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallCard, setShowInstallCard] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Controlla se è già installata come PWA
    const checkStandalone = () => {
      setIsStandalone(
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://')
      )
    }

    // Controlla se è iOS
    const checkIOS = () => {
      const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent)
      setIsIOS(isIOSDevice)
    }

    checkStandalone()
    checkIOS()

    // Ascolta l'evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      // Mostra il prompt dopo 2 secondi
      setTimeout(() => {
        if (!isStandalone) {
          setShowInstallCard(true)
        }
      }, 2000)
    }

    // Ascolta l'evento appinstalled
    const handleAppInstalled = () => {
      setDeferredPrompt(null)
      setShowInstallCard(false)
      toast.success('BastaBarriere installata con successo!')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [isStandalone])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        toast.success('Grazie per aver installato BastaBarriere!')
      }
      
      setDeferredPrompt(null)
      setShowInstallCard(false)
    } catch (error) {
      console.error('Errore durante l\'installazione:', error)
      toast.error('Errore durante l\'installazione')
    }
  }

  const handleDismiss = () => {
    setShowInstallCard(false)
    // Salva in localStorage che l'utente ha rifiutato
    localStorage.setItem('pwa-install-dismissed', 'true')
  }

  // Non mostrare se è già standalone o se l'utente ha rifiutato
  if (isStandalone || !showInstallCard || localStorage.getItem('pwa-install-dismissed')) {
    return null
  }

  // iOS ha bisogno di istruzioni manuali
  if (isIOS) {
    return (
      <Card className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-96 z-50 shadow-lg border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-blue-800 flex items-center">
              <Smartphone className="h-4 w-4 mr-2" />
              Installa BastaBarriere
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-sm text-blue-700 space-y-2">
            <p>
              Installa questa app sul tuo iPhone/iPad per un'esperienza migliore:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Tocca il pulsante Condividi <span className="font-mono">⎋</span></li>
              <li>Scorri e tocca <strong>"Aggiungi alla Home"</strong></li>
              <li>Tocca <strong>"Aggiungi"</strong> per completare</li>
            </ol>
            <div className="flex justify-end mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDismiss}
                className="text-blue-600 border-blue-200 hover:bg-blue-100"
              >
                Ho capito
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Android/Desktop con installazione diretta
  return (
    <Card className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-96 z-50 shadow-lg border-green-200 bg-green-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-green-800 flex items-center">
            <Download className="h-4 w-4 mr-2" />
            Installa BastaBarriere
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-6 w-6 p-0 text-green-600 hover:text-green-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-sm text-green-700 space-y-3">
          <p>
            Installa l'app per accedere più velocemente e ricevere notifiche sulle segnalazioni nella tua area.
          </p>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDismiss}
              className="text-green-600 border-green-200 hover:bg-green-100"
            >
              Dopo
            </Button>
            <Button
              size="sm"
              onClick={handleInstallClick}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Installa ora
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}