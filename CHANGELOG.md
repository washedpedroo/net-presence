# Changelog

Tutte le modifiche rilevanti a questo progetto saranno documentate in questo file.

Il formato è basato su [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
e questo progetto aderisce al [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-02-14

### 🎉 Release Iniziale

#### Aggiunte

**Autenticazione & Autorizzazione**
- ✅ Sistema di autenticazione con NextAuth.js v5
- ✅ Gestione ruoli multi-livello (ADMIN, GP, DIPENDENTE)
- ✅ Password hashing con bcrypt (cost factor 12)
- ✅ Session management con JWT
- ✅ Timeout sessioni configurabile (default 8 ore)

**Database & Schema**
- ✅ Schema Prisma completo con 12 tabelle
- ✅ Supporto PostgreSQL
- ✅ Sistema di versioning per timbrature
- ✅ Relazioni e vincoli di integrità referenziale
- ✅ Indici ottimizzati per query frequenti
- ✅ Seed script con dati di test

**Gestione Utenti** (ADMIN)
- ✅ CRUD utenti completo
- ✅ Creazione utenti con ruoli
- ✅ Gestione anagrafica dipendenti
- ✅ Validazione dati con Zod
- ✅ Interface utente responsive

**Gestione Dipendenti** (GP/ADMIN)
- ✅ Visualizzazione lista dipendenti
- ✅ Template orari settimanali
- ✅ Statistiche dipendenti attivi
- ✅ Filtri e ricerca

**Timbrature** (GP)
- ✅ Calendario mensile interattivo
- ✅ Inserimento timbrature con 4 slot
- ✅ Calcolo automatico ore lavorate
- ✅ Calcolo straordinari con tolleranza ±10 min
- ✅ Validazione business logic
- ✅ Sistema di versioning modifiche
- ✅ Conferma timbrature per dipendente
- ✅ Workflow: Bozza → Confermato GP → Inviato AD

**Approvazione Presenze** (ADMIN)
- ✅ Dashboard presenze inviate
- ✅ Approvazione/Rigetto mensile
- ✅ Motivazione obbligatoria per rigetto
- ✅ Possibilità correzione dopo rigetto
- ✅ Workflow completo: Inviato AD → Approvato/Rigettato

**Giustificativi** (DIPENDENTE)
- ✅ Richiesta Ferie (periodo multi-giorno)
- ✅ Richiesta Permessi (orario 10min-8h)
- ✅ Richiesta Ex Festività
- ✅ Calcolo automatico ore totali
- ✅ Timeline stato richieste
- ✅ Visualizzazione storico

**Approvazione Giustificativi** (ADMIN)
- ✅ Dashboard giustificativi pending
- ✅ Approvazione/Rigetto con motivazione
- ✅ Timeline completa modifiche stato
- ✅ Badge stati (Pending/Approvato/Rifiutato)

**Le Mie Presenze** (DIPENDENTE)
- ✅ Visualizzazione calendario personale
- ✅ Dettaglio timbrature giornaliere
- ✅ Riepilogo mensile ore lavorate
- ✅ Statistiche personali

**Report & Analytics** (GP/ADMIN)
- ✅ Generazione report mensili
- ✅ Recap aggregato per dipendente
- ✅ Statistiche: ore totali, straordinari, media
- ✅ Identificazione dipendente top ore
- ✅ Tasso di presenza
- ✅ Export PDF (placeholder)

**Configurazioni** (ADMIN)
- ✅ Gestione parametri sistema
- ✅ Configurazione ore standard
- ✅ Configurazione tolleranza minuti
- ✅ Timeout sessioni
- ✅ Visualizzazione festività automatiche
- ✅ Informazioni sistema

**Festività**
- ✅ Calcolo automatico festività italiane
- ✅ Algoritmo Pasqua (Meeus)
- ✅ 12 festività nazionali 2026
- ✅ Visualizzazione nel calendario (rosso)
- ✅ Weekend evidenziati

**Audit & Logging**
- ✅ Log completo azioni critiche
- ✅ Tracking: userId, azione, entità, dettagli
- ✅ Registrazione IP e user-agent
- ✅ Log automatico: LOGIN, CREATE, UPDATE, DELETE
- ✅ Log workflow: CONFERMA, INVIA, APPROVA

**UI/UX**
- ✅ Design system con Tailwind CSS
- ✅ Componenti riutilizzabili (shadcn/ui style)
- ✅ Dashboard responsive per tutti i ruoli
- ✅ Sidebar dinamica basata su ruolo
- ✅ Calendario mensile interattivo
- ✅ Form con validazione real-time
- ✅ Dialog/Modal per azioni critiche
- ✅ Badge colorati per stati
- ✅ Loader e feedback utente
- ✅ Toast notifications (componenti pronti)

**Sicurezza**
- ✅ Password policy (min 12 caratteri)
- ✅ bcrypt hashing (cost 12)
- ✅ Session JWT sicure
- ✅ HTTPS enforcement (produzione)
- ✅ CORS configuration
- ✅ SQL injection protection (Prisma ORM)
- ✅ XSS protection (React escape)

**Validazioni**
- ✅ Schema Zod client + server
- ✅ Validazione formato orari (HH:MM)
- ✅ Validazione coerenza temporale
- ✅ Check sovrapposizioni slot
- ✅ Alert anomalie (<8h, >20h straordinari)
- ✅ Note obbligatorie timbrature

**Documentazione**
- ✅ README completo con setup guide
- ✅ ARCHITECTURE.md con diagrammi
- ✅ Credenziali test per tutti i ruoli
- ✅ Comandi npm documentati
- ✅ Troubleshooting comune
- ✅ API routes documentate inline

---

## [0.1.0] - 2026-02-14

### Preparazione

- 🔨 Setup iniziale progetto
- 🔨 Configurazione Next.js 14 + TypeScript
- 🔨 Setup Prisma + PostgreSQL
- 🔨 Configurazione Tailwind CSS
- 🔨 Struttura directory progetto

---

## Prossime Release (Roadmap)

### [1.1.0] - Notifiche Real-time
- [ ] Integrazione Pusher/Socket.io
- [ ] Notifiche push in-app
- [ ] Email notifications
- [ ] Centro notifiche persistente
- [ ] Badge counter non lette

### [1.2.0] - Export Avanzato
- [ ] Export PDF completo con Puppeteer
- [ ] Template PDF personalizzabili
- [ ] Export Excel (XLSX)
- [ ] Firma digitale PDF
- [ ] Watermark documenti

### [1.3.0] - Analytics Dashboard
- [ ] Dashboard analytics ADMIN
- [ ] Grafici trend mensili
- [ ] Heatmap presenze
- [ ] Predizioni ML assenze
- [ ] Alert pattern anomali

### [2.0.0] - Mobile App
- [ ] React Native + Expo
- [ ] Push notifications native
- [ ] Geolocalizzazione timbrature
- [ ] Face ID / Touch ID
- [ ] Offline mode

### [2.1.0] - Integrazioni
- [ ] API pubblica REST
- [ ] Webhook system
- [ ] Integrazione Google Calendar
- [ ] Integrazione sistemi HR/Payroll
- [ ] SSO (SAML, OAuth)

### [3.0.0] - Multi-tenant
- [ ] Isolamento database per azienda
- [ ] Gestione sottoscrizioni
- [ ] Billing automatico
- [ ] Dashboard super-admin
- [ ] White-label customization

---

## Note

Per suggerimenti, bug report o feature requests, aprire una issue su GitHub.

**Maintainers**: Sistema Gestione Presenze Team  
**License**: Proprietario - Tutti i diritti riservati
