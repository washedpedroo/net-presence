# Sistema Gestione Presenze

Sistema completo per la gestione delle presenze aziendali con workflow di approvazione multi-livello, gestione giustificativi, e reportistica.

## 🚀 Caratteristiche Principali

### Gestione Utenti e Ruoli
- **ADMIN**: Gestione completa del sistema, approvazione finale presenze e giustificativi
- **GP (Gestore Presenze)**: Inserimento timbrature, conferma presenze mensili, invio all'AD
- **DIPENDENTE**: Visualizzazione presenze proprie, richiesta giustificativi

### Timbrature
- Inserimento con 4 slot giornalieri
- Calcolo automatico ore lavorate e straordinari
- Sistema di versioning per modifiche
- Tolleranza configurabile (±10 minuti)
- Validazioni business logic
- Stati: Bozza → Confermato GP → Inviato AD → Approvato/Rigettato

### Giustificativi
- **Ferie**: Richiesta per periodo (giorni lavorativi)
- **Permessi**: Richiesta oraria (10 minuti - 8 ore)
- **Ex Festività**: Gestione giorni compensativi
- Timeline completa delle modifiche
- Workflow approvazione AD

### Festività
- Calendario festività nazionali italiane
- Calcolo automatico Pasqua e Lunedì dell'Angelo
- Visualizzazione giorni festivi nel calendario

### Audit & Sicurezza
- Log completo di tutte le azioni critiche
- Tracking IP e user-agent
- Password hashing con bcrypt
- Session JWT con timeout
- GDPR compliance ready

---

## 📋 Stack Tecnologico

- **Frontend**: Next.js 14 (App Router) + React 18
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Auth**: NextAuth.js v5
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Validazione**: Zod
- **TypeScript**: Full type-safety

---

## 🛠️ Setup e Installazione

### Prerequisiti

- **Node.js** >= 18.x
- **PostgreSQL** >= 14.x
- **npm** o **yarn** o **pnpm**

### 1. Clona il Repository

```bash
git clone <repo-url>
cd presenze-app
```

### 2. Installa le Dipendenze

```bash
npm install
```

### 3. Configura il Database PostgreSQL

Crea un database PostgreSQL:

```sql
CREATE DATABASE presenze_db;
```

### 4. Configura le Variabili d'Ambiente

Copia il file `.env.example` in `.env`:

```bash
cp .env.example .env
```

Modifica `.env` con le tue configurazioni:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/presenze_db?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"  # Genera con: openssl rand -base64 32

# App Configuration
ORE_STANDARD=8
TOLLERANZA_MINUTI=10
```

### 5. Genera il Client Prisma

```bash
npm run prisma:generate
```

### 6. Esegui le Migrations

```bash
npm run prisma:migrate
```

Quando richiesto, dai un nome alla migration (es: "init").

### 7. Popola il Database con Dati Iniziali

```bash
npm run prisma:seed
```

Questo creerà:
- 3 utenti (ADMIN, GP, DIPENDENTE)
- 1 dipendente con template orari
- Configurazioni di sistema
- Festività italiane 2026

### 8. Avvia il Server di Sviluppo

```bash
npm run dev
```

L'applicazione sarà disponibile su: **http://localhost:3000**

---

## 👤 Credenziali di Accesso Iniziali

### Amministratore (ADMIN)
- **Email**: `admin@presenze.it`
- **Password**: `AdminPassword123!`

### Gestore Presenze (GP)
- **Email**: `gp@presenze.it`
- **Password**: `GpPassword123!`

### Dipendente
- **Email**: `dipendente@presenze.it`
- **Password**: `DipPassword123!`

---

## 📁 Struttura del Progetto

```
presenze-app/
├── app/
│   ├── api/                    # API Routes
│   │   ├── auth/              # NextAuth
│   │   ├── timbrature/        # Gestione timbrature
│   │   ├── giustificativi/    # Gestione giustificativi
│   │   ├── users/             # Gestione utenti
│   │   ├── employees/         # Gestione dipendenti
│   │   └── export/            # Export PDF/Excel
│   ├── dashboard/             # Dashboard principale
│   ├── login/                 # Pagina login
│   ├── layout.tsx             # Layout principale
│   └── globals.css            # Stili globali
├── components/
│   ├── ui/                    # Componenti UI riutilizzabili
│   └── sidebar.tsx            # Sidebar navigazione
├── lib/
│   ├── auth.ts                # Configurazione NextAuth
│   ├── prisma.ts              # Client Prisma
│   ├── utils.ts               # Utility (calcolo ore, festività)
│   └── validations.ts         # Schemi Zod
├── prisma/
│   ├── schema.prisma          # Schema database
│   └── seed.ts                # Seeding database
├── types/
│   └── next-auth.d.ts         # Tipi TypeScript
├── .env.example               # Template variabili ambiente
├── package.json
└── README.md
```

---

## 🔑 Funzionalità per Ruolo

### ADMIN (Amministratore)
✅ Gestione utenti (CRUD)  
✅ Visualizzazione tutte le timbrature  
✅ Approvazione/Rigetto giustificativi  
✅ Approvazione/Rigetto presenze mensili  
✅ Configurazioni di sistema  
✅ Visualizzazione audit log  
✅ Export report PDF

### GP (Gestore Presenze)
✅ Inserimento timbrature per dipendenti  
✅ Conferma timbrature mensili per dipendente  
✅ Invio presenze aggregate all'AD  
✅ Visualizzazione giustificativi  
✅ Gestione dipendenti  
✅ Report mensili

### DIPENDENTE
✅ Visualizzazione proprie presenze  
✅ Richiesta ferie  
✅ Richiesta permessi/ex festività  
✅ Visualizzazione storico giustificativi  
✅ Timeline approvazioni

---

## 📊 Workflow Approvazione Presenze

```
1. GP inserisce timbrature → Stato: BOZZA
2. GP conferma dipendente → Stato: CONFERMATO_GP
3. GP invia tutte presenze → Stato: INVIATO_AD
4. AD approva/rigetta → Stato: APPROVATO / RIGETTATO
   - Se rigettato: torna a BOZZA per correzioni
