# 🚀 Guida Deploy Sistema Gestione Presenze

Guida completa per il deploy del sistema in produzione su diverse piattaforme.

---

## 📋 Prerequisiti Deploy

Prima di procedere, assicurati di avere:

- ✅ Account provider cloud (Vercel/Railway/AWS/DigitalOcean)
- ✅ Database PostgreSQL in produzione
- ✅ Dominio (opzionale ma consigliato)
- ✅ NEXTAUTH_SECRET generato
- ✅ Repository Git (GitHub/GitLab)

---

## 🎯 Opzione 1: Vercel (Consigliato)

Vercel è la piattaforma ottimale per Next.js con deploy automatico e scalabilità.

### Step 1: Preparazione

```bash
# Assicurati che il progetto buildi correttamente
npm run build

# Verifica che non ci siano errori TypeScript
npm run lint
```

### Step 2: Setup Database

**Opzione A - Supabase (Consigliato)**

1. Vai su https://supabase.com
2. Crea nuovo progetto
3. Copia la connection string da Settings → Database
4. Formato: `postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres`

**Opzione B - Neon Database**

1. Vai su https://neon.tech
2. Crea nuovo progetto
3. Copia connection string
4. Formato: `postgresql://[user]:[password]@[host]/[database]?sslmode=require`

### Step 3: Deploy su Vercel

1. **Push su GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/tuousername/presenze-app.git
   git push -u origin main
   ```

2. **Connetti a Vercel**
   - Vai su https://vercel.com
   - Click "New Project"
   - Import repository GitHub
   - Seleziona "presenze-app"

3. **Configura Environment Variables**
   
   In Vercel Dashboard → Settings → Environment Variables, aggiungi:

   ```env
   # Database
   DATABASE_URL=postgresql://[TUO_DATABASE_URL]
   
   # NextAuth
   NEXTAUTH_URL=https://tuodominio.vercel.app
   NEXTAUTH_SECRET=[GENERA_CON: openssl rand -base64 32]
   
   # App Config
   ORE_STANDARD=8
   TOLLERANZA_MINUTI=10
   ```

4. **Deploy**
   - Click "Deploy"
   - Attendi build (circa 2-3 minuti)
   - L'app sarà live su `https://presenze-app.vercel.app`

### Step 4: Migrations & Seed

**IMPORTANTE**: Dopo il primo deploy, esegui migrations:

```bash
# Opzione A - Da locale (consigliato per primo deploy)
DATABASE_URL="postgresql://[PRODUCTION_URL]" npx prisma migrate deploy
DATABASE_URL="postgresql://[PRODUCTION_URL]" npm run prisma:seed

# Opzione B - Connettiti via SSH al database e esegui migrations
```

### Step 5: Dominio Custom (Opzionale)

1. In Vercel Dashboard → Settings → Domains
2. Aggiungi il tuo dominio (es: presenze.tuaazienda.it)
3. Configura DNS secondo le istruzioni Vercel
4. Aggiorna `NEXTAUTH_URL` con nuovo dominio

---

## 🎯 Opzione 2: Railway

Railway offre database + hosting in un'unica piattaforma.

### Step 1: Setup

1. Vai su https://railway.app
2. Sign up con GitHub
3. Click "New Project"
4. Seleziona "Deploy from GitHub repo"

### Step 2: Aggiungi Database

1. Nel progetto Railway, click "+ New"
2. Seleziona "Database" → "PostgreSQL"
3. Railway crea automaticamente DATABASE_URL

### Step 3: Configura Variables

In Railway → Variables, aggiungi:

```env
NEXTAUTH_URL=${{RAILWAY_PUBLIC_DOMAIN}}
NEXTAUTH_SECRET=[GENERA RANDOM]
ORE_STANDARD=8
TOLLERANZA_MINUTI=10
```

### Step 4: Deploy

1. Railway buildia automaticamente
2. Genera URL pubblico automaticamente
3. Accedi a migrations via Railway CLI:

```bash
# Installa Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link al progetto
railway link

# Run migrations
railway run npx prisma migrate deploy
railway run npm run prisma:seed
```

