# Civitavecchia Sicura - Istruzioni di Installazione

## 🚀 Avvio Rapido

### Prerequisiti
- Node.js 18+ installato
- npm o yarn

### Passaggi per l'installazione

1. **Installazione dipendenze**
   ```bash
   npm install
   ```

2. **Configurazione database**
   ```bash
   npm run db:push
   ```
   Questo comando creerà il file del database SQLite nella cartella `db/`.

3. **Avvio dell'applicazione**
   ```bash
   npm run dev
   ```

4. **Apri l'applicazione**
   Visita http://localhost:3000 nel tuo browser

## 📁 Struttura del Progetto

```
civitavecchia-sicura/
├── src/
│   ├── app/
│   │   ├── api/segnalazioni/    # API endpoints
│   │   ├── page.tsx             # Pagina principale
│   │   └── layout.tsx           # Layout dell'app
│   ├── components/ui/           # Componenti UI shadcn
│   └── lib/
│       ├── db.ts                # Configurazione Prisma
│       └── utils.ts             # Utilità
├── prisma/
│   └── schema.prisma            # Schema database
├── db/
│   └── custom.db                # Database SQLite (creato automaticamente)
├── public/
│   ├── logo.png                 # Logo dell'app
│   └── favicon.png              # Favicon
└── package.json
```

## 🗄️ Database

L'app utilizza **SQLite** come database, che non richiede configurazione esterna. Il file del database viene creato automaticamente nella cartella `db/` quando esegui `npm run db:push`.

## 🎯 Funzionalità

- ✅ Segnalazione buche e barriere architettoniche
- ✅ Upload foto (supporto base)
- ✅ Geolocalizzazione automatica
- ✅ Filtri per tipo e stato
- ✅ Design responsive
- ✅ Database persistente
- ✅ Notifiche toast

## 🔧 Note Tecniche

- Il database è configurato per funzionare senza variabili d'ambiente
- Il percorso del database è relativo: `file:./db/custom.db`
- L'app utilizza Next.js 15 con App Router
- UI realizzata con shadcn/ui e Tailwind CSS

## 📱 Utilizzo

1. Apri l'app su http://localhost:3000
2. Clicca "Nuova Segnalazione"
3. Compila il form con i dettagli del problema
4. Aggiungi una foto (opzionale)
5. Invia la segnalazione

Le segnalazioni verranno salvate nel database e visualizzate nella lista principale.

## 🐛 Risoluzione Problemi

Se riscontri problemi con il database:

1. Assicurati che la cartella `db/` esista
2. Esegui nuovamente `npm run db:push`
3. Riavvia il server con `npm run dev`

Se il problema persiste, elimina il file `db/custom.db` e ripeti i passaggi.