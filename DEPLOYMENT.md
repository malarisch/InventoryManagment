# Deployment Guide für InventoryManagment

## 🚀 Quick Start Optionen

### 1. Vercel (Empfohlen - Einfachste Option)

```bash
# Vercel CLI installieren
npm i -g vercel

# Deployment starten
vercel
```

**Environment Variables in Vercel setzen:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`

### 2. Docker (Self-Hosted)

**Option A: Automatisch gebautes Image von GitHub (empfohlen)**

```bash
# Image von GitHub Container Registry pullen
docker pull ghcr.io/malarisch/inventorymanagment:latest

# .env.production aus Template erstellen
cp .env.production.example .env.production
# Dann Werte eintragen!

# Mit Docker Compose (angepasst für ghcr.io Image)
# Ersetze in docker-compose.yml: build: -> image: ghcr.io/malarisch/inventorymanagment:latest
docker-compose --env-file .env.production up -d

# Oder Standalone
docker run -p 3000:3000 --env-file .env.production ghcr.io/malarisch/inventorymanagment:latest
```

**Option B: Selbst bauen**

```bash
docker build -t inventory-management .
docker run -p 3000:3000 --env-file .env.production inventory-management
```

Siehe [`DOCKER.md`](./DOCKER.md) für Details.

> **💡 Hinweis:** Nach jedem erfolgreichen Test-Durchlauf auf `main` wird automatisch ein Docker Image gebaut und zu `ghcr.io/malarisch/inventorymanagment:latest` gepusht (siehe `.github/workflows/docker-build.yml`).

### 3. Node.js Server (VPS/Dedicated)

```bash
# Dependencies installieren
npm ci --omit=dev

# Prisma generieren
npx prisma generate

# Build
npm run build

# Mit PM2 starten
pm2 start npm --name "inventory" -- start
```

## 📋 Pre-Deployment Checklist

### 1. Supabase Produktion Setup

```bash
# 1. Projekt bei supabase.com erstellen
# 2. Projekt verknüpfen
npx supabase link --project-ref your-project-ref

# 3. Migrationen pushen
npx supabase db push

# 4. Storage Buckets erstellen (im Dashboard):
#    - company_files (public)
#    - private_files (private)
```

### 2. Erste Company + Admin User

Im Supabase Dashboard -> SQL Editor:

```sql
-- 1. Erstelle User über Supabase Auth UI (Dashboard -> Authentication)
-- 2. Dann:

INSERT INTO public.companies (name, owner_user_id) 
VALUES ('Deine Firma', 'user-uuid-hier');

INSERT INTO public.users_companies (user_id, company_id)
VALUES ('user-uuid-hier', (SELECT id FROM companies WHERE name = 'Deine Firma'));
```

### 3. Tests laufen lassen

```bash
npm run test
```

## 🔒 Sicherheit

### Environment Variables

**Niemals committen:**
- `.env.local`
- `.env.production`
- Secrets in plain text

**Für Production:**
- Nutze Secrets Manager (AWS Secrets Manager, Vault, etc.)
- Oder Plattform-Features (Vercel Secrets, Railway Vars)

### Database

- RLS Policies sind aktiv (siehe `supabase/migrations/`)
- Service Role Key nur serverseitig nutzen
- Anon Key ist sicher für Client

## 📊 Monitoring

### Health Check Endpoint

Erstelle `/app/api/health/route.ts`:

```typescript
export async function GET() {
  return Response.json({ status: 'ok', timestamp: new Date().toISOString() });
}
```

### Logs

```bash
# Vercel
vercel logs

# Docker
docker-compose logs -f app

# PM2
pm2 logs inventory
```

## 🔄 Updates & Migrations

### Schema-Änderungen

```bash
# 1. Neue Migration lokal erstellen
npx supabase migration new your_change

# 2. SQL schreiben in supabase/migrations/

# 3. Auf Prod pushen
npx supabase db push
```

### App-Updates

```bash
# Vercel: automatisch bei git push

# Docker:
docker-compose pull
docker-compose up -d

# PM2:
git pull
npm run build
pm2 restart inventory
```

## 🆘 Troubleshooting

### "Cannot connect to database"

- Prüfe `DATABASE_URL` Format
- Supabase: Nutze Connection Pooler URL (Port 6543)
- Firewall: Öffne Port für DB-Zugriff

### "Supabase client error"

- Prüfe `NEXT_PUBLIC_SUPABASE_URL` und `ANON_KEY`
- Domain-Whitelist in Supabase -> Settings -> API

### "RLS policy violation"

- User ist nicht in `users_companies` für die Company
- `company_id` fehlt in Query
- Service Role Key nutzen für Admin-Ops

## 📚 Weitere Ressourcen

- [`DOCKER.md`](./DOCKER.md) - Detaillierte Docker-Anleitung
- [`AGENTS.md`](./AGENTS.md) - Architektur & Domain-Model
- [`supabase_ai_docs/`](./supabase_ai_docs/) - Supabase-Details
- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [Supabase Production Checklist](https://supabase.com/docs/guides/platform/going-into-prod)
