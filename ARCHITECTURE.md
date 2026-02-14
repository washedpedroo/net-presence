# Architettura Sistema Gestione Presenze

## 📐 Panoramica Architetturale

Il sistema è costruito su un'architettura moderna **full-stack** basata su Next.js 14 con App Router, che unisce frontend e backend in un'unica applicazione monolitica ottimizzata.

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                      │
│  ┌──────────────────────────────────────────────────┐  │
│  │        Next.js React Components (RSC)            │  │
│  │  - Dashboard UI                                   │  │
│  │  - Forms & Validazione                           │  │
│  │  - State Management                              │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↕ HTTPS
┌─────────────────────────────────────────────────────────┐
│              NEXT.JS SERVER (App Router)                 │
│  ┌──────────────────────────────────────────────────┐  │
│  │         API Routes (Backend Logic)               │  │
│  │  /api/auth       - NextAuth.js                   │  │
│  │  /api/timbrature - CRUD Timbrature               │  │
│  │  /api/giustificativi - CRUD Giustificativi      │  │
│  │  /api/users      - Gestione Utenti              │  │
│  │  /api/employees  - Gestione Dipendenti          │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │          Middleware & Auth Layer                 │  │
│  │  - NextAuth Session Management                   │  │
│  │  - Role-based Access Control (RBAC)             │  │
│  │  - Request Validation (Zod)                     │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↕ SQL
┌─────────────────────────────────────────────────────────┐
│              DATABASE LAYER (Prisma ORM)                 │
│  ┌──────────────────────────────────────────────────┐  │
│  │            PostgreSQL Database                    │  │
│  │  - Users & Employees                             │  │
│  │  - Timbrature & Versions                         │  │
│  │  - Giustificativi & Timeline                     │  │
│  │  - Audit Logs                                    │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 🏗️ Componenti Principali

### 1. Frontend Layer (React Server Components)

**Tecnologie**: Next.js 14 App Router, React 18, Tailwind CSS

**Caratteristiche**:
- **Server Components** per performance ottimali
- **Client Components** per interattività (`"use client"`)
- Routing basato su file system
- Layout annidati con condivisione stato
- Ottimizzazione automatica immagini e bundle

**Struttura**:
```
app/
├── (auth)/
│   └── login/          # Pagina login
├── dashboard/          # Area protetta
│   ├── layout.tsx      # Layout condiviso
│   ├── page.tsx        # Dashboard home
│   ├── timbrature/     # Gestione timbrature
│   ├── giustificativi/ # Gestione giustificativi
│   └── users/          # Admin - Gestione utenti
└── api/                # API Routes
```

### 2. API Layer (Next.js API Routes)

**Pattern**: RESTful API

**Struttura Endpoint**:
```
GET    /api/timbrature           - Lista timbrature
POST   /api/timbrature           - Crea/Aggiorna timbratura
POST   /api/timbrature/conferma  - Conferma GP
POST   /api/timbrature/invia     - Invio AD
POST   /api/timbrature/approva   - Approvazione AD

GET    /api/giustificativi       - Lista giustificativi
POST   /api/giustificativi       - Crea giustificativo
POST   /api/giustificativi/approva - Approva/Rigetta

GET    /api/users                - Lista utenti (ADMIN)
POST   /api/users                - Crea utente (ADMIN)

GET    /api/employees            - Lista dipendenti
```

**Middleware Stack**:
1. NextAuth Session Check
2. Role-based Authorization
3. Request Validation (Zod)
4. Business Logic
5. Database Transaction
6. Audit Logging
7. Response

### 3. Authentication & Authorization

**Sistema**: NextAuth.js v5

**Flow di Autenticazione**:
```
1. User → POST /api/auth/signin
2. Credentials Provider verifica email/password
3. bcrypt.compare() valida password
4. Genera JWT token con user.id + role + employeeId
5. Session cookie (httpOnly, secure)
6. Audit log LOGIN
```

**RBAC (Role-Based Access Control)**:
```typescript
Role Hierarchy:
ADMIN       → Full access
GP          → Timbrature + Dipendenti + Report
DIPENDENTE  → Solo proprie presenze + giustificativi
```

### 4. Database Layer (Prisma ORM)