---

## 🎯 Opzione 3: DigitalOcean App Platform

### Step 1: Preparazione

1. Crea account DigitalOcean
2. Crea database PostgreSQL managed
3. Nota connection string

### Step 2: Deploy App

1. In DigitalOcean Dashboard → Apps → Create App
2. Connetti GitHub repository
3. Configura build:
   - Build Command: `npm run build`
   - Run Command: `npm start`

### Step 3: Environment Variables

Aggiungi in App Settings → Environment:

```env
DATABASE_URL=[CONNECTION_STRING_DIGITALOCEAN]
NEXTAUTH_URL=[APP_URL]
NEXTAUTH_SECRET=[RANDOM_SECRET]
ORE_STANDARD=8
TOLLERANZA_MINUTI=10
```

### Step 4: Run Migrations

```bash
# Via DO Console o SSH
DATABASE_URL="[PRODUCTION_URL]" npx prisma migrate deploy
DATABASE_URL="[PRODUCTION_URL]" npm run prisma:seed
```

---

## 🐳 Opzione 4: Docker + VPS

### Dockerfile

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/presenze_db
      - NEXTAUTH_URL=https://tuodominio.com
      - NEXTAUTH_SECRET=your-secret-here
    depends_on:
      - db

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=presenze_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

### Deploy su VPS

```bash
# 1. SSH nel server
ssh root@your-server-ip

# 2. Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 3. Clone repo
git clone https://github.com/tuousername/presenze-app.git
cd presenze-app

# 4. Configura .env
nano .env
# ... inserisci variabili

# 5. Build e start
docker-compose up -d

# 6. Run migrations
docker-compose exec app npx prisma migrate deploy
docker-compose exec app npm run prisma:seed
```

---

## 🔒 Checklist Sicurezza Produzione

Prima di andare live, verifica:

- [ ] `NEXTAUTH_SECRET` è una stringa random forte (min 32 caratteri)
- [ ] Database ha password complessa
- [ ] Database accetta solo connessioni SSL
- [ ] Firewall configurato (solo porte 80, 443, 22)
- [ ] HTTPS attivo (certificato SSL)
- [ ] Environment variables mai committate su Git
- [ ] `.env` in `.gitignore`
- [ ] Backup automatico database configurato
- [ ] Monitoring attivo (Sentry, Datadog)
- [ ] Rate limiting API attivo (Vercel Pro, CloudFlare)

---

## 📊 Monitoring & Logging

### Sentry (Error Tracking)

```bash
npm install @sentry/nextjs

# Configura in next.config.js e aggiunge SENTRY_DSN
```

### LogRocket (Session Replay)

```bash
npm install logrocket

# Setup in app/layout.tsx
```

### Vercel Analytics

Già incluso in Vercel Pro plan - nessuna configurazione necessaria.

---

## 🔄 CI/CD Pipeline

### GitHub Actions (Esempio)

Crea `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 🆘 Troubleshooting Deploy

### Errore: "Can't reach database"

```bash
# Verifica connection string
echo $DATABASE_URL

# Testa connessione
psql $DATABASE_URL -c "SELECT 1"

# Verifica che database accetti connessioni esterne
# Controlla firewall rules
```

### Errore: "Module not found: Can't resolve '@/...'

```bash
# Verifica tsconfig paths
# Rigenera Prisma client
npx prisma generate

# Rebuild
npm run build
```

### Errore: "Prisma Client not generated"

```bash
# Nel comando di build assicurati che ci sia:
npm run build
# che include "prisma generate" in postinstall script
```

### Build timeout su Vercel

```bash
# Aumenta Node memory (in package.json):
"build": "NODE_OPTIONS='--max-old-space-size=4096' next build"
```

---

## 📞 Support

Per problemi di deploy:
- **GitHub Issues**: https://github.com/tuousername/presenze-app/issues
- **Email**: support@presenze.it
- **Docs**: Consulta README.md e ARCHITECTURE.md

---

**Ultimo aggiornamento**: 14 Febbraio 2026  
**Versione**: 1.0.0