```

---

## 📝 Workflow Giustificativi

```
1. Dipendente richiede → Stato: PENDING
2. AD approva/rigetta → Stato: APPROVATO / RIFIUTATO
3. Se approvato → integrato automaticamente in timbrature
```

---

## 🗄️ Modello Database

### Tabelle Principali

- **users**: Utenti del sistema
- **employees**: Anagrafica dipendenti
- **employee_templates**: Template orari standard
- **timbrature**: Timbrature giornaliere
- **timbratura_versions**: Storico modifiche
- **giustificativi**: Ferie/permessi/ex festività
- **giustificativo_timeline**: Timeline stato giustificativi
- **festivita**: Festività nazionali/regionali
- **configurations**: Configurazioni sistema
- **audit_logs**: Log azioni critiche

---

## 🚀 Comandi Utili

```bash
# Sviluppo
npm run dev                 # Avvia server sviluppo

# Database
npm run prisma:generate     # Genera Prisma Client
npm run prisma:migrate      # Esegui migrations
npm run prisma:seed         # Popola database
npx prisma studio           # Interfaccia grafica DB

# Build & Deploy
npm run build               # Build produzione
npm start                   # Avvia produzione
```

---

## 🔒 Sicurezza

- **Password**: Minimo 12 caratteri, hashing bcrypt
- **Session**: JWT con timeout 8 ore
- **HTTPS**: Obbligatorio in produzione
- **Rate Limiting**: Da implementare per API pubbliche
- **CORS**: Configurazione restrittiva
- **SQL Injection**: Protezione via Prisma ORM

---

## 📦 Deploy in Produzione

### Vercel (Consigliato)

1. Fai push del codice su GitHub
2. Connetti repository su Vercel
3. Configura variabili ambiente:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`
4. Deploy automatico

### Docker

```dockerfile
# Dockerfile (esempio)
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Database Produzione

Opzioni consigliate:
- **Supabase**: Database PostgreSQL gestito
- **Railway**: Database + hosting
- **AWS RDS**: PostgreSQL su AWS

---

## 🧪 Testing

```bash
# Unit tests (da implementare)
npm run test

# E2E tests (da implementare)
npm run test:e2e
```

---

## 📈 Roadmap Futuri Sviluppi

- [ ] Notifiche real-time (Pusher/Socket.io)
- [ ] Export Excel avanzato
- [ ] Dashboard analytics
- [ ] Multi-lingua (i18n)
- [ ] Mobile app (React Native)
- [ ] Integrazione sistemi payroll
- [ ] Geolocalizzazione timbrature
- [ ] Riconoscimento facciale
- [ ] Multi-tenant

---

## 🐛 Troubleshooting

### Errore: "Can't reach database server"

Verifica che PostgreSQL sia avviato:
```bash
sudo service postgresql status
sudo service postgresql start
```

### Errore: "Prisma Client not generated"

Rigenera il client:
```bash
npm run prisma:generate
```

### Errore: "Invalid session"

Rigenera il secret:
```bash
openssl rand -base64 32
```
E aggiorna `.env`.

---

## 📄 Licenza

Proprietario - Tutti i diritti riservati

---

## 👥 Supporto

Per domande o supporto:
- Email: support@presenze.it
- Issues: GitHub Issues

---

## 🎉 Credits

Sviluppato con ❤️ per gestire le presenze aziendali in modo efficiente e trasparente.
