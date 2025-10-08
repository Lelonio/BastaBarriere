# 🏛️ BastaBarriere

App di segnalazione buche e barriere architettoniche per la città di Civitavecchia. Un'app moderna, accattivante e funzionale per rendere la città più sicura e accessibile.

## 🎯 Caratteristiche Principali

- ✅ **Segnalazione problemi**: Buche, barriere architettoniche, illuminazione difettosa
- ✅ **Mappa interattiva**: Visualizzazione geolocalizzata delle segnalazioni con Leaflet
- ✅ **Geolocalizzazione**: Rilevamento automatico della posizione
- ✅ **Upload foto**: Aggiungi immagini ai problemi segnalati
- ✅ **Sistema filtri**: Filtra per tipo e stato delle segnalazioni
- ✅ **Pannello Admin**: Gestione completa delle segnalazioni per amministratori
- ✅ **Design responsive**: Perfetta su mobile e desktop
- ✅ **Database persistente**: SQLite senza configurazione esterna
- ✅ **Notifiche toast**: Feedback immediato per le azioni

## 🚀 Avvio Rapido

### Metodo 1: Setup Automatico
```bash
# Setup completo in un comando
npm run setup
```

### Metodo 2: Setup Manuale
```bash
# 1. Installa le dipendenze
npm install

# 2. Configura il database
npm run db:push

# 3. Avvia l'applicazione
npm run dev
```

### Metodo 3: Script di Setup
```bash
# Esegui lo script di setup
bash setup.sh
```

Apri [http://localhost:3000](http://localhost:3000) per vedere l'applicazione.

## 📱 Pagine dell'App

### 🏠 Homepage Utente (http://localhost:3000)
- **Mappa interattiva** con tutte le segnalazioni
- **Form di segnalazione** per nuovi problemi
- **Lista segnalazioni** con filtri
- **Visualizzazione dettagli** di ogni segnalazione

### 🔐 Pannello Admin (http://localhost:3000/admin)
- **Statistiche** in tempo reale
- **Gestione completa** delle segnalazioni
- **Cambio stato** (Aperta → In lavorazione → Risolta)
- **Eliminazione segnalazioni**
- **Filtri avanzati** e ricerca
- **Dettagli completi** di ogni segnalazione

## 🗄️ Database

L'app utilizza **SQLite** come database:
- ✅ Nessuna configurazione esterna richiesta
- ✅ File del database creato automaticamente
- ✅ Dati persistenti tra i riavvii
- ✅ Schema completo con Prisma ORM

## 📱 Utilizzo

### Per i Cittadini:
1. **Apri l'app** su http://localhost:3000
2. **Visualizza le segnalazioni** sulla mappa interattiva
3. **Usa i filtri** per trovare segnalazioni specifiche
4. **Clicca "Nuova Segnalazione"** per segnalare un problema
5. **Compila il form** con tutti i dettagli
6. **Aggiungi una foto** (opzionale) per documentare il problema
7. **Invia la segnalazione** e ricevi conferma immediata

### Per gli Amministratori:
1. **Accedi al pannello** su http://localhost:3000/admin
2. **Visualizza le statistiche** delle segnalazioni
3. **Filtra e cerca** segnalazioni specifiche
4. **Cambia stato** delle segnalazioni
5. **Elimina** segnalazioni non pertinenti
6. **Visualizza dettagli** completi

## 🎨 Design e UX

- **Layout moderno** con gradienti blu e design pulito
- **Card interattive** con hover effects
- **Badge colorati** per gravità e stato
- **Icone intuitive** per ogni tipo di problema
- **Design responsive** che funziona su tutti i dispositivi
- **Notifiche toast** per feedback utente
- **Mappa interattiva** con marker colorati per tipo e stato

## 🔧 Stack Tecnologico

- **Frontend**: Next.js 15, React 19, TypeScript 5
- **Styling**: Tailwind CSS 4, shadcn/ui
- **Database**: Prisma ORM con SQLite
- **Maps**: Leaflet.js per mappa interattiva
- **Icons**: Lucide React
- **Notifications**: Sonner
- **Forms**: React Hook Form con validazione

## 📋 Tipi di Segnalazioni

- 🕳️ **Buche**: Pericoli per veicoli e pedoni
- ♿ **Barriere architettoniche**: Ostacoli per accessibilità
- 💡 **Illuminazione difettosa**: Problemi di sicurezza notturna
- 📌 **Altro**: Altri tipi di problemi

## 🔄 Stati delle Segnalazioni

- 🔴 **Aperta**: Appena segnalata
- 🟡 **In lavorazione**: Presa in carico
- 🟢 **Risolta**: Problema risolto

## 🗺️ Mappa Interattiva

La mappa mostra:
- **Marker colorati** in base al tipo e stato della segnalazione
- **Popup informativi** con dettagli rapidi
- **Posizione utente** con marker blu
- **Zoom automatico** per includere tutte le segnalazioni
- **Navigazione fluida** con controlli standard

## 🐛 Risoluzione Problemi

### Database non funziona?
```bash
# Resetta il database
npm run db:reset
# Oppure elimina il file db/custom.db e ripeti il setup
```

### Server non parte?
```bash
# Controlla che la porta 3000 sia libera
lsof -ti:3000
# Uccidi processi sulla porta 3000
kill -9 $(lsof -ti:3000)
# Riavvia il server
npm run dev
```

### Dipendenze problematiche?
```bash
# Pulisci e reinstalla
rm -rf node_modules package-lock.json
npm install
```

### Mappa non funziona?
- Controlla la connessione internet per i tile di OpenStreetMap
- Verifica che le coordinate siano corrette
- Controlla la console per errori JavaScript

## 🚀 Comandi Utili

```bash
npm run dev          # Avvia server di sviluppo
npm run build        # Build per produzione
npm run start        # Avvia server di produzione
npm run lint         # Controlla qualità del codice
npm run setup        # Setup completo automatico
npm run db:push      # Configura database
npm run db:reset     # Resetta database
```

## 📄 Licenza

Questo progetto è stato sviluppato per migliorare la sicurezza e l'accessibilità della città di Civitavecchia.

---

Built with ❤️ per Civitavecchia 
