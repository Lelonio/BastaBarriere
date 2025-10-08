#!/bin/bash

echo "🚀 Setup di BastaBarriere"
echo "================================"

# Controlla se Node.js è installato
if ! command -v node &> /dev/null; then
    echo "❌ Node.js non è installato. Per favore installa Node.js 18+ prima di continuare."
    exit 1
fi

# Controlla versione Node.js
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js versione 18+ richiesta. Versione attuale: $(node -v)"
    exit 1
fi

echo "✅ Node.js versione $(node -v) trovata"

# Installa dipendenze
echo "📦 Installazione dipendenze..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Errore nell'installazione delle dipendenze"
    exit 1
fi

echo "✅ Dipendenze installate"

# Crea cartella database se non esiste
if [ ! -d "db" ]; then
    echo "📁 Creazione cartella database..."
    mkdir -p db
fi

# Configura database
echo "🗄️ Configurazione database..."
npm run db:push

if [ $? -ne 0 ]; then
    echo "❌ Errore nella configurazione del database"
    exit 1
fi

echo "✅ Database configurato"

echo ""
echo "🎉 Setup completato con successo!"
echo ""
echo "Per avviare l'applicazione:"
echo "   npm run dev"
echo ""
echo "Poi visita http://localhost:3000 nel tuo browser"
echo ""