**Vantaggi Prisma**:
- Type-safety completa TypeScript
- Migrations automatiche
- Query builder intuitivo
- Connection pooling
- Middleware per logging

**Schema Highlights**:
```prisma
model Timbratura {
  id           String   @id @default(cuid())
  employeeId   String
  data         DateTime
  entrata1     String?
  uscita1      String?
  entrata2     String?
  uscita2      String?
  oreLavorate  Float
  straordinari Float
  stato        StatoTimbrature
  versione     Int
  versions     TimbraturaVersion[]
}
```

**Ottimizzazioni**:
- Indici su foreign keys e campi filtrati
- Unique constraints per integrità
- Cascade delete per relazioni
- Paginazione query pesanti

### 5. Business Logic Layer

**Utility Core**: `lib/utils.ts`

**Funzioni Principali**:
- `calcolaOreLavorate()`: Calcolo ore da 4 slot
- `getFestivitaItaliane()`: Genera festività anno
- `isWeekend()`, `isFestivo()`: Validazioni calendario
- `formatOre()`: Formattazione output

**Validazioni**: `lib/validations.ts`

Schema Zod per:
- Timbrature (4 slot + note obbligatorie)
- Giustificativi (Ferie vs Permessi)
- Utenti (con dati anagrafici dipendente)
- Template orari

---

## 🔄 Workflow Critici

### Workflow 1: Inserimento Timbratura

```
GP → Form Timbratura
  ↓
Validazione Client (React Hook Form + Zod)
  ↓
POST /api/timbrature
  ↓
Validazione Server (Zod)
  ↓
calcolaOreLavorate() → Business Logic
  ↓
Check errori (sovrapposizioni, ore anomale)
  ↓
Prisma Transaction:
  - Se esiste: Crea TimbraturaVersion + Update
  - Se nuova: Crea Timbratura
  ↓
Audit Log CREATE/UPDATE_TIMBRATURA
  ↓
Response → Client aggiorna UI
```

### Workflow 2: Approvazione Presenze (Multi-Step)

```
Step 1: GP Conferma Dipendente
  POST /api/timbrature/conferma
  → Stato: BOZZA → CONFERMATO_GP
  
Step 2: GP Invia Tutte Presenze
  POST /api/timbrature/invia
  → Verifica: tutte CONFERMATO_GP
  → Stato: CONFERMATO_GP → INVIATO_AD
  
Step 3: AD Approva/Rigetta
  POST /api/timbrature/approva
  → Stato: INVIATO_AD → APPROVATO/RIGETTATO
  → Se RIGETTATO: possibilità correzione → torna BOZZA
```

### Workflow 3: Giustificativo

```
Dipendente → Richiesta Ferie/Permesso
  ↓
POST /api/giustificativi
  ↓
Validazione tipo (FERIE: periodo | PERMESSO: orario)
  ↓
Calcolo oreTotali
  ↓
Crea Giustificativo (stato: PENDING)
  ↓
Crea GiustificativoTimeline entry
  ↓
AD riceve notifica (future)
  ↓
AD → POST /api/giustificativi/approva
  ↓
Aggiorna stato → APPROVATO/RIFIUTATO
  ↓
Timeline entry + notifica dipendente
  ↓
Se APPROVATO → integrazione automatica in timbrature
```

---

## 🔐 Sicurezza

### 1. Authentication
- Password: bcrypt hash (cost factor 12)
- Session: JWT con secret strong
- Timeout: 8 ore di inattività
- Refresh: Automatico su activity

### 2. Authorization
- Middleware per ogni API route
- Check ruolo server-side
- Validazione employeeId per dipendenti
- No data leakage tra ruoli

### 3. Input Validation
- Client: React Hook Form + Zod
- Server: Zod schemas duplicati
- Sanitization automatica Prisma
- XSS protection (React escape)

### 4. Audit & Logging
```typescript
AuditLog {
  userId, azione, entita, entitaId
  dettagli (JSON), ipAddress, userAgent
  timestamp
}
```

Azioni loggata:
- LOGIN/LOGOUT
- CREATE/UPDATE/DELETE entities
- APPROVE/REJECT workflows
- Export dati sensibili

### 5. GDPR Compliance
- Consenso privacy tracking
- Diritto all'oblio (anonimizzazione)
- Export dati completo
- Retention policy configurabile
- Cookie banner (future)

---

## 📊 Database Schema Relazionale

```
Users (1) ──────────► (0..1) Employee
  ↓                            ↓
  │                   (1) ──► (0..1) EmployeeTemplate
  │                            ↓
  │                           (1) ──► (*) Timbratura
  │                            │          ↓
  │                            │         (*) TimbraturaVersion
  │                            │
  │                           (1) ──► (*) Giustificativo
  │                                       ↓
  │                                      (*) GiustificativoTimeline
  ↓
 (*) AuditLog

Festivita (indipendente)
Configurations (indipendente)
```

**Integrità Referenziale**:
- CASCADE DELETE: User → Employee → Timbrature
- RESTRICT: Se timbrature approvate, no delete dipendente
- Unique Constraints: email, codiceFiscale, (employeeId, data)

---

## 🚀 Performance Considerations

### 1. Database
- **Indici**: employeeId, data, stato, anno/mese
- **Paginazione**: Limit 50 per query lista
- **Select**: Solo campi necessari (no SELECT *)
- **Connection Pool**: Max 10 connessioni

### 2. Frontend
- **SSR**: Dashboard pagine statiche
- **ISR**: Regeneration ogni 60s per dati aggregati
- **Client State**: React Context per form complessi
- **Caching**: SWR per fetch clientside (future)

### 3. API
- **Rate Limiting**: 100 req/min per IP (future)
- **Compression**: gzip response > 1KB
- **Lazy Load**: Paginate lista dipendenti/timbrature

---

## 🧪 Testing Strategy (Future Implementation)

```
Unit Tests (Jest)
├── lib/utils.ts          → Calcolo ore, festività
├── lib/validations.ts    → Schema Zod
└── lib/auth.ts           → Password hashing

Integration Tests (Jest + Supertest)
├── API Routes            → CRUD completi
├── Workflow              → Multi-step approvals
└── Auth                  → Login/Logout/Session

E2E Tests (Playwright/Cypress)
├── User Journey GP       → Insert → Confirm → Send
├── User Journey ADMIN    → Approve timbrature
└── User Journey DIP      → Request giustificativo
```

---

## 📈 Scalabilità

### Current Architecture (< 100 dipendenti)
- Monolith Next.js: OK
- PostgreSQL single instance: OK
- Session in-memory JWT: OK

### Future Scale (100-1000 dipendenti)
- **Database**: Read Replicas per reporting
- **Session**: Redis store
- **File Storage**: S3 per PDF/export
- **CDN**: CloudFront per static assets

### Enterprise Scale (1000+ dipendenti)
- **Microservices**: Separare timbrature/giustificativi
- **Event-Driven**: Kafka per notifiche
- **Multi-tenant**: Isolamento database per azienda
- **Kubernetes**: Container orchestration

---

## 🔄 CI/CD Pipeline (Future)

```
GitHub Actions Workflow:
1. On Push → main
2. Run Tests (unit + integration)
3. Build Next.js
4. Run Prisma Migrate
5. Deploy to Vercel/Railway
6. Run E2E Tests (staging)
7. Promote to Production
8. Slack notification
```

---

## 📚 Risorse e Documentazione

- **Next.js Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **NextAuth.js**: https://next-auth.js.org
- **Zod**: https://zod.dev
- **Tailwind**: https://tailwindcss.com

---

## 🛣️ Roadmap Architetturale

### Q1 2026
- [ ] Real-time notifications (Pusher)
- [ ] Advanced analytics dashboard
- [ ] PDF export con template

### Q2 2026
- [ ] Mobile app (React Native + Expo)
- [ ] Geolocalizzazione timbrature
- [ ] Integrazione Google Calendar

### Q3 2026
- [ ] Multi-tenant architecture
- [ ] API pubblica per integrazioni
- [ ] Webhook system

### Q4 2026
- [ ] AI-powered anomaly detection
- [ ] Predictive analytics
- [ ] Voice timbratura (Alexa/Google)

---

**Documento versione**: 1.0  
**Ultimo aggiornamento**: Febbraio 2026  
**Autore**: Sistema Gestione Presenze Team